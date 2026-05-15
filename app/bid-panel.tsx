"use client";

import { useMemo, useState } from "react";
import { placeBid } from "./lib/api";

type BidPanelProps = {
  bidLabel: string;
  bidsLabel: string;
  currentBid: string;
  currentBidLabel: string;
  endsIn: string;
  endsInLabel: string;
  initialBids?: number;
  postId: number;
};

const formatWon = (amount: number) => `${amount.toLocaleString("ko-KR")}원`;
const parseWon = (value: string) => Number(value.replace(/[^0-9]/g, ""));
const sanitizeMoneyInput = (value: string) => value.replace(/\D/g, "");

export default function BidPanel({
  bidLabel,
  bidsLabel,
  currentBid,
  currentBidLabel,
  endsIn,
  endsInLabel,
  initialBids = 0,
  postId,
}: BidPanelProps) {
  const initialCurrentBid = useMemo(() => parseWon(currentBid), [currentBid]);
  const [currentBidAmount, setCurrentBidAmount] = useState(initialCurrentBid);
  const [bidCount, setBidCount] = useState(initialBids);
  const [isBidOpen, setIsBidOpen] = useState(false);
  const [additionalBid, setAdditionalBid] = useState("");
  const [bidError, setBidError] = useState("");

  const additionalBidAmount = parseWon(additionalBid);
  const nextBidAmount = currentBidAmount + additionalBidAmount;

  const handleSubmitBid = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBidError("");

    if (additionalBidAmount <= 0) {
      setBidError("입찰 금액을 입력해 주세요.");
      return;
    }

    if (additionalBidAmount % 100 !== 0) {
      setBidError("입찰 금액은 100원 단위로 입력해 주세요.");
      return;
    }

    try {
      const result = await placeBid(postId, additionalBidAmount);
      setCurrentBidAmount(result.bid_amount);
      setBidCount((current) => current + 1);
      setAdditionalBid("");
      setIsBidOpen(false);
    } catch (err) {
      setBidError(err instanceof Error ? err.message : "입찰에 실패했습니다.");
    }
  };

  return (
    <>
      <div className="grid gap-3 rounded-md border border-[#eeeeee] bg-[#fafafa] p-4 sm:grid-cols-[1fr_1fr_1fr_auto]">
        <div>
          <p className="text-xs text-[#888888]">{currentBidLabel}</p>
          <p className="mt-1 font-black text-[#c62917]">
            {formatWon(currentBidAmount)}
          </p>
        </div>
        <div>
          <p className="text-xs text-[#888888]">{bidsLabel}</p>
          <p className="mt-1 font-bold">{bidCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#888888]">{endsInLabel}</p>
          <p className="mt-1 font-bold text-[#c62917]">{endsIn}</p>
        </div>
        <button
          className="h-11 rounded-md bg-[#c62917] px-4 text-sm font-bold !text-white transition hover:bg-[#ae2112]"
          onClick={() => setIsBidOpen(true)}
          type="button"
        >
          {bidLabel}
        </button>
      </div>

      {isBidOpen ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/45 px-4 py-6"
          role="dialog"
        >
          <section className="w-full max-w-[420px] rounded-md border border-[#dedede] bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black">입찰하기</h2>
                <p className="mt-1 text-sm leading-6 text-[#777777]">
                  현재가에 더할 금액을 입력하세요.
                </p>
              </div>
              <button
                aria-label="입찰 창 닫기"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#dddddd] text-lg leading-none text-[#777777] hover:bg-[#f5f5f5]"
                onClick={() => setIsBidOpen(false)}
                type="button"
              >
                x
              </button>
            </div>

            <form className="mt-5 space-y-4" onSubmit={handleSubmitBid}>
              <div className="rounded-md bg-[#fafafa] p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-[#777777]">현재가</span>
                  <span className="font-black text-[#c62917]">
                    {formatWon(currentBidAmount)}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="font-semibold text-[#777777]">
                    입찰 후 금액
                  </span>
                  <span className="font-black text-[#222222]">
                    {formatWon(nextBidAmount)}
                  </span>
                </div>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-[#333333]">
                  더해서 입찰할 금액
                </span>
                <input
                  autoFocus
                  className="h-12 w-full rounded-md border border-[#d9d9d9] bg-white px-3 text-sm outline-none placeholder:text-[#aaaaaa] focus:border-[#c62917] focus:ring-2 focus:ring-[#c62917]/10"
                  inputMode="numeric"
                  onChange={(event) =>
                    setAdditionalBid(sanitizeMoneyInput(event.target.value))
                  }
                  placeholder="예: 1,000"
                  type="text"
                  value={additionalBid}
                />
              </label>

              {bidError ? (
                <p className="rounded-md bg-[#fff5f3] px-3 py-2 text-sm font-bold text-[#c62917]">
                  {bidError}
                </p>
              ) : null}

              <button
                className="h-12 w-full rounded-md bg-[#c62917] text-sm font-bold !text-white transition hover:bg-[#ae2112]"
                type="submit"
              >
                {formatWon(nextBidAmount)}에 입찰하기
              </button>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}
