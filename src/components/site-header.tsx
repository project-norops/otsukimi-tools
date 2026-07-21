import Image from "next/image";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="すしうさどっとねっと ホーム">
        <Image
          src="/brand/characters/maguro.png"
          width={56}
          height={56}
          alt=""
          priority
          unoptimized
        />
        <span className="brand-wordmark" aria-hidden="true">
          <span>すしうさ</span>
          <span className="brand-wordmark-pink">どっと</span>
          <span className="brand-wordmark-orange">ねっと</span>
        </span>
      </Link>
      <Link className="header-home" href="/#tools">ツール一覧</Link>
    </header>
  );
}
