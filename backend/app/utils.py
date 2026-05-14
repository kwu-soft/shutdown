import uuid
import os
from fastapi import UploadFile, HTTPException

UPLOAD_DIR = "uploads"
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


async def save_image(file: UploadFile | None) -> str | None:
    # 현재 상황: 게시글 작성/수정에서 이미지가 선택되지 않았을 수 있습니다.
    # 목적: 이미지가 없으면 DB에 None을 저장하고, 있으면 검증 후 uploads 폴더에 저장합니다.
    if file is None or file.filename == "":
        return None

    # 현재 상황: 허용된 이미지 확장자만 업로드할 수 있게 제한합니다.
    # 목적: 실행 파일이나 예상하지 못한 형식이 서버에 저장되는 위험을 줄입니다.
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="jpg, png, gif, webp 파일만 업로드 가능합니다")

    # 현재 상황: 파일 전체를 읽어서 크기를 검사합니다.
    # 목적: 너무 큰 파일이 서버 저장 공간과 응답 속도에 부담을 주지 않게 합니다.
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="파일 크기는 10MB 이하여야 합니다")

    # 현재 상황: UUID를 파일명으로 사용해 사용자 파일명 충돌을 피합니다.
    # 목적: DB에는 이 경로를 저장하고, 프론트는 /uploads 정적 경로로 이미지를 불러옵니다.
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(contents)

    return filepath


def delete_image(image_path: str | None):
    # 현재 상황: 게시글 삭제 또는 이미지 교체 시 기존 파일을 정리합니다.
    # 목적: DB에서 사라진 게시글의 이미지 파일이 서버에 계속 남지 않도록 합니다.
    if image_path and os.path.exists(image_path):
        os.remove(image_path)
