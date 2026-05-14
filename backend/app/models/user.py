from sqlalchemy import Column, Integer, String, DateTime, func
from app.database import Base


class User(Base):
    # 현재 상황: 서비스에 가입한 사용자의 기본 계정 정보를 저장하는 테이블입니다.
    # 목적: 게시글/댓글/좋아요/입찰의 작성자와 로그인 인증 기준으로 사용합니다.
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
