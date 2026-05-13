"use client";

import { useEffect, useState } from "react";
import CommunityBoard from "../community-board";
import { groupedReviewPosts, type CommunityPost } from "../community-data";
import { getReviews, type ReviewPostResponse } from "../lib/api";

const ASSIGNMENT_MAP: Record<string, string> = {
  many: "많음", normal: "보통", few: "적음", none: "없음",
};
const GRADING_MAP: Record<string, string> = {
  generous: "너그러움", normal: "보통", strict: "깐깐함",
};
const SEMESTER_MAP: Record<string, string> = {
  "1": "1학기", "2": "2학기", summer: "여름학기", winter: "겨울학기",
};

function toRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "방금";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  return `${Math.floor(hr / 24)}일 전`;
}

function toPost(p: ReviewPostResponse): CommunityPost {
  return {
    id: p.id,
    boardKey: "reviews",
    board: "강의평게시판",
    title: p.course_name,
    preview: p.content.slice(0, 100),
    createdAt: p.created_at,
    time: toRelativeTime(p.created_at),
    comments: 0,
    likes: p.like_count,
    author: p.author_name,
    authorRecommendations: 0,
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
    getReviews()
      .then((data) => setPosts(data.posts.map(toPost)))
      .catch(() => {});
  }, []);

  return (
    <CommunityBoard
      activeBoard="reviews"
      description="강의평게시판의 최신 강의평을 순서대로 보여줍니다."
      posts={posts}
      title="강의평게시판"
    />
  );
}
