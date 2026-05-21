"use client";

import { useState } from "react";

const AUTH_STORAGE_KEY = "campus-board-numeric-user-id";

type PostCounterButtonProps = {
  initialCount: number;
  label: string;
  tone?: "red" | "gray";
  authorId?: number;
  onToggle?: () => Promise<{
    liked?: boolean;
    like_count?: number;
    recommended?: boolean;
    recommendation_count?: number;
  }>;
};

export default function PostCounterButton({
  initialCount,
  label,
  tone = "gray",
  authorId,
  onToggle,
}: PostCounterButtonProps) {
  const [isSelected, setIsSelected] = useState(false);
  const [countOverride, setCountOverride] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const count = countOverride ?? initialCount;

  const handleClick = async () => {
    if (authorId !== undefined) {
      const currentUserId = Number(window.localStorage.getItem(AUTH_STORAGE_KEY));
      if (currentUserId && currentUserId === authorId) {
        setErrorMessage("본인에게는 추천할 수 없습니다.");
        return;
      }
    }

    setErrorMessage("");

    if (!onToggle) {
      setIsSelected((c) => !c);
      setCountOverride(count + (isSelected ? -1 : 1));
      return;
    }
    try {
      const result = await onToggle();
      setIsSelected(result.liked ?? result.recommended ?? false);
      setCountOverride(result.like_count ?? result.recommendation_count ?? count);
    } catch {
      // 로그인 필요 또는 네트워크 오류 시 무시
    }
  };

  return (
    <span className="relative inline-flex items-center">
      <button
        className={`inline-flex h-8 items-center rounded-md border px-3 text-xs font-bold transition ${
          isSelected
            ? "border-[#c62917] bg-[#fff5f3] text-[#c62917]"
            : tone === "red"
            ? "border-[#c62917] text-[#c62917] hover:bg-[#fff5f3]"
            : "border-[#dedede] text-[#777777] hover:border-[#c62917] hover:text-[#c62917]"
        }`}
        onClick={handleClick}
        onMouseLeave={() => setErrorMessage("")}
        type="button"
      >
        {label} {count}
      </button>
      {errorMessage ? (
        <span className="absolute bottom-full left-0 z-50 mb-1 whitespace-nowrap rounded bg-[#333333] px-2 py-1 text-xs text-white">
          {errorMessage}
        </span>
      ) : null}
    </span>
  );
}
