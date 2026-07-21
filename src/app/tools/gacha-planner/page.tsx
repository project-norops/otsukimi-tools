import type { Metadata } from "next";
import { GachaPlanner } from "@/components/gacha-planner";
export const metadata: Metadata = { title: "ガチャ設定シミュレーター", description: "景品と確率からポイント・原価・収支・在庫リスクを確認し、リスナー向け告知PNGも自動生成できます" };
export default function GachaPlannerPage() { return <GachaPlanner />; }
