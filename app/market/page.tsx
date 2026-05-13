"use client";

import { useEffect, useState } from "react";
import CommunityBoard from "../community-board";
import { marketPosts, type CommunityPost } from "../community-data";
import { getMarketPosts, type MarketPostResponse } from "../lib/api";

function toRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "방금";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  return `${Math.floor(hr / 24)}일 전`;
}

function toPost(p: MarketPostResponse): CommunityPost {
  return {
    id: p.id,
    boardKey: "market",
    board: "장터게시판",
    title: p.title,
    preview: p.content.slice(0, 100),
    createdAt: p.created_at,
    time: toRelativeTime(p.created_at),
    comments: 0,
    likes: p.like_count,
    author: p.author_name,
    authorRecommendations: 0,
    price: `${p.price.toLocaleString("ko-KR")}원`,
    statusKey: "available",
    status: "구매가능",
  };
}

export default function MarketBoardPage() {
  const [posts, setPosts] = useState<CommunityPost[]>(marketPosts);

  useEffect(() => {
    getMarketPosts()
      .then((data) => setPosts(data.posts.map(toPost)))
      .catch(() => {});
  }, []);

  return (
    <CommunityBoard
      activeBoard="market"
      description="장터게시판의 판매글을 최신순으로 보여줍니다."
      posts={posts}
      title="장터게시판"
    />
  );
}
