from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from math import ceil

from app.database import get_db
from app.models.user import User
from app.models.auction_board import AuctionPost, AuctionBid, AuctionPostLike
from app.schemas.auction_board import (
    AuctionPostResponse, AuctionPostListResponse,
    AuctionBidCreate, AuctionBidResponse,
)
from app.schemas.free_board import LikeResponse
from app.dependencies import get_current_user
from app.utils import save_image, delete_image

router = APIRouter(prefix="/auction", tags=["족보경매장"])


def get_current_price(post: AuctionPost) -> int:
    # 현재 상황: 경매글의 현재가는 입찰 내역이 없으면 시작가, 있으면 최고 입찰가입니다.
    # 목적: 목록/상세/새 입찰 계산에서 같은 기준으로 현재가를 사용합니다.
    if not post.bids:
        return post.starting_price
    return max(b.bid_amount for b in post.bids)


def post_to_response(post: AuctionPost) -> AuctionPostResponse:
    # 현재 상황: 경매 DB 모델을 화면용 응답 데이터로 변환합니다.
    # 목적: 현재가, 마감 여부, 최신순 입찰 내역까지 한 번에 계산합니다.
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    return AuctionPostResponse(
        id=post.id,
        title=post.title,
        content=post.content,
        course_name=post.course_name,
        professor_name=post.professor_name,
        starting_price=post.starting_price,
        current_price=get_current_price(post),
        deadline=post.deadline,
        image_path=post.image_path,
        is_anonymous=post.is_anonymous,
        author_id=post.author_id,
        author_name="익명" if post.is_anonymous else post.author.username,
        created_at=post.created_at,
        is_ended=post.deadline < now,
        like_count=len(post.likes),
        bids=[
            AuctionBidResponse(
                id=b.id,
                bid_amount=b.bid_amount,
                bidder_name=b.user.username,
                created_at=b.created_at,
            )
            for b in sorted(post.bids, key=lambda b: b.created_at, reverse=True)
        ],
    )


# 현재 상황: 족보 경매글 목록을 최신순으로 페이지 단위 조회합니다.
# 목적: 경매 리스트 화면에 현재가와 마감 상태를 함께 제공합니다.
@router.get("", response_model=AuctionPostListResponse)
def list_posts(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    total = db.query(AuctionPost).count()
    posts = (
        db.query(AuctionPost)
        .order_by(AuctionPost.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )
    return AuctionPostListResponse(
        posts=[post_to_response(p) for p in posts],
        total=total,
        page=page,
        size=size,
        total_pages=ceil(total / size) if total else 1,
    )


# 현재 상황: 로그인한 사용자가 새 경매글을 작성합니다.
# 목적: 마감 시간이 현재보다 미래인지 검증하고 경매 정보를 저장합니다.
@router.post("", response_model=AuctionPostResponse, status_code=201)
async def create_post(
    title: str = Form(...),
    content: str = Form(...),
    course_name: str = Form(...),
    professor_name: str = Form(...),
    starting_price: int = Form(...),
    deadline: datetime = Form(...),
    is_anonymous: bool = Form(False),
    image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if deadline.tzinfo is not None:
        deadline = deadline.astimezone(timezone.utc).replace(tzinfo=None)
    if deadline <= datetime.now(timezone.utc).replace(tzinfo=None):
        raise HTTPException(status_code=400, detail="마감시간은 현재 시간보다 이후여야 합니다")

    image_path = await save_image(image)
    post = AuctionPost(
        title=title,
        content=content,
        course_name=course_name,
        professor_name=professor_name,
        starting_price=starting_price,
        deadline=deadline,
        is_anonymous=is_anonymous,
        image_path=image_path,
        author_id=current_user.id,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return post_to_response(post)


# 현재 상황: 특정 경매글 상세 정보를 조회합니다.
# 목적: 입찰 내역, 현재가, 마감 여부를 상세 페이지에 제공합니다.
@router.get("/{post_id}", response_model=AuctionPostResponse)
def get_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(AuctionPost).filter(AuctionPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다")
    return post_to_response(post)


# 현재 상황: 로그인한 작성자가 마감 전 경매글을 수정합니다.
# 목적: 작성자 권한과 마감 여부를 확인한 뒤 제목/내용/이미지를 갱신합니다.
@router.put("/{post_id}", response_model=AuctionPostResponse)
async def update_post(
    post_id: int,
    title: str | None = Form(None),
    content: str | None = Form(None),
    image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = db.query(AuctionPost).filter(AuctionPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다")
    if post.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="본인 게시글만 수정할 수 있습니다")
    post_deadline = post.deadline
    if post_deadline.tzinfo is not None:
        post_deadline = post_deadline.astimezone(timezone.utc).replace(tzinfo=None)
    if post_deadline <= datetime.now(timezone.utc).replace(tzinfo=None):
        raise HTTPException(status_code=400, detail="마감된 경매는 수정할 수 없습니다")

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


# 현재 상황: 로그인한 작성자가 본인 경매글을 삭제합니다.
# 목적: DB 게시글, 입찰/좋아요 관계, 업로드 이미지를 정리합니다.
@router.delete("/{post_id}", status_code=204)
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = db.query(AuctionPost).filter(AuctionPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다")
    if post.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="본인 게시글만 삭제할 수 있습니다")

    delete_image(post.image_path)
    db.delete(post)
    db.commit()


# 현재 상황: 로그인한 사용자가 경매글에 추가 금액을 입찰합니다.
# 목적: 마감 여부, 본인 글 여부, 양수 금액 여부를 검증한 뒤 새 최고가를 저장합니다.
@router.post("/{post_id}/bid", response_model=AuctionBidResponse, status_code=201)
def place_bid(
    post_id: int,
    body: AuctionBidCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = db.query(AuctionPost).filter(AuctionPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다")
    if post.deadline <= datetime.now(timezone.utc).replace(tzinfo=None):
        raise HTTPException(status_code=400, detail="경매가 마감되었습니다")
    if post.author_id == current_user.id:
        raise HTTPException(status_code=400, detail="본인 경매에는 입찰할 수 없습니다")
    if body.additional_amount <= 0:
        raise HTTPException(status_code=400, detail="추가금액은 0보다 커야 합니다")

    current_price = get_current_price(post)
    new_bid_amount = current_price + body.additional_amount

    bid = AuctionBid(
        post_id=post_id,
        user_id=current_user.id,
        bid_amount=new_bid_amount,
    )
    db.add(bid)
    db.commit()
    db.refresh(bid)
    return AuctionBidResponse(
        id=bid.id,
        bid_amount=bid.bid_amount,
        bidder_name=current_user.username,
        created_at=bid.created_at,
    )


# 현재 상황: 로그인한 사용자가 경매글 좋아요를 누르거나 취소합니다.
# 목적: 관심 경매 상태와 최신 좋아요 수를 반환합니다.
@router.post("/{post_id}/like", response_model=LikeResponse)
def toggle_post_like(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = db.query(AuctionPost).filter(AuctionPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다")

    existing = db.query(AuctionPostLike).filter_by(user_id=current_user.id, post_id=post_id).first()
    if existing:
        db.delete(existing)
        db.commit()
        db.refresh(post)
        return LikeResponse(liked=False, like_count=len(post.likes))
    else:
        db.add(AuctionPostLike(user_id=current_user.id, post_id=post_id))
        db.commit()
        db.refresh(post)
        return LikeResponse(liked=True, like_count=len(post.likes))
