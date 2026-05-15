"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  authStorageKey,
  nicknameByEmailStorageKey,
  nicknameStorageKey,
  userProfileStorageKey,
} from "../auth-link";
import {
  getMyMarketPosts,
  getReceivedPurchaseRequests,
  getSentPurchaseRequests,
  updatePurchaseRequestStatus,
  type MarketPostResponse,
  type MarketPurchaseRequestResponse,
} from "../lib/api";
import { formatPostTime } from "../lib/time";
import { localStorageChangedEvent, notifyLocalStorageChanged, safeJsonParse } from "../storage";

type ActiveTab = "profile" | "account" | "sent" | "received" | "sales";

type UserProfile = {
  email: string;
  major: string;
  nickname: string;
  userId: string;
};

type AccountInfo = {
  bankName: string;
  accountNumber: string;
};

const accountStorageKey = "campus-board-account-info";

const emptyProfile: UserProfile = {
  email: "",
  major: "",
  nickname: "",
  userId: "",
};

const emptyAccountInfo: AccountInfo = {
  bankName: "",
  accountNumber: "",
};

const statusLabels: Record<MarketPurchaseRequestResponse["status"], string> = {
  requested: "요청됨",
  accepted: "수락됨",
  rejected: "거절됨",
  completed: "거래완료",
};

function getStoredProfile() {
  if (typeof window === "undefined") return emptyProfile;

  const savedProfile = safeJsonParse<UserProfile | null>(
    window.localStorage.getItem(userProfileStorageKey),
    null,
  );

  return (
    savedProfile ?? {
      ...emptyProfile,
      nickname: window.localStorage.getItem(nicknameStorageKey) ?? "",
      userId: window.localStorage.getItem(authStorageKey) ?? "",
    }
  );
}

function getStoredAccountInfo() {
  if (typeof window === "undefined") return emptyAccountInfo;

  return safeJsonParse<AccountInfo | null>(
    window.localStorage.getItem(accountStorageKey),
    null,
  ) ?? emptyAccountInfo;
}

export default function MyPageClient() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("profile");
  const [profile, setProfile] = useState<UserProfile>(getStoredProfile);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<UserProfile>(getStoredProfile);
  const [accountInfo, setAccountInfo] = useState<AccountInfo>(getStoredAccountInfo);
  const [bankName, setBankName] = useState(() => getStoredAccountInfo().bankName);
  const [accountNumber, setAccountNumber] = useState(
    () => getStoredAccountInfo().accountNumber,
  );
  const [sentRequests, setSentRequests] = useState<MarketPurchaseRequestResponse[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<MarketPurchaseRequestResponse[]>([]);
  const [mySales, setMySales] = useState<MarketPostResponse[]>([]);
  const [tradeError, setTradeError] = useState("");

  const refreshTradeData = () => {
    setTradeError("");
    Promise.all([
      getSentPurchaseRequests(),
      getReceivedPurchaseRequests(),
      getMyMarketPosts(),
    ])
      .then(([sent, received, sales]) => {
        setSentRequests(sent);
        setReceivedRequests(received);
        setMySales(sales);
      })
      .catch(() => {
        setTradeError("로그인 후 거래 정보를 확인할 수 있습니다.");
      });
  };

  useEffect(() => {
    const refresh = () => {
      const next = getStoredProfile();
      setProfile(next);
      setProfileForm(next);
    };

    queueMicrotask(refreshTradeData);
    window.addEventListener("storage", refresh);
    window.addEventListener(localStorageChangedEvent, refresh);
    window.addEventListener("pageshow", refreshTradeData);
    window.addEventListener("focus", refreshTradeData);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(localStorageChangedEvent, refresh);
      window.removeEventListener("pageshow", refreshTradeData);
      window.removeEventListener("focus", refreshTradeData);
    };
  }, []);

  const handleSaveAccount = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextAccountInfo = { accountNumber, bankName };
    window.localStorage.setItem(accountStorageKey, JSON.stringify(nextAccountInfo));
    setAccountInfo(nextAccountInfo);
    notifyLocalStorageChanged();
  };

  const handleSaveProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextProfile = {
      email: profileForm.email.trim(),
      major: profileForm.major.trim(),
      nickname: profileForm.nickname.trim(),
      userId: profileForm.userId.trim(),
    };

    window.localStorage.setItem(userProfileStorageKey, JSON.stringify(nextProfile));
    window.localStorage.setItem(authStorageKey, nextProfile.userId);
    window.localStorage.setItem(nicknameStorageKey, nextProfile.nickname);

    if (nextProfile.email) {
      const savedNicknames = safeJsonParse<Record<string, string>>(
        window.localStorage.getItem(nicknameByEmailStorageKey),
        {},
      );

      window.localStorage.setItem(
        nicknameByEmailStorageKey,
        JSON.stringify({ ...savedNicknames, [nextProfile.email]: nextProfile.nickname }),
      );
    }

    notifyLocalStorageChanged();
    setProfile(nextProfile);
    setProfileForm(nextProfile);
    setIsEditingProfile(false);
  };

  const handleUpdateRequest = async (
    requestId: number,
    status: "accepted" | "rejected" | "completed",
  ) => {
    try {
      const updated = await updatePurchaseRequestStatus(requestId, status);
      setReceivedRequests((current) =>
        current.map((request) => (request.id === requestId ? updated : request)),
      );
    } catch {
      setTradeError("요청 상태를 변경할 수 없습니다.");
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f5f5] px-4 py-8 text-[#222222]">
      <section className="mx-auto max-w-4xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-[#c62917]">마이페이지</p>
            <h1 className="mt-1 text-2xl font-black">
              {profile.nickname || "내 정보"}
            </h1>
          </div>
          <Link
            className="rounded-md border border-[#dedede] bg-white px-4 py-2 text-sm font-bold text-[#555555] hover:bg-[#fafafa]"
            href="/"
          >
            게시판으로 돌아가기
          </Link>
        </div>

        <div className="overflow-hidden rounded-md border border-[#dedede] bg-white">
          <div className="grid border-b border-[#eeeeee] sm:grid-cols-5">
            <TabButton active={activeTab === "profile"} onClick={() => setActiveTab("profile")}>
              내 정보
            </TabButton>
            <TabButton active={activeTab === "account"} onClick={() => setActiveTab("account")}>
              계좌정보
            </TabButton>
            <TabButton active={activeTab === "sent"} onClick={() => setActiveTab("sent")}>
              보낸 요청
            </TabButton>
            <TabButton active={activeTab === "received"} onClick={() => setActiveTab("received")}>
              받은 요청
            </TabButton>
            <TabButton active={activeTab === "sales"} onClick={() => setActiveTab("sales")}>
              내 판매글
            </TabButton>
          </div>

          {activeTab === "profile" ? (
            <ProfilePanel
              isEditing={isEditingProfile}
              onCancel={() => {
                setProfileForm(profile);
                setIsEditingProfile(false);
              }}
              onEdit={() => {
                setProfileForm(profile);
                setIsEditingProfile(true);
              }}
              onSave={handleSaveProfile}
              profile={profile}
              profileForm={profileForm}
              setProfileForm={setProfileForm}
            />
          ) : null}

          {activeTab === "account" ? (
            <AccountPanel
              accountInfo={accountInfo}
              accountNumber={accountNumber}
              bankName={bankName}
              onAccountNumberChange={setAccountNumber}
              onBankNameChange={setBankName}
              onSave={handleSaveAccount}
            />
          ) : null}

          {activeTab === "sent" ? (
            <TradePanel
              emptyText="보낸 구매 요청이 없습니다."
              error={tradeError}
              requests={sentRequests}
              type="sent"
            />
          ) : null}

          {activeTab === "received" ? (
            <TradePanel
              emptyText="받은 구매 요청이 없습니다."
              error={tradeError}
              onUpdate={handleUpdateRequest}
              requests={receivedRequests}
              type="received"
            />
          ) : null}

          {activeTab === "sales" ? (
            <SalesPanel error={tradeError} posts={mySales} />
          ) : null}
        </div>
      </section>
    </main>
  );
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={`px-4 py-3 text-sm font-bold ${
        active ? "bg-[#fff5f3] text-[#c62917]" : "text-[#555555] hover:bg-[#fafafa]"
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function ProfilePanel({
  isEditing,
  onCancel,
  onEdit,
  onSave,
  profile,
  profileForm,
  setProfileForm,
}: {
  isEditing: boolean;
  onCancel: () => void;
  onEdit: () => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  profile: UserProfile;
  profileForm: UserProfile;
  setProfileForm: React.Dispatch<React.SetStateAction<UserProfile>>;
}) {
  return (
    <div className="p-5">
      {isEditing ? (
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSave}>
          <ProfileInput
            label="아이디"
            onChange={(value) => setProfileForm((current) => ({ ...current, userId: value }))}
            value={profileForm.userId}
          />
          <ProfileInput
            label="닉네임"
            onChange={(value) => setProfileForm((current) => ({ ...current, nickname: value }))}
            value={profileForm.nickname}
          />
          <ProfileInput
            label="이메일"
            onChange={(value) => setProfileForm((current) => ({ ...current, email: value }))}
            type="email"
            value={profileForm.email}
          />
          <ProfileInput
            label="학과"
            onChange={(value) => setProfileForm((current) => ({ ...current, major: value }))}
            value={profileForm.major}
          />
          <div className="flex gap-2 sm:col-span-2">
            <button className="h-12 flex-1 rounded-md bg-[#c62917] text-sm font-bold !text-white" type="submit">
              저장
            </button>
            <button className="h-12 flex-1 rounded-md border border-[#dedede] bg-white text-sm font-bold text-[#555555]" onClick={onCancel} type="button">
              취소
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="mb-4 flex justify-end">
            <button className="rounded-md bg-[#c62917] px-4 py-2 text-sm font-bold !text-white" onClick={onEdit} type="button">
              수정
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoItem label="아이디" value={profile.userId || "-"} />
            <InfoItem label="닉네임" value={profile.nickname || "-"} />
            <InfoItem label="이메일" value={profile.email || "-"} />
            <InfoItem label="학과" value={profile.major || "-"} />
          </div>
        </>
      )}
    </div>
  );
}

function AccountPanel({
  accountInfo,
  accountNumber,
  bankName,
  onAccountNumberChange,
  onBankNameChange,
  onSave,
}: {
  accountInfo: AccountInfo;
  accountNumber: string;
  bankName: string;
  onAccountNumberChange: (value: string) => void;
  onBankNameChange: (value: string) => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="p-5">
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSave}>
        <ProfileInput label="은행명" onChange={onBankNameChange} value={bankName} />
        <ProfileInput label="계좌번호" onChange={onAccountNumberChange} value={accountNumber} />
        <button className="h-12 rounded-md bg-[#c62917] text-sm font-bold !text-white sm:col-span-2" type="submit">
          계좌정보 저장
        </button>
      </form>

      {accountInfo.bankName || accountInfo.accountNumber ? (
        <div className="mt-5 grid gap-3 rounded-md bg-[#fafafa] p-4 sm:grid-cols-2">
          <InfoItem label="은행명" value={accountInfo.bankName || "-"} />
          <InfoItem label="계좌번호" value={accountInfo.accountNumber || "-"} />
        </div>
      ) : null}
    </div>
  );
}

function TradePanel({
  emptyText,
  error,
  onUpdate,
  requests,
  type,
}: {
  emptyText: string;
  error: string;
  onUpdate?: (requestId: number, status: "accepted" | "rejected" | "completed") => void;
  requests: MarketPurchaseRequestResponse[];
  type: "sent" | "received";
}) {
  return (
    <div className="space-y-3 p-5">
      {error ? <p className="rounded-md bg-[#fff5f3] px-3 py-2 text-sm font-bold text-[#c62917]">{error}</p> : null}
      {requests.length === 0 ? (
        <p className="rounded-md border border-[#eeeeee] p-4 text-sm text-[#777777]">{emptyText}</p>
      ) : (
        requests.map((request) => (
          <article className="rounded-md border border-[#eeeeee] p-4" key={request.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Link className="font-black text-[#333333] hover:text-[#c62917]" href={`/posts/${request.post_id}?board=market`}>
                  {request.post_title}
                </Link>
                <p className="mt-1 text-sm text-[#777777]">
                  {request.post_price.toLocaleString("ko-KR")}원 · {formatPostTime(request.created_at)}
                </p>
              </div>
              <span className="rounded-sm bg-[#fff5f3] px-2 py-1 text-xs font-bold text-[#c62917]">
                {statusLabels[request.status]}
              </span>
            </div>
            <p className="mt-3 text-sm text-[#555555]">
              {type === "sent" ? `판매자: ${request.seller_name}` : `구매자: ${request.buyer_name}`}
            </p>
            <p className="mt-2 whitespace-pre-line rounded-md bg-[#fafafa] p-3 text-sm leading-6 text-[#444444]">
              {request.message}
            </p>
            {type === "received" && request.status === "requested" && onUpdate ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <ActionButton onClick={() => onUpdate(request.id, "accepted")}>수락</ActionButton>
                <ActionButton onClick={() => onUpdate(request.id, "rejected")} tone="gray">거절</ActionButton>
              </div>
            ) : null}
            {type === "received" && request.status === "accepted" && onUpdate ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <ActionButton onClick={() => onUpdate(request.id, "completed")}>거래완료</ActionButton>
              </div>
            ) : null}
          </article>
        ))
      )}
    </div>
  );
}

function SalesPanel({ error, posts }: { error: string; posts: MarketPostResponse[] }) {
  return (
    <div className="space-y-3 p-5">
      {error ? <p className="rounded-md bg-[#fff5f3] px-3 py-2 text-sm font-bold text-[#c62917]">{error}</p> : null}
      {posts.length === 0 ? (
        <p className="rounded-md border border-[#eeeeee] p-4 text-sm text-[#777777]">올린 판매글이 없습니다.</p>
      ) : (
        posts.map((post) => (
          <Link
            className="block rounded-md border border-[#eeeeee] p-4 hover:bg-[#fafafa]"
            href={`/posts/${post.id}?board=market`}
            key={post.id}
          >
            <p className="font-black text-[#333333]">{post.title}</p>
            <p className="mt-1 text-sm text-[#777777]">
              {post.price.toLocaleString("ko-KR")}원 · {post.market_status === "available" ? "판매중" : post.market_status === "reserved" ? "예약중" : "거래완료"} · 좋아요 {post.like_count}
            </p>
          </Link>
        ))
      )}
    </div>
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

function ProfileInput({
  label,
  onChange,
  type = "text",
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  type?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-[#333333]">{label}</span>
      <input
        className="h-12 w-full rounded-md border border-[#d9d9d9] px-3 text-sm outline-none placeholder:text-[#aaaaaa] focus:border-[#c62917] focus:ring-2 focus:ring-[#c62917]/10"
        onChange={(event) => onChange(event.target.value)}
        required
        type={type}
        value={value}
      />
    </label>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#eeeeee] bg-[#fafafa] p-4">
      <p className="text-xs font-bold text-[#888888]">{label}</p>
      <p className="mt-2 break-all text-sm font-bold text-[#333333]">{value}</p>
    </div>
  );
}
