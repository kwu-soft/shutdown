"use client";

import { useEffect, useState } from "react";
import CommunityBoard from "../community-board";
import { freePosts, type CommunityPost } from "../community-data";
import { getFreePosts, type FreePostResponse } from "../lib/api";
import { formatPostTime } from "../lib/time";

function toPost(p: FreePostResponse): CommunityPost {
  return {
    id: p.id,
    boardKey: "free",
    board: "자유게시판",
    title: p.title,
    preview: p.content.slice(0, 100),
    createdAt: p.created_at,
    time: formatPostTime(p.created_at),
    comments: p.comment_count,
    likes: p.like_count,
    author: p.author_name,
    authorId: p.author_id,
    authorRecommendations: p.author_recommendation_count,
  };
}

export default function FreeBoardPage() {
  const [posts, setPosts] = useState<CommunityPost[]>(freePosts);

  useEffect(() => {
    const refreshPosts = () => {
      getFreePosts()
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
      activeBoard="free"
      description="자유게시판의 최신 게시글을 시간순으로 보여줍니다."
      posts={posts}
      title="자유게시판"
    />
  );
}
