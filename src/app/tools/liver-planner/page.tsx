import type { Metadata } from "next";
import { LiverPlanner } from "@/components/liver-planner";
export const metadata: Metadata = { title: "ライバー手帳", description: "配信以外の予定・締切タスクを管理し、ランクカレンダーから週間画像を作れる手帳です。" };
export default function LiverPlannerPage() { return <LiverPlanner />; }
