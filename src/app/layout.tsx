import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
export const metadata: Metadata = { title: { default: "おつきみつーるず", template: "%s | おつきみつーるず" }, description: "ライバーとリスナーのための、ちいさくて便利なツール置き場", manifest: "/manifest.webmanifest", appleWebApp: { capable: true, title: "おつきみ" }, icons: { icon: "/icon.svg", apple: "/icon.svg" } };
export const viewport: Viewport = { themeColor: "#FF6B91", width: "device-width", initialScale: 1 };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ja"><body><SiteHeader /><main>{children}</main><footer><p>ホーム画面に追加すると、アプリのようにすぐ使えます。</p><p>© おつきみつーるず</p></footer></body></html>; }
