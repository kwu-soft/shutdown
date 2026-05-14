from pydantic import BaseModel, EmailStr
from datetime import datetime


class UserCreate(BaseModel):
    # 현재 상황: 회원가입 요청에서 프론트가 보내는 데이터 형식입니다.
    # 목적: 새 사용자를 만들기 전에 username, email, password를 검증합니다.
    username: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    # 현재 상황: 로그인 요청에서 프론트가 보내는 데이터 형식입니다.
    # 목적: 이메일과 비밀번호로 사용자를 확인하고 JWT를 발급합니다.
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    # 현재 상황: 회원가입 성공 후 클라이언트에 돌려주는 사용자 정보입니다.
    # 목적: 비밀번호 해시를 숨기고 필요한 공개 정보만 응답합니다.
    id: int
    username: str
    email: str
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    # 현재 상황: 로그인 성공 시 클라이언트가 저장할 인증 토큰 응답입니다.
    # 목적: 이후 보호된 API 요청에서 Bearer 토큰으로 사용합니다.
    access_token: str
    token_type: str = "bearer"
