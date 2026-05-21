"use client";

import { useMemo, useState, useEffect } from "react";
import { createFreeComment, getFreeComments } from "./lib/api";

type CommentSectionProps = {
  initialCount: number;
  postAuthorId: number;
  postId: number;
};

type CommentItem = {
  author: string;
  authorId: number;
  content: string;
  id: number;
  isAnonymous: boolean;
};

export default function CommentSection({
  initialCount,
  postAuthorId,
  postId,
}: CommentSectionProps) {
  const [content, setContent] = useState("");
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    getFreeComments(postId)
      .then((data) => {
        setComments(
          data.map((comment) => ({
            id: comment.id,
            author: comment.author_name,
            authorId: comment.author_id,
            content: comment.content,
            isAnonymous: comment.is_anonymous,
          })),
        );
        setIsLoaded(true);
      })
      .catch(() => {});
  }, [postId]);

  const anonymousNumbers = useMemo(() => {
    const numbers = new Map<number, number>();

    comments.forEach((comment) => {
      if (
        comment.isAnonymous &&
        comment.authorId !== postAuthorId &&
        !numbers.has(comment.authorId)
      ) {
        numbers.set(comment.authorId, numbers.size + 1);
      }
    });

    return numbers;
  }, [comments, postAuthorId]);

  const getCommentAuthorLabel = (comment: CommentItem) => {
    if (comment.authorId === postAuthorId) {
      return "작성자";
    }

    if (comment.isAnonymous) {
      return `익명${anonymousNumbers.get(comment.authorId) ?? ""}`;
    }

    return comment.author;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    setSubmitError("");
    try {
      const comment = await createFreeComment(postId, trimmed, isAnonymous);
      setComments((prev) => [
        ...prev,
        {
          id: comment.id,
          author: comment.author_name,
          authorId: comment.author_id,
          content: comment.content,
          isAnonymous: comment.is_anonymous,
        },
      ]);
      setContent("");
    } catch {
      setSubmitError("댓글 등록에 실패했습니다. 로그인 상태를 확인해 주세요.");
    }
  };

  return (
    <section className="border-t border-[#eeeeee] px-5 py-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-black text-[#333333]">
          댓글 {isLoaded ? comments.length : initialCount}
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

      {submitError ? (
        <p className="mt-2 text-sm font-bold text-[#c62917]">{submitError}</p>
      ) : null}

      {comments.length > 0 ? (
        <ol className="mt-4 divide-y divide-[#eeeeee] rounded-md border border-[#eeeeee]">
          {comments.map((comment) => {
            const isPostAuthor = comment.authorId === postAuthorId;

            return (
              <li className="px-4 py-3 text-sm leading-6 text-[#333333]" key={comment.id}>
                <p
                  className={`mb-1 text-xs font-black ${
                    isPostAuthor ? "text-[#2563eb]" : "text-[#c62917]"
                  }`}
                >
                  {getCommentAuthorLabel(comment)}
                </p>
                <p>{comment.content}</p>
              </li>
            );
          })}
        </ol>
      ) : null}
    </section>
  );
}
