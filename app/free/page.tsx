"use client";

import { useEffect, useState } from "react";
import CommunityBoard from "../community-board";
import { freePosts, type CommunityPost } from "../community-data";
import { getFreePosts, type FreePostResponse } from "../lib/api";

function toRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "방금";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  return `${Math.floor(hr / 24)}일 전`;
}

function toPost(p: FreePostResponse): CommunityPost {
  return {
    id: p.id,
    boardKey: "free",
    board: "자유게시판",
    title: p.title,
    preview: p.content.slice(0, 100),
    createdAt: p.created_at,
    time: toRelativeTime(p.created_at),
    comments: p.comment_count,
    likes: p.like_count,
    author: p.author_name,
    authorRecommendations: 0,
  };
}

export default function FreeBoardPage() {
  const [posts, setPosts] = useState<CommunityPost[]>(freePosts);

  useEffect(() => {
    getFreePosts()
      .then((data) => setPosts(data.posts.map(toPost)))
      .catch(() => {/* 백엔드 미연결 시 더미 데이터 유지 */});
  }, []);

  return (
    <CommunityBoard
      activeBoard="free"
      description="자유게시판의 최신 게시글을 순서대로 보여줍니다."
      posts={posts}
      title="자유게시판"
    />
  );
}
