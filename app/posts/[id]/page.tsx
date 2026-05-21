"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import AuthLink, { authStorageKey } from "../../auth-link";
import BidPanel from "../../bid-panel";
import CommentSection from "../../comment-section";
import { allPosts, boards, type CommunityPost } from "../../community-data";
import MarketPurchaseButton from "../../market-purchase-button";
import PostCounterButton from "../../post-counter-button";
import ReportAuthorButton from "../../report-author-button";
import {
  getFreePost,
  getMarketPost,
  getAuctionPost,
  getReview,
  toggleAuthorRecommendation,
  toggleFreePostLike,
  toggleMarketPostLike,
  toggleAuctionPostLike,
  toggleReviewLike,
  type FreePostResponse,
  type MarketPostResponse,
  type AuctionPostResponse,
  type ReviewPostResponse,
} from "../../lib/api";
import { formatPostTime } from "../../lib/time";

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

function parseWon(value: string | undefined): number {
  return Number(value?.replace(/[^\d]/g, "") || 0);
}

function getFallbackPost(id: number, board: BoardKey): PostState | null {
  // 현재 상황: 백엔드 DB에는 없지만 프론트 샘플 데이터에는 존재하는 게시글이 있습니다.
  // 목적: 상세 조회 API가 실패해도 기존 샘플/묶음 게시글은 상세 화면에서 계속 볼 수 있게 합니다.
  const localPost = allPosts.find(
    (candidate) => candidate.id === id && candidate.boardKey === board,
  );

  if (!localPost) {
    return null;
  }

  return mapLocalPostToDetail(localPost, board);
}

function mapLocalPostToDetail(post: CommunityPost, board: BoardKey): PostState {
  const base = {
    id: post.id,
    title: post.title,
    content: post.reviewEntries?.map((entry) => entry.content).join("\n\n") ?? post.preview,
    author_id: 0,
    author_name: post.author,
    created_at: post.createdAt,
    like_count: post.likes,
    author_recommendation_count: post.authorRecommendations,
  };

  if (board === "market") {
    return {
      type: "market",
      data: {
        ...base,
        price: parseWon(post.price),
        image_path: null,
        is_anonymous: false,
        updated_at: post.createdAt,
        market_status: post.statusKey ?? "available",
      },
    };
  }

  if (board === "examAuction") {
    const currentPrice = parseWon(post.currentBid);
    return {
      type: "examAuction",
      data: {
        ...base,
        course_name: post.courseName ?? post.title,
        professor_name: post.professor ?? "",
        starting_price: currentPrice,
        current_price: currentPrice,
        deadline: post.endsAt ?? post.createdAt,
        image_path: null,
        is_anonymous: false,
        is_ended: Boolean(post.isAwarded),
        bids: Array.from({ length: post.bids ?? 0 }, (_, index) => ({
          id: index + 1,
          bid_amount: currentPrice,
          bidder_name: "",
          created_at: post.createdAt,
        })),
      },
    };
  }

  if (board === "reviews") {
    return {
      type: "reviews",
      data: {
        ...base,
        course_name: post.courseName ?? post.title,
        professor_name: post.professor ?? "",
        assignment_level: "normal",
        team_project_load: "normal",
        grading_style: "normal",
        rating: Number(post.rating ?? 0),
        year: Number(post.courseYear ?? new Date(post.createdAt).getFullYear()),
        semester: post.courseSemester?.includes("2") ? "2" : "1",
        updated_at: post.createdAt,
      },
    };
  }

  return {
    type: "free",
    data: {
      ...base,
      image_path: null,
      is_anonymous: false,
      updated_at: post.createdAt,
      comment_count: post.comments,
    },
  };
}

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
  const [loginRequired, setLoginRequired] = useState(false);

  useEffect(() => {
    let ignore = false;
    const numId = Number(id);
    queueMicrotask(() => {
      if (ignore) return;

      setError(false);
      setPost(null);
      setLoginRequired(false);

    // 현재 상황: 게시글 상세 내용은 로그인한 사용자만 볼 수 있게 제한합니다.
    // 목적: 비로그인 사용자는 게시글을 불러오기 전에 안내 화면으로 보내고, 불필요한 API 호출을 막습니다.
    if (!window.localStorage.getItem(authStorageKey)) {
      setLoginRequired(true);
      return;
    }

    if (!Number.isFinite(numId)) {
      setError(true);
      return;
    }

    const fetcher =
      board === "free" ? getFreePost(numId) :
      board === "market" ? getMarketPost(numId) :
      board === "examAuction" ? getAuctionPost(numId) :
      getReview(numId);

    fetcher
      .then((data) => {
        if (!ignore) {
          setPost({ type: board, data } as PostState);
        }
      })
      .catch(() => {
        if (ignore) return;

        const fallbackPost = getFallbackPost(numId, board);

        if (fallbackPost) {
          setPost(fallbackPost);
          return;
        }

        setError(true);
      });

    });

    return () => {
      ignore = true;
    };
  }, [id, board]);

  if (loginRequired) {
    const boardMeta = BOARD_META[board] ?? BOARD_META.free;

    return (
      <main className="min-h-screen bg-[#f5f5f5] px-4 py-8 text-[#222222]">
        <div className="mx-auto max-w-3xl rounded-md border border-[#dedede] bg-white p-8 text-center">
          <p className="text-sm font-bold text-[#999999]">{boardMeta.name}</p>
          <h1 className="mt-3 text-xl font-black text-[#222222]">
            로그인이 필요한 게시글입니다.
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#777777]">
            게시글 내용을 보려면 먼저 로그인해 주세요.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link
              className="inline-flex h-10 items-center rounded-md bg-[#c62917] px-5 text-sm font-bold !text-white hover:bg-[#ae2112]"
              href="/login"
            >
              로그인하러 가기
            </Link>
            <Link
              className="inline-flex h-10 items-center rounded-md border border-[#dedede] bg-white px-5 text-sm font-bold text-[#555555] hover:bg-[#fafafa]"
              href={boardMeta.backHref}
            >
              목록으로 돌아가기
            </Link>
          </div>
        </div>
      </main>
    );
  }

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
  const time = isReview ? null : formatPostTime(post.data.created_at);

  const canViewContent = !isAuction || (post.type === "examAuction" && post.data.is_ended);

  return (
    <main className="min-h-screen bg-[#f5f5f5] text-[#222222]">
      <header className="sticky top-0 z-10 border-b border-[#e2e2e2] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link className="flex items-center gap-3" href="/">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#c62917] text-lg font-black !text-white">
              L
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight">캠퍼스 게시판</h1>
              <p className="text-xs text-[#777777]">우리 학교 실시간 커뮤니티</p>
            </div>
          </Link>
          <AuthLink loginLabel="로그인" />
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-5 px-4 py-5 lg:grid-cols-[180px_1fr]">
        <aside className="hidden lg:block">
          <nav className="overflow-hidden rounded-md border border-[#dedede] bg-white">
            {boards.map((b) => (
              <Link
                className={`block border-b border-[#eeeeee] px-4 py-3 text-sm last:border-b-0 ${
                  board === b.key
                    ? "bg-[#fff5f3] font-bold text-[#c62917]"
                    : "text-[#333333] hover:bg-[#fafafa]"
                }`}
                href={b.href}
                key={b.key}
              >
                {b.label}
              </Link>
            ))}
          </nav>
        </aside>
        <article className="rounded-md border border-[#dedede] bg-white">
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
            {time ? <span className="text-xs text-[#999999]">{time}</span> : null}
          </div>
          <h1 className="text-2xl font-bold leading-8">{title}</h1>
          {isReview && post.type === "reviews" ? (
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-semibold text-[#777777]">
              <span>
                {post.data.professor_name} · {post.data.year}년 {SEMESTER_LABEL[post.data.semester]}
              </span>
              <span className="inline-flex h-8 items-center">{author}</span>
              <PostCounterButton
                authorId={post.data.author_id}
                initialCount={post.data.author_recommendation_count}
                label={text.recommend}
                onToggle={() => toggleAuthorRecommendation(post.data.author_id)}
              />
              <ReportAuthorButton
                author={author}
                board={board}
                postId={post.data.id}
                targetUserId={post.data.author_id}
              />
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-semibold text-[#777777]">
              <span className="inline-flex h-8 items-center">{author}</span>
              <PostCounterButton
                authorId={post.data.author_id}
                initialCount={post.data.author_recommendation_count}
                label={text.recommend}
                onToggle={() => toggleAuthorRecommendation(post.data.author_id)}
              />
              <ReportAuthorButton
                author={author}
                board={board}
                postId={post.data.id}
                targetUserId={post.data.author_id}
              />
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
                <p className="mt-1 font-bold">
                  {post.data.market_status === "available"
                    ? "판매중"
                    : post.data.market_status === "reserved"
                      ? "예약중"
                      : "거래완료"}
                </p>
              </div>
              <MarketPurchaseButton
                href={`/purchase/${post.data.id}`}
                label={text.buy}
                statusKey={post.data.market_status}
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
            <PostCounterButton
              initialCount={
                post.type === "free" ? post.data.like_count :
                post.type === "market" ? post.data.like_count :
                post.type === "examAuction" ? post.data.like_count :
                post.type === "reviews" ? post.data.like_count : 0
              }
              label={text.likes}
              tone="red"
              onToggle={
                post.type === "free" ? () => toggleFreePostLike(post.data.id) :
                post.type === "market" ? () => toggleMarketPostLike(post.data.id) :
                post.type === "examAuction" ? () => toggleAuctionPostLike(post.data.id) :
                post.type === "reviews" ? () => toggleReviewLike(post.data.id) :
                undefined
              }
            />
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
            postAuthorId={post.data.author_id}
            postId={post.data.id}
          />
        )}
      </article>
      </div>
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
