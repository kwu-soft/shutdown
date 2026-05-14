from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class AssignmentLevel(str, enum.Enum):
    # 현재 상황: 강의평에서 과제량을 정해진 값 중 하나로 저장합니다.
    # 목적: 프론트가 필터/표시를 안정적으로 처리할 수 있게 문자열 값을 제한합니다.
    many = "many"
    normal = "normal"
    few = "few"
    none = "none"


class Semester(str, enum.Enum):
    # 현재 상황: 수강 학기를 1학기, 2학기, 여름, 겨울 중 하나로 저장합니다.
    # 목적: 강의평 데이터의 학기 표기를 통일합니다.
    first = "1"
    second = "2"
    summer = "summer"
    winter = "winter"


class GradingStyle(str, enum.Enum):
    # 현재 상황: 학점 부여 성향을 후함/보통/엄격으로 구분합니다.
    # 목적: 강의 선택 시 사용자가 평가 방식을 빠르게 비교할 수 있게 합니다.
    generous = "generous"
    normal = "normal"
    strict = "strict"


class TeamProjectLoad(str, enum.Enum):
    # 현재 상황: 팀플 부담 정도를 정해진 값으로 저장합니다.
    # 목적: 과제량과 별도로 팀프로젝트 부담을 비교할 수 있게 합니다.
    many = "many"
    normal = "normal"
    few = "few"
    none = "none"


class ReviewPost(Base):
    # 현재 상황: 강의평 게시판의 후기 본문과 강의 메타데이터를 저장합니다.
    # 목적: 과목명/교수명 검색, 별점, 과제량, 학점 스타일 정보를 제공하는 핵심 테이블입니다.
    __tablename__ = "review_posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    course_name = Column(String(100), nullable=False)
    professor_name = Column(String(50), nullable=False)
    assignment_level = Column(Enum(AssignmentLevel), nullable=False)
    team_project_load = Column(Enum(TeamProjectLoad), default=TeamProjectLoad.normal, nullable=False)
    grading_style = Column(Enum(GradingStyle), default=GradingStyle.normal, nullable=False)
    rating = Column(Integer, default=5, nullable=False)
    year = Column(Integer, nullable=False)
    semester = Column(Enum(Semester), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    author = relationship("User")
    likes = relationship("ReviewPostLike", back_populates="post", cascade="all, delete-orphan")


class ReviewPostLike(Base):
    # 현재 상황: 사용자가 강의평 게시글에 좋아요를 눌렀는지 기록합니다.
    # 목적: 한 사용자당 한 강의평에 하나의 좋아요만 허용하고 좋아요 수를 계산합니다.
    __tablename__ = "review_post_likes"
    __table_args__ = (UniqueConstraint("user_id", "post_id"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    post_id = Column(Integer, ForeignKey("review_posts.id"), nullable=False)

    post = relationship("ReviewPost", back_populates="likes")
