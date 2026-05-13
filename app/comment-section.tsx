"use client";

import { useEffect, useState } from "react";
import { nicknameStorageKey } from "./auth-link";
import { createFreeComment, getFreeComments } from "./lib/api";

type CommentSectionProps = {
  initialCount: number;
  postAuthor: string;
  postId: number;
};

type CommentItem = {
  author: string;
  content: string;
  id: number;
};

export default function CommentSection({ initialCount, postAuthor, postId }: CommentSectionProps) {
  const [content, setContent] = useState("");
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);

  useEffect(() => {
    getFreeComments(postId)
      .then((data) =>
        setComments(data.map((c) => ({ id: c.id, author: c.author_name, content: c.content })))
      )
      .catch(() => {});
  }, [postId]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    try {
      const c = await createFreeComment(postId, trimmed, isAnonymous);
      setComments((prev) => [...prev, { id: c.id, author: c.author_name, content: c.content }]);
      setContent("");
    } catch {
      const nickname = window.localStorage.getItem(nicknameStorageKey) || "사용자";
      setComments((prev) => [
        ...prev,
        { id: Date.now(), author: isAnonymous ? "익명" : nickname, content: trimmed },
      ]);
      setContent("");
    }
  };

  return (
    <section className="border-t border-[#eeeeee] px-5 py-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-black text-[#333333]">
          댓글 {initialCount + comments.length}
        </h2>
      </div>

      <form className="flex flex-wrap gap-2" onSubmit={handleSubmit}>
        <input
          className="h-11 min-w-0 flex-1 rounded-md border border-[#d9d9d9] px-3 text-sm outline-none placeholder:text-[#aaaaaa] focus:border-[#c62917] focus:ring-2 focus:ring-[#c62917]/10"
          onChange={(e) => setContent(e.target.value)}
          placeholder="댓글을 입력하세요"
          value={content}
        />
        <label className="inline-flex h-11 items-center gap-2 rounded-md border border-[#dedede] px-3 text-sm font-bold text-[#555555]">
          <input
            checked={isAnonymous}
            className="h-4 w-4 accent-[#c62917]"
            onChange={(e) => setIsAnonymous(e.target.checked)}
            type="checkbox"
          />
          익명
        </label>
        <button
          className="shrink-0 rounded-md bg-[#c62917] px-4 text-sm font-bold !text-white transition hover:bg-[#ae2112]"
          type="submit"
        >
          등록
        </button>
      </form>

      {comments.length > 0 ? (
        <ol className="mt-4 divide-y divide-[#eeeeee] rounded-md border border-[#eeeeee]">
          {comments.map((comment) => (
            <li className="px-4 py-3 text-sm leading-6 text-[#333333]" key={comment.id}>
              <p className={`mb-1 text-xs font-black ${comment.author === postAuthor ? "text-[#2563eb]" : "text-[#c62917]"}`}>
                {comment.author}
              </p>
              <p>{comment.content}</p>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
