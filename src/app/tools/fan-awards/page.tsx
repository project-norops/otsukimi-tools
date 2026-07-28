import type { Metadata } from "next";
import { FanGuildSuite } from "@/components/fan-guild-suite";
export const metadata: Metadata = { title: "月末ファン表彰式", description: "枠を支えてくれたリスナーへ、特別な表彰カードを作れます。" };
export default function FanAwardsPage() { return <FanGuildSuite initialMode="awards" />; }
