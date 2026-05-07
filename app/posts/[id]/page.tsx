import Link from "next/link";
import { notFound } from "next/navigation";
import BidPanel from "../../bid-panel";
import { allPosts } from "../../community-data";
import PostCounterButton from "../../post-counter-button";
import ReportAuthorButton from "../../report-author-button";

// 게시글 id에 맞는 상세 내용을 보여주는 동적 상세 페이지입니다.
// app/posts/[id]/page.tsx 파일명에서 [id]가 URL의 게시글 id 역할을 합니다.
type PostPageProps = {
  params: Promise<{
    id: string;
  }>;
};

// 상세 페이지에서 반복해서 쓰는 라벨 문구입니다.
// 화면 텍스트를 이 객체에 모아두면 표현 문구만 바꾸고 레이아웃은 그대로 둘 수 있습니다.
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
};

// 정적 생성 대상이 될 게시글 id 목록을 Next.js에 알려줍니다.
// allPosts의 모든 id를 문자열로 바꿔 /posts/1, /posts/2 같은 경로를 미리 만들게 합니다.
export function generateStaticParams() {
  return allPosts.map((post) => ({
    id: String(post.id),
  }));
}

export default async function PostPage({ params }: PostPageProps) {
  // Next.js 16에서는 params가 Promise 형태라 await로 id를 꺼냅니다.
  const { id } = await params;
  // URL에서 받은 id와 같은 게시글을 전체 게시글 목록에서 찾습니다.
  const post = allPosts.find((item) => item.id === Number(id));

  // 없는 id로 접근하면 Next.js의 404 페이지를 보여줍니다.
  if (!post) {
    notFound();
  }

  const canViewContent = !post.currentBid || post.isAwarded;

  return (
    <main className="min-h-screen bg-[#f5f5f5] px-4 py-8 text-[#222222]">
      {/* 상세 본문 카드입니다. 게시글의 메타 정보, 제목, 내용, 거래/경매 정보를 한곳에 모읍니다. */}
      <article className="mx-auto max-w-3xl rounded-md border border-[#dedede] bg-white">
        <header className="border-b border-[#eeeeee] px-5 py-4">
          {/* 게시판명, 평점, 작성 시각처럼 제목 위에 붙는 보조 정보입니다. */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-sm bg-[#f1f1f1] px-2 py-1 text-xs font-semibold text-[#777777]">
              {post.board}
            </span>
            {post.rating ? (
              <span className="rounded-sm bg-[#fff5f3] px-2 py-1 text-xs font-bold text-[#c62917]">
                {text.rating} {post.rating}
              </span>
            ) : null}
            <span className="text-xs text-[#999999]">{post.time}</span>
          </div>
          {/* 게시글 제목과 작성자/추천수 정보를 헤더 영역에서 강조합니다. */}
          <h1 className="text-2xl font-bold leading-8">{post.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-semibold text-[#777777]">
            <span className="inline-flex h-8 items-center">
              {text.author} {post.author}
            </span>
            <PostCounterButton
              initialCount={post.authorRecommendations}
              label={text.recommend}
            />
            <ReportAuthorButton author={post.author} />
          </div>
        </header>

        <section className="space-y-5 px-5 py-5">
          {/* 강의평 글에만 교수 정보가 있으므로 값이 있을 때만 보여줍니다. */}
          {post.professor ? (
            <p className="text-sm font-semibold text-[#555555]">
              {text.professor} {post.professor}
            </p>
          ) : null}

          {/* 족보경매장 글은 낙찰된 경우에만 본문 내용을 보여줍니다. */}
          {canViewContent ? (
            <p className="whitespace-pre-line text-base leading-8 text-[#333333]">
              {post.preview}
            </p>
          ) : (
            <div className="rounded-md border border-[#f0d5d0] bg-[#fff5f3] p-4">
              <p className="text-sm font-bold text-[#c62917]">
                {text.lockedAuction}
              </p>
              <p className="mt-2 text-sm leading-6 text-[#777777]">
                경매가 끝나고 낙찰 처리된 뒤 본문 내용을 볼 수 있습니다.
              </p>
            </div>
          )}

          {/* 장터게시판 글일 때만 가격, 상태, 구매 버튼 영역을 보여줍니다. */}
          {post.price ? (
            <div className="grid gap-3 rounded-md border border-[#eeeeee] bg-[#fafafa] p-4 sm:grid-cols-[1fr_1fr_auto]">
              <div>
                <p className="text-xs text-[#888888]">{text.price}</p>
                <p className="mt-1 font-black text-[#c62917]">
                  {post.price}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#888888]">{text.status}</p>
                <p className="mt-1 font-bold">{post.status}</p>
              </div>
              <button
                className="h-11 rounded-md bg-[#c62917] px-4 text-sm font-bold text-white transition hover:bg-[#ae2112]"
                type="button"
              >
                {text.buy}
              </button>
            </div>
          ) : null}

          {/* 족보경매장 글일 때만 현재가, 입찰수, 마감 시간, 입찰 버튼을 보여줍니다. */}
          {post.currentBid ? (
            <BidPanel
              bidLabel={text.bid}
              bidsLabel={text.bids}
              currentBid={post.currentBid}
              currentBidLabel={text.currentBid}
              endsIn={post.endsIn ?? ""}
              endsInLabel={text.endsIn}
              initialBids={post.bids}
            />
          ) : null}

          {/* 본문 하단에는 좋아요/댓글 수와 목록 이동 버튼을 같은 줄에 배치합니다. */}
          <div className="flex flex-wrap items-center gap-2 border-t border-[#eeeeee] pt-4 text-sm font-bold text-[#777777]">
            <PostCounterButton
              initialCount={post.likes}
              label={text.likes}
              tone="red"
            />
            <span className="inline-flex h-8 items-center px-1">
              {text.comments} {post.comments}
            </span>
            {/* 게시글이 속한 게시판을 기준으로 목록으로 돌아갈 경로를 결정합니다. */}
            <Link
              className="ml-auto inline-flex h-8 items-center rounded-md border border-[#dedede] bg-white px-4 text-sm font-bold text-[#555555] hover:bg-[#fafafa]"
              href={
                post.board === "자유게시판"
                  ? "/free"
                  : post.board === "장터게시판"
                    ? "/market"
                    : post.board === "족보경매장"
                      ? "/exam-auction"
                      : "/reviews"
              }
            >
              {text.back}
            </Link>
          </div>
        </section>
      </article>
    </main>
  );
}
