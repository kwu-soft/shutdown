"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  userProfileStorageKey,
  userRoleStorageKey,
} from "../auth-link";
import {
  deleteAdminPost,
  getAdminLogs,
  getAdminPosts,
  getAdminReports,
  getAdminSummary,
  getAdminUsers,
  getCurrentUser,
  updateAdminReport,
  updateAdminUser,
  type AdminLogItem,
  type AdminPostItem,
  type AdminSummary,
  type AdminUserItem,
  type ReportItem,
  type UserRole,
} from "../lib/api";
import { formatPostTime } from "../lib/time";
import { safeJsonParse } from "../storage";

type AdminTab = "dashboard" | "users" | "posts" | "reports" | "logs";

const tabs: Array<{ key: AdminTab; label: string }> = [
  { key: "dashboard", label: "대시보드" },
  { key: "users", label: "사용자/권한/제재" },
  { key: "posts", label: "게시글 관리" },
  { key: "reports", label: "신고 관리" },
  { key: "logs", label: "운영 로그" },
];

const boardLabels: Record<string, string> = {
  examAuction: "족보경매장",
  free: "자유게시판",
  market: "장터게시판",
  reviews: "강의평게시판",
};

const reportStatusLabels: Record<ReportItem["status"], string> = {
  pending: "대기",
  rejected: "기각",
  resolved: "처리완료",
  reviewing: "검토중",
};

function getStoredRole() {
  if (typeof window === "undefined") return "";

  const profile = safeJsonParse<{ role?: string } | null>(
    window.localStorage.getItem(userProfileStorageKey),
    null,
  );

  return profile?.role || window.localStorage.getItem(userRoleStorageKey) || "";
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [isAllowed, setIsAllowed] = useState(() => getStoredRole() === "admin");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [posts, setPosts] = useState<AdminPostItem[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [logs, setLogs] = useState<AdminLogItem[]>([]);

  const refreshAdminData = () => {
    setError("");
    Promise.all([
      getAdminSummary(),
      getAdminUsers(),
      getAdminPosts(),
      getAdminReports(),
      getAdminLogs(),
    ])
      .then(([nextSummary, nextUsers, nextPosts, nextReports, nextLogs]) => {
        setSummary(nextSummary);
        setUsers(nextUsers);
        setPosts(nextPosts);
        setReports(nextReports);
        setLogs(nextLogs);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "관리자 데이터를 불러오지 못했습니다.");
      });
  };

  useEffect(() => {
    getCurrentUser()
      .then((currentUser) => {
        const allowed = currentUser.role === "admin";
        setIsAllowed(allowed);
        if (allowed) refreshAdminData();
      })
      .catch(() => {
        setIsAllowed(false);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const pendingReports = useMemo(
    () => reports.filter((report) => report.status === "pending"),
    [reports],
  );

  const handleUpdateUser = async (
    user: AdminUserItem,
    patch: { role?: UserRole; status?: "active" | "suspended"; sanction_reason?: string | null },
  ) => {
    const updated = await updateAdminUser(user.id, patch);
    setUsers((current) =>
      current.map((item) => (item.id === updated.id ? updated : item)),
    );
    refreshAdminData();
  };

  const handleDeletePost = async (post: AdminPostItem) => {
    await deleteAdminPost(post.board, post.id);
    setPosts((current) =>
      current.filter((item) => !(item.board === post.board && item.id === post.id)),
    );
    refreshAdminData();
  };

  const handleReportStatus = async (
    report: ReportItem,
    status: ReportItem["status"],
  ) => {
    const updated = await updateAdminReport(report.id, {
      admin_note: report.admin_note ?? "",
      status,
    });
    setReports((current) =>
      current.map((item) => (item.id === updated.id ? updated : item)),
    );
    refreshAdminData();
  };

  return (
    <main className="min-h-screen bg-[#f5f5f5] px-4 py-8 text-[#222222]">
      <section className="mx-auto max-w-6xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-[#c62917]">ADMIN</p>
            <h1 className="mt-1 text-2xl font-black">관리자 페이지</h1>
            <p className="mt-2 text-sm text-[#777777]">
              신고, 게시글, 사용자 권한과 제재를 한 곳에서 관리합니다.
            </p>
          </div>
          <Link
            className="rounded-md border border-[#dedede] bg-white px-4 py-2 text-sm font-bold text-[#555555] hover:bg-[#fafafa]"
            href="/"
          >
            게시판으로 돌아가기
          </Link>
        </div>

        {isLoading ? (
          <Panel>관리자 권한 확인 중...</Panel>
        ) : null}

        {!isLoading && !isAllowed ? (
          <Panel>
            <div className="text-center">
              <h2 className="text-xl font-black text-[#c62917]">
                관리자 계정으로 로그인해야 접근할 수 있습니다.
              </h2>
              <Link
                className="mt-5 inline-flex h-10 items-center rounded-md bg-[#c62917] px-5 text-sm font-bold !text-white"
                href="/login"
              >
                로그인
              </Link>
            </div>
          </Panel>
        ) : null}

        {!isLoading && isAllowed ? (
          <>
            <div className="mb-4 overflow-x-auto rounded-md border border-[#dedede] bg-white">
              <div className="flex min-w-max">
                {tabs.map((tab) => (
                  <button
                    className={`border-r border-[#eeeeee] px-4 py-3 text-sm font-bold last:border-r-0 ${
                      activeTab === tab.key
                        ? "bg-[#fff5f3] text-[#c62917]"
                        : "text-[#555555] hover:bg-[#fafafa]"
                    }`}
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    type="button"
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {error ? (
              <p className="mb-4 rounded-md bg-[#fff5f3] px-4 py-3 text-sm font-bold text-[#c62917]">
                {error}
              </p>
            ) : null}

            {activeTab === "dashboard" ? (
              <DashboardPanel
                pendingReports={pendingReports}
                recentLogs={logs.slice(0, 5)}
                summary={summary}
              />
            ) : null}
            {activeTab === "users" ? (
              <UsersPanel onUpdate={handleUpdateUser} users={users} />
            ) : null}
            {activeTab === "posts" ? (
              <PostsPanel onDelete={handleDeletePost} posts={posts} />
            ) : null}
            {activeTab === "reports" ? (
              <ReportsPanel onStatusChange={handleReportStatus} reports={reports} />
            ) : null}
            {activeTab === "logs" ? <LogsPanel logs={logs} /> : null}
          </>
        ) : null}
      </section>
    </main>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-[#dedede] bg-white p-5">
      {children}
    </section>
  );
}

function DashboardPanel({
  pendingReports,
  recentLogs,
  summary,
}: {
  pendingReports: ReportItem[];
  recentLogs: AdminLogItem[];
  summary: AdminSummary | null;
}) {
  const cards = [
    ["총 회원", summary?.total_users ?? 0],
    ["오늘 가입", summary?.today_users ?? 0],
    ["총 게시글", summary?.total_posts ?? 0],
    ["대기 신고", summary?.pending_reports ?? 0],
    ["정지 회원", summary?.suspended_users ?? 0],
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map(([label, value]) => (
          <div className="rounded-md border border-[#dedede] bg-white p-4" key={label}>
            <p className="text-xs font-bold text-[#888888]">{label}</p>
            <p className="mt-2 text-2xl font-black text-[#c62917]">{value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <h2 className="text-base font-black">최근 대기 신고</h2>
          <SimpleList
            empty="대기 중인 신고가 없습니다."
            items={pendingReports.slice(0, 5).map((report) => ({
              id: report.id,
              main: `${report.target_author_name} - ${report.reason}`,
              sub: `${boardLabels[report.board] ?? report.board} #${report.post_id}`,
            }))}
          />
        </Panel>
        <Panel>
          <h2 className="text-base font-black">최근 운영 로그</h2>
          <SimpleList
            empty="운영 로그가 없습니다."
            items={recentLogs.map((log) => ({
              id: log.id,
              main: `${log.action} (${log.target_type} ${log.target_id})`,
              sub: `${log.admin_name ?? "system"} · ${formatPostTime(log.created_at)}`,
            }))}
          />
        </Panel>
      </div>
    </div>
  );
}

function UsersPanel({
  onUpdate,
  users,
}: {
  onUpdate: (
    user: AdminUserItem,
    patch: { role?: UserRole; status?: "active" | "suspended"; sanction_reason?: string | null },
  ) => void;
  users: AdminUserItem[];
}) {
  return (
    <Panel>
      <h2 className="text-base font-black">사용자 관리</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[920px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#eeeeee] text-left text-[#777777]">
              <th className="py-2 pr-3">사용자</th>
              <th className="py-2 pr-3">권한</th>
              <th className="py-2 pr-3">상태</th>
              <th className="py-2 pr-3">추천/글</th>
              <th className="py-2 pr-3">가입일</th>
              <th className="py-2 pr-3">작업</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr className="border-b border-[#eeeeee]" key={user.id}>
                <td className="py-3 pr-3">
                  <p className="font-bold">{user.username}</p>
                  <p className="text-xs text-[#888888]">{user.email}</p>
                  {user.sanction_reason ? (
                    <p className="mt-1 text-xs font-bold text-[#c62917]">
                      {user.sanction_reason}
                    </p>
                  ) : null}
                </td>
                <td className="py-3 pr-3">
                  <select
                    className="rounded-md border border-[#dedede] bg-white px-2 py-1"
                    onChange={(event) =>
                      onUpdate(user, { role: event.target.value as UserRole })
                    }
                    value={user.role}
                  >
                    <option value="user">user</option>
                    <option value="moderator">moderator</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td className="py-3 pr-3">
                  <span
                    className={`rounded-sm px-2 py-1 text-xs font-bold ${
                      user.status === "active"
                        ? "bg-[#eef8f0] text-[#16803a]"
                        : "bg-[#fff5f3] text-[#c62917]"
                    }`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="py-3 pr-3">
                  {user.recommendation_count} / {user.post_count}
                </td>
                <td className="py-3 pr-3">{formatPostTime(user.created_at)}</td>
                <td className="py-3 pr-3">
                  <div className="flex flex-wrap gap-2">
                    {user.status === "active" ? (
                      <ActionButton
                        onClick={() =>
                          onUpdate(user, {
                            sanction_reason: "관리자에 의해 계정이 정지되었습니다.",
                            status: "suspended",
                          })
                        }
                      >
                        정지
                      </ActionButton>
                    ) : (
                      <ActionButton
                        onClick={() =>
                          onUpdate(user, {
                            sanction_reason: null,
                            status: "active",
                          })
                        }
                        tone="gray"
                      >
                        해제
                      </ActionButton>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function PostsPanel({
  onDelete,
  posts,
}: {
  onDelete: (post: AdminPostItem) => void;
  posts: AdminPostItem[];
}) {
  return (
    <Panel>
      <h2 className="text-base font-black">게시글 관리</h2>
      <div className="mt-4 grid gap-3">
        {posts.length === 0 ? (
          <p className="text-sm text-[#777777]">게시글이 없습니다.</p>
        ) : (
          posts.map((post) => (
            <article
              className="rounded-md border border-[#eeeeee] p-4"
              key={`${post.board}-${post.id}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#c62917]">
                    {boardLabels[post.board] ?? post.board}
                  </p>
                  <Link
                    className="mt-1 block truncate font-black hover:text-[#c62917]"
                    href={`/posts/${post.id}?board=${post.board}`}
                  >
                    {post.title}
                  </Link>
                  <p className="mt-1 text-sm text-[#777777]">
                    {post.author_name} · 좋아요 {post.like_count} · 댓글 {post.comment_count} ·{" "}
                    {formatPostTime(post.created_at)}
                  </p>
                </div>
                <ActionButton onClick={() => onDelete(post)}>삭제</ActionButton>
              </div>
            </article>
          ))
        )}
      </div>
    </Panel>
  );
}

function ReportsPanel({
  onStatusChange,
  reports,
}: {
  onStatusChange: (report: ReportItem, status: ReportItem["status"]) => void;
  reports: ReportItem[];
}) {
  return (
    <Panel>
      <h2 className="text-base font-black">신고 관리</h2>
      <div className="mt-4 grid gap-3">
        {reports.length === 0 ? (
          <p className="text-sm text-[#777777]">접수된 신고가 없습니다.</p>
        ) : (
          reports.map((report) => (
            <article className="rounded-md border border-[#eeeeee] p-4" key={report.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-black">
                    {report.target_author_name} · {report.reason}
                  </p>
                  <p className="mt-1 text-sm text-[#777777]">
                    신고자 {report.reporter_name ?? "-"} · {boardLabels[report.board] ?? report.board} #
                    {report.post_id} · {formatPostTime(report.created_at)}
                  </p>
                  {report.details ? (
                    <p className="mt-2 rounded-md bg-[#fafafa] p-3 text-sm text-[#555555]">
                      {report.details}
                    </p>
                  ) : null}
                </div>
                <span className="rounded-sm bg-[#fff5f3] px-2 py-1 text-xs font-bold text-[#c62917]">
                  {reportStatusLabels[report.status]}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <ActionButton onClick={() => onStatusChange(report, "reviewing")} tone="gray">
                  검토중
                </ActionButton>
                <ActionButton onClick={() => onStatusChange(report, "resolved")}>
                  처리완료
                </ActionButton>
                <ActionButton onClick={() => onStatusChange(report, "rejected")} tone="gray">
                  기각
                </ActionButton>
              </div>
            </article>
          ))
        )}
      </div>
    </Panel>
  );
}

function LogsPanel({ logs }: { logs: AdminLogItem[] }) {
  return (
    <Panel>
      <h2 className="text-base font-black">운영 로그</h2>
      <SimpleList
        empty="운영 로그가 없습니다."
        items={logs.map((log) => ({
          id: log.id,
          main: `${log.action} · ${log.target_type} ${log.target_id}`,
          sub: `${log.admin_name ?? "system"} · ${formatPostTime(log.created_at)}${
            log.detail ? ` · ${log.detail}` : ""
          }`,
        }))}
      />
    </Panel>
  );
}

function SimpleList({
  empty,
  items,
}: {
  empty: string;
  items: Array<{ id: number; main: string; sub: string }>;
}) {
  if (items.length === 0) {
    return <p className="mt-4 text-sm text-[#777777]">{empty}</p>;
  }

  return (
    <ol className="mt-4 divide-y divide-[#eeeeee]">
      {items.map((item) => (
        <li className="py-3" key={item.id}>
          <p className="font-bold text-[#333333]">{item.main}</p>
          <p className="mt-1 text-sm text-[#888888]">{item.sub}</p>
        </li>
      ))}
    </ol>
  );
}

function ActionButton({
  children,
  onClick,
  tone = "red",
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone?: "red" | "gray";
}) {
  return (
    <button
      className={`h-9 rounded-md px-4 text-sm font-bold ${
        tone === "red"
          ? "bg-[#c62917] !text-white hover:bg-[#ae2112]"
          : "border border-[#dedede] bg-white text-[#555555] hover:bg-[#fafafa]"
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
