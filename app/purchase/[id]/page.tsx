import Link from "next/link";
import { notFound } from "next/navigation";
import { allPosts } from "../../community-data";

type PurchasePageProps = {
  params: Promise<{
    id: string;
  }>;
};

const text = {
  title: "구매하기",
  product: "상품명",
  seller: "판매자",
  price: "가격",
  status: "상태",
  confirm: "구매 요청하기",
  back: "게시글로 돌아가기",
  marketBack: "장터게시판으로 돌아가기",
};

export function generateStaticParams() {
  return allPosts
    .filter((post) => post.price && post.statusKey === "available")
    .map((post) => ({
      id: String(post.id),
    }));
}

export default async function PurchasePage({ params }: PurchasePageProps) {
  const { id } = await params;
  const post = allPosts.find((item) => item.id === Number(id));

  if (!post || !post.price || post.statusKey !== "available") {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f5f5f5] px-4 py-8 text-[#222222]">
      <section className="mx-auto max-w-2xl rounded-md border border-[#dedede] bg-white">
        <header className="border-b border-[#eeeeee] px-5 py-4">
          <p className="text-sm font-bold text-[#c62917]">장터게시판</p>
          <h1 className="mt-1 text-2xl font-black">{text.title}</h1>
        </header>

        <div className="space-y-4 px-5 py-5">
          <div className="grid gap-3 rounded-md bg-[#fafafa] p-4 sm:grid-cols-2">
            <InfoItem label={text.product} value={post.title} />
            <InfoItem label={text.seller} value={post.author} />
            <InfoItem label={text.price} value={post.price} />
            <InfoItem label={text.status} value={post.status ?? "-"} />
          </div>

          <p className="rounded-md border border-[#eeeeee] p-4 text-sm leading-6 text-[#666666]">
            구매 요청을 누르면 판매자에게 구매 의사를 전달하는 흐름으로 이어질
            수 있습니다. 현재는 화면 이동과 확인 UI만 준비되어 있습니다.
          </p>

          <button
            className="h-12 w-full rounded-md bg-[#c62917] text-sm font-bold !text-white transition hover:bg-[#ae2112]"
            type="button"
          >
            {text.confirm}
          </button>

          <div className="flex flex-wrap gap-2">
            <Link
              className="inline-flex h-10 items-center rounded-md border border-[#dedede] px-4 text-sm font-bold text-[#555555] hover:bg-[#fafafa]"
              href={`/posts/${post.id}`}
            >
              {text.back}
            </Link>
            <Link
              className="inline-flex h-10 items-center rounded-md border border-[#dedede] px-4 text-sm font-bold text-[#555555] hover:bg-[#fafafa]"
              href="/market"
            >
              {text.marketBack}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-[#888888]">{label}</p>
      <p className="mt-1 break-all text-sm font-black text-[#333333]">
        {value}
      </p>
    </div>
  );
}
