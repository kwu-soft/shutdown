"use client";

// 로그인 여부에 따라 헤더 오른쪽에 로그인 버튼 또는 내 아이디 링크를 보여주는 컴포넌트입니다.
// 실제 서버 인증이 아직 없으므로 브라우저 localStorage에 저장된 userId를 로그인 상태로 사용합니다.
import Link from "next/link";
import { useSyncExternalStore } from "react";
import {
  localStorageChangedEvent,
  notifyLocalStorageChanged,
  safeJsonParse,
} from "./storage";
import { JWT_KEY } from "./lib/api";

type AuthLinkProps = {
  loginLabel: string;
};

export const authStorageKey = "campus-board-user-id";
export const nicknameStorageKey = "campus-board-nickname";
export const nicknameByEmailStorageKey = "campus-board-nickname-by-email";
export const userProfileStorageKey = "campus-board-user-profile";
export const userRoleStorageKey = "campus-board-user-role";

function getStoredAuthLabel() {
  return (
    window.localStorage.getItem(nicknameStorageKey) ||
    window.localStorage.getItem(authStorageKey) ||
    ""
  );
}

function getStoredRole() {
  const savedProfile = safeJsonParse<{ role?: string } | null>(
    window.localStorage.getItem(userProfileStorageKey),
    null,
  );

  return savedProfile?.role || window.localStorage.getItem(userRoleStorageKey) || "";
}

function subscribeToAuthStorage(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(localStorageChangedEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(localStorageChangedEvent, onStoreChange);
  };
}

export default function AuthLink({ loginLabel }: AuthLinkProps) {
  const nickname = useSyncExternalStore(
    subscribeToAuthStorage,
    getStoredAuthLabel,
    () => "",
  );
  const role = useSyncExternalStore(
    subscribeToAuthStorage,
    getStoredRole,
    () => "",
  );

  const handleLogout = () => {
    window.localStorage.removeItem(authStorageKey);
    window.localStorage.removeItem(nicknameStorageKey);
    window.localStorage.removeItem(userRoleStorageKey);
    window.localStorage.removeItem(userProfileStorageKey);
    window.localStorage.removeItem(JWT_KEY);
    notifyLocalStorageChanged();
  };

  if (nickname) {
    return (
      <div className="flex items-center gap-2">
        <Link
          className="rounded-md border border-[#c62917] bg-[#fff5f3] px-4 py-2 text-sm font-bold text-[#c62917] transition hover:bg-[#ffe9e5]"
          href="/mypage"
        >
          {nickname}
        </Link>
        {role === "admin" ? (
          <Link
            className="rounded-md bg-[#222222] px-4 py-2 text-sm font-bold !text-white transition hover:bg-[#111111]"
            href="/admin"
          >
            관리자 페이지
          </Link>
        ) : null}
        <button
          className="rounded-md border border-[#dedede] bg-white px-3 py-2 text-sm font-bold text-[#555555] transition hover:bg-[#fafafa]"
          onClick={handleLogout}
          type="button"
        >
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <Link
      className="rounded-md bg-[#c62917] px-4 py-2 text-sm font-semibold !text-white shadow-sm transition hover:bg-[#ae2112]"
      href="/login"
    >
      {loginLabel}
    </Link>
  );
}
