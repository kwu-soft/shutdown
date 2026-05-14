from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import relationship
from app.database import Base


class AuctionPost(Base):
    # 현재 상황: 족보 경매 게시글의 기본 정보와 마감 시간을 저장합니다.
    # 목적: 시작가, 현재 입찰 목록, 마감 여부를 계산해 경매 화면에 제공합니다.
    __tablename__ = "auction_posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    course_name = Column(String(100), nullable=False)
    professor_name = Column(String(50), nullable=False)
    starting_price = Column(Integer, nullable=False)
    deadline = Column(DateTime, nullable=False)
    image_path = Column(String(500), nullable=True)
    is_anonymous = Column(Boolean, default=False, nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    author = relationship("User")
    bids = relationship("AuctionBid", back_populates="post", cascade="all, delete-orphan")
    likes = relationship("AuctionPostLike", back_populates="post", cascade="all, delete-orphan")


class AuctionBid(Base):
    # 현재 상황: 특정 경매글에 사용자가 제시한 입찰 금액을 누적 저장합니다.
    # 목적: 최신 최고가 계산과 입찰 내역 표시의 기준 데이터로 사용합니다.
    __tablename__ = "auction_bids"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("auction_posts.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    bid_amount = Column(Integer, nullable=False)  # 입찰 총액
    created_at = Column(DateTime, server_default=func.now())

    post = relationship("AuctionPost", back_populates="bids")
    user = relationship("User")


class AuctionPostLike(Base):
    # 현재 상황: 사용자가 경매 게시글에 좋아요를 눌렀는지 저장합니다.
    # 목적: 경매글 관심도를 표시하고 중복 좋아요를 막습니다.
    __tablename__ = "auction_post_likes"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("auction_posts.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    post = relationship("AuctionPost", back_populates="likes")

    __table_args__ = (UniqueConstraint("user_id", "post_id"),)
