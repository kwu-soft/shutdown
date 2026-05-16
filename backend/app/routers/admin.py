from datetime import datetime, time

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models.admin import AdminLog, Report
from app.models.auction_board import AuctionPost
from app.models.free_board import FreePost
from app.models.market_board import MarketPost
from app.models.review_board import ReviewPost
from app.models.user import User
from app.schemas.admin import (
    AdminLogItem,
    AdminPostItem,
    AdminSummary,
    AdminUserItem,
    AdminUserUpdate,
    ReportCreate,
    ReportItem,
    ReportUpdate,
)

router = APIRouter(prefix="/admin", tags=["admin"])

POST_MODELS = {
    "free": FreePost,
    "market": MarketPost,
    "examAuction": AuctionPost,
    "reviews": ReviewPost,
}


def write_admin_log(
    db: Session,
    admin: User | None,
    action: str,
    target_type: str,
    target_id: str,
    detail: str | None = None,
) -> None:
    db.add(
        AdminLog(
            admin_id=admin.id if admin else None,
            action=action,
            target_type=target_type,
            target_id=target_id,
            detail=detail,
        )
    )


def user_post_count(db: Session, user_id: int) -> int:
    return sum(
        db.query(model).filter(model.author_id == user_id).count()
        for model in POST_MODELS.values()
    )


def report_to_item(report: Report) -> ReportItem:
    return ReportItem(
        id=report.id,
        reporter_id=report.reporter_id,
        reporter_name=report.reporter.username if report.reporter else None,
        target_user_id=report.target_user_id,
        target_author_name=report.target_author_name,
        board=report.board,
        post_id=report.post_id,
        reason=report.reason,
        details=report.details,
        status=report.status,
        admin_note=report.admin_note,
        created_at=report.created_at,
        updated_at=report.updated_at,
    )


@router.post("/reports", response_model=ReportItem, status_code=201)
def create_report(
    body: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if body.board not in POST_MODELS:
        raise HTTPException(status_code=400, detail="지원하지 않는 게시판입니다")

    post_model = POST_MODELS[body.board]
    post = db.query(post_model).filter(post_model.id == body.post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다")

    report = Report(
        reporter_id=current_user.id,
        target_user_id=body.target_user_id,
        target_author_name=body.target_author_name,
        board=body.board,
        post_id=body.post_id,
        reason=body.reason,
        details=body.details,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report_to_item(report)


@router.get("/summary", response_model=AdminSummary)
def get_summary(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    today_start = datetime.combine(datetime.now().date(), time.min)
    total_posts = sum(db.query(model).count() for model in POST_MODELS.values())

    return AdminSummary(
        total_users=db.query(User).count(),
        suspended_users=db.query(User).filter(User.status == "suspended").count(),
        total_posts=total_posts,
        pending_reports=db.query(Report).filter(Report.status == "pending").count(),
        today_users=db.query(User).filter(User.created_at >= today_start).count(),
    )


@router.get("/users", response_model=list[AdminUserItem])
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    users = db.query(User).order_by(User.created_at.desc()).all()

    return [
        AdminUserItem(
            id=user.id,
            username=user.username,
            email=user.email,
            role=user.role,
            status=user.status,
            sanction_reason=user.sanction_reason,
            created_at=user.created_at,
            recommendation_count=len(user.recommendations_received),
            post_count=user_post_count(db, user.id),
        )
        for user in users
    ]


@router.patch("/users/{user_id}", response_model=AdminUserItem)
def update_user(
    user_id: int,
    body: AdminUserUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")

    if body.role is not None:
        if body.role not in {"user", "moderator", "admin"}:
            raise HTTPException(status_code=400, detail="올바르지 않은 권한입니다")
        user.role = body.role
    if body.status is not None:
        if body.status not in {"active", "suspended"}:
            raise HTTPException(status_code=400, detail="올바르지 않은 상태입니다")
        user.status = body.status
    if body.sanction_reason is not None:
        user.sanction_reason = body.sanction_reason

    write_admin_log(
        db,
        admin,
        "update_user",
        "user",
        str(user.id),
        f"role={user.role}, status={user.status}",
    )
    db.commit()
    db.refresh(user)

    return AdminUserItem(
        id=user.id,
        username=user.username,
        email=user.email,
        role=user.role,
        status=user.status,
        sanction_reason=user.sanction_reason,
        created_at=user.created_at,
        recommendation_count=len(user.recommendations_received),
        post_count=user_post_count(db, user.id),
    )


@router.get("/posts", response_model=list[AdminPostItem])
def list_posts(
    board: str | None = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    boards = [board] if board else list(POST_MODELS.keys())
    posts: list[AdminPostItem] = []

    for board_key in boards:
        post_model = POST_MODELS.get(board_key)
        if not post_model:
            raise HTTPException(status_code=400, detail="지원하지 않는 게시판입니다")

        for post in db.query(post_model).order_by(post_model.created_at.desc()).limit(100).all():
            posts.append(
                AdminPostItem(
                    id=post.id,
                    board=board_key,
                    title=post.title,
                    author_id=post.author_id,
                    author_name=post.author.username,
                    created_at=post.created_at,
                    like_count=len(post.likes),
                    comment_count=len(post.comments) if hasattr(post, "comments") else 0,
                )
            )

    return sorted(posts, key=lambda post: post.created_at, reverse=True)


@router.delete("/posts/{board}/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(
    board: str,
    post_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    post_model = POST_MODELS.get(board)
    if not post_model:
        raise HTTPException(status_code=400, detail="지원하지 않는 게시판입니다")

    post = db.query(post_model).filter(post_model.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다")

    write_admin_log(db, admin, "delete_post", board, str(post_id), post.title)
    db.delete(post)
    db.commit()


@router.get("/reports", response_model=list[ReportItem])
def list_reports(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    reports = db.query(Report).order_by(Report.created_at.desc()).all()
    return [report_to_item(report) for report in reports]


@router.patch("/reports/{report_id}", response_model=ReportItem)
def update_report(
    report_id: int,
    body: ReportUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    if body.status not in {"pending", "reviewing", "resolved", "rejected"}:
        raise HTTPException(status_code=400, detail="올바르지 않은 신고 상태입니다")

    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="신고를 찾을 수 없습니다")

    report.status = body.status
    report.admin_note = body.admin_note
    write_admin_log(
        db,
        admin,
        "update_report",
        "report",
        str(report.id),
        f"status={report.status}",
    )
    db.commit()
    db.refresh(report)
    return report_to_item(report)


@router.get("/logs", response_model=list[AdminLogItem])
def list_logs(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    logs = db.query(AdminLog).order_by(AdminLog.created_at.desc()).limit(100).all()
    return [
        AdminLogItem(
            id=log.id,
            admin_id=log.admin_id,
            admin_name=log.admin.username if log.admin else None,
            action=log.action,
            target_type=log.target_type,
            target_id=log.target_id,
            detail=log.detail,
            created_at=log.created_at,
        )
        for log in logs
    ]
