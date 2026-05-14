from pydantic import BaseModel
from datetime import datetime
from app.models.review_board import AssignmentLevel, Semester, GradingStyle, TeamProjectLoad


class ReviewPostCreate(BaseModel):
    # 현재 상황: 강의평 작성 요청에서 받는 입력값입니다.
    # 목적: 강의 정보, 과제/팀플/학점 스타일, 별점, 수강 학기를 구조화합니다.
    title: str
    content: str
    course_name: str
    professor_name: str
    assignment_level: AssignmentLevel
    team_project_load: TeamProjectLoad = TeamProjectLoad.normal
    grading_style: GradingStyle = GradingStyle.normal
    rating: int = 5
    year: int
    semester: Semester


class ReviewPostUpdate(BaseModel):
    # 현재 상황: 강의평 수정 시 일부 항목만 바꿀 수 있게 optional로 둡니다.
    # 목적: 작성자가 필요한 필드만 선택적으로 수정합니다.
    title: str | None = None
    content: str | None = None
    assignment_level: AssignmentLevel | None = None
    team_project_load: TeamProjectLoad | None = None
    grading_style: GradingStyle | None = None
    rating: int | None = None


class ReviewPostResponse(BaseModel):
    # 현재 상황: 강의평 목록/상세 화면에 제공하는 응답 형식입니다.
    # 목적: 화면 표시용 강의 정보와 평가 지표, 좋아요 수를 포함합니다.
    id: int
    title: str
    content: str
    course_name: str
    professor_name: str
    assignment_level: AssignmentLevel
    team_project_load: TeamProjectLoad
    grading_style: GradingStyle
    rating: int
    year: int
    semester: Semester
    author_id: int
    author_name: str
    created_at: datetime
    updated_at: datetime
    like_count: int

    model_config = {"from_attributes": True}


class ReviewPostListResponse(BaseModel):
    # 현재 상황: 강의평 목록 조회 결과와 페이지 정보를 반환합니다.
    # 목적: 검색/필터 결과의 총 개수와 페이지 구성을 프론트에 알려줍니다.
    posts: list[ReviewPostResponse]
    total: int
    page: int
    size: int
    total_pages: int


class LikeResponse(BaseModel):
    # 현재 상황: 강의평 좋아요 토글 결과를 반환합니다.
    # 목적: 최신 좋아요 상태와 좋아요 수를 즉시 화면에 반영합니다.
    liked: bool
    like_count: int
