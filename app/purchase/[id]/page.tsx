"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  createPurchaseRequest,
  getMarketPost,
  type MarketPostResponse,
  type MarketPurchaseRequestResponse,
} from "../../lib/api";

const statusLabels: Record<MarketPurchaseRequestResponse["status"], string> = {
  requested: "요청됨",
  accepted: "수락됨",
  rejected: "거절됨",
  completed: "거래완료",
};

const marketStatusLabels: Record<MarketPostResponse["market_status"], string> = {
  available: "판매중",
  reserved: "예약중",
  sold: "거래완료",
};

export default function PurchasePage() {
  const { id } = useParams<{ id: string }>();
  const postId = Number(id);
  const [post, setPost] = useState<MarketPostResponse | null>(null);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<MarketPurchaseRequestResponse | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(postId)) return;

    getMarketPost(postId)
      .then(setPost)
      .catch(() => setError("판매글을 불러올 수 없습니다."));
  }, [postId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (post?.market_status !== "available") {
      setError(`${marketStatusLabels[post?.market_status ?? "sold"]}인 상품입니다.`);
      return;
    }
    const trimmed = message.trim();

    if (!trimmed) {
      setError("판매자에게 보낼 메시지를 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const nextResult = await createPurchaseRequest(postId, trimmed);
      setResult(nextResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "구매 요청을 보낼 수 없습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!post && !error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f5f5]">
        <p className="text-sm font-bold text-[#777777]">불러오는 중</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f5f5] px-4 py-8 text-[#222222]">
      <section className="mx-auto max-w-2xl rounded-md border border-[#dedede] bg-white">
        <header className="border-b border-[#eeeeee] px-5 py-4">
          <p className="text-sm font-bold text-[#c62917]">장터게시판</p>
          <h1 className="mt-1 text-2xl font-black">
            {result ? "구매 요청 완료" : "구매 요청"}
          </h1>
        </header>

        <div className="space-y-4 px-5 py-5">
          {post ? (
            <div className="grid gap-3 rounded-md bg-[#fafafa] p-4 sm:grid-cols-2">
              <InfoItem label="상품명" value={post.title} />
              <InfoItem label="판매자" value={post.author_name} />
              <InfoItem label="가격" value={`${post.price.toLocaleString("ko-KR")}원`} />
              <InfoItem label="상태" value={marketStatusLabels[post.market_status]} />
            </div>
          ) : null}

          {result ? (
            <div className="rounded-md border border-[#eeeeee] p-4">
              <p className="text-sm font-bold text-[#c62917]">
                구매 요청을 보냈습니다.
              </p>
              <p className="mt-2 text-sm leading-6 text-[#666666]">
                현재 상태는 {statusLabels[result.status]}입니다. 마이페이지에서 요청 상태를 확인할 수 있습니다.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  className="inline-flex h-10 items-center rounded-md bg-[#c62917] px-4 text-sm font-bold !text-white hover:bg-[#ae2112]"
                  href="/mypage"
                >
                  마이페이지로 이동
                </Link>
                <Link
                  className="inline-flex h-10 items-center rounded-md border border-[#dedede] px-4 text-sm font-bold text-[#555555] hover:bg-[#fafafa]"
                  href="/market"
                >
                  장터로 돌아가기
                </Link>
              </div>
            </div>
          ) : post?.market_status !== "available" ? (
            <div className="rounded-md border border-[#eeeeee] p-4">
              <p className="text-sm font-bold text-[#c62917]">
                {marketStatusLabels[post?.market_status ?? "sold"]}인 상품입니다.
              </p>
              <p className="mt-2 text-sm leading-6 text-[#666666]">
                판매자가 이미 구매 요청을 수락했거나 거래를 완료한 상품은 새 구매 요청을 보낼 수 없습니다.
              </p>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-[#333333]">
                  판매자에게 보낼 메시지
                </span>
                <textarea
                  className="min-h-32 w-full resize-y rounded-md border border-[#d9d9d9] px-3 py-3 text-sm leading-6 outline-none placeholder:text-[#aaaaaa] focus:border-[#c62917] focus:ring-2 focus:ring-[#c62917]/10"
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="예: 오늘 오후에 거래 가능할까요?"
                  value={message}
                />
              </label>

              {error ? (
                <p className="rounded-md bg-[#fff5f3] px-3 py-2 text-sm font-bold text-[#c62917]">
                  {error}
                </p>
              ) : null}

              <button
                className="h-12 w-full rounded-md bg-[#c62917] text-sm font-bold !text-white transition hover:bg-[#ae2112] disabled:cursor-not-allowed disabled:bg-[#d9d9d9]"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? "보내는 중" : "구매 요청 보내기"}
              </button>
            </form>
          )}

          <div className="flex flex-wrap gap-2">
            <Link
              className="inline-flex h-10 items-center rounded-md border border-[#dedede] px-4 text-sm font-bold text-[#555555] hover:bg-[#fafafa]"
              href={`/posts/${postId}?board=market`}
            >
              게시글로 돌아가기
            </Link>
            <Link
              className="inline-flex h-10 items-center rounded-md border border-[#dedede] px-4 text-sm font-bold text-[#555555] hover:bg-[#fafafa]"
              href="/market"
            >
              장터게시판
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-[#888888]">{label}</p>
      <p className="mt-1 break-all text-sm font-black text-[#333333]">
        {value}
      </p>
    </div>
  );
}
