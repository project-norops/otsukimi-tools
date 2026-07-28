import type { Metadata } from "next";
import { FanGuildSuite } from "@/components/fan-guild-suite";
export const metadata: Metadata = { title: "IRIAM企画リレー", description: "参加ライバーと日程を整理し、企画リレーのバトンと告知文を作れます。" };
export default function ProjectRelayPage() { return <FanGuildSuite initialMode="relay" />; }
