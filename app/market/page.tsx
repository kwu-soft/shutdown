"use client";

import { useEffect, useState } from "react";
import CommunityBoard from "../community-board";
import { marketPosts, type CommunityPost } from "../community-data";
import { getMarketPosts, type MarketPostResponse } from "../lib/api";
import { formatPostTime } from "../lib/time";

function toPost(p: MarketPostResponse): CommunityPost {
  return {
    id: p.id,
    boardKey: "market",
    board: "장터게시판",
    title: p.title,
    preview: p.content.slice(0, 100),
    createdAt: p.created_at,
    time: formatPostTime(p.created_at),
    comments: 0,
    likes: p.like_count,
    author: p.author_name,
    authorId: p.author_id,
    authorRecommendations: p.author_recommendation_count,
    price: `${p.price.toLocaleString("ko-KR")}원`,
    statusKey: p.market_status,
    status:
      p.market_status === "available"
        ? "판매중"
        : p.market_status === "reserved"
          ? "예약중"
          : "거래완료",
  };
}

export default function MarketBoardPage() {
  const [posts, setPosts] = useState<CommunityPost[]>(marketPosts);

  useEffect(() => {
    const refreshPosts = () => {
      getMarketPosts()
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
      activeBoard="market"
      description="장터게시판의 판매글을 최신순으로 보여줍니다."
      posts={posts}
      title="장터게시판"
    />
  );
}
