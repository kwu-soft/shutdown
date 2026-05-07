import CommunityBoard from "../community-board";
import { freePosts } from "../community-data";

// 자유게시판 경로에서 자유게시판 데이터만 공통 게시판 UI에 전달합니다.
// 이 파일은 /free URL에 대응하는 페이지입니다.
const freeText = {
  description:
    "자유게시판의 최신 게시글을 순서대로 보여줍니다.",
  eyebrow: "최신순",
  title: "자유게시판",
};

export default function FreeBoardPage() {
  return (
    // CommunityBoard는 화면 틀을 담당하고, 이 페이지는 어떤 데이터와 제목을 쓸지만 정합니다.
    <CommunityBoard
      activeBoard="free"
      description={freeText.description}
      eyebrow={freeText.eyebrow}
      posts={freePosts}
      title={freeText.title}
    />
  );
}
