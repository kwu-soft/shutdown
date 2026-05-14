from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, func, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base


class FreePost(Base):
    # 현재 상황: 자유게시판의 게시글 본문과 작성자 정보를 저장합니다.
    # 목적: 사용자가 자유롭게 글을 쓰고, 익명 여부와 이미지 첨부 상태까지 관리합니다.
    __tablename__ = "free_posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    image_path = Column(String(500), nullable=True)
    is_anonymous = Column(Boolean, default=False, nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    author = relationship("User")
    comments = relationship("FreeComment", back_populates="post", cascade="all, delete-orphan")
    likes = relationship("FreePostLike", back_populates="post", cascade="all, delete-orphan")


class FreeComment(Base):
    # 현재 상황: 자유게시판 게시글에 달린 댓글을 저장합니다.
    # 목적: 댓글도 작성자, 익명 여부, 좋아요 수를 연결해서 표시할 수 있게 합니다.
    __tablename__ = "free_comments"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    is_anonymous = Column(Boolean, default=False, nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    post_id = Column(Integer, ForeignKey("free_posts.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    author = relationship("User")
    post = relationship("FreePost", back_populates="comments")
    likes = relationship("FreeCommentLike", back_populates="comment", cascade="all, delete-orphan")


class FreePostLike(Base):
    # 현재 상황: 사용자가 자유게시판 게시글에 좋아요를 눌렀는지 기록합니다.
    # 목적: user_id와 post_id 조합을 유일하게 만들어 한 사용자가 한 글에 한 번만 좋아요를 누르게 합니다.
    __tablename__ = "free_post_likes"
    __table_args__ = (UniqueConstraint("user_id", "post_id"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    post_id = Column(Integer, ForeignKey("free_posts.id"), nullable=False)

    post = relationship("FreePost", back_populates="likes")


class FreeCommentLike(Base):
    # 현재 상황: 사용자가 자유게시판 댓글에 좋아요를 눌렀는지 기록합니다.
    # 목적: 댓글 좋아요 토글과 좋아요 수 계산에 사용합니다.
    __tablename__ = "free_comment_likes"
    __table_args__ = (UniqueConstraint("user_id", "comment_id"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    comment_id = Column(Integer, ForeignKey("free_comments.id"), nullable=False)

    comment = relationship("FreeComment", back_populates="likes")
