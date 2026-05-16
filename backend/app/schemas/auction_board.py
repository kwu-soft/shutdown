from pydantic import BaseModel
from datetime import datetime


class AuctionPostCreate(BaseModel):
    # 현재 상황: 족보 경매글 작성 요청에서 필요한 입력값입니다.
    # 목적: 과목/교수/시작가/마감시간을 검증해 경매글을 생성합니다.
    title: str
    content: str
    course_name: str
    professor_name: str
    starting_price: int
    deadline: datetime
    is_anonymous: bool = False


class AuctionPostUpdate(BaseModel):
    # 현재 상황: 경매글 수정 시 제한적으로 바꿀 수 있는 입력값입니다.
    # 목적: 마감 전 제목과 내용 중심으로 수정할 수 있게 합니다.
    title: str | None = None
    content: str | None = None


class AuctionBidCreate(BaseModel):
    # 현재 상황: 입찰 요청에서 사용자가 추가로 올릴 금액을 받습니다.
    # 목적: 현재 최고가에 additional_amount를 더해 새 입찰가를 계산합니다.
    additional_amount: int  # 현재 최고가에서 추가할 금액


class AuctionBidResponse(BaseModel):
    # 현재 상황: 입찰 성공 또는 경매 상세 조회에서 입찰 내역을 보여주는 형식입니다.
    # 목적: 입찰 금액, 입찰자 이름, 시간을 프론트에 제공합니다.
    id: int
    bid_amount: int
    bidder_name: str
    created_at: datetime

    model_config = {"from_attributes": True}


class AuctionPostResponse(BaseModel):
    # 현재 상황: 경매글 목록/상세 화면에서 사용하는 응답 형식입니다.
    # 목적: 현재가, 마감 여부, 입찰 내역, 좋아요 수까지 한 번에 제공합니다.
    id: int
    title: str
    content: str
    course_name: str
    professor_name: str
    starting_price: int
    current_price: int        # 현재 최고 입찰가
    deadline: datetime
    image_path: str | None
    is_anonymous: bool
    author_id: int
    author_name: str
    created_at: datetime
    is_ended: bool            # 마감 여부
    like_count: int
    author_recommendation_count: int
    bids: list[AuctionBidResponse]

    model_config = {"from_attributes": True}


class AuctionPostListResponse(BaseModel):
    # 현재 상황: 경매 목록 조회 결과와 페이지 정보를 함께 반환합니다.
    # 목적: 프론트가 경매 게시글 목록과 페이지네이션을 표시합니다.
    posts: list[AuctionPostResponse]
    total: int
    page: int
    size: int
    total_pages: int
