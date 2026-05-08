"use client";

// 자유/장터/족보 게시글 상세 페이지에서 댓글을 작성하고 목록으로 보여주는 컴포넌트입니다.
import { FormEvent, useState } from "react";
import { authStorageKey, nicknameStorageKey } from "./auth-link";

type CommentSectionProps = {
  initialCount: number;
  postAuthor: string;
};

type CommentItem = {
  author: string;
  authorKey: string;
  content: string;
  id: number;
  isAnonymous: boolean;
};

export default function CommentSection({
  initialCount,
  postAuthor,
}: CommentSectionProps) {
  const [content, setContent] = useState("");
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextContent = content.trim();
    const nickname = window.localStorage.getItem(nicknameStorageKey) || "사용자";
    const userId = window.localStorage.getItem(authStorageKey) || "guest";

    if (!nextContent) {
      return;
    }

    setComments((current) => {
      const existingAnonymousComment = current.find(
        (comment) => comment.isAnonymous && comment.authorKey === userId,
      );
      const anonymousAuthor =
        existingAnonymousComment?.author ??
        `익명${
          new Set(
            current
              .filter((comment) => comment.isAnonymous)
              .map((comment) => comment.authorKey),
          ).size + 1
        }`;

      return [
        ...current,
        {
          author: isAnonymous
            ? anonymousAuthor
            : nickname === postAuthor
              ? "작성자"
              : nickname,
          authorKey: userId,
          content: nextContent,
          id: Date.now(),
          isAnonymous,
        },
      ];
    });
    setContent("");
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
          onChange={(event) => setContent(event.target.value)}
          placeholder="댓글을 입력하세요"
          value={content}
        />
        <label className="inline-flex h-11 items-center gap-2 rounded-md border border-[#dedede] px-3 text-sm font-bold text-[#555555]">
          <input
            checked={isAnonymous}
            className="h-4 w-4 accent-[#c62917]"
            onChange={(event) => setIsAnonymous(event.target.checked)}
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
              <p
                className={`mb-1 text-xs font-black ${
                  comment.author === "작성자"
                    ? "text-[#2563eb]"
                    : "text-[#c62917]"
                }`}
              >
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
