"use client";

// 각 게시판 페이지에서 공통으로 사용하는 목록, 검색, 추천 랭킹 UI입니다.
import Link from "next/link";
import { useMemo } from "react";
import AuthLink from "./auth-link";
import {
  allPosts,
  boards,
  trending,
  type BoardKey,
  type CommunityPost,
} from "./community-data";

type CommunityBoardProps = {
  // 현재 열려 있는 게시판을 표시하기 위한 키입니다.
  activeBoard: BoardKey;
  // 게시판 본문 상단에 표시되는 제목입니다.
  title: string;
  // 제목 오른쪽에 붙는 짧은 상태 문구입니다. 예: 최신순, 경매중
  eyebrow: string;
  // 이 화면에 실제로 나열할 게시글 목록입니다.
  posts: CommunityPost[];
  // 게시판 설명은 없는 페이지도 있을 수 있어서 선택값으로 둡니다.
  description?: string;
};

// 공용 게시판 컴포넌트에서 쓰는 화면 문구입니다.
// 여러 곳에 문자열을 직접 쓰지 않고 ui 객체에서 꺼내 쓰면 수정 지점이 줄어듭니다.
const ui = {
  siteTitle: "캠퍼스 게시판",
  siteSubtitle:
    "우리 학교 실시간 커뮤니티",
  login: "로그인",
  search: "검색",
  searchLabel: "게시글 검색",
  searchPlaceholder:
    "궁금한 글을 찾아보세요",
  write: "글쓰기",
  rating: "평점",
  price: "가격",
  currentBid: "현재가",
  likes: "좋아요",
  comments: "댓글",
  buy: "구매",
  bids: "입찰",
  recommend: "추천",
  ranking: "추천 랭킹",
  viewed: "많이 본 글",
  openPost: "게시글 열기",
};

// 게시판별 글쓰기 페이지 경로입니다.
const writeHrefByBoard: Partial<Record<BoardKey, string>> = {
  free: "/write/free",
  market: "/write/market",
  examAuction: "/write/exam-auction",
  reviews: "/write/reviews",
};

const lockedAuctionMessage =
  "낙찰된 사용자만 게시물 내용을 확인할 수 있습니다.";

export default function CommunityBoard({
  activeBoard,
  title,
  eyebrow,
  posts,
  description,
}: CommunityBoardProps) {
  // 현재 게시판에 연결된 글쓰기 페이지가 있으면 버튼을 링크로 보여줍니다.
  // 값이 없는 게시판이 생기면 버튼을 숨길 수 있게 선택형 매핑으로 둡니다.
  const writeHref = writeHrefByBoard[activeBoard];

  // 오른쪽 추천 랭킹은 더미 데이터의 추천수를 기준으로 계산합니다.
  const ranking = useMemo(() => {
    return [...allPosts]
      .map((post) => ({
        id: post.id,
        author: post.author,
        recommendations: post.authorRecommendations,
      }))
      .sort((first, second) => second.recommendations - first.recommendations)
      .slice(0, 3);
  }, []);

  return (
    <main className="min-h-screen bg-[#f5f5f5] text-[#222222]">
      {/* 공통 헤더: 어떤 게시판에 있어도 홈과 로그인으로 이동할 수 있게 둡니다. */}
      <header className="sticky top-0 z-10 border-b border-[#e2e2e2] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link className="flex items-center gap-3" href="/">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#c62917] text-lg font-black !text-white">
              L
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight">
                {ui.siteTitle}
              </h1>
              <p className="text-xs text-[#777777]">{ui.siteSubtitle}</p>
            </div>
          </Link>
          <AuthLink loginLabel={ui.login} />
        </div>
      </header>

      {/* 게시판 화면은 왼쪽 메뉴, 가운데 글 목록, 오른쪽 보조 정보의 3단 레이아웃입니다. */}
      <div className="mx-auto grid max-w-6xl gap-5 px-4 py-5 lg:grid-cols-[180px_1fr_280px]">
        <aside className="hidden lg:block">
          {/* 데스크톱용 게시판 목록입니다. 현재 게시판은 붉은색 배경으로 강조합니다. */}
          <nav className="overflow-hidden rounded-md border border-[#dedede] bg-white">
            {boards.map((board) => {
              // 화면 문구가 바뀌어도 현재 게시판 판별은 안정적인 key로 처리합니다.
              const isActive = activeBoard === board.key;

              return (
                <Link
                  className={`block border-b border-[#eeeeee] px-4 py-3 text-sm last:border-b-0 ${
                    isActive
                      ? "bg-[#fff5f3] font-bold text-[#c62917]"
                      : "text-[#333333] hover:bg-[#fafafa]"
                  }`}
                  href={board.href}
                  key={board.href}
                >
                  {board.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <section className="space-y-4">
          {/* 검색창과 글쓰기 버튼이 들어 있는 상단 도구 영역입니다. */}
          <div className="rounded-md border border-[#dedede] bg-white p-3">
            <div className="flex items-center gap-2">
              {/* 실제 검색 기능은 아직 연결되어 있지 않고, 현재는 입력 UI만 준비되어 있습니다. */}
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-[#dedede] bg-[#fafafa] px-3 py-2">
                <span className="text-sm text-[#999999]">{ui.search}</span>
                <input
                  aria-label={ui.searchLabel}
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#aaaaaa]"
                  placeholder={ui.searchPlaceholder}
                />
              </div>
              {writeHref ? (
                <Link
                  className="shrink-0 rounded-md bg-[#c62917] px-4 py-2 text-sm font-bold !text-white shadow-sm transition hover:bg-[#ae2112]"
                  href={writeHref}
                >
                  {ui.write}
                </Link>
              ) : null}
            </div>
            {activeBoard === "reviews" ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <label className="flex min-w-0 items-center gap-2 rounded-md border border-[#dedede] bg-[#fafafa] px-3 py-2">
                  <span className="shrink-0 text-sm text-[#999999]">
                    강의명
                  </span>
                  <input
                    aria-label="강의명 검색"
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#aaaaaa]"
                    placeholder="강의명을 검색하세요"
                  />
                </label>
                <label className="flex min-w-0 items-center gap-2 rounded-md border border-[#dedede] bg-[#fafafa] px-3 py-2">
                  <span className="shrink-0 text-sm text-[#999999]">
                    교수명
                  </span>
                  <input
                    aria-label="교수명 검색"
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#aaaaaa]"
                    placeholder="교수명을 검색하세요"
                  />
                </label>
              </div>
            ) : null}
            {/* 모바일에서는 왼쪽 사이드바가 숨겨지므로 가로 스크롤 게시판 메뉴를 대신 보여줍니다. */}
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {boards.map((board) => (
                <Link
                  className="shrink-0 rounded-md border border-[#dedede] bg-white px-3 py-2 text-sm text-[#555555]"
                  href={board.href}
                  key={board.href}
                >
                  {board.label}
                </Link>
              ))}
            </div>
          </div>

          {/* 실제 게시글 목록입니다. 게시판 페이지에서 넘겨준 posts 배열을 순서대로 렌더링합니다. */}
          <article className="rounded-md border border-[#dedede] bg-white">
            <div className="border-b border-[#eeeeee] px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-bold">{title}</h2>
                <span className="text-xs font-medium text-[#c62917]">
                  {eyebrow}
                </span>
              </div>
              {description ? (
                <p className="mt-1 text-sm leading-6 text-[#777777]">
                  {description}
                </p>
              ) : null}
            </div>
            {posts.map((post) => (
              <div
                className="border-b border-[#eeeeee] px-4 py-4 last:border-b-0 hover:bg-[#fafafa]"
                key={post.id}
              >
                {/* 게시판명, 평점, 작성 시각처럼 글을 열기 전에 빠르게 확인할 메타 정보입니다. */}
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-sm bg-[#f1f1f1] px-2 py-1 text-xs font-semibold text-[#777777]">
                    {post.board}
                  </span>
                  {post.rating ? (
                    <span className="rounded-sm bg-[#fff5f3] px-2 py-1 text-xs font-bold text-[#c62917]">
                      {ui.rating} {post.rating}
                    </span>
                  ) : null}
                  <span className="text-xs text-[#999999]">{post.time}</span>
                </div>
                {/* 글 제목과 요약을 누르면 게시글 상세 페이지로 이동합니다. */}
                <Link
                  aria-label={`${post.title} ${ui.openPost}`}
                  className="flex items-start justify-between gap-4"
                  href={`/posts/${post.id}`}
                >
                  <div className="min-w-0">
                    <h3 className="line-clamp-1 text-[15px] font-bold text-[#202020]">
                      {post.title}
                    </h3>
                    {post.professor ? (
                      <p className="mt-1 text-xs font-semibold text-[#777777]">
                        {post.professor}
                      </p>
                    ) : null}
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#666666]">
                      {post.currentBid && !post.isAwarded
                        ? lockedAuctionMessage
                        : post.preview}
                    </p>
                  </div>
                  {/* 장터 글에는 가격과 거래 상태가 있으므로 오른쪽에 별도로 보여줍니다. */}
                  {post.price ? (
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-[#999999]">{ui.price}</p>
                      <p
                        className={`mt-1 text-sm font-black ${
                          post.statusKey === "sold"
                            ? "text-[#999999]"
                            : "text-[#c62917]"
                        }`}
                      >
                        {post.price}
                      </p>
                      {post.status ? (
                        <p className="mt-1 text-xs font-bold text-[#777777]">
                          {post.status}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                  {/* 경매 글에는 현재가와 남은 시간이 있으므로 가격 대신 입찰 정보를 보여줍니다. */}
                  {post.currentBid ? (
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-[#999999]">{ui.currentBid}</p>
                      <p className="mt-1 text-sm font-black text-[#c62917]">
                        {post.currentBid}
                      </p>
                      <p className="mt-1 text-xs font-bold text-[#777777]">
                        {post.endsIn}
                      </p>
                    </div>
                  ) : null}
                </Link>
                {/* 하단 액션 영역: 좋아요/댓글 수와 추천 버튼을 함께 배치합니다. */}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-[#888888]">
                  <span className="inline-flex h-8 items-center px-1 text-[#c62917]">
                    {ui.likes} {post.likes}
                  </span>
                  {post.boardKey !== "reviews" ? (
                    <span className="inline-flex h-8 items-center px-1">
                      {ui.comments} {post.comments}
                    </span>
                  ) : null}
                  {post.price ? <span>{ui.buy}</span> : null}
                  {post.bids ? (
                    <span>
                      {ui.bids} {post.bids}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </article>
        </section>

        <aside className="space-y-4">
          {/* 현재 추천 상태를 기준으로 추천수가 높은 작성자 3명을 보여줍니다. */}
          <section className="rounded-md border border-[#dedede] bg-white">
            <div className="border-b border-[#eeeeee] px-4 py-3">
              <h2 className="text-sm font-bold">{ui.ranking}</h2>
            </div>
            <ol className="divide-y divide-[#eeeeee]">
              {ranking.map((person, index) => (
                <li
                  className="flex items-center gap-3 px-4 py-3 text-sm"
                  key={person.id}
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#fff5f3] font-black text-[#c62917]">
                    {index + 1}
                  </span>
                  <p className="min-w-0 flex-1 truncate font-bold text-[#333333]">
                    {person.author}
                  </p>
                  <span className="font-bold text-[#c62917]">
                    {person.recommendations}
                  </span>
                </li>
              ))}
            </ol>
          </section>

          {/* 많이 본 글 목록은 trending 배열의 문자열을 그대로 보여주는 보조 영역입니다. */}
          <section className="rounded-md border border-[#dedede] bg-white">
            <div className="border-b border-[#eeeeee] px-4 py-3">
              <h2 className="text-sm font-bold">{ui.viewed}</h2>
            </div>
            <ol className="divide-y divide-[#eeeeee]">
              {trending.map((item, index) => (
                <li className="flex gap-3 px-4 py-3 text-sm" key={item}>
                  <span className="w-4 font-bold text-[#c62917]">
                    {index + 1}
                  </span>
                  <span className="line-clamp-1 text-[#333333]">{item}</span>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </main>
  );
}
