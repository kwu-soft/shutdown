from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from jose import jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User, UserRecommendation
from app.schemas.user import (
    TokenResponse,
    UserCreate,
    UserLogin,
    UserRecommendationRankingItem,
    UserRecommendationResponse,
    UserResponse,
)

load_dotenv()

# 현재 상황: 개발용 SQLite 환경에서는 .env 없이 실행할 수 있습니다.
# 목적: JWT_SECRET이 없어도 로컬 테스트용 토큰 발급은 가능하게 합니다.
SECRET_KEY = os.getenv("JWT_SECRET", "dev-only-secret-key")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", 60))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 현재 상황: 인증 관련 API는 /auth 하위 경로로 묶어서 관리합니다.
# 목적: 회원가입과 로그인 기능을 다른 게시판 API와 분리합니다.
router = APIRouter(prefix="/auth", tags=["auth"])

DEFAULT_ADMIN_EMAIL = os.getenv("DEFAULT_ADMIN_EMAIL", "admin@naver.com")
DEFAULT_ADMIN_USERNAME = os.getenv("DEFAULT_ADMIN_USERNAME", "admin")
DEFAULT_ADMIN_PASSWORD = os.getenv("DEFAULT_ADMIN_PASSWORD", "admin")
LEGACY_DEFAULT_ADMIN_EMAIL = "admin@campus.com"


def hash_password(password: str) -> str:
    # 현재 상황: 사용자가 입력한 원문 비밀번호를 그대로 저장하지 않습니다.
    # 목적: DB가 노출되더라도 실제 비밀번호를 바로 알 수 없게 bcrypt 해시로 변환합니다.
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    # 현재 상황: 로그인 시 입력한 비밀번호와 DB에 저장된 해시를 비교합니다.
    # 목적: 원문 비밀번호를 저장하지 않고도 인증 여부를 판단합니다.
    return pwd_context.verify(plain, hashed)


def create_access_token(user_id: int) -> str:
    # 현재 상황: 로그인 성공 후 사용자 id를 JWT의 sub 값으로 넣습니다.
    # 목적: 이후 요청에서 토큰만으로 현재 사용자를 찾을 수 있게 합니다.
    expire = datetime.utcnow() + timedelta(minutes=EXPIRE_MINUTES)
    return jwt.encode({"sub": str(user_id), "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/register", response_model=UserResponse, status_code=201)
def register(body: UserCreate, db: Session = Depends(get_db)):
    # 현재 상황: 새 회원가입 요청을 처리하는 단계입니다.
    # 목적: 이메일/닉네임 중복을 막고, 비밀번호는 해시로 저장합니다.
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="이미 사용 중인 이메일입니다")
    if db.query(User).filter(User.username == body.username).first():
        raise HTTPException(status_code=400, detail="이미 사용 중인 닉네임입니다")

    user = User(
        username=body.username,
        email=body.email,
        hashed_password=hash_password(body.password),
        role="user",
        status="active",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
def login(body: UserLogin, db: Session = Depends(get_db)):
    # 현재 상황: 로그인 요청에서 이메일로 사용자를 찾고 비밀번호를 검증합니다.
    # 목적: 성공하면 프론트가 localStorage에 저장할 JWT를 발급합니다.
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 틀렸습니다")
    if user.status == "suspended":
        raise HTTPException(status_code=403, detail=user.sanction_reason or "정지된 계정입니다")

    return {
        "access_token": create_access_token(user.id),
        "user_id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "status": user.status,
        "sanction_reason": user.sanction_reason,
    }


@router.get("/me", response_model=UserResponse)
def read_me(current_user: User = Depends(get_current_user)):
    return current_user


def ensure_default_admin(db: Session) -> None:
    admin = db.query(User).filter(User.email == DEFAULT_ADMIN_EMAIL).first()

    if not admin:
        admin = (
            db.query(User)
            .filter(User.email == LEGACY_DEFAULT_ADMIN_EMAIL, User.username == DEFAULT_ADMIN_USERNAME)
            .first()
        )

    if admin:
        admin.email = DEFAULT_ADMIN_EMAIL
        admin.username = DEFAULT_ADMIN_USERNAME
        admin.hashed_password = hash_password(DEFAULT_ADMIN_PASSWORD)
        admin.role = "admin"
        admin.status = "active"
        admin.sanction_reason = None
        db.commit()
        return

    username_owner = db.query(User).filter(User.username == DEFAULT_ADMIN_USERNAME).first()
    if username_owner:
        username_owner.email = DEFAULT_ADMIN_EMAIL
        username_owner.hashed_password = hash_password(DEFAULT_ADMIN_PASSWORD)
        username_owner.role = "admin"
        username_owner.status = "active"
        username_owner.sanction_reason = None
        db.commit()
        return

    db.add(
        User(
            username=DEFAULT_ADMIN_USERNAME,
            email=DEFAULT_ADMIN_EMAIL,
            hashed_password=hash_password(DEFAULT_ADMIN_PASSWORD),
            role="admin",
            status="active",
        )
    )
    db.commit()


@router.get("/recommendations/ranking", response_model=list[UserRecommendationRankingItem])
def get_recommendation_ranking(
    limit: int = Query(3, ge=1, le=20),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(
            User.id,
            User.username,
            func.count(UserRecommendation.id).label("recommendation_count"),
        )
        .outerjoin(
            UserRecommendation,
            UserRecommendation.target_user_id == User.id,
        )
        .group_by(User.id, User.username)
        .having(func.count(UserRecommendation.id) > 0)
        .order_by(func.count(UserRecommendation.id).desc(), User.username.asc())
        .limit(limit)
        .all()
    )

    return [
        UserRecommendationRankingItem(
            user_id=user_id,
            username=username,
            recommendation_count=recommendation_count,
        )
        for user_id, username, recommendation_count in rows
    ]


@router.post("/users/{user_id}/recommend", response_model=UserRecommendationResponse)
def toggle_user_recommendation(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
    if target_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="본인은 추천할 수 없습니다")

    existing = (
        db.query(UserRecommendation)
        .filter_by(recommender_id=current_user.id, target_user_id=user_id)
        .first()
    )

    if existing:
        db.delete(existing)
        db.commit()
        count = db.query(UserRecommendation).filter_by(target_user_id=user_id).count()
        return UserRecommendationResponse(recommended=False, recommendation_count=count)

    db.add(UserRecommendation(recommender_id=current_user.id, target_user_id=user_id))
    db.commit()
    count = db.query(UserRecommendation).filter_by(target_user_id=user_id).count()
    return UserRecommendationResponse(recommended=True, recommendation_count=count)
