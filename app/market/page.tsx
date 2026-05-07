import CommunityBoard from "../community-board";
import { marketPosts } from "../community-data";

// 장터게시판 경로에서 판매글 데이터를 공통 게시판 UI에 전달합니다.
// 이 파일은 /market URL에 대응하는 페이지입니다.
const marketText = {
  description:
    "장터게시판의 판매글을 최신순으로 보여줍니다.",
  eyebrow: "최신순",
  title: "장터게시판",
};

export default function MarketBoardPage() {
  return (
    // activeBoard="market" 값을 넘겨 왼쪽 게시판 목록에서 장터게시판을 강조합니다.
    <CommunityBoard
      activeBoard="market"
      description={marketText.description}
      eyebrow={marketText.eyebrow}
      posts={marketPosts}
      title={marketText.title}
    />
  );
}
