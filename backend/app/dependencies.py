from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import os

from app.database import get_db
from app.models.user import User

load_dotenv()

# 현재 상황: 개발용 SQLite 환경에서는 .env 없이 실행할 수 있습니다.
# 목적: auth.py에서 발급한 로컬 테스트용 JWT를 같은 키로 검증합니다.
SECRET_KEY = os.getenv("JWT_SECRET", "dev-only-secret-key")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

# 현재 상황: Authorization: Bearer <token> 헤더에서 JWT를 꺼내기 위한 보안 스키마입니다.
# 목적: 로그인이 필요한 API에서 공통으로 현재 사용자를 검증합니다.
bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    # 현재 상황: 클라이언트가 보낸 JWT를 해석해서 user_id(sub)를 확인합니다.
    # 목적: 글쓰기, 수정, 삭제, 좋아요처럼 로그인 사용자가 필요한 작업을 보호합니다.
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        sub = payload.get("sub")
        if sub is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        user_id: int = int(sub)
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    # 현재 상황: 토큰이 유효하고 DB에도 사용자가 존재하면 라우터에 User 객체를 넘겨줍니다.
    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user
