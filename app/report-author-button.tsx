"use client";

// 게시글 작성자를 신고하는 버튼입니다.
// 아직 서버 저장은 없으므로 클릭하면 현재 화면에서 신고 접수 상태만 보여줍니다.
import { useState } from "react";

type ReportAuthorButtonProps = {
  author: string;
};

export default function ReportAuthorButton({ author }: ReportAuthorButtonProps) {
  const [isReported, setIsReported] = useState(false);

  return (
    <button
      className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
        isReported
          ? "bg-[#cccccc] text-white"
          : "bg-[#c62917] text-white hover:bg-[#ae2112]"
      }`}
      disabled={isReported}
      onClick={() => setIsReported(true)}
      type="button"
    >
      {isReported ? "신고 접수됨" : "신고"}
    </button>
  );
}
