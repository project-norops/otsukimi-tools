import Link from "next/link";
export function SiteHeader() { return <header className="site-header"><Link className="brand" href="/">おつきみつーるず</Link><nav><Link href="/liver">ライバー向け</Link><Link href="/listener">リスナー向け</Link></nav></header>; }
