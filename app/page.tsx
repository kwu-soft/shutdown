import Link from "next/link";
import AuthLink from "./auth-link";
import {
  examAuctionPosts,
  freePosts,
  groupedReviewPosts,
  marketPosts,
  type CommunityPost,
} from "./community-data";
import {
  getAuthorRecommendationRanking,
  getAuctionPosts,
  getFreePosts,
  getMarketPosts,
  getReviews,
  type AuctionPostResponse,
  type FreePostResponse,
  type MarketPostResponse,
  type ReviewPostResponse,
} from "./lib/api";
import { formatPostTime } from "./lib/time";

export const dynamic = "force-dynamic";

// 메인 화면에서 게시판별 최신 글과 추천 랭킹을 한눈에 보여줍니다.
// 화면에 직접 노출되는 문구를 한곳에 모아두면 나중에 문구를 바꿀 때 JSX를 뒤지지 않아도 됩니다.
const text = {
  siteTitle: "캠퍼스 게시판",
  siteSubtitle:
    "게시판별 최신글을 빠르게 확인하세요",
  login: "로그인",
  ranking: "추천 랭킹",
  recommend: "추천",
  noRanking: "아직 추천받은 작성자가 없습니다.",
  boardList: "게시판 목록",
  free: "자유게시판",
  market: "장터게시판",
  examAuction: "족보경매장",
  reviews: "강의평게시판",
};

type BoardSection = {
  title: string;
  href: string;
  posts: CommunityPost[];
};
type RankingPerson = { id: string; author: string; recommendations: number };

const POST_PREVIEW_LIMIT = 5;

function sortLatest(posts: CommunityPost[]): CommunityPost[] {
  return [...posts].sort(
    (first, second) =>
      new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
  );
}

function toFreePost(post: FreePostResponse): CommunityPost {
  return {
    id: post.id,
    boardKey: "free",
    board: text.free,
    title: post.title,
    preview: post.content.slice(0, 100),
    createdAt: post.created_at,
    time: formatPostTime(post.created_at),
    comments: post.comment_count,
    likes: post.like_count,
    author: post.author_name,
    authorId: post.author_id,
    authorRecommendations: post.author_recommendation_count,
  };
}

function toMarketPost(post: MarketPostResponse): CommunityPost {
  return {
    id: post.id,
    boardKey: "market",
    board: text.market,
    title: post.title,
    preview: post.content.slice(0, 100),
    createdAt: post.created_at,
    time: formatPostTime(post.created_at),
    comments: 0,
    likes: post.like_count,
    author: post.author_name,
    authorId: post.author_id,
    authorRecommendations: post.author_recommendation_count,
    price: `${post.price.toLocaleString("ko-KR")}원`,
    statusKey: post.market_status,
    status:
      post.market_status === "available"
        ? "판매중"
        : post.market_status === "reserved"
          ? "예약중"
          : "거래완료",
  };
}

function toAuctionPost(post: AuctionPostResponse): CommunityPost {
  return {
    id: post.id,
    boardKey: "examAuction",
    board: text.examAuction,
    title: post.title,
    preview: post.content.slice(0, 100),
    createdAt: post.created_at,
    time: formatPostTime(post.created_at),
    comments: 0,
    likes: post.like_count,
    author: post.author_name,
    authorId: post.author_id,
    authorRecommendations: post.author_recommendation_count,
    currentBid: `${post.current_price.toLocaleString("ko-KR")}원`,
    bids: post.bids.length,
    endsAt: post.deadline,
    isAwarded: post.is_ended,
  };
}

function toReviewPost(post: ReviewPostResponse): CommunityPost {
  return {
    id: post.id,
    boardKey: "reviews",
    board: text.reviews,
    title: post.course_name,
    preview: post.content.slice(0, 100),
    createdAt: post.created_at,
    time: formatPostTime(post.created_at),
    comments: 0,
    likes: post.like_count,
    author: post.author_name,
    authorId: post.author_id,
    authorRecommendations: post.author_recommendation_count,
    rating: String(post.rating),
    courseName: post.course_name,
    professor: post.professor_name,
  };
}

async function withFallback<T>(request: Promise<T>, fallback: T): Promise<T> {
  try {
    return await request;
  } catch {
    return fallback;
  }
}

// 메인 화면의 각 게시판 미리보기 카드가 사용할 제목, 이동 경로, 게시글 목록입니다.
// 같은 카드 컴포넌트를 네 번 재사용하기 위해 데이터 배열로 묶어둡니다.
async function loadBoardSections(): Promise<BoardSection[]> {
  const [freeLatest, marketLatest, auctionLatest, reviewLatest] = await Promise.all([
    withFallback(getFreePosts().then((data) => data.posts.map(toFreePost)), freePosts),
    withFallback(getMarketPosts().then((data) => data.posts.map(toMarketPost)), marketPosts),
    withFallback(getAuctionPosts().then((data) => data.posts.map(toAuctionPost)), examAuctionPosts),
    withFallback(getReviews().then((data) => data.posts.map(toReviewPost)), groupedReviewPosts),
  ]);

  return [
    {
      title: text.free,
      href: "/free",
      posts: sortLatest(freeLatest).slice(0, POST_PREVIEW_LIMIT),
    },
    {
      title: text.market,
      href: "/market",
      posts: sortLatest(marketLatest).slice(0, POST_PREVIEW_LIMIT),
    },
    {
      title: text.examAuction,
      href: "/exam-auction",
      posts: sortLatest(auctionLatest).slice(0, POST_PREVIEW_LIMIT),
    },
    {
      title: text.reviews,
      href: "/reviews",
      posts: sortLatest(reviewLatest).slice(0, POST_PREVIEW_LIMIT),
    },
  ];
}

function createFallbackRanking(posts: CommunityPost[]): RankingPerson[] {
  const authors = new Map<string, RankingPerson>();

  posts.forEach((post) => {
    const key = post.authorId ? `user-${post.authorId}` : `${post.boardKey}-${post.id}`;
    const current = authors.get(key);

    if (!current || post.authorRecommendations > current.recommendations) {
      authors.set(key, {
        id: key,
        author: post.author,
        recommendations: post.authorRecommendations,
      });
    }
  });

  return [...authors.values()]
    .sort((first, second) => second.recommendations - first.recommendations)
    .slice(0, 3);
}

async function loadRecommendationRanking(
  fallbackPosts: CommunityPost[],
): Promise<RankingPerson[]> {
  const fallback = createFallbackRanking(fallbackPosts);

  return withFallback(
    getAuthorRecommendationRanking().then((items) =>
      items.map((item) => ({
        id: `user-${item.user_id}`,
        author: item.username,
        recommendations: item.recommendation_count,
      })),
    ),
    fallback,
  );
}

function BoardPreviewCard({
  href,
  posts,
  title,
}: {
  href: string;
  posts: CommunityPost[];
  title: string;
}) {
  return (
    // 한 게시판의 최신 글 일부를 카드 형태로 보여주는 재사용 컴포넌트입니다.
    <section className="rounded-none border border-[#dedede] bg-white">
      <Link
        className="block border-b border-[#eeeeee] px-4 py-3 text-lg font-black text-[#ff1f10] hover:bg-[#fff8f7]"
        href={href}
      >
        {title}
      </Link>
      <ol>
        {/* 메인 화면은 요약용이므로 각 게시판의 최신 5개 글만 보여줍니다. */}
        {posts.slice(0, POST_PREVIEW_LIMIT).map((post) => (
          <li className="border-b border-[#eeeeee] last:border-b-0" key={`${post.boardKey}-${post.id}`}>
            <Link
              className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 hover:bg-[#fafafa]"
              href={`/posts/${post.id}?board=${post.boardKey}`}
            >
              <span className="truncate text-[15px] text-[#333333]">
                {post.title}
              </span>
              {post.boardKey !== "reviews" ? (
                <span className="shrink-0 text-sm text-[#999999]">
                  {formatPostTime(post.createdAt)}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default async function Home() {
  const boardSections = await loadBoardSections();
  const ranking = await loadRecommendationRanking(
    boardSections.flatMap((section) => section.posts),
  );

  return (
    <main className="min-h-screen bg-[#f5f5f5] text-[#222222]">
      {/* 상단 헤더: 로고/서비스명은 홈으로, 로그인 버튼은 로그인 페이지로 이동합니다. */}
      <header className="border-b border-[#e2e2e2] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link className="flex items-center gap-3" href="/">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#c62917] text-lg font-black !text-white">
              L
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight">
                {text.siteTitle}
              </h1>
              <p className="text-xs text-[#777777]">{text.siteSubtitle}</p>
            </div>
          </Link>
          <AuthLink loginLabel={text.login} />
        </div>
      </header>

      {/* 데스크톱에서는 왼쪽 메뉴, 가운데 게시판 카드, 오른쪽 랭킹의 3단 구조로 배치합니다. */}
      <div className="mx-auto grid max-w-6xl gap-3 px-4 py-4 lg:grid-cols-[180px_1fr_260px]">
        <aside className="hidden lg:block">
          {/* 왼쪽 게시판 목록: 사용자가 원하는 게시판 페이지로 바로 이동하는 내비게이션입니다. */}
          <nav className="border border-[#dedede] bg-white">
            <div className="border-b border-[#eeeeee] px-4 py-3 text-sm font-black text-[#c62917]">
              {text.boardList}
            </div>
            {boardSections.map((section) => (
              <Link
                className="block border-b border-[#eeeeee] px-4 py-3 text-sm font-semibold text-[#333333] last:border-b-0 hover:bg-[#fafafa]"
                href={section.href}
                key={section.href}
              >
                {section.title}
              </Link>
            ))}
          </nav>
        </aside>

        {/* 가운데 영역: boardSections 데이터를 순회하면서 게시판별 미리보기 카드를 만듭니다. */}
        <section className="grid gap-2 md:grid-cols-2">
          {boardSections.map((section) => (
            <BoardPreviewCard
              href={section.href}
              key={section.href}
              posts={section.posts}
              title={section.title}
            />
          ))}
        </section>

        <aside>
          {/* 오른쪽 영역: 추천수가 높은 작성자를 랭킹처럼 보여주는 보조 정보입니다. */}
          <section className="border border-[#dedede] bg-white">
            <div className="border-b border-[#eeeeee] px-4 py-3 text-lg font-black text-[#ff1f10]">
              {text.ranking}
            </div>
            <ol>
              {ranking.length > 0 ? ranking.map((post, index) => (
                <li
                  className="grid grid-cols-[28px_1fr] gap-3 border-b border-[#eeeeee] px-4 py-3 last:border-b-0"
                  key={post.id}
                >
                  <span className="font-black text-[#c62917]">{index + 1}</span>
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-bold text-[#333333]">
                      {post.author}
                    </p>
                    <p className="mt-1 text-sm text-[#999999]">
                      {text.recommend} {post.recommendations}
                    </p>
                  </div>
                </li>
              )) : (
                <li className="px-4 py-3 text-sm font-semibold text-[#999999]">
                  {text.noRanking}
                </li>
              )}
            </ol>
          </section>
        </aside>
      </div>
    </main>
  );
}
