from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from dotenv import load_dotenv
from pathlib import Path
import os

load_dotenv()

# 현재 상황: .env 파일에 저장된 DB 접속 정보를 조합해 MySQL 연결 문자열을 만듭니다.
# 목적: 계정/비밀번호 같은 민감한 값은 코드에 직접 쓰지 않고 환경 변수로 관리합니다.
mysql_env_keys = ("DB_USER", "DB_PASSWORD", "DB_HOST", "DB_PORT", "DB_NAME")
has_mysql_config = all(os.getenv(key) for key in mysql_env_keys)

# 현재 상황: MySQL 접속 정보가 있으면 MySQL을 쓰고, 없으면 개발용 SQLite 파일 DB를 씁니다.
# 목적: 아직 실제 DB가 없어도 backend/dev.db 파일로 회원가입/로그인/게시글 기능을 테스트합니다.
if has_mysql_config:
    DATABASE_URL = (
        f"mysql+pymysql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}"
        f"@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
        f"?charset=utf8mb4"
    )
else:
    default_sqlite_path = Path(__file__).resolve().parents[1] / "dev.db"
    DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{default_sqlite_path.as_posix()}")

# 현재 상황: SQLAlchemy가 실제 DB와 통신할 때 사용하는 엔진과 세션 팩토리입니다.
# 목적: 라우터 함수마다 독립적인 DB 세션을 받아 CRUD 작업을 수행하게 합니다.
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    # 현재 상황: 모든 ORM 모델(User, 게시글, 댓글 등)이 상속하는 공통 베이스입니다.
    # 목적: SQLAlchemy가 모델 클래스를 모아 테이블 생성/매핑을 처리할 수 있게 합니다.
    pass


def get_db():
    # 현재 상황: FastAPI Depends에서 사용하는 DB 세션 제공 함수입니다.
    # 목적: 요청이 끝나면 finally에서 세션을 닫아 연결 누수를 막습니다.
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
