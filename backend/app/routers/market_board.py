from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from math import ceil

from app.database import get_db
from app.models.user import User
from app.models.market_board import MarketPost, MarketPostLike
from app.schemas.market_board import MarketPostResponse, MarketPostListResponse
from app.schemas.free_board import LikeResponse
from app.dependencies import get_current_user
from app.utils import save_image, delete_image

router = APIRouter(prefix="/market", tags=["장터게시판"])


def post_to_response(post: MarketPost) -> MarketPostResponse:
    # 현재 상황: 장터 DB 모델을 프론트 응답 형식으로 바꿉니다.
    # 목적: 가격, 이미지, 익명 표시명, 좋아요 수를 화면에서 바로 쓰게 합니다.
    return MarketPostResponse(
        id=post.id,
        title=post.title,
        content=post.content,
        price=post.price,
        image_path=post.image_path,
        is_anonymous=post.is_anonymous,
        author_id=post.author_id,
        author_name="익명" if post.is_anonymous else post.author.username,
        created_at=post.created_at,
        updated_at=post.updated_at,
        like_count=len(post.likes),
    )


# 현재 상황: 장터 판매글 목록을 최신순으로 페이지 단위 조회합니다.
# 목적: 판매글 리스트 화면에 필요한 데이터와 페이지 정보를 제공합니다.
@router.get("", response_model=MarketPostListResponse)
def list_posts(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    total = db.query(MarketPost).count()
    posts = (
        db.query(MarketPost)
        .order_by(MarketPost.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )
    return MarketPostListResponse(
        posts=[post_to_response(p) for p in posts],
        total=total,
        page=page,
        size=size,
        total_pages=ceil(total / size) if total else 1,
    )


# 현재 상황: 로그인한 사용자가 장터 판매글을 작성합니다.
# 목적: 가격과 이미지 파일을 포함한 판매글을 DB에 저장합니다.
@router.post("", response_model=MarketPostResponse, status_code=201)
async def create_post(
    title: str = Form(...),
    content: str = Form(...),
    price: int = Form(...),
    is_anonymous: bool = Form(False),
    image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    image_path = await save_image(image)
    post = MarketPost(
        title=title,
        content=content,
        price=price,
        is_anonymous=is_anonymous,
        image_path=image_path,
        author_id=current_user.id,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return post_to_response(post)


# 현재 상황: 특정 장터 판매글 상세 정보를 조회합니다.
# 목적: 구매/상세 페이지에서 필요한 가격, 설명, 작성자 정보를 제공합니다.
@router.get("/{post_id}", response_model=MarketPostResponse)
def get_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(MarketPost).filter(MarketPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다")
    return post_to_response(post)


# 현재 상황: 로그인한 작성자가 본인 장터 글을 수정합니다.
# 목적: 작성자 권한 확인 후 제목, 내용, 가격, 이미지를 갱신합니다.
@router.put("/{post_id}", response_model=MarketPostResponse)
async def update_post(
    post_id: int,
    title: str | None = Form(None),
    content: str | None = Form(None),
    price: int | None = Form(None),
    image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = db.query(MarketPost).filter(MarketPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다")
    if post.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="본인 게시글만 수정할 수 있습니다")

    if title is not None:
        post.title = title
    if content is not None:
        post.content = content
    if price is not None:
        post.price = price
    if image and image.filename:
        delete_image(post.image_path)
        post.image_path = await save_image(image)

    db.commit()
    db.refresh(post)
    return post_to_response(post)


# 현재 상황: 로그인한 작성자가 본인 장터 글을 삭제합니다.
# 목적: DB 게시글과 업로드 이미지를 함께 정리합니다.
@router.delete("/{post_id}", status_code=204)
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = db.query(MarketPost).filter(MarketPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다")
    if post.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="본인 게시글만 삭제할 수 있습니다")

    delete_image(post.image_path)
    db.delete(post)
    db.commit()


# 현재 상황: 로그인한 사용자가 장터 글 좋아요를 누르거나 취소합니다.
# 목적: 관심 판매글 상태와 최신 좋아요 수를 프론트에 반환합니다.
@router.post("/{post_id}/like", response_model=LikeResponse)
def toggle_post_like(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = db.query(MarketPost).filter(MarketPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다")

    existing = db.query(MarketPostLike).filter_by(user_id=current_user.id, post_id=post_id).first()
    if existing:
        db.delete(existing)
        db.commit()
        db.refresh(post)
        return LikeResponse(liked=False, like_count=len(post.likes))
    else:
        db.add(MarketPostLike(user_id=current_user.id, post_id=post_id))
        db.commit()
        db.refresh(post)
        return LikeResponse(liked=True, like_count=len(post.likes))
