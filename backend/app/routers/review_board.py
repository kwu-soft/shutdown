from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from math import ceil

from app.database import get_db
from app.models.user import User
from app.models.review_board import ReviewPost, ReviewPostLike
from app.schemas.review_board import (
    ReviewPostCreate, ReviewPostUpdate,
    ReviewPostResponse, ReviewPostListResponse, LikeResponse,
)
from app.dependencies import get_current_user

router = APIRouter(prefix="/reviews", tags=["강의평게시판"])


def post_to_response(post: ReviewPost) -> ReviewPostResponse:
    # 현재 상황: 강의평 DB 모델을 프론트 응답 스키마로 변환합니다.
    # 목적: 강의 정보, 평가 지표, 작성자명, 좋아요 수를 화면에서 바로 사용하게 합니다.
    return ReviewPostResponse(
        id=post.id,
        title=post.title,
        content=post.content,
        course_name=post.course_name,
        professor_name=post.professor_name,
        assignment_level=post.assignment_level,
        team_project_load=post.team_project_load,
        grading_style=post.grading_style,
        rating=post.rating,
        year=post.year,
        semester=post.semester,
        author_id=post.author_id,
        author_name=post.author.username,
        created_at=post.created_at,
        updated_at=post.updated_at,
        like_count=len(post.likes),
    )


# 현재 상황: 강의평 목록을 페이지 단위로 조회하고 검색/필터를 적용합니다.
# 목적: 과목명 또는 교수명으로 원하는 강의평을 찾을 수 있게 합니다.
@router.get("", response_model=ReviewPostListResponse)
def list_posts(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    search: str | None = Query(None, description="강의명 또는 교수명 통합 검색"),
    course_name: str | None = Query(None, description="강의명으로 필터"),
    professor_name: str | None = Query(None, description="교수명으로 필터"),
    db: Session = Depends(get_db),
):
    # 현재 상황: 검색어가 있으면 과목명과 교수명 양쪽에서 부분 일치로 찾습니다.
    # 목적: 사용자가 한 검색창으로 강의명/교수명을 모두 탐색할 수 있게 합니다.
    query = db.query(ReviewPost)

    if search:
        query = query.filter(
            ReviewPost.course_name.contains(search) |
            ReviewPost.professor_name.contains(search)
        )
    if course_name:
        query = query.filter(ReviewPost.course_name.contains(course_name))
    if professor_name:
        query = query.filter(ReviewPost.professor_name.contains(professor_name))

    total = query.count()
    posts = query.order_by(ReviewPost.created_at.desc()).offset((page - 1) * size).limit(size).all()

    return ReviewPostListResponse(
        posts=[post_to_response(p) for p in posts],
        total=total,
        page=page,
        size=size,
        total_pages=ceil(total / size) if total else 1,
    )


# 현재 상황: 로그인한 사용자가 강의평을 작성합니다.
# 목적: 강의 정보와 평가 항목을 구조화해서 DB에 저장합니다.
@router.post("", response_model=ReviewPostResponse, status_code=201)
def create_post(
    body: ReviewPostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = ReviewPost(
        title=body.title,
        content=body.content,
        course_name=body.course_name,
        professor_name=body.professor_name,
        assignment_level=body.assignment_level,
        team_project_load=body.team_project_load,
        grading_style=body.grading_style,
        rating=body.rating,
        year=body.year,
        semester=body.semester,
        author_id=current_user.id,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return post_to_response(post)


# 현재 상황: 특정 강의평 상세 정보를 조회합니다.
# 목적: 상세 페이지에서 강의 정보와 평가 내용을 모두 보여줍니다.
@router.get("/{post_id}", response_model=ReviewPostResponse)
def get_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(ReviewPost).filter(ReviewPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다")
    return post_to_response(post)


# 현재 상황: 로그인한 작성자가 본인 강의평을 수정합니다.
# 목적: 작성자 권한 확인 후 수정 가능한 평가 항목을 갱신합니다.
@router.put("/{post_id}", response_model=ReviewPostResponse)
def update_post(
    post_id: int,
    body: ReviewPostUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = db.query(ReviewPost).filter(ReviewPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다")
    if post.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="본인 게시글만 수정할 수 있습니다")

    if body.title is not None:
        post.title = body.title
    if body.content is not None:
        post.content = body.content
    if body.assignment_level is not None:
        post.assignment_level = body.assignment_level

    db.commit()
    db.refresh(post)
    return post_to_response(post)


# 현재 상황: 로그인한 작성자가 본인 강의평을 삭제합니다.
# 목적: 작성자 본인만 삭제할 수 있게 보호합니다.
@router.delete("/{post_id}", status_code=204)
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = db.query(ReviewPost).filter(ReviewPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다")
    if post.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="본인 게시글만 삭제할 수 있습니다")

    db.delete(post)
    db.commit()


# 현재 상황: 로그인한 사용자가 강의평 좋아요를 누르거나 취소합니다.
# 목적: 강의평 선호 상태와 최신 좋아요 수를 반환합니다.
@router.post("/{post_id}/like", response_model=LikeResponse)
def toggle_like(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = db.query(ReviewPost).filter(ReviewPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다")

    existing = db.query(ReviewPostLike).filter_by(user_id=current_user.id, post_id=post_id).first()
    if existing:
        db.delete(existing)
        db.commit()
        return LikeResponse(liked=False, like_count=len(post.likes) - 1)
    else:
        db.add(ReviewPostLike(user_id=current_user.id, post_id=post_id))
        db.commit()
        return LikeResponse(liked=True, like_count=len(post.likes) + 1)
