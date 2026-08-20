import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "アクセス解析とプライバシー",
  description: "すしうさどっとねっとの匿名アクセス解析と、ツール内データの取り扱いについて説明します。",
};

export default function PrivacyPage() {
  return (
    <article className="legal-page">
      <header>
        <p className="eyebrow">Privacy</p>
        <h1>アクセス解析とプライバシー</h1>
        <p>すしうさどっとねっとは、利用状況を把握して改善するため、Vercel Web Analyticsによる匿名のアクセス統計を使用します。</p>
      </header>

      <section>
        <h2>取得する情報</h2>
        <p>閲覧したページ、参照元、閲覧日時、国・地域、端末種別、OS、ブラウザなどの匿名集計に必要な情報です。第三者Cookieは使用せず、個人を特定する目的では利用しません。</p>
      </section>

      <section>
        <h2>取得しない情報</h2>
        <p>IRIAMランク管理カレンダーなどへ入力した計画、ランク、スコア、メモ、ライバー名はアクセス解析へ送信しません。ツール内で端末保存と案内している内容は、引き続き利用者の端末内だけに保存されます。</p>
      </section>

      <section>
        <h2>利用目的</h2>
        <p>ページごとの匿名訪問者数と閲覧数を確認し、実際に利用されているツールの改善、表示不具合の把握、提供継続の判断に使用します。広告目的の個人追跡や、異なるサイトをまたぐ行動追跡には使用しません。</p>
      </section>

      <section>
        <h2>現在確認できる範囲</h2>
        <p>無料プランではページの匿名訪問者数と閲覧数を確認します。計画保存、共有URL、PNG保存、カレンダー追加などの操作内容や入力値は計測しません。</p>
      </section>

      <p><small>最終更新: 2026年8月20日</small></p>
    </article>
  );
}
