from pydantic import BaseModel
from datetime import datetime


class MarketPostCreate(BaseModel):
    # 현재 상황: 장터 글 작성 시 필요한 기본 입력값입니다.
    # 목적: 판매글의 제목, 내용, 가격, 익명 여부를 검증합니다.
    title: str
    content: str
    price: int
    is_anonymous: bool = False


class MarketPostUpdate(BaseModel):
    # 현재 상황: 장터 글 수정 시 바뀔 수 있는 값만 optional로 받습니다.
    # 목적: 제목/내용/가격 중 필요한 항목만 수정합니다.
    title: str | None = None
    content: str | None = None
    price: int | None = None


class MarketPostResponse(BaseModel):
    # 현재 상황: 장터 게시글을 화면에 보여줄 때 사용하는 응답 형식입니다.
    # 목적: 판매 가격, 이미지 경로, 작성자 표시명, 좋아요 수를 포함합니다.
    id: int
    title: str
    content: str
    price: int
    image_path: str | None
    is_anonymous: bool
    author_id: int
    author_name: str
    created_at: datetime
    updated_at: datetime
    like_count: int

    model_config = {"from_attributes": True}


class MarketPostListResponse(BaseModel):
    # 현재 상황: 장터 목록 조회 결과와 페이지 정보를 함께 전달합니다.
    # 목적: 프론트에서 전체 개수와 현재 페이지를 기준으로 목록 UI를 구성합니다.
    posts: list[MarketPostResponse]
    total: int
    page: int
    size: int
    total_pages: int
