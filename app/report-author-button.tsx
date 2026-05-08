"use client";

// 게시글 작성자를 신고하는 버튼입니다.
// 아직 서버 저장은 없으므로 신고 사유를 고른 뒤 현재 화면에서 접수 상태만 보여줍니다.
import { FormEvent, useState } from "react";

type ReportAuthorButtonProps = {
  author: string;
};

const reportReasons = [
  "게시판 성격에 맞지 않음",
  "욕설/비하",
  "음란물/불건전한 만남 및 대화",
  "상업적 광고 및 판매",
  "유출/사칭/사기",
  "낚시/놀람/도배",
  "정당/정치인 비하 및 선거운동",
  "불법촬영물 등의 유통",
  "기타",
];

export default function ReportAuthorButton({ author }: ReportAuthorButtonProps) {
  const [isReported, setIsReported] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState(reportReasons[0]);
  const [extraReason, setExtraReason] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (selectedReason === "기타" && !extraReason.trim()) {
      return;
    }

    setIsReported(true);
    setIsOpen(false);
  };

  return (
    <>
      <button
        className={`text-xs font-bold transition ${
          isReported
            ? "text-[#aaaaaa]"
            : "text-[#aaaaaa] hover:text-[#777777]"
        }`}
        disabled={isReported}
        onClick={() => setIsOpen(true)}
        type="button"
      >
        {isReported ? "신고 접수됨" : "신고"}
      </button>

      {isOpen ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 px-4 py-6"
          role="dialog"
        >
          <section className="max-h-[90vh] w-full max-w-[520px] overflow-y-auto rounded-md border border-[#dedede] bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black">작성자 신고</h2>
                <p className="mt-1 text-sm leading-6 text-[#777777]">
                  {author} 작성자를 신고하는 이유를 선택하세요.
                </p>
              </div>
              <button
                aria-label="신고 창 닫기"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#dddddd] text-lg leading-none text-[#777777] hover:bg-[#f5f5f5]"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                x
              </button>
            </div>

            <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                {reportReasons.map((reason) => (
                  <label
                    className="flex items-center gap-3 rounded-md border border-[#eeeeee] px-3 py-2 text-sm font-semibold text-[#333333] hover:bg-[#fafafa]"
                    key={reason}
                  >
                    <input
                      checked={selectedReason === reason}
                      className="h-4 w-4 accent-[#c62917]"
                      name="reportReason"
                      onChange={() => setSelectedReason(reason)}
                      type="radio"
                      value={reason}
                    />
                    {reason}
                  </label>
                ))}
              </div>

              {selectedReason === "기타" ? (
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-[#333333]">
                    기타 신고 내용
                  </span>
                  <textarea
                    className="min-h-28 w-full resize-y rounded-md border border-[#d9d9d9] px-3 py-3 text-sm leading-6 outline-none placeholder:text-[#aaaaaa] focus:border-[#c62917] focus:ring-2 focus:ring-[#c62917]/10"
                    onChange={(event) => setExtraReason(event.target.value)}
                    placeholder="신고 내용을 입력하세요"
                    required
                    value={extraReason}
                  />
                </label>
              ) : null}

              <button
                className="h-12 w-full rounded-md bg-[#c62917] text-sm font-bold !text-white transition hover:bg-[#ae2112]"
                type="submit"
              >
                신고 제출
              </button>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}
