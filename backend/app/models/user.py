from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    # 현재 상황: 서비스에 가입한 사용자의 기본 계정 정보를 저장하는 테이블입니다.
    # 목적: 게시글/댓글/좋아요/입찰의 작성자와 로그인 인증 기준으로 사용합니다.
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, server_default="user", default="user")
    status = Column(String(20), nullable=False, server_default="active", default="active")
    sanction_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    recommendations_received = relationship(
        "UserRecommendation",
        foreign_keys="UserRecommendation.target_user_id",
        cascade="all, delete-orphan",
    )


class UserRecommendation(Base):
    __tablename__ = "user_recommendations"
    __table_args__ = (
        UniqueConstraint("recommender_id", "target_user_id", name="uq_user_recommendation"),
    )

    id = Column(Integer, primary_key=True, index=True)
    recommender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    target_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
