from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import inspect, text
import os

from app.database import engine, Base, SessionLocal
from app.models import admin as admin_models, user, free_board, market_board, auction_board, review_board  # noqa: F401
from app.routers import admin, auth, free_board as free, market_board as market, auction_board as auction, review_board as review

# 현재 상황: 앱이 시작될 때 SQLAlchemy 모델을 기준으로 필요한 테이블을 준비합니다.
# 목적: 별도의 마이그레이션 도구 없이도 개발 환경에서 바로 API를 실행할 수 있게 합니다.
Base.metadata.create_all(bind=engine)


def ensure_user_role_column() -> None:
    inspector = inspect(engine)
    columns = {column["name"] for column in inspector.get_columns("users")}

    with engine.begin() as connection:
        if "role" not in columns:
            connection.execute(
                text("ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user'")
            )
        if "status" not in columns:
            connection.execute(
                text("ALTER TABLE users ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active'")
            )
        if "sanction_reason" not in columns:
            connection.execute(
                text("ALTER TABLE users ADD COLUMN sanction_reason TEXT")
            )


ensure_user_role_column()
with SessionLocal() as db:
    auth.ensure_default_admin(db)

app = FastAPI(title="CRUD 게시판 API", version="1.0.0")

# 현재 상황: 프론트엔드 Next.js 앱에서 백엔드 API를 호출할 수 있도록 CORS를 열어둔 상태입니다.
# 목적: 개발 중에는 모든 origin을 허용하지만, 배포 시에는 실제 프론트 주소로 제한하는 것이 좋습니다.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프론트 주소로 교체 권장
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 현재 상황: 게시글 작성 시 업로드한 이미지 파일을 /uploads 경로로 접근할 수 있게 공개합니다.
# 목적: DB에는 이미지 경로만 저장하고, 실제 파일은 서버의 uploads 폴더에서 제공합니다.
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# 현재 상황: 기능별 라우터를 FastAPI 앱에 연결합니다.
# 목적: auth, 자유게시판, 장터, 경매, 강의평 API를 각각 분리해서 관리합니다.
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(free.router)
app.include_router(market.router)
app.include_router(auction.router)
app.include_router(review.router)


@app.get("/")
def health_check():
    # 현재 상황: 서버가 정상적으로 떠 있는지 확인하는 가장 단순한 체크 엔드포인트입니다.
    return {"status": "ok"}
