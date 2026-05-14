from pydantic import BaseModel
from datetime import datetime


class FreePostCreate(BaseModel):
    # 현재 상황: 자유게시판 글 작성 시 필요한 기본 입력값입니다.
    # 목적: 이미지가 없는 JSON 기반 생성 흐름에서도 사용할 수 있는 형태입니다.
    title: str
    content: str
    is_anonymous: bool = False


class FreePostUpdate(BaseModel):
    # 현재 상황: 자유게시판 글 수정 시 일부 필드만 바꿀 수 있게 optional로 둡니다.
    # 목적: 제목 또는 내용 중 필요한 값만 수정합니다.
    title: str | None = None
    content: str | None = None


class FreePostResponse(BaseModel):
    # 현재 상황: 자유게시판 게시글을 목록/상세 화면에 보여줄 때 사용하는 응답 형식입니다.
    # 목적: 작성자 표시명, 좋아요 수, 댓글 수처럼 화면에 필요한 계산값까지 포함합니다.
    id: int
    title: str
    content: str
    image_path: str | None
    is_anonymous: bool
    author_id: int
    author_name: str          # 익명이면 "익명"
    created_at: datetime
    updated_at: datetime
    like_count: int
    comment_count: int

    model_config = {"from_attributes": True}


class FreePostListResponse(BaseModel):
    # 현재 상황: 자유게시판 목록 조회 결과를 페이지 정보와 함께 돌려줍니다.
    # 목적: 프론트에서 페이지네이션을 구성할 수 있게 합니다.
    posts: list[FreePostResponse]
    total: int
    page: int
    size: int
    total_pages: int


class FreeCommentCreate(BaseModel):
    # 현재 상황: 자유게시판 댓글 작성 요청 데이터입니다.
    # 목적: 댓글 내용과 익명 여부를 서버에 전달합니다.
    content: str
    is_anonymous: bool = False


class FreeCommentResponse(BaseModel):
    # 현재 상황: 댓글 목록/작성 응답에서 사용하는 데이터 형식입니다.
    # 목적: 댓글 작성자 표시명과 좋아요 수를 함께 제공합니다.
    id: int
    content: str
    is_anonymous: bool
    author_id: int
    author_name: str          # 익명이면 "익명"
    post_id: int
    created_at: datetime
    like_count: int

    model_config = {"from_attributes": True}


class LikeResponse(BaseModel):
    # 현재 상황: 좋아요 토글 API가 공통으로 돌려주는 응답입니다.
    # 목적: 현재 사용자가 좋아요를 눌렀는지와 최신 좋아요 수를 프론트에 알려줍니다.
    liked: bool
    like_count: int
