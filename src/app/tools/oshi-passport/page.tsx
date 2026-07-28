import type { Metadata } from "next";
import { FanGuildSuite } from "@/components/fan-guild-suite";
export const metadata: Metadata = { title: "推し枠パスポート", description: "思い出ミッションでグレードが進化する、IRIAM向け推し枠パスポートを作れます。" };
export default function OshiPassportPage() { return <FanGuildSuite initialMode="passport" />; }
