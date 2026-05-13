"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import BidPanel from "../../bid-panel";
import CommentSection from "../../comment-section";
import MarketPurchaseButton from "../../market-purchase-button";
import PostCounterButton from "../../post-counter-button";
import ReportAuthorButton from "../../report-author-button";
import {
  getFreePost,
  getMarketPost,
  getAuctionPost,
  getReview,
  toggleFreePostLike,
  toggleMarketPostLike,
  toggleAuctionPostLike,
  type FreePostResponse,
  type MarketPostResponse,
  type AuctionPostResponse,
  type ReviewPostResponse,
} from "../../lib/api";

const text = {
  back: "목록으로 돌아가기",
  likes: "좋아요",
  comments: "댓글",
  author: "작성자",
  recommend: "추천수",
  price: "가격",
  status: "상태",
  buy: "구매하기",
  currentBid: "현재가",
  bids: "입찰수",
  endsIn: "마감",
  bid: "입찰하기",
  rating: "평점",
  professor: "교수",
  lockedAuction: "낙찰된 사용자만 게시물 내용을 확인할 수 있습니다.",
  assignment: "과제",
  teamProject: "조모임",
  grading: "성적",
};

const ASSIGNMENT_LABEL: Record<string, string> = {
  many: "많음", normal: "보통", few: "적음", none: "없음",
};
const TEAM_LABEL: Record<string, string> = {
  many: "많음", normal: "보통", few: "적음", none: "없음",
};
const GRADING_LABEL: Record<string, string> = {
  generous: "너그러움", normal: "보통", strict: "깐깐함",
};
const SEMESTER_LABEL: Record<string, string> = {
  "1": "1학기", "2": "2학기", summer: "여름학기", winter: "겨울학기",
};

type BoardKey = "free" | "market" | "examAuction" | "reviews";

const BOARD_META: Record<BoardKey, { name: string; backHref: string }> = {
  free: { name: "자유게시판", backHref: "/free" },
  market: { name: "장터게시판", backHref: "/market" },
  examAuction: { name: "족보경매장", backHref: "/exam-auction" },
  reviews: { name: "강의평게시판", backHref: "/reviews" },
};

function toRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "방금";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  return `${Math.floor(hr / 24)}일 전`;
}

function getEndsIn(deadlineStr: string): string {
  const diff = new Date(deadlineStr).getTime() - Date.now();
  if (diff <= 0) return "마감됨";
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}시간 후`;
  return `${Math.floor(hours / 24)}일 후`;
}

function formatWon(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}원`;
}

type PostState =
  | { type: "free"; data: FreePostResponse }
  | { type: "market"; data: MarketPostResponse }
  | { type: "examAuction"; data: AuctionPostResponse }
  | { type: "reviews"; data: ReviewPostResponse };

export default function PostPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#f5f5f5]">
          <p className="text-[#777777]">로딩 중...</p>
        </main>
      }
    >
      <PostContent />
    </Suspense>
  );
}

function PostContent() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const board = (searchParams.get("board") ?? "free") as BoardKey;

  const [post, setPost] = useState<PostState | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const numId = Number(id);
    const fetcher =
      board === "free" ? getFreePost(numId) :
      board === "market" ? getMarketPost(numId) :
      board === "examAuction" ? getAuctionPost(numId) :
      getReview(numId);

    fetcher
      .then((data) => setPost({ type: board, data } as PostState))
      .catch(() => setError(true));
  }, [id, board]);

  if (error) {
    return (
      <main className="min-h-screen bg-[#f5f5f5] px-4 py-8 text-[#222222]">
        <div className="mx-auto max-w-3xl rounded-md border border-[#dedede] bg-white p-8 text-center">
          <p className="font-bold text-[#c62917]">게시글을 불러올 수 없습니다.</p>
        </div>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f5f5]">
        <p className="text-[#777777]">로딩 중...</p>
      </main>
    );
  }

  const boardMeta = BOARD_META[board] ?? BOARD_META.free;
  const isReview = post.type === "reviews";
  const isAuction = post.type === "examAuction";
  const isMarket = post.type === "market";

  const title = post.data.title;
  const content = post.data.content;
  const author = post.data.author_name;
  const time = toRelativeTime(post.data.created_at);

  const canViewContent = !isAuction || (post.type === "examAuction" && post.data.is_ended);

  return (
    <main className="min-h-screen bg-[#f5f5f5] px-4 py-8 text-[#222222]">
      <article className="mx-auto max-w-3xl rounded-md border border-[#dedede] bg-white">
        <header className="border-b border-[#eeeeee] px-5 py-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-sm bg-[#f1f1f1] px-2 py-1 text-xs font-semibold text-[#777777]">
              {boardMeta.name}
            </span>
            {isReview && post.type === "reviews" && (
              <span className="rounded-sm bg-[#fff5f3] px-2 py-1 text-xs font-bold text-[#c62917]">
                {text.rating} {post.data.rating}
              </span>
            )}
            <span className="text-xs text-[#999999]">{time}</span>
          </div>
          <h1 className="text-2xl font-bold leading-8">{title}</h1>
          {isReview && post.type === "reviews" ? (
            <p className="mt-3 text-sm font-semibold text-[#777777]">
              {post.data.professor_name} · {post.data.year}년 {SEMESTER_LABEL[post.data.semester]}
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-semibold text-[#777777]">
              <span className="inline-flex h-8 items-center">{text.author} {author}</span>
              <PostCounterButton initialCount={0} label={text.recommend} />
              <ReportAuthorButton author={author} />
            </div>
          )}
        </header>

        <section className="space-y-5 px-5 py-5">
          {isReview && post.type === "reviews" ? (
            <>
              <ReviewDetailCard data={post.data} />
              <p className="whitespace-pre-line text-base leading-8 text-[#333333]">{content}</p>
            </>
          ) : canViewContent ? (
            <p className="whitespace-pre-line text-base leading-8 text-[#333333]">{content}</p>
          ) : (
            <div className="rounded-md border border-[#f0d5d0] bg-[#fff5f3] p-4">
              <p className="text-sm font-bold text-[#c62917]">{text.lockedAuction}</p>
              <p className="mt-2 text-sm leading-6 text-[#777777]">
                경매가 끝나고 낙찰 처리된 뒤 본문 내용을 볼 수 있습니다.
              </p>
            </div>
          )}

          {isMarket && post.type === "market" && (
            <div className="grid gap-3 rounded-md border border-[#eeeeee] bg-[#fafafa] p-4 sm:grid-cols-[1fr_1fr_auto]">
              <div>
                <p className="text-xs text-[#888888]">{text.price}</p>
                <p className="mt-1 font-black text-[#c62917]">{formatWon(post.data.price)}</p>
              </div>
              <div>
                <p className="text-xs text-[#888888]">{text.status}</p>
                <p className="mt-1 font-bold">구매가능</p>
              </div>
              <MarketPurchaseButton
                href={`/purchase/${post.data.id}`}
                label={text.buy}
                statusKey="available"
              />
            </div>
          )}

          {isAuction && post.type === "examAuction" && (
            <BidPanel
              bidLabel={text.bid}
              bidsLabel={text.bids}
              currentBid={formatWon(post.data.current_price)}
              currentBidLabel={text.currentBid}
              endsIn={getEndsIn(post.data.deadline)}
              endsInLabel={text.endsIn}
              initialBids={post.data.bids.length}
              postId={post.data.id}
            />
          )}

          <div className="flex flex-wrap items-center gap-2 border-t border-[#eeeeee] pt-4 text-sm font-bold text-[#777777]">
            {!isReview && (
              <PostCounterButton
                initialCount={
                  post.type === "free" ? post.data.like_count :
                  post.type === "market" ? post.data.like_count :
                  post.type === "examAuction" ? post.data.like_count : 0
                }
                label={text.likes}
                tone="red"
                onToggle={
                  post.type === "free" ? () => toggleFreePostLike(post.data.id) :
                  post.type === "market" ? () => toggleMarketPostLike(post.data.id) :
                  post.type === "examAuction" ? () => toggleAuctionPostLike(post.data.id) :
                  undefined
                }
              />
            )}
            {!isReview && (
              <span className="inline-flex h-8 items-center px-1">
                {text.comments} {post.type === "free" ? post.data.comment_count : 0}
              </span>
            )}
            <Link
              className="ml-auto inline-flex h-8 items-center rounded-md border border-[#dedede] bg-white px-4 text-sm font-bold text-[#555555] hover:bg-[#fafafa]"
              href={boardMeta.backHref}
            >
              {text.back}
            </Link>
          </div>
        </section>

        {post.type === "free" && (
          <CommentSection
            initialCount={post.data.comment_count}
            postAuthor={post.data.author_name}
            postId={post.data.id}
          />
        )}
      </article>
    </main>
  );
}

function ReviewDetailCard({ data }: { data: ReviewPostResponse }) {
  return (
    <div className="grid gap-3 rounded-md border border-[#eeeeee] bg-[#fafafa] p-4 sm:grid-cols-3">
      <div className="rounded-md border border-[#eeeeee] bg-white p-3">
        <h2 className="text-sm font-black text-[#333333]">{text.assignment}</h2>
        <p className="mt-2 text-sm font-bold text-[#c62917]">
          {ASSIGNMENT_LABEL[data.assignment_level] ?? data.assignment_level}
        </p>
      </div>
      <div className="rounded-md border border-[#eeeeee] bg-white p-3">
        <h2 className="text-sm font-black text-[#333333]">{text.teamProject}</h2>
        <p className="mt-2 text-sm font-bold text-[#c62917]">
          {TEAM_LABEL[data.team_project_load] ?? data.team_project_load}
        </p>
      </div>
      <div className="rounded-md border border-[#eeeeee] bg-white p-3">
        <h2 className="text-sm font-black text-[#333333]">{text.grading}</h2>
        <p className="mt-2 text-sm font-bold text-[#c62917]">
          {GRADING_LABEL[data.grading_style] ?? data.grading_style}
        </p>
      </div>
    </div>
  );
}
