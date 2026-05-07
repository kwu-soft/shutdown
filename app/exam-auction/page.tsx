import CommunityBoard from "../community-board";
import { examAuctionPosts } from "../community-data";

// 족보경매장 경로에서 경매 게시글 데이터를 공통 게시판 UI에 전달합니다.
// 이 파일은 /exam-auction URL에 대응하는 페이지입니다.
const examAuctionText = {
  description:
    "족보경매장의 경매 게시글을 최신순으로 보여줍니다.",
  eyebrow: "경매중",
  title: "족보경매장",
};

export default function ExamAuctionPage() {
  return (
    // 경매 게시글 데이터에는 현재가, 입찰 수, 남은 시간이 포함되어 목록에서 별도로 표시됩니다.
    <CommunityBoard
      activeBoard="examAuction"
      description={examAuctionText.description}
      eyebrow={examAuctionText.eyebrow}
      posts={examAuctionPosts}
      title={examAuctionText.title}
    />
  );
}
