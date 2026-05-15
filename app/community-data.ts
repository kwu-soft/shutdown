// 게시판 목록, 게시글 더미 데이터, 추천 랭킹용 데이터를 모아둔 파일입니다.
// 지금은 서버나 DB 대신 이 파일의 배열을 데이터 소스로 사용합니다.
export type BoardKey = "home" | "free" | "market" | "examAuction" | "reviews";
export type PostBoardKey = Exclude<BoardKey, "home">;
export type MarketStatusKey = "available" | "sold" | "reserved";
export type AssignmentLoad = "많음" | "보통" | "적음" | "없음";
export type TeamProjectLoad = "많음" | "보통" | "적음" | "없음";
export type GradingStyle = "너그러움" | "보통" | "깐깐함";

export type ReviewEntry = {
  id: number;
  author: string;
  assignmentLoad: AssignmentLoad;
  content: string;
  createdAt: string;
  courseSemester: string;
  courseYear: string;
  gradingStyle: GradingStyle;
  rating: number;
  teamProjectLoad: TeamProjectLoad;
  time: string;
};

export type StoredReviewPost = {
  assignmentLoad: AssignmentLoad;
  content: string;
  courseName: string;
  courseSemester: string;
  courseYear: string;
  createdAt: string;
  gradingStyle: GradingStyle;
  id: number;
  professor: string;
  rating: string;
  teamProjectLoad: TeamProjectLoad;
  time: string;
};

// 모든 게시글이 공통으로 가져야 하는 필드와 게시판 종류별 선택 필드를 정의합니다.
export type CommunityPost = {
  id: number;
  boardKey: PostBoardKey;
  board: string;
  title: string;
  preview: string;
  createdAt: string;
  time: string;
  comments: number;
  likes: number;
  author: string;
  authorId?: number;
  authorRecommendations: number;
  price?: string;
  statusKey?: MarketStatusKey;
  status?: string;
  currentBid?: string;
  bids?: number;
  endsIn?: string;
  endsAt?: string;
  isAwarded?: boolean;
  rating?: string;
  courseName?: string;
  courseSemester?: string;
  courseYear?: string;
  professor?: string;
  assignmentLoad?: AssignmentLoad;
  teamProjectLoad?: TeamProjectLoad;
  gradingStyle?: GradingStyle;
  reviewEntries?: ReviewEntry[];
};

// 왼쪽 게시판 메뉴와 모바일 게시판 탭에서 공통으로 사용하는 게시판 링크 목록입니다.
export const boards = [
  { key: "free", label: "자유게시판", href: "/free" },
  { key: "market", label: "장터게시판", href: "/market" },
  { key: "examAuction", label: "족보경매장", href: "/exam-auction" },
  { key: "reviews", label: "강의평게시판", href: "/reviews" },
] satisfies Array<{ key: PostBoardKey; label: string; href: string }>;

// 자유게시판 글은 가격, 경매, 강의평 정보 없이 일반 커뮤니티 글 정보만 갖습니다.
export const freePosts: CommunityPost[] = [
  {
    id: 1,
    boardKey: "free",
    board: "자유게시판",
    title:
      "오늘 학생식당 돈가스 괜찮나요?",
    preview:
      "점심 전에 빠르게 먹고 수업 들어가야 하는데 줄 많이 서나요?",
    createdAt: "2026-05-08T14:59:00+09:00",
    time: "방금",
    comments: 12,
    likes: 18,
    author: "민준",
    authorRecommendations: 42,
  },
  {
    id: 2,
    boardKey: "free",
    board: "자유게시판",
    title:
      "중앙도서관 오후에 자리 많이 남아있나요?",
    preview:
      "팀플 준비해야 해서 조용한 자리 찾고 있습니다.",
    createdAt: "2026-05-08T14:52:00+09:00",
    time: "8분 전",
    comments: 7,
    likes: 14,
    author: "서연",
    authorRecommendations: 37,
  },
  {
    id: 3,
    boardKey: "free",
    board: "자유게시판",
    title:
      "축제 두 번째 날 부스 추천해주세요",
    preview:
      "친구들과 저녁에 돌아보려고 하는데 먹을 것 위주로 궁금해요.",
    createdAt: "2026-05-08T14:41:00+09:00",
    time: "19분 전",
    comments: 21,
    likes: 33,
    author: "도윤",
    authorRecommendations: 29,
  },
];

// 장터게시판 글은 price와 status를 추가로 사용해서 판매 정보를 보여줍니다.
export const marketPosts: CommunityPost[] = [
  {
    id: 4,
    boardKey: "market",
    board: "장터게시판",
    title:
      "아이패드 에어 5세대 64GB 필기용",
    preview:
      "필름 부착, 케이스 포함. 강의실에서 바로 거래 가능",
    createdAt: "2026-05-08T14:57:00+09:00",
    time: "3분 전",
    comments: 18,
    likes: 26,
    author: "하린",
    authorRecommendations: 55,
    price: "385,000원",
    statusKey: "available",
    status: "구매가능",
  },
  {
    id: 5,
    boardKey: "market",
    board: "장터게시판",
    title:
      "전공서 세트 자료구조 + 운영체제",
    preview:
      "필기 약간 있지만 상태 좋아요. 오늘 안에 가져가실 분",
    createdAt: "2026-05-08T14:49:00+09:00",
    time: "11분 전",
    comments: 9,
    likes: 17,
    author: "지호",
    authorRecommendations: 48,
    price: "42,000원",
    statusKey: "sold",
    status: "판매완료",
  },
  {
    id: 6,
    boardKey: "market",
    board: "장터게시판",
    title:
      "기숙사용 미니 청소기 거의 새것",
    preview:
      "한 달 사용. 소음 작고 필터 여분 있습니다",
    createdAt: "2026-05-08T14:36:00+09:00",
    time: "24분 전",
    comments: 6,
    likes: 12,
    author: "유나",
    authorRecommendations: 31,
    price: "28,000원",
    statusKey: "reserved",
    status: "예약중",
  },
];

// 족보경매장 글은 currentBid, bids, endsIn을 사용해서 경매 상태를 보여줍니다.
export const examAuctionPosts: CommunityPost[] = [
  {
    id: 10,
    boardKey: "examAuction",
    board: "족보경매장",
    title:
      "자료구조 중간고사 복원 정리본",
    preview:
      "지난 학기 중간 복원과 핵심 유형 정리를 포함했습니다.",
    createdAt: "2026-05-08T14:55:00+09:00",
    time: "5분 전",
    comments: 14,
    likes: 19,
    author: "준서",
    authorRecommendations: 58,
    currentBid: "18,000원",
    bids: 9,
    endsIn: "22분 남음",
    endsAt: "2026-05-08T15:22:00+09:00",
  },
  {
    id: 11,
    boardKey: "examAuction",
    board: "족보경매장",
    title:
      "웹프로그래밍 기말 프로젝트 채점포인트",
    preview:
      "교수님이 중요하게 보시는 항목과 기말 준비 팁입니다.",
    createdAt: "2026-05-08T14:42:00+09:00",
    time: "18분 전",
    comments: 8,
    likes: 16,
    author: "소윤",
    authorRecommendations: 46,
    currentBid: "12,000원",
    bids: 6,
    endsIn: "47분 남음",
    endsAt: "2026-05-08T15:47:00+09:00",
  },
  {
    id: 12,
    boardKey: "examAuction",
    board: "족보경매장",
    title:
      "현대사회와윤리 기출 토론주제 모음",
    preview:
      "수업 토론주제와 시험 대비용 요약 문서입니다.",
    createdAt: "2026-05-08T14:21:00+09:00",
    time: "39분 전",
    comments: 5,
    likes: 11,
    author: "가온",
    authorRecommendations: 34,
    currentBid: "9,000원",
    bids: 4,
    endsIn: "1시간 남음",
    endsAt: "2026-05-08T16:00:00+09:00",
  },
];

// 강의평게시판 원본 글은 강의명과 교수명이 같으면 하나의 목록 게시물로 묶입니다.
export const reviewPosts: CommunityPost[] = [
  {
    id: 7,
    boardKey: "reviews",
    board: "강의평게시판",
    title: "웹프로그래밍",
    preview:
      "매주 작은 과제가 있고 기말 프로젝트가 큽니다. 따라가면 결과물이 확실히 남아요.",
    createdAt: "2026-05-08T14:45:00+09:00",
    time: "15분 전",
    comments: 11,
    likes: 22,
    author: "현우",
    authorRecommendations: 63,
    rating: "5",
    courseName: "웹프로그래밍",
    courseYear: "2025",
    courseSemester: "2학기",
    professor: "김도현 교수",
    assignmentLoad: "많음",
    teamProjectLoad: "적음",
    gradingStyle: "보통",
  },
  {
    id: 13,
    boardKey: "reviews",
    board: "강의평게시판",
    title: "웹프로그래밍",
    preview:
      "실습 위주라 코드를 직접 많이 쓰게 됩니다. 팀 프로젝트보다 개인 과제가 더 중요했어요.",
    createdAt: "2026-05-08T13:20:00+09:00",
    time: "1시간 전",
    comments: 3,
    likes: 18,
    author: "서우",
    authorRecommendations: 41,
    rating: "5",
    courseName: "웹프로그래밍",
    courseYear: "2026",
    courseSemester: "1학기",
    professor: "김도현 교수",
    assignmentLoad: "많음",
    teamProjectLoad: "없음",
    gradingStyle: "너그러움",
  },
  {
    id: 8,
    boardKey: "reviews",
    board: "강의평게시판",
    title: "현대사회와윤리",
    preview:
      "출석과 토론 태도를 꾸준히 보셔서 말하기 부담 없는 분들에게 잘 맞아요.",
    createdAt: "2026-05-08T14:28:00+09:00",
    time: "32분 전",
    comments: 4,
    likes: 13,
    author: "나은",
    authorRecommendations: 35,
    rating: "4",
    courseName: "현대사회와윤리",
    courseYear: "2025",
    courseSemester: "1학기",
    professor: "박서진 교수",
    assignmentLoad: "적음",
    teamProjectLoad: "많음",
    gradingStyle: "깐깐함",
  },
  {
    id: 9,
    boardKey: "reviews",
    board: "강의평게시판",
    title: "자료구조",
    preview:
      "코딩 테스트 준비에도 도움됩니다. 복습 안 하면 중간부터 꽤 힘들어요.",
    createdAt: "2026-05-08T14:00:00+09:00",
    time: "1시간 전",
    comments: 19,
    likes: 28,
    author: "태오",
    authorRecommendations: 44,
    rating: "4",
    courseName: "자료구조",
    courseYear: "2024",
    courseSemester: "2학기",
    professor: "이수민 교수",
    assignmentLoad: "보통",
    teamProjectLoad: "없음",
    gradingStyle: "깐깐함",
  },
  {
    id: 14,
    boardKey: "reviews",
    board: "강의평게시판",
    title: "자료구조",
    preview:
      "개념 설명은 좋지만 시험 문제가 응용형이라 꾸준히 문제를 풀어야 합니다.",
    createdAt: "2026-05-08T12:40:00+09:00",
    time: "2시간 전",
    comments: 6,
    likes: 17,
    author: "리아",
    authorRecommendations: 39,
    rating: "4",
    courseName: "자료구조",
    courseYear: "2025",
    courseSemester: "1학기",
    professor: "이수민 교수",
    assignmentLoad: "보통",
    teamProjectLoad: "없음",
    gradingStyle: "보통",
  },
];

export const groupedReviewPosts: CommunityPost[] = Array.from(
  reviewPosts
    .reduce((groups, review) => {
      const key = `${review.courseName ?? review.title}__${review.professor ?? ""}`;
      const current = groups.get(key) ?? [];

      groups.set(key, [...current, review]);
      return groups;
    }, new Map<string, CommunityPost[]>())
    .values(),
).map((reviews, index) => {
  const [latestReview] = [...reviews].sort(
    (first, second) =>
      new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
  );
  const reviewEntries = reviews.map((review) => ({
    id: review.id,
    author: review.author,
    assignmentLoad: review.assignmentLoad ?? "보통",
    content: review.preview,
    createdAt: review.createdAt,
    courseSemester: review.courseSemester ?? "",
    courseYear: review.courseYear ?? "",
    gradingStyle: review.gradingStyle ?? "보통",
    rating: Number(review.rating ?? 0),
    teamProjectLoad: review.teamProjectLoad ?? "보통",
    time: review.time,
  }));
  const averageRating =
    reviewEntries.reduce((total, review) => total + review.rating, 0) /
    reviewEntries.length;
  const courseName = latestReview.courseName ?? latestReview.title;

  return {
    id: 700 + index,
    boardKey: "reviews",
    board: "강의평게시판",
    title: courseName,
    preview: `${courseName} ${latestReview.professor} 강의평 ${reviewEntries.length}개`,
    createdAt: latestReview.createdAt,
    time: latestReview.time,
    comments: reviewEntries.length,
    likes: reviews.reduce((total, review) => total + review.likes, 0),
    author: latestReview.author,
    authorRecommendations: latestReview.authorRecommendations,
    rating: averageRating.toFixed(1),
    courseName,
    professor: latestReview.professor,
    reviewEntries,
  } satisfies CommunityPost;
});

export function createReviewPostFromStoredReview(
  review: StoredReviewPost,
): CommunityPost {
  return {
    id: review.id,
    boardKey: "reviews",
    board: "강의평게시판",
    title: review.courseName,
    preview: review.content,
    createdAt: review.createdAt,
    time: review.time,
    comments: 0,
    likes: 0,
    author: "수강자",
    authorRecommendations: 0,
    rating: review.rating,
    courseName: review.courseName,
    courseYear: review.courseYear,
    courseSemester: review.courseSemester,
    professor: review.professor,
    assignmentLoad: review.assignmentLoad,
    teamProjectLoad: review.teamProjectLoad,
    gradingStyle: review.gradingStyle,
  };
}

export function groupReviewPosts(reviews: CommunityPost[]): CommunityPost[] {
  return Array.from(
    reviews
      .reduce((groups, review) => {
        const key = `${review.courseName ?? review.title}__${review.professor ?? ""}`;
        const current = groups.get(key) ?? [];

        groups.set(key, [...current, review]);
        return groups;
      }, new Map<string, CommunityPost[]>())
      .values(),
  ).map((groupedReviews, index) => {
    const [latestReview] = [...groupedReviews].sort(
      (first, second) =>
        new Date(second.createdAt).getTime() -
        new Date(first.createdAt).getTime(),
    );
    const reviewEntries = groupedReviews.map((review) => ({
      id: review.id,
      author: review.author,
      assignmentLoad: review.assignmentLoad ?? "보통",
      content: review.preview,
      createdAt: review.createdAt,
      courseSemester: review.courseSemester ?? "",
      courseYear: review.courseYear ?? "",
      gradingStyle: review.gradingStyle ?? "보통",
      rating: Number(review.rating ?? 0),
      teamProjectLoad: review.teamProjectLoad ?? "보통",
      time: review.time,
    }));
    const averageRating =
      reviewEntries.reduce((total, review) => total + review.rating, 0) /
      reviewEntries.length;
    const courseName = latestReview.courseName ?? latestReview.title;

    return {
      id: 700 + index,
      boardKey: "reviews",
      board: "강의평게시판",
      title: courseName,
      preview: `${courseName} ${latestReview.professor} 강의평 ${reviewEntries.length}개`,
      createdAt: latestReview.createdAt,
      time: latestReview.time,
      comments: reviewEntries.length,
      likes: 0,
      author: "수강자",
      authorRecommendations: 0,
      rating: averageRating.toFixed(1),
      courseName,
      professor: latestReview.professor,
      reviewEntries,
    } satisfies CommunityPost;
  });
}

export const basePosts = [
  ...freePosts,
  ...marketPosts,
  ...examAuctionPosts,
];

// 게시글 상세 페이지와 추천 랭킹은 모든 게시판 글을 한 번에 검색해야 하므로 하나로 합칩니다.
export const allPosts = [
  ...basePosts,
  ...groupedReviewPosts,
];

// 오른쪽 사이드바의 많이 본 글 영역에 보여줄 간단한 제목 목록입니다.
export const trending = [
  "시험기간 카페 자리 많은 곳",
  "복수전공 신청 후기",
  "기숙사 택배 보관함 위치",
  "오늘 축제 부스 메뉴 정리",
];
