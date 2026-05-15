from datetime import datetime
from pydantic import BaseModel


class AdminSummary(BaseModel):
    total_users: int
    suspended_users: int
    total_posts: int
    pending_reports: int
    today_users: int


class AdminUserItem(BaseModel):
    id: int
    username: str
    email: str
    role: str
    status: str
    sanction_reason: str | None
    created_at: datetime
    recommendation_count: int
    post_count: int


class AdminUserUpdate(BaseModel):
    role: str | None = None
    status: str | None = None
    sanction_reason: str | None = None


class AdminPostItem(BaseModel):
    id: int
    board: str
    title: str
    author_id: int
    author_name: str
    created_at: datetime
    like_count: int
    comment_count: int


class ReportCreate(BaseModel):
    target_user_id: int | None = None
    target_author_name: str
    board: str
    post_id: int
    reason: str
    details: str | None = None


class ReportItem(BaseModel):
    id: int
    reporter_id: int | None
    reporter_name: str | None
    target_user_id: int | None
    target_author_name: str
    board: str
    post_id: int
    reason: str
    details: str | None
    status: str
    admin_note: str | None
    created_at: datetime
    updated_at: datetime


class ReportUpdate(BaseModel):
    status: str
    admin_note: str | None = None


class AdminLogItem(BaseModel):
    id: int
    admin_id: int | None
    admin_name: str | None
    action: str
    target_type: str
    target_id: str
    detail: str | None
    created_at: datetime
