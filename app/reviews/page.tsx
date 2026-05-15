"use client";

import { useEffect, useState } from "react";
import CommunityBoard from "../community-board";
import { groupedReviewPosts, type CommunityPost } from "../community-data";
import { getReviews, type ReviewPostResponse } from "../lib/api";
import { formatPostTime } from "../lib/time";

const ASSIGNMENT_MAP: Record<string, string> = {
  many: "많음", normal: "보통", few: "적음", none: "없음",
};
const GRADING_MAP: Record<string, string> = {
  generous: "너그러움", normal: "보통", strict: "깐깐함",
};
const SEMESTER_MAP: Record<string, string> = {
  "1": "1학기", "2": "2학기", summer: "여름학기", winter: "겨울학기",
};

function toPost(p: ReviewPostResponse): CommunityPost {
  return {
    id: p.id,
    boardKey: "reviews",
    board: "강의평게시판",
    title: p.course_name,
    preview: p.content.slice(0, 100),
    createdAt: p.created_at,
    time: formatPostTime(p.created_at),
    comments: 0,
    likes: p.like_count,
    author: p.author_name,
    authorId: p.author_id,
    authorRecommendations: p.author_recommendation_count,
    rating: String(p.rating),
    courseName: p.course_name,
    courseYear: String(p.year),
    courseSemester: SEMESTER_MAP[p.semester] ?? p.semester,
    professor: p.professor_name,
    assignmentLoad: (ASSIGNMENT_MAP[p.assignment_level] ?? "보통") as CommunityPost["assignmentLoad"],
    teamProjectLoad: (ASSIGNMENT_MAP[p.team_project_load] ?? "보통") as CommunityPost["teamProjectLoad"],
    gradingStyle: (GRADING_MAP[p.grading_style] ?? "보통") as CommunityPost["gradingStyle"],
  };
}

export default function ReviewBoardPage() {
  const [posts, setPosts] = useState<CommunityPost[]>(groupedReviewPosts);

  useEffect(() => {
    const refreshPosts = () => {
      getReviews()
        .then((data) => setPosts(data.posts.map(toPost)))
        .catch(() => {});
    };

    refreshPosts();
    window.addEventListener("pageshow", refreshPosts);
    window.addEventListener("focus", refreshPosts);

    return () => {
      window.removeEventListener("pageshow", refreshPosts);
      window.removeEventListener("focus", refreshPosts);
    };
  }, []);

  return (
    <CommunityBoard
      activeBoard="reviews"
      description="강의평게시판의 최신 강의평을 시간순으로 보여줍니다."
      posts={posts}
      title="강의평게시판"
    />
  );
}
