"use client";

// 장터게시판 상세 페이지에서 상품 상태에 따라 구매 이동 또는 안내 메시지를 처리합니다.
import Link from "next/link";
import { useState } from "react";

type MarketPurchaseButtonProps = {
  href: string;
  label: string;
  status?: string;
};

export default function MarketPurchaseButton({
  href,
  label,
  status,
}: MarketPurchaseButtonProps) {
  const [message, setMessage] = useState("");
  const canPurchase = status === "구매가능";

  if (canPurchase) {
    return (
      <Link
        className="inline-flex h-11 items-center rounded-md bg-[#c62917] px-4 text-sm font-bold !text-white transition hover:bg-[#ae2112]"
        href={href}
      >
        {label}
      </Link>
    );
  }

  return (
    <div className="space-y-2">
      <button
        className="inline-flex h-11 items-center rounded-md bg-[#cccccc] px-4 text-sm font-bold !text-white transition hover:bg-[#bdbdbd]"
        onClick={() =>
          setMessage(
            status === "예약중"
              ? "예약중인 상품입니다."
              : "판매 완료된 상품입니다.",
          )
        }
        type="button"
      >
        {label}
      </button>
      {message ? (
        <p className="text-xs font-bold text-[#777777]">{message}</p>
      ) : null}
    </div>
  );
}
