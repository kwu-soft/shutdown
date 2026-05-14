from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from jose import jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse, TokenResponse

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", 60))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 현재 상황: 인증 관련 API는 /auth 하위 경로로 묶어서 관리합니다.
# 목적: 회원가입과 로그인 기능을 다른 게시판 API와 분리합니다.
router = APIRouter(prefix="/auth", tags=["auth"])


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

    return {"access_token": create_access_token(user.id)}
