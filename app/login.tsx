"use client";

// 로그인 화면과 회원가입 모달 UI를 담당하는 클라이언트 컴포넌트입니다.
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import {
  authStorageKey,
  nicknameByEmailStorageKey,
  nicknameStorageKey,
  userProfileStorageKey,
} from "./auth-link";
import { apiLogin, apiRegister, JWT_KEY } from "./lib/api";
import { notifyLocalStorageChanged, safeJsonParse } from "./storage";

// 로그인 페이지와 회원가입 모달에서 쓰는 모든 문구를 모아둡니다.
// 폼 구조와 문구를 분리해두면 화면 문구 수정이 훨씬 단순해집니다.
const text = {
  title: "캠퍼스 게시판 로그인",
  subtitle:
    "학교 계정으로 커뮤니티에 참여하세요",
  email: "이메일",
  emailPlaceholder: "school@example.co.kr",
  password: "비밀번호",
  passwordPlaceholder:
    "비밀번호를 입력하세요",
  submit: "로그인",
  noAccount: "아직 계정이 없나요?",
  signup: "회원가입",
  back: "게시판으로 돌아가기",
  modalTitle: "회원가입",
  modalSubtitle:
    "학교 이메일과 닉네임으로 시작해보세요",
  name: "닉네임",
  namePlaceholder: "예: 컴공새내기",
  confirmPassword: "비밀번호 확인",
  major: "학과",
  majorPlaceholder: "예: 컴퓨터공학과",
  createAccount: "계정 만들기",
  close: "닫기",
};

export default function Login() {
  const router = useRouter();
  // 회원가입 버튼을 눌렀을 때 모달을 열고, 닫기 버튼을 누르면 다시 숨깁니다.
  const [isSignupOpen, setIsSignupOpen] = useState(false);

  const [loginError, setLoginError] = useState("");
  const [signupError, setSignupError] = useState("");

  const handleLogin = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      const token = await apiLogin(email, password);
      window.localStorage.setItem(JWT_KEY, token);

      // 다른 계정의 프로필이 남아있으면 지움
      const savedProfile = safeJsonParse<{ email?: string } | null>(
        window.localStorage.getItem(userProfileStorageKey),
        null,
      );
      if (savedProfile && savedProfile.email !== email) {
        window.localStorage.removeItem(userProfileStorageKey);
      }

      // 닉네임은 저장된 값 또는 이메일 앞부분으로 대체
      const savedNicknames = safeJsonParse<Record<string, string>>(
        window.localStorage.getItem(nicknameByEmailStorageKey),
        {},
      );
      const userId = email.split("@")[0] || "campus-user";
      const nickname = savedNicknames[email] || userId;
      window.localStorage.setItem(authStorageKey, userId);
      window.localStorage.setItem(nicknameStorageKey, nickname);
      notifyLocalStorageChanged();
      router.push("/");
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "로그인 실패");
    }
  };

  const handleSignup = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const nickname = String(formData.get("nickname") ?? "").trim();
    const email = String(formData.get("signupEmail") ?? "").trim();
    const password = String(formData.get("signupPassword") ?? "");
    const major = String(formData.get("major") ?? "").trim();
    const userId = email.split("@")[0] || "campus-user";

    try {
      await apiRegister(nickname, email, password);

      // 회원가입 성공 후 바로 로그인
      const token = await apiLogin(email, password);
      window.localStorage.setItem(JWT_KEY, token);

      const savedNicknames = safeJsonParse<Record<string, string>>(
        window.localStorage.getItem(nicknameByEmailStorageKey),
        {},
      );
      window.localStorage.setItem(
        nicknameByEmailStorageKey,
        JSON.stringify({ ...savedNicknames, [email]: nickname }),
      );
      window.localStorage.setItem(authStorageKey, userId);
      window.localStorage.setItem(nicknameStorageKey, nickname);
      window.localStorage.setItem(
        userProfileStorageKey,
        JSON.stringify({ email, major, nickname, userId }),
      );
      notifyLocalStorageChanged();
      setIsSignupOpen(false);
      router.push("/");
    } catch (err) {
      setSignupError(err instanceof Error ? err.message : "회원가입 실패");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f5f5] px-4 py-10 text-[#222222]">
      <section className="w-full max-w-[420px]">
        {/* 로그인 카드 위쪽의 로고와 안내 문구 영역입니다. */}
        <div className="mb-7 text-center">
          <Link className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-[#c62917] text-2xl font-black !text-white" href="/">
            L
          </Link>
          <h1 className="text-2xl font-bold">{text.title}</h1>
          <p className="mt-2 text-sm text-[#777777]">{text.subtitle}</p>
        </div>

        {/* 실제 서버 로그인 처리는 아직 연결되어 있지 않고, 현재는 입력 폼 UI만 구성되어 있습니다. */}
        <form
          className="rounded-md border border-[#dedede] bg-white p-5 shadow-sm"
          onSubmit={handleLogin}
        >
          <div className="space-y-4">
            {/* 이메일 입력칸입니다. type=email을 사용해서 브라우저 기본 이메일 검사를 활용합니다. */}
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[#333333]">
                {text.email}
              </span>
              <input
                className="h-12 w-full rounded-md border border-[#d9d9d9] bg-white px-3 text-sm outline-none transition placeholder:text-[#aaaaaa] focus:border-[#c62917] focus:ring-2 focus:ring-[#c62917]/10"
                name="email"
                placeholder={text.emailPlaceholder}
                required
                type="email"
              />
            </label>

            {/* 비밀번호 입력칸입니다. type=password라 입력값이 화면에 노출되지 않습니다. */}
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[#333333]">
                {text.password}
              </span>
              <input
                className="h-12 w-full rounded-md border border-[#d9d9d9] bg-white px-3 text-sm outline-none transition placeholder:text-[#aaaaaa] focus:border-[#c62917] focus:ring-2 focus:ring-[#c62917]/10"
                name="password"
                placeholder={text.passwordPlaceholder}
                required
                type="password"
              />
            </label>
          </div>

          {loginError ? (
            <p className="mt-3 rounded-md bg-[#fff5f3] px-3 py-2 text-sm font-bold text-[#c62917]">
              {loginError}
            </p>
          ) : null}

          <button
            className="mt-4 h-12 w-full rounded-md bg-[#c62917] text-sm font-bold text-white transition hover:bg-[#ae2112]"
            type="submit"
          >
            {text.submit}
          </button>

          {/* 회원가입 버튼을 누르면 아래쪽 조건부 렌더링 영역에서 모달이 나타납니다. */}
          <div className="mt-5 border-t border-[#eeeeee] pt-5 text-center text-sm text-[#666666]">
            {text.noAccount}{" "}
            <button
              className="font-bold text-[#c62917] hover:text-[#ae2112]"
              onClick={() => setIsSignupOpen(true)}
              type="button"
            >
              {text.signup}
            </button>
          </div>
        </form>

        {/* 로그인하지 않고 다시 메인 게시판으로 돌아가는 링크입니다. */}
        <Link
          className="mt-5 block text-center text-sm font-semibold text-[#777777] hover:text-[#c62917]"
          href="/"
        >
          {text.back}
        </Link>
      </section>

      {/* isSignupOpen이 true일 때만 회원가입 모달을 화면 위에 띄웁니다. */}
      {isSignupOpen ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-20 flex items-center justify-center bg-black/45 px-4 py-6"
          role="dialog"
        >
          <section className="w-full max-w-[460px] rounded-md border border-[#dedede] bg-white p-5 shadow-xl">
            {/* 모달 상단에는 제목/설명과 닫기 버튼을 배치합니다. */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">{text.modalTitle}</h2>
                <p className="mt-1 text-sm leading-6 text-[#777777]">
                  {text.modalSubtitle}
                </p>
              </div>
              <button
                aria-label={text.close}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#dddddd] text-lg leading-none text-[#777777] hover:bg-[#f5f5f5]"
                onClick={() => setIsSignupOpen(false)}
                type="button"
              >
                x
              </button>
            </div>

            {/* 회원가입에 필요한 기본 입력값을 받는 폼입니다. 아직 제출 로직은 연결되어 있지 않습니다. */}
            <form className="mt-5 space-y-4" onSubmit={handleSignup}>
              {/* 사용자가 게시판에서 보일 닉네임을 입력합니다. */}
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">
                  {text.name}
                </span>
                <input
                  className="h-12 w-full rounded-md border border-[#d9d9d9] px-3 text-sm outline-none placeholder:text-[#aaaaaa] focus:border-[#c62917] focus:ring-2 focus:ring-[#c62917]/10"
                  name="nickname"
                  placeholder={text.namePlaceholder}
                  required
                  type="text"
                />
              </label>

              {/* 학교 이메일을 입력하는 칸입니다. */}
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">
                  {text.email}
                </span>
                <input
                  className="h-12 w-full rounded-md border border-[#d9d9d9] px-3 text-sm outline-none placeholder:text-[#aaaaaa] focus:border-[#c62917] focus:ring-2 focus:ring-[#c62917]/10"
                  name="signupEmail"
                  placeholder={text.emailPlaceholder}
                  required
                  type="email"
                />
              </label>

              {/* 학과 정보를 입력하는 칸입니다. */}
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">
                  {text.major}
                </span>
                <input
                  className="h-12 w-full rounded-md border border-[#d9d9d9] px-3 text-sm outline-none placeholder:text-[#aaaaaa] focus:border-[#c62917] focus:ring-2 focus:ring-[#c62917]/10"
                  name="major"
                  placeholder={text.majorPlaceholder}
                  required
                  type="text"
                />
              </label>

              {/* 비밀번호와 비밀번호 확인은 작은 화면에서는 세로, 넓은 화면에서는 2열로 보입니다. */}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">
                    {text.password}
                  </span>
                  <input
                    className="h-12 w-full rounded-md border border-[#d9d9d9] px-3 text-sm outline-none placeholder:text-[#aaaaaa] focus:border-[#c62917] focus:ring-2 focus:ring-[#c62917]/10"
                    name="signupPassword"
                    placeholder={text.password}
                    required
                    type="password"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">
                    {text.confirmPassword}
                  </span>
                  <input
                    className="h-12 w-full rounded-md border border-[#d9d9d9] px-3 text-sm outline-none placeholder:text-[#aaaaaa] focus:border-[#c62917] focus:ring-2 focus:ring-[#c62917]/10"
                    name="confirmPassword"
                    placeholder={text.confirmPassword}
                    required
                    type="password"
                  />
                </label>
              </div>

              {signupError ? (
                <p className="rounded-md bg-[#fff5f3] px-3 py-2 text-sm font-bold text-[#c62917]">
                  {signupError}
                </p>
              ) : null}

              <button
                className="h-12 w-full rounded-md bg-[#c62917] text-sm font-bold text-white transition hover:bg-[#ae2112]"
                type="submit"
              >
                {text.createAccount}
              </button>
            </form>
          </section>
        </div>
      ) : null}
    </main>
  );
}
