import type { Metadata } from "next";
import { RankPlanner } from "@/components/rank-planner";
export const metadata: Metadata = { title: "IRIAMランク管理カレンダー", description: "1〜6か月先までのIRIAMランク推移を計画できる非公式シミュレーター" };
export default function RankCalendarPage() { return <RankPlanner />; }
