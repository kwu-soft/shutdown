"use client";

import { useEffect, useState } from "react";
import CommunityBoard from "../community-board";
import { examAuctionPosts, type CommunityPost } from "../community-data";
import { getAuctionPosts, type AuctionPostResponse } from "../lib/api";
import { formatPostTime } from "../lib/time";

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
    board: "족보경매",
    title: p.title,
    preview: p.content.slice(0, 100),
    createdAt: p.created_at,
    time: formatPostTime(p.created_at),
    comments: 0,
    likes: p.like_count,
    author: p.author_name,
    authorId: p.author_id,
    authorRecommendations: p.author_recommendation_count,
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
    const refreshPosts = () => {
      getAuctionPosts()
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
      activeBoard="examAuction"
      description="족보경매의 경매 게시글을 최신순으로 보여줍니다."
      posts={posts}
      title="족보경매"
    />
  );
}
