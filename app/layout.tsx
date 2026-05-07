import type { Metadata } from "next";
import "./globals.css";

// 앱 전체 HTML 뼈대와 기본 메타데이터를 설정하는 루트 레이아웃입니다.
// Next.js app router에서는 모든 페이지가 이 layout 안쪽의 children으로 들어옵니다.
export const metadata: Metadata = {
  title: "캠퍼스 게시판",
  description: "학교 생활을 나누는 실시간 게시판",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // lang="ko"는 브라우저와 보조기술에 이 사이트의 기본 언어가 한국어임을 알려줍니다.
    <html
      lang="ko"
      className="h-full antialiased"
    >
      {/* children 자리에는 현재 URL에 맞는 page.tsx 컴포넌트가 렌더링됩니다. */}
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
