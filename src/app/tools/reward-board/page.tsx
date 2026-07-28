import type { Metadata } from "next";
import { FanGuildSuite } from "@/components/fan-guild-suite";
export const metadata: Metadata = { title: "返礼・特典かんばん", description: "IRIAM配信の返礼や特典を、未着手からお渡し済みまで端末内で管理できます。" };
export default function RewardBoardPage() { return <FanGuildSuite initialMode="rewards" />; }
