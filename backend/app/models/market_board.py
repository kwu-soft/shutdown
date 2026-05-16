from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import relationship
from app.database import Base


class MarketPost(Base):
    # 현재 상황: 장터게시판의 판매글 정보를 저장합니다.
    # 목적: 제목/내용/가격/이미지/작성자를 DB에 남겨 중고거래 게시판 화면에 제공합니다.
    __tablename__ = "market_posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    price = Column(Integer, nullable=False)
    image_path = Column(String(500), nullable=True)
    is_anonymous = Column(Boolean, default=False, nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    author = relationship("User")
    likes = relationship("MarketPostLike", back_populates="post", cascade="all, delete-orphan")
    purchase_requests = relationship(
        "MarketPurchaseRequest",
        back_populates="post",
        cascade="all, delete-orphan",
    )


class MarketPostLike(Base):
    # 현재 상황: 사용자가 장터 게시글에 좋아요를 눌렀는지 저장합니다.
    # 목적: 같은 사용자가 같은 판매글에 중복 좋아요를 누르지 않도록 제한합니다.
    __tablename__ = "market_post_likes"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("market_posts.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    post = relationship("MarketPost", back_populates="likes")

    __table_args__ = (UniqueConstraint("user_id", "post_id"),)


class MarketPurchaseRequest(Base):
    __tablename__ = "market_purchase_requests"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("market_posts.id"), nullable=False)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    seller_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String(20), default="requested", nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    post = relationship("MarketPost", back_populates="purchase_requests")
    buyer = relationship("User", foreign_keys=[buyer_id])
    seller = relationship("User", foreign_keys=[seller_id])
