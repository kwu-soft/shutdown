"use client";

// 게시글 상세 페이지에서 좋아요/추천수처럼 누르면 숫자가 올라가는 버튼입니다.
import { useState } from "react";

type PostCounterButtonProps = {
  initialCount: number;
  label: string;
  tone?: "red" | "gray";
};

export default function PostCounterButton({
  initialCount,
  label,
  tone = "gray",
}: PostCounterButtonProps) {
  const [isSelected, setIsSelected] = useState(false);
  const count = isSelected ? initialCount + 1 : initialCount;

  return (
    <button
      className={`inline-flex h-8 items-center rounded-md border px-3 text-xs font-bold transition ${
        isSelected
          ? "border-[#c62917] bg-[#fff5f3] text-[#c62917]"
          : tone === "red"
          ? "border-[#c62917] text-[#c62917] hover:bg-[#fff5f3]"
          : "border-[#dedede] text-[#777777] hover:border-[#c62917] hover:text-[#c62917]"
      }`}
      onClick={() => setIsSelected((current) => !current)}
      type="button"
    >
      {label} {count}
    </button>
  );
}
