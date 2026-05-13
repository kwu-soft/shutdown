"use client";

import { useEffect, useState } from "react";
import CommunityBoard from "../community-board";
import { examAuctionPosts, type CommunityPost } from "../community-data";
import { getAuctionPosts, type AuctionPostResponse } from "../lib/api";

function toRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "방금";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  return `${Math.floor(hr / 24)}일 전`;
}

function toEndsIn(deadline: string): string {
  const remaining = new Date(deadline).getTime() - Date.now();
  if (remaining <= 0) return "마감";
  const min = Math.floor(remaining / 60000);
  if (min < 60) return `${min}분 남음`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 남음`;
  return `${Math.floor(hr / 24)}일 남음`;
}

function toPost(p: AuctionPostResponse): CommunityPost {
  return {
    id: p.id,
    boardKey: "examAuction",
    board: "족보경매장",
    title: p.title,
    preview: p.content.slice(0, 100),
    createdAt: p.created_at,
    time: toRelativeTime(p.created_at),
    comments: 0,
    likes: p.like_count,
    author: p.author_name,
    authorRecommendations: 0,
    currentBid: `${p.current_price.toLocaleString("ko-KR")}원`,
    bids: p.bids.length,
    endsIn: toEndsIn(p.deadline),
    endsAt: p.deadline,
    isAwarded: p.is_ended,
  };
}

export default function ExamAuctionPage() {
  const [posts, setPosts] = useState<CommunityPost[]>(examAuctionPosts);

  useEffect(() => {
    getAuctionPosts()
      .then((data) => setPosts(data.posts.map(toPost)))
      .catch(() => {});
  }, []);

  return (
    <CommunityBoard
      activeBoard="examAuction"
      description="족보경매장의 경매 게시글을 최신순으로 보여줍니다."
      posts={posts}
      title="족보경매장"
    />
  );
}
