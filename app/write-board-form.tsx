"use client";

// 자유게시판, 장터게시판, 족보경매장, 강의평게시판의 글쓰기 화면을 하나의 폼 컴포넌트로 처리합니다.
// 게시판마다 필요한 추가 입력값이 다르기 때문에 boardType 값에 따라 필드를 조건부로 보여줍니다.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AssignmentLoad, GradingStyle, TeamProjectLoad } from "./community-data";
import { createAuctionPost, createFreePost, createMarketPost, createReview } from "./lib/api";

const ASSIGNMENT_API_MAP: Record<AssignmentLoad, string> = {
  "많음": "many", "보통": "normal", "적음": "few", "없음": "none",
};
const GRADING_API_MAP: Record<GradingStyle, string> = {
  "너그러움": "generous", "보통": "normal", "깐깐함": "strict",
};
const SEMESTER_API_MAP: Record<string, string> = {
  "1학기": "1", "2학기": "2", "여름학기": "summer", "겨울학기": "winter",
};

type WriteBoardType = "free" | "market" | "examAuction" | "reviews";

type WriteBoardFormProps = {
  // 어떤 게시판의 글쓰기 화면인지 구분하는 값입니다.
  boardType: WriteBoardType;
};

const boardSettings = {
  free: {
    backHref: "/free",
    boardName: "자유게시판",
    description: "자유롭게 이야기를 나눌 게시글을 작성합니다.",
    submitLabel: "자유게시판에 올리기",
    title: "자유게시판 글쓰기",
  },
  market: {
    backHref: "/market",
    boardName: "장터게시판",
    description: "판매할 물건의 정보와 가격을 함께 작성합니다.",
    submitLabel: "장터게시판에 올리기",
    title: "장터게시판 글쓰기",
  },
  examAuction: {
    backHref: "/exam-auction",
    boardName: "족보경매장",
    description: "강의 정보와 경매 조건을 함께 작성합니다.",
    submitLabel: "족보경매장에 올리기",
    title: "족보경매장 글쓰기",
  },
  reviews: {
    backHref: "/reviews",
    boardName: "강의평게시판",
    description: "강의와 교수를 고른 뒤 수강 경험과 평점을 작성합니다.",
    submitLabel: "강의평게시판에 올리기",
    title: "강의평 글쓰기",
  },
} satisfies Record<
  WriteBoardType,
  {
    backHref: string;
    boardName: string;
    description: string;
    submitLabel: string;
    title: string;
  }
>;

const defaultNickname = "컴공새내기";

const courseOptions = [
  "웹프로그래밍",
  "자료구조",
  "현대사회와윤리",
  "운영체제",
  "컴퓨터네트워크",
];

const professorOptions = [
  "김도현 교수",
  "박서진 교수",
  "이수민 교수",
  "정하늘 교수",
  "최민재 교수",
];

const ratingOptions = Array.from({ length: 5 }, (_, index) =>
  String(index + 1),
);
const assignmentOptions: AssignmentLoad[] = ["많음", "보통", "적음", "없음"];
const teamProjectOptions: TeamProjectLoad[] = ["많음", "보통", "적음", "없음"];
const gradingOptions: GradingStyle[] = ["너그러움", "보통", "깐깐함"];
const courseYearOptions = ["2026", "2025", "2024", "2023", "2022"];
const courseSemesterOptions = ["1학기", "여름학기", "2학기", "겨울학기"];

export default function WriteBoardForm({ boardType }: WriteBoardFormProps) {
  const settings = boardSettings[boardType];
  const isMarket = boardType === "market";
  const isExamAuction = boardType === "examAuction";
  const isReview = boardType === "reviews";

  // 제출 후에는 현재 브라우저에 저장하고 화면 아래 미리보기 카드에 작성 결과를 보여줍니다.
  const [isSubmitted, setIsSubmitted] = useState(false);

  // 익명 체크 여부에 따라 작성자 표시 이름이 달라집니다.
  const [isAnonymous, setIsAnonymous] = useState(false);

  // 입력값을 state로 관리해서 제출 후 미리보기에서도 같은 값을 바로 사용할 수 있게 합니다.
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [price, setPrice] = useState("");
  const [courseName, setCourseName] = useState("");
  const [professorName, setProfessorName] = useState("");
  const [startPrice, setStartPrice] = useState("");
  const [auctionEndTime, setAuctionEndTime] = useState("");
  const [rating, setRating] = useState("5");
  const [courseYear, setCourseYear] = useState("2026");
  const [courseSemester, setCourseSemester] = useState("1학기");
  const [assignmentLoad, setAssignmentLoad] =
    useState<AssignmentLoad>("보통");
  const [teamProjectLoad, setTeamProjectLoad] =
    useState<TeamProjectLoad>("보통");
  const [gradingStyle, setGradingStyle] = useState<GradingStyle>("보통");

  // 사진은 파일 자체를 업로드하지 않고, 현재 선택된 파일 이름을 미리보기용으로 보여줍니다.
  const [photoNames, setPhotoNames] = useState<string[]>([]);

  const router = useRouter();
  const [submitError, setSubmitError] = useState("");
  const authorName = isAnonymous ? "익명" : defaultNickname;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");

    try {
      if (isReview) {
        await createReview({
          title: courseName,
          content,
          course_name: courseName,
          professor_name: professorName,
          assignment_level: ASSIGNMENT_API_MAP[assignmentLoad] as "many" | "normal" | "few" | "none",
          team_project_load: ASSIGNMENT_API_MAP[teamProjectLoad] as "many" | "normal" | "few" | "none",
          grading_style: GRADING_API_MAP[gradingStyle] as "generous" | "normal" | "strict",
          rating: Number(rating),
          year: Number(courseYear),
          semester: SEMESTER_API_MAP[courseSemester] as "1" | "2" | "summer" | "winter",
        });
        router.push("/reviews");
        return;
      }

      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      formData.append("is_anonymous", String(isAnonymous));

      if (isMarket) {
        const priceNum = Number(price.replace(/[^0-9]/g, ""));
        formData.append("price", String(priceNum));
        await createMarketPost(formData);
        router.push("/market");
      } else if (isExamAuction) {
        formData.append("course_name", courseName);
        formData.append("professor_name", professorName);
        formData.append("starting_price", String(Number(startPrice.replace(/[^0-9]/g, ""))));
        formData.append("deadline", new Date(auctionEndTime).toISOString());
        await createAuctionPost(formData);
        router.push("/exam-auction");
      } else {
        await createFreePost(formData);
        router.push("/free");
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "게시글 등록 실패. 로그인 상태를 확인하세요.");
      setIsSubmitted(true);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f5f5] px-4 py-8 text-[#222222]">
      <section className="mx-auto max-w-3xl">
        {/* 상단 영역에서는 현재 어떤 게시판에 글을 쓰는지와 돌아가기 링크를 보여줍니다. */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-[#c62917]">
              {settings.boardName}
            </p>
            <h1 className="mt-1 text-2xl font-black">{settings.title}</h1>
            <p className="mt-2 text-sm text-[#777777]">
              {settings.description}
            </p>
          </div>
          <Link
            className="rounded-md border border-[#dedede] bg-white px-4 py-2 text-sm font-bold text-[#555555] hover:bg-[#fafafa]"
            href={settings.backHref}
          >
            목록으로
          </Link>
        </div>

        {/* 게시글 작성 폼입니다. 게시판 종류에 따라 아래쪽 추가 필드가 달라집니다. */}
        <form
          className="rounded-md border border-[#dedede] bg-white p-5 shadow-sm"
          onSubmit={handleSubmit}
        >
          <div className="space-y-5">
            {/* 강의평은 강의명 자체가 제목 역할을 하므로 별도 제목 입력칸을 숨깁니다. */}
            {!isReview ? (
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-[#333333]">
                  제목
                </span>
                <input
                  className="h-12 w-full rounded-md border border-[#d9d9d9] bg-white px-3 text-sm outline-none placeholder:text-[#aaaaaa] focus:border-[#c62917] focus:ring-2 focus:ring-[#c62917]/10"
                  name="title"
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="제목을 입력하세요"
                  required
                  type="text"
                  value={title}
                />
              </label>
            ) : null}

            {/* 강의평게시판은 강의명과 교수명을 검색 후보에서 고르고, 평점은 1점 단위로 선택합니다. */}
            {isReview ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-[#333333]">
                    강의명
                  </span>
                  <input
                    className="h-12 w-full rounded-md border border-[#d9d9d9] bg-white px-3 text-sm outline-none placeholder:text-[#aaaaaa] focus:border-[#c62917] focus:ring-2 focus:ring-[#c62917]/10"
                    list="course-options"
                    name="courseName"
                    onChange={(event) => setCourseName(event.target.value)}
                    placeholder="강의명을 검색해서 고르세요"
                    required
                    type="text"
                    value={courseName}
                  />
                  <datalist id="course-options">
                    {courseOptions.map((course) => (
                      <option key={course} value={course} />
                    ))}
                  </datalist>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-[#333333]">
                    교수명
                  </span>
                  <input
                    className="h-12 w-full rounded-md border border-[#d9d9d9] bg-white px-3 text-sm outline-none placeholder:text-[#aaaaaa] focus:border-[#c62917] focus:ring-2 focus:ring-[#c62917]/10"
                    list="professor-options"
                    name="professorName"
                    onChange={(event) => setProfessorName(event.target.value)}
                    placeholder="교수명을 검색해서 고르세요"
                    required
                    type="text"
                    value={professorName}
                  />
                  <datalist id="professor-options">
                    {professorOptions.map((professor) => (
                      <option key={professor} value={professor} />
                    ))}
                  </datalist>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-[#333333]">
                    수강 연도
                  </span>
                  <select
                    className="h-12 w-full rounded-md border border-[#d9d9d9] bg-white px-3 text-sm outline-none focus:border-[#c62917] focus:ring-2 focus:ring-[#c62917]/10"
                    name="courseYear"
                    onChange={(event) => setCourseYear(event.target.value)}
                    required
                    value={courseYear}
                  >
                    {courseYearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}년
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-[#333333]">
                    수강 학기
                  </span>
                  <select
                    className="h-12 w-full rounded-md border border-[#d9d9d9] bg-white px-3 text-sm outline-none focus:border-[#c62917] focus:ring-2 focus:ring-[#c62917]/10"
                    name="courseSemester"
                    onChange={(event) => setCourseSemester(event.target.value)}
                    required
                    value={courseSemester}
                  >
                    {courseSemesterOptions.map((semester) => (
                      <option key={semester} value={semester}>
                        {semester}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid gap-4 sm:col-span-2 lg:grid-cols-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-[#333333]">
                      평점
                    </span>
                    <select
                      className="h-12 w-full rounded-md border border-[#d9d9d9] bg-white px-3 text-sm outline-none focus:border-[#c62917] focus:ring-2 focus:ring-[#c62917]/10"
                      name="rating"
                      onChange={(event) => setRating(event.target.value)}
                      required
                      value={rating}
                    >
                      {ratingOptions.map((ratingOption) => (
                        <option key={ratingOption} value={ratingOption}>
                          {ratingOption}점
                        </option>
                      ))}
                    </select>
                  </label>
                  <ReviewChoiceGroup
                    label="과제"
                    name="assignmentLoad"
                    onChange={setAssignmentLoad}
                    options={assignmentOptions}
                    value={assignmentLoad}
                  />
                  <ReviewChoiceGroup
                    label="조모임"
                    name="teamProjectLoad"
                    onChange={setTeamProjectLoad}
                    options={teamProjectOptions}
                    value={teamProjectLoad}
                  />
                  <ReviewChoiceGroup
                    label="성적"
                    name="gradingStyle"
                    onChange={setGradingStyle}
                    options={gradingOptions}
                    value={gradingStyle}
                  />
                </div>
              </div>
            ) : null}

            {/* 모든 게시판에서 공통으로 받는 본문 입력칸입니다. */}
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-[#333333]">
                내용
              </span>
              <textarea
                className="min-h-40 w-full resize-y rounded-md border border-[#d9d9d9] bg-white px-3 py-3 text-sm leading-6 outline-none placeholder:text-[#aaaaaa] focus:border-[#c62917] focus:ring-2 focus:ring-[#c62917]/10"
                name="content"
                onChange={(event) => setContent(event.target.value)}
                placeholder="내용을 입력하세요"
                required
                value={content}
              />
            </label>

            {/* 장터게시판은 판매 가격 입력이 필요합니다. */}
            {isMarket ? (
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-[#333333]">
                  판매 가격
                </span>
                <input
                  className="h-12 w-full rounded-md border border-[#d9d9d9] bg-white px-3 text-sm outline-none placeholder:text-[#aaaaaa] focus:border-[#c62917] focus:ring-2 focus:ring-[#c62917]/10"
                  inputMode="numeric"
                  name="price"
                  onChange={(event) => setPrice(event.target.value)}
                  placeholder="예: 42,000원"
                  required
                  type="text"
                  value={price}
                />
              </label>
            ) : null}

            {/* 족보경매장은 강의명, 교수명, 시작가, 마감 시간을 추가로 받습니다. */}
            {isExamAuction ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-[#333333]">
                    강의명
                  </span>
                  <input
                    className="h-12 w-full rounded-md border border-[#d9d9d9] bg-white px-3 text-sm outline-none placeholder:text-[#aaaaaa] focus:border-[#c62917] focus:ring-2 focus:ring-[#c62917]/10"
                    name="courseName"
                    onChange={(event) => setCourseName(event.target.value)}
                    placeholder="예: 자료구조"
                    required
                    type="text"
                    value={courseName}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-[#333333]">
                    교수명
                  </span>
                  <input
                    className="h-12 w-full rounded-md border border-[#d9d9d9] bg-white px-3 text-sm outline-none placeholder:text-[#aaaaaa] focus:border-[#c62917] focus:ring-2 focus:ring-[#c62917]/10"
                    name="professorName"
                    onChange={(event) => setProfessorName(event.target.value)}
                    placeholder="예: 김도현 교수"
                    required
                    type="text"
                    value={professorName}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-[#333333]">
                    입찰 시작가격
                  </span>
                  <input
                    className="h-12 w-full rounded-md border border-[#d9d9d9] bg-white px-3 text-sm outline-none placeholder:text-[#aaaaaa] focus:border-[#c62917] focus:ring-2 focus:ring-[#c62917]/10"
                    inputMode="numeric"
                    name="startPrice"
                    onChange={(event) => setStartPrice(event.target.value)}
                    placeholder="예: 10,000원"
                    required
                    type="text"
                    value={startPrice}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-[#333333]">
                    경매 마감 시간
                  </span>
                  <input
                    className="h-12 w-full rounded-md border border-[#d9d9d9] bg-white px-3 text-sm outline-none focus:border-[#c62917] focus:ring-2 focus:ring-[#c62917]/10"
                    name="auctionEndTime"
                    onChange={(event) => setAuctionEndTime(event.target.value)}
                    required
                    type="datetime-local"
                    value={auctionEndTime}
                  />
                </label>
              </div>
            ) : null}

            {/* 자유/장터/족보 글쓰기에서는 사진을 여러 장 선택할 수 있게 합니다. */}
            {!isReview ? (
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-[#333333]">
                  사진
                </span>
                <input
                  accept="image/*"
                  className="block w-full rounded-md border border-[#d9d9d9] bg-white px-3 py-3 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[#fff5f3] file:px-3 file:py-2 file:text-sm file:font-bold file:text-[#c62917]"
                  multiple
                  name="photos"
                  onChange={(event) =>
                    setPhotoNames(
                      Array.from(event.target.files ?? []).map(
                        (file) => file.name,
                      ),
                    )
                  }
                  type="file"
                />
                <p className="mt-2 text-xs text-[#888888]">
                  이미지 파일을 여러 장 선택할 수 있습니다.
                </p>
              </label>
            ) : null}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* 강의평은 수강 시점으로 표시하므로 익명 선택이 필요하지 않습니다. */}
            {!isReview ? (
              <label className="flex h-12 w-fit items-center gap-2 rounded-md border border-[#eeeeee] bg-[#fafafa] px-3 text-sm font-semibold text-[#333333]">
                <input
                  checked={isAnonymous}
                  className="h-4 w-4 accent-[#c62917]"
                  name="anonymous"
                  onChange={(event) => setIsAnonymous(event.target.checked)}
                  type="checkbox"
                />
                익명
              </label>
            ) : null}
            <button
              className="h-12 flex-1 rounded-md bg-[#c62917] text-sm font-bold !text-white transition hover:bg-[#ae2112]"
              type="submit"
            >
              {settings.submitLabel}
            </button>
          </div>

          {submitError ? (
            <p className="mt-3 rounded-md bg-[#fff5f3] px-3 py-2 text-sm font-bold text-[#c62917]">
              {submitError}
            </p>
          ) : null}
        </form>

        {/* 제출 후에는 게시판에 반영될 내용을 한 번 더 확인할 수 있게 보여줍니다. */}
        {isSubmitted ? (
          <section className="mt-5 rounded-md border border-[#dedede] bg-white p-5">
            <p className="text-sm font-bold text-[#c62917]">
              게시글 미리보기
            </p>
            <h2 className="mt-2 text-xl font-black">
              {isReview ? courseName || "강의명 없음" : title || "제목 없음"}
            </h2>
            <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold text-[#777777]">
              <span>{settings.boardName}</span>
              {isReview ? (
                <span>
                  {courseYear}년 {courseSemester} 수강자
                </span>
              ) : (
                <span>작성자 {authorName}</span>
              )}
              {price ? <span>판매 가격 {price}</span> : null}
              {courseName ? <span>강의명 {courseName}</span> : null}
              {professorName ? <span>교수명 {professorName}</span> : null}
              {isReview ? <span>평점 {rating}점</span> : null}
              {isReview ? <span>과제 {assignmentLoad}</span> : null}
              {isReview ? <span>조모임 {teamProjectLoad}</span> : null}
              {isReview ? <span>성적 {gradingStyle}</span> : null}
              {startPrice ? <span>시작가 {startPrice}</span> : null}
              {auctionEndTime ? <span>마감 {auctionEndTime}</span> : null}
            </div>
            <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#333333]">
              {content || "내용 없음"}
            </p>
            {photoNames.length > 0 ? (
              <div className="mt-4 rounded-md bg-[#fafafa] p-3">
                <p className="text-xs font-bold text-[#777777]">
                  첨부 사진
                </p>
                <ul className="mt-2 space-y-1 text-sm text-[#555555]">
                  {photoNames.map((photoName) => (
                    <li key={photoName}>{photoName}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ) : null}
      </section>
    </main>
  );
}

function ReviewChoiceGroup<T extends string>({
  label,
  name,
  onChange,
  options,
  value,
}: {
  label: string;
  name: string;
  onChange: (value: T) => void;
  options: T[];
  value: T;
}) {
  return (
    <fieldset>
      <legend className="mb-2 block text-sm font-bold text-[#333333]">
        {label}
      </legend>
      <div className="flex min-h-12 flex-wrap overflow-hidden rounded-md border border-[#d9d9d9] bg-white">
        {options.map((option) => (
          <label
            className={`flex min-h-10 flex-1 cursor-pointer items-center justify-center whitespace-nowrap border-r border-[#eeeeee] px-2 text-xs font-bold last:border-r-0 ${
              value === option
                ? "bg-[#fff5f3] text-[#c62917]"
                : "text-[#666666] hover:bg-[#fafafa]"
            }`}
            key={option}
          >
            <input
              checked={value === option}
              className="sr-only"
              name={name}
              onChange={() => onChange(option)}
              type="radio"
              value={option}
            />
            {option}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
