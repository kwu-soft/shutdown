from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from math import ceil

from app.database import get_db
from app.models.user import User
from app.models.free_board import FreePost, FreeComment, FreePostLike, FreeCommentLike
from app.schemas.free_board import (
    FreePostResponse, FreePostListResponse,
    FreeCommentCreate, FreeCommentResponse, LikeResponse,
)
from app.dependencies import get_current_user
from app.utils import save_image, delete_image

router = APIRouter(prefix="/free-board", tags=["자유게시판"])


def resolve_name(is_anonymous: bool, username: str) -> str:
    # 현재 상황: 게시글/댓글이 익명으로 작성될 수 있습니다.
    # 목적: 익명 글이면 실제 username 대신 익명 표시명을 응답에 내려줍니다.
    return "익명" if is_anonymous else username


def post_to_response(post: FreePost) -> FreePostResponse:
    # 현재 상황: DB 모델 객체를 프론트가 쓰기 좋은 응답 스키마로 변환합니다.
    # 목적: 좋아요 수, 댓글 수, 작성자 표시명처럼 화면에 필요한 값을 함께 계산합니다.
    return FreePostResponse(
        id=post.id,
        title=post.title,
        content=post.content,
        image_path=post.image_path,
        is_anonymous=post.is_anonymous,
        author_id=post.author_id,
        author_name=resolve_name(post.is_anonymous, post.author.username),
        created_at=post.created_at,
        updated_at=post.updated_at,
        like_count=len(post.likes),
        comment_count=len(post.comments),
    )


# ── 게시글 ──────────────────────────────────────────────

# 현재 상황: 자유게시판 글 목록을 최신순으로 페이지 단위 조회합니다.
# 목적: 한 번에 너무 많은 데이터를 내려주지 않고 목록 화면을 구성합니다.
@router.get("", response_model=FreePostListResponse)
def list_posts(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    total = db.query(FreePost).count()
    posts = (
        db.query(FreePost)
        .order_by(FreePost.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )
    return FreePostListResponse(
        posts=[post_to_response(p) for p in posts],
        total=total,
        page=page,
        size=size,
        total_pages=ceil(total / size) if total else 1,
    )


# 현재 상황: 로그인한 사용자가 자유게시판 글을 작성합니다.
# 목적: 폼 데이터와 선택 이미지 파일을 받아 게시글 DB 행을 생성합니다.
@router.post("", response_model=FreePostResponse, status_code=201)
async def create_post(
    title: str = Form(...),
    content: str = Form(...),
    is_anonymous: bool = Form(False),
    image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    image_path = await save_image(image)
    post = FreePost(
        title=title,
        content=content,
        is_anonymous=is_anonymous,
        image_path=image_path,
        author_id=current_user.id,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return post_to_response(post)


# 현재 상황: 특정 자유게시판 글의 상세 정보를 조회합니다.
# 목적: 상세 페이지에서 본문, 작성자 표시명, 좋아요/댓글 수를 보여줍니다.
@router.get("/{post_id}", response_model=FreePostResponse)
def get_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(FreePost).filter(FreePost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다")
    return post_to_response(post)


# 현재 상황: 로그인한 작성자가 본인 자유게시판 글을 수정합니다.
# 목적: 권한을 확인한 뒤 제목/내용/이미지를 필요한 만큼만 갱신합니다.
@router.put("/{post_id}", response_model=FreePostResponse)
async def update_post(
    post_id: int,
    title: str | None = Form(None),
    content: str | None = Form(None),
    image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = db.query(FreePost).filter(FreePost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다")
    if post.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="본인 게시글만 수정할 수 있습니다")

    if title is not None:
        post.title = title
    if content is not None:
        post.content = content
    if image and image.filename:
        delete_image(post.image_path)
        post.image_path = await save_image(image)

    db.commit()
    db.refresh(post)
    return post_to_response(post)


# 현재 상황: 로그인한 작성자가 본인 자유게시판 글을 삭제합니다.
# 목적: 권한 확인 후 DB 행과 연결된 이미지 파일을 함께 정리합니다.
@router.delete("/{post_id}", status_code=204)
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = db.query(FreePost).filter(FreePost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다")
    if post.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="본인 게시글만 삭제할 수 있습니다")

    delete_image(post.image_path)
    db.delete(post)
    db.commit()


# 현재 상황: 로그인한 사용자가 자유게시판 글의 좋아요를 누르거나 취소합니다.
# 목적: 이미 누른 상태면 삭제하고, 아니면 새 좋아요 행을 추가하는 토글 방식입니다.
@router.post("/{post_id}/like", response_model=LikeResponse)
def toggle_post_like(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = db.query(FreePost).filter(FreePost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다")

    existing = db.query(FreePostLike).filter_by(user_id=current_user.id, post_id=post_id).first()
    if existing:
        db.delete(existing)
        db.commit()
        db.refresh(post)
        return LikeResponse(liked=False, like_count=len(post.likes))
    else:
        db.add(FreePostLike(user_id=current_user.id, post_id=post_id))
        db.commit()
        db.refresh(post)
        return LikeResponse(liked=True, like_count=len(post.likes))


# ── 댓글 ──────────────────────────────────────────────

# 현재 상황: 특정 자유게시판 글에 달린 댓글을 조회합니다.
# 목적: 댓글 내용, 작성자 표시명, 댓글 좋아요 수를 상세 페이지에 제공합니다.
@router.get("/{post_id}/comments", response_model=list[FreeCommentResponse])
def list_comments(post_id: int, db: Session = Depends(get_db)):
    post = db.query(FreePost).filter(FreePost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다")
    return [
        FreeCommentResponse(
            id=c.id,
            content=c.content,
            is_anonymous=c.is_anonymous,
            author_id=c.author_id,
            author_name=resolve_name(c.is_anonymous, c.author.username),
            post_id=c.post_id,
            created_at=c.created_at,
            like_count=len(c.likes),
        )
        for c in post.comments
    ]


# 현재 상황: 로그인한 사용자가 특정 자유게시판 글에 댓글을 작성합니다.
# 목적: 댓글 본문과 익명 여부를 저장하고 방금 만든 댓글 정보를 반환합니다.
@router.post("/{post_id}/comments", response_model=FreeCommentResponse, status_code=201)
def create_comment(
    post_id: int,
    body: FreeCommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = db.query(FreePost).filter(FreePost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다")

    comment = FreeComment(
        content=body.content,
        is_anonymous=body.is_anonymous,
        author_id=current_user.id,
        post_id=post_id,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return FreeCommentResponse(
        id=comment.id,
        content=comment.content,
        is_anonymous=comment.is_anonymous,
        author_id=comment.author_id,
        author_name=resolve_name(comment.is_anonymous, current_user.username),
        post_id=comment.post_id,
        created_at=comment.created_at,
        like_count=0,
    )


# 현재 상황: 로그인한 작성자가 본인 댓글을 삭제합니다.
# 목적: 댓글 작성자만 삭제할 수 있게 권한을 제한합니다.
@router.delete("/comments/{comment_id}", status_code=204)
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment = db.query(FreeComment).filter(FreeComment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="댓글을 찾을 수 없습니다")
    if comment.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="본인 댓글만 삭제할 수 있습니다")

    db.delete(comment)
    db.commit()


# 현재 상황: 로그인한 사용자가 댓글 좋아요를 누르거나 취소합니다.
# 목적: 댓글별 사용자 좋아요 상태를 토글하고 최신 좋아요 수를 반환합니다.
@router.post("/comments/{comment_id}/like", response_model=LikeResponse)
def toggle_comment_like(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment = db.query(FreeComment).filter(FreeComment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="댓글을 찾을 수 없습니다")

    existing = db.query(FreeCommentLike).filter_by(user_id=current_user.id, comment_id=comment_id).first()
    if existing:
        db.delete(existing)
        db.commit()
        return LikeResponse(liked=False, like_count=len(comment.likes) - 1)
    else:
        db.add(FreeCommentLike(user_id=current_user.id, comment_id=comment_id))
        db.commit()
        return LikeResponse(liked=True, like_count=len(comment.likes) + 1)
