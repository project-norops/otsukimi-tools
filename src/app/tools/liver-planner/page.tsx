import type { Metadata } from "next";
import { LiverPlanner } from "@/components/liver-planner";
export const metadata: Metadata = { title: "ライバー手帳（仮）", description: "配信とライバー活動の予定・タスクをまとめる手帳です。" };
export default function LiverPlannerPage() { return <LiverPlanner />; }
