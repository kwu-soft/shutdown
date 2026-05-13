"use client";

// 마이페이지의 탭 UI와 localStorage 기반 개인 정보/계좌 정보 관리를 담당합니다.
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  authStorageKey,
  nicknameByEmailStorageKey,
  nicknameStorageKey,
  userProfileStorageKey,
} from "../auth-link";
import { localStorageChangedEvent, notifyLocalStorageChanged, safeJsonParse } from "../storage";

type ActiveTab = "profile" | "account";

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

function getStoredProfile() {
  if (typeof window === "undefined") {
    return emptyProfile;
  }

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
  if (typeof window === "undefined") {
    return emptyAccountInfo;
  }

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

  useEffect(() => {
    const refresh = () => {
      const next = getStoredProfile();
      setProfile(next);
      setProfileForm(next);
    };
    window.addEventListener("storage", refresh);
    window.addEventListener(localStorageChangedEvent, refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(localStorageChangedEvent, refresh);
    };
  }, []);
  const [accountInfo, setAccountInfo] =
    useState<AccountInfo>(getStoredAccountInfo);
  const [bankName, setBankName] = useState(() => getStoredAccountInfo().bankName);
  const [accountNumber, setAccountNumber] = useState(
    () => getStoredAccountInfo().accountNumber,
  );

  const handleSaveAccount = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextAccountInfo = {
      accountNumber,
      bankName,
    };

    window.localStorage.setItem(
      accountStorageKey,
      JSON.stringify(nextAccountInfo),
    );
    setAccountInfo(nextAccountInfo);
    notifyLocalStorageChanged();
  };

  const handleStartEditProfile = () => {
    setProfileForm(profile);
    setIsEditingProfile(true);
  };

  const handleCancelEditProfile = () => {
    setProfileForm(profile);
    setIsEditingProfile(false);
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
        JSON.stringify({
          ...savedNicknames,
          [nextProfile.email]: nextProfile.nickname,
        }),
      );
    }

    notifyLocalStorageChanged();
    setProfile(nextProfile);
    setProfileForm(nextProfile);
    setIsEditingProfile(false);
  };

  return (
    <main className="min-h-screen bg-[#f5f5f5] px-4 py-8 text-[#222222]">
      <section className="mx-auto max-w-3xl">
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
          <div className="flex border-b border-[#eeeeee]">
            <button
              className={`flex-1 px-4 py-3 text-sm font-bold ${
                activeTab === "profile"
                  ? "bg-[#fff5f3] text-[#c62917]"
                  : "text-[#555555] hover:bg-[#fafafa]"
              }`}
              onClick={() => setActiveTab("profile")}
              type="button"
            >
              내 정보
            </button>
            <button
              className={`flex-1 px-4 py-3 text-sm font-bold ${
                activeTab === "account"
                  ? "bg-[#fff5f3] text-[#c62917]"
                  : "text-[#555555] hover:bg-[#fafafa]"
              }`}
              onClick={() => setActiveTab("account")}
              type="button"
            >
              계좌정보
            </button>
          </div>

          {activeTab === "profile" ? (
            <div className="p-5">
              {isEditingProfile ? (
                <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSaveProfile}>
                  <ProfileInput
                    label="아이디"
                    onChange={(value) =>
                      setProfileForm((current) => ({
                        ...current,
                        userId: value,
                      }))
                    }
                    value={profileForm.userId}
                  />
                  <ProfileInput
                    label="닉네임"
                    onChange={(value) =>
                      setProfileForm((current) => ({
                        ...current,
                        nickname: value,
                      }))
                    }
                    value={profileForm.nickname}
                  />
                  <ProfileInput
                    label="이메일"
                    onChange={(value) =>
                      setProfileForm((current) => ({
                        ...current,
                        email: value,
                      }))
                    }
                    type="email"
                    value={profileForm.email}
                  />
                  <ProfileInput
                    label="학과"
                    onChange={(value) =>
                      setProfileForm((current) => ({
                        ...current,
                        major: value,
                      }))
                    }
                    value={profileForm.major}
                  />
                  <div className="flex gap-2 sm:col-span-2">
                    <button
                      className="h-12 flex-1 rounded-md bg-[#c62917] text-sm font-bold !text-white transition hover:bg-[#ae2112]"
                      type="submit"
                    >
                      저장
                    </button>
                    <button
                      className="h-12 flex-1 rounded-md border border-[#dedede] bg-white text-sm font-bold text-[#555555] transition hover:bg-[#fafafa]"
                      onClick={handleCancelEditProfile}
                      type="button"
                    >
                      취소
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="mb-4 flex justify-end">
                    <button
                      className="rounded-md bg-[#c62917] px-4 py-2 text-sm font-bold !text-white transition hover:bg-[#ae2112]"
                      onClick={handleStartEditProfile}
                      type="button"
                    >
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
          ) : (
            <div className="p-5">
              <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSaveAccount}>
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-[#333333]">
                    은행명
                  </span>
                  <input
                    className="h-12 w-full rounded-md border border-[#d9d9d9] px-3 text-sm outline-none placeholder:text-[#aaaaaa] focus:border-[#c62917] focus:ring-2 focus:ring-[#c62917]/10"
                    onChange={(event) => setBankName(event.target.value)}
                    placeholder="예: 국민은행"
                    required
                    type="text"
                    value={bankName}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-[#333333]">
                    계좌번호
                  </span>
                  <input
                    className="h-12 w-full rounded-md border border-[#d9d9d9] px-3 text-sm outline-none placeholder:text-[#aaaaaa] focus:border-[#c62917] focus:ring-2 focus:ring-[#c62917]/10"
                    onChange={(event) => setAccountNumber(event.target.value)}
                    placeholder="예: 123456-78-901234"
                    required
                    type="text"
                    value={accountNumber}
                  />
                </label>
                <button
                  className="h-12 rounded-md bg-[#c62917] text-sm font-bold !text-white transition hover:bg-[#ae2112] sm:col-span-2"
                  type="submit"
                >
                  계좌정보 저장
                </button>
              </form>

              {accountInfo.bankName || accountInfo.accountNumber ? (
                <div className="mt-5 grid gap-3 rounded-md bg-[#fafafa] p-4 sm:grid-cols-2">
                  <InfoItem label="은행명" value={accountInfo.bankName} />
                  <InfoItem label="계좌번호" value={accountInfo.accountNumber} />
                </div>
              ) : null}
            </div>
          )}
        </div>
      </section>
    </main>
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
      <span className="mb-2 block text-sm font-bold text-[#333333]">
        {label}
      </span>
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
