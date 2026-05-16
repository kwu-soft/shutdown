"use client";

import Link from "next/link";
import type { MarketStatusKey } from "./community-data";

type MarketPurchaseButtonProps = {
  href: string;
  label: string;
  statusKey?: MarketStatusKey;
};

export default function MarketPurchaseButton({
  href,
  label,
  statusKey,
}: MarketPurchaseButtonProps) {
  if (statusKey === "available") {
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
    <button
      className="inline-flex h-11 cursor-not-allowed items-center rounded-md bg-[#cccccc] px-4 text-sm font-bold !text-white"
      disabled
      type="button"
    >
      {statusKey === "reserved" ? "예약중" : "거래완료"}
    </button>
  );
}
