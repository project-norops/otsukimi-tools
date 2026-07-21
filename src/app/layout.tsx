import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: {
    default: "すしうさどっとねっと",
    template: "%s | すしうさどっとねっと",
  },
  description:
    "IRIAMライバーや小規模配信者の活動に役立つ、スマホで使える無料ツールとコンテンツ。",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "すしうさどっとねっと" },
  icons: {
    icon: [
      { url: "/brand/icons/favicon.ico" },
      { url: "/brand/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/brand/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#16473D",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>
        <SiteHeader />
        <main>{children}</main>
        <footer>
          <strong>すしうさどっとねっと</strong>
          <p>配信活動を、少し便利に、少し楽しく。</p>
          <p>キャラクター制作　月乃美玲</p>
          <p>© すしうさどっとねっと</p>
        </footer>
      </body>
    </html>
  );
}
