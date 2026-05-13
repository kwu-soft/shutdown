// 백엔드 API와 통신하는 함수 모음입니다.
// 토큰은 localStorage의 'campus-board-jwt' 키에 저장합니다.

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const JWT_KEY = "campus-board-jwt";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(JWT_KEY);
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.detail || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── 인증 ──────────────────────────────────────────────

export async function apiLogin(email: string, password: string): Promise<string> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await handleResponse<{ access_token: string }>(res);
  return data.access_token;
}

export async function apiRegister(username: string, email: string, password: string): Promise<{ id: number; username: string }> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  return handleResponse(res);
}

// ── 자유게시판 ──────────────────────────────────────────

export async function getFreePosts(page = 1) {
  const res = await fetch(`${API_URL}/free-board?page=${page}&size=20`);
  return handleResponse<FreePostListResponse>(res);
}

export async function createFreePost(formData: FormData) {
  const res = await fetch(`${API_URL}/free-board`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
  return handleResponse<FreePostResponse>(res);
}

export async function getFreePost(id: number) {
  const res = await fetch(`${API_URL}/free-board/${id}`);
  return handleResponse<FreePostResponse>(res);
}

export async function updateFreePost(id: number, formData: FormData) {
  const res = await fetch(`${API_URL}/free-board/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: formData,
  });
  return handleResponse<FreePostResponse>(res);
}

export async function deleteFreePost(id: number) {
  const res = await fetch(`${API_URL}/free-board/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleResponse<void>(res);
}

export async function toggleFreePostLike(id: number) {
  const res = await fetch(`${API_URL}/free-board/${id}/like`, {
    method: "POST",
    headers: authHeaders(),
  });
  return handleResponse<{ liked: boolean; like_count: number }>(res);
}

export async function getFreeComments(postId: number) {
  const res = await fetch(`${API_URL}/free-board/${postId}/comments`);
  return handleResponse<FreeCommentResponse[]>(res);
}

export async function createFreeComment(postId: number, content: string, isAnonymous: boolean) {
  const res = await fetch(`${API_URL}/free-board/${postId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ content, is_anonymous: isAnonymous }),
  });
  return handleResponse<FreeCommentResponse>(res);
}

export async function toggleFreeCommentLike(commentId: number) {
  const res = await fetch(`${API_URL}/free-board/comments/${commentId}/like`, {
    method: "POST",
    headers: authHeaders(),
  });
  return handleResponse<{ liked: boolean; like_count: number }>(res);
}

// ── 장터게시판 ──────────────────────────────────────────

export async function getMarketPosts(page = 1) {
  const res = await fetch(`${API_URL}/market?page=${page}&size=20`);
  return handleResponse<MarketPostListResponse>(res);
}

export async function createMarketPost(formData: FormData) {
  const res = await fetch(`${API_URL}/market`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
  return handleResponse<MarketPostResponse>(res);
}

export async function getMarketPost(id: number) {
  const res = await fetch(`${API_URL}/market/${id}`);
  return handleResponse<MarketPostResponse>(res);
}

// ── 족보경매장 ──────────────────────────────────────────

export async function getAuctionPosts(page = 1) {
  const res = await fetch(`${API_URL}/auction?page=${page}&size=20`);
  return handleResponse<AuctionPostListResponse>(res);
}

export async function createAuctionPost(formData: FormData) {
  const res = await fetch(`${API_URL}/auction`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
  return handleResponse<AuctionPostResponse>(res);
}

export async function getAuctionPost(id: number) {
  const res = await fetch(`${API_URL}/auction/${id}`);
  return handleResponse<AuctionPostResponse>(res);
}

export async function toggleMarketPostLike(id: number) {
  const res = await fetch(`${API_URL}/market/${id}/like`, {
    method: "POST",
    headers: authHeaders(),
  });
  return handleResponse<{ liked: boolean; like_count: number }>(res);
}

export async function toggleAuctionPostLike(id: number) {
  const res = await fetch(`${API_URL}/auction/${id}/like`, {
    method: "POST",
    headers: authHeaders(),
  });
  return handleResponse<{ liked: boolean; like_count: number }>(res);
}

export async function placeBid(postId: number, additionalAmount: number) {
  const res = await fetch(`${API_URL}/auction/${postId}/bid`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ additional_amount: additionalAmount }),
  });
  return handleResponse<{ id: number; bid_amount: number; bidder_name: string; created_at: string }>(res);
}

// ── 강의평게시판 ──────────────────────────────────────────

export async function getReviews(page = 1, search?: string, courseName?: string, professorName?: string) {
  const params = new URLSearchParams({ page: String(page), size: "20" });
  if (search) params.set("search", search);
  if (courseName) params.set("course_name", courseName);
  if (professorName) params.set("professor_name", professorName);
  const res = await fetch(`${API_URL}/reviews?${params}`);
  return handleResponse<ReviewPostListResponse>(res);
}

export async function createReview(data: ReviewPostCreate) {
  const res = await fetch(`${API_URL}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
  return handleResponse<ReviewPostResponse>(res);
}

export async function getReview(id: number) {
  const res = await fetch(`${API_URL}/reviews/${id}`);
  return handleResponse<ReviewPostResponse>(res);
}

export async function toggleReviewLike(id: number) {
  const res = await fetch(`${API_URL}/reviews/${id}/like`, {
    method: "POST",
    headers: authHeaders(),
  });
  return handleResponse<{ liked: boolean; like_count: number }>(res);
}

// ── 타입 정의 ──────────────────────────────────────────

export type FreePostResponse = {
  id: number;
  title: string;
  content: string;
  image_path: string | null;
  is_anonymous: boolean;
  author_id: number;
  author_name: string;
  created_at: string;
  updated_at: string;
  like_count: number;
  comment_count: number;
};

export type FreePostListResponse = {
  posts: FreePostResponse[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
};

export type FreeCommentResponse = {
  id: number;
  content: string;
  is_anonymous: boolean;
  author_id: number;
  author_name: string;
  post_id: number;
  created_at: string;
  like_count: number;
};

export type MarketPostResponse = {
  id: number;
  title: string;
  content: string;
  price: number;
  image_path: string | null;
  is_anonymous: boolean;
  author_id: number;
  author_name: string;
  created_at: string;
  updated_at: string;
  like_count: number;
};

export type MarketPostListResponse = {
  posts: MarketPostResponse[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
};

export type AuctionPostResponse = {
  id: number;
  title: string;
  content: string;
  course_name: string;
  professor_name: string;
  starting_price: number;
  current_price: number;
  deadline: string;
  image_path: string | null;
  is_anonymous: boolean;
  author_id: number;
  author_name: string;
  created_at: string;
  is_ended: boolean;
  like_count: number;
  bids: Array<{ id: number; bid_amount: number; bidder_name: string; created_at: string }>;
};

export type AuctionPostListResponse = {
  posts: AuctionPostResponse[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
};

export type ReviewPostResponse = {
  id: number;
  title: string;
  content: string;
  course_name: string;
  professor_name: string;
  assignment_level: "many" | "normal" | "few" | "none";
  team_project_load: "many" | "normal" | "few" | "none";
  grading_style: "generous" | "normal" | "strict";
  rating: number;
  year: number;
  semester: "1" | "2" | "summer" | "winter";
  author_id: number;
  author_name: string;
  created_at: string;
  updated_at: string;
  like_count: number;
};

export type ReviewPostListResponse = {
  posts: ReviewPostResponse[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
};

export type ReviewPostCreate = {
  title: string;
  content: string;
  course_name: string;
  professor_name: string;
  assignment_level: "many" | "normal" | "few" | "none";
  team_project_load: "many" | "normal" | "few" | "none";
  grading_style: "generous" | "normal" | "strict";
  rating: number;
  year: number;
  semester: "1" | "2" | "summer" | "winter";
};
