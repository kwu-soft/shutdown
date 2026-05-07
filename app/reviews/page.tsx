import CommunityBoard from "../community-board";
import { reviewPosts } from "../community-data";

// 강의평게시판 경로에서 강의평 데이터를 공통 게시판 UI에 전달합니다.
// 이 파일은 /reviews URL에 대응하는 페이지입니다.
const reviewText = {
  description:
    "강의평게시판의 최신 강의평을 순서대로 보여줍니다.",
  eyebrow: "최신순",
  title: "강의평게시판",
};

export default function ReviewBoardPage() {
  return (
    // 강의평 데이터에는 평점과 교수명이 포함되어 목록과 상세 페이지에서 조건부로 보입니다.
    <CommunityBoard
      activeBoard="reviews"
      description={reviewText.description}
      eyebrow={reviewText.eyebrow}
      posts={reviewPosts}
      title={reviewText.title}
    />
  );
}
