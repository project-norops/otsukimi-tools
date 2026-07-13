import type { Metadata } from "next";
import { RankPlanner } from "@/components/rank-planner";
export const metadata: Metadata = { title: "ランク計画カレンダー", description: "3か月先までのIRIAMランク推移を計画する非公式シミュレーター" };
export default function RankCalendarPage() { return <RankPlanner />; }
