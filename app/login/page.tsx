import Login from "../login";

// /login 경로에서 공통 로그인 컴포넌트를 렌더링합니다.
// 실제 로그인 화면 코드는 app/login.tsx에 두고, 이 파일은 URL 연결만 담당합니다.
export default function LoginPage() {
  return <Login />;
}
