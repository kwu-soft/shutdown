"use client";

import { useState } from "react";

type PostCounterButtonProps = {
  initialCount: number;
  label: string;
  tone?: "red" | "gray";
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
  onToggle,
}: PostCounterButtonProps) {
  const [isSelected, setIsSelected] = useState(false);
  const [count, setCount] = useState(initialCount);

  const handleClick = async () => {
    if (!onToggle) {
      setIsSelected((c) => !c);
      setCount((c) => (isSelected ? c - 1 : c + 1));
      return;
    }
    try {
      const result = await onToggle();
      setIsSelected(result.liked ?? result.recommended ?? false);
      setCount((current) => result.like_count ?? result.recommendation_count ?? current);
    } catch {
      // 로그인 필요 또는 네트워크 오류 시 무시
    }
  };

  return (
    <button
      className={`inline-flex h-8 items-center rounded-md border px-3 text-xs font-bold transition ${
        isSelected
          ? "border-[#c62917] bg-[#fff5f3] text-[#c62917]"
          : tone === "red"
          ? "border-[#c62917] text-[#c62917] hover:bg-[#fff5f3]"
          : "border-[#dedede] text-[#777777] hover:border-[#c62917] hover:text-[#c62917]"
      }`}
      onClick={handleClick}
      type="button"
    >
      {label} {count}
    </button>
  );
}
