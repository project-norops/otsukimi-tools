import type { Metadata } from "next";
import { VideoClipper } from "@/components/video-clipper";

export const metadata: Metadata = { title: "10秒動画メイカー", description: "「ドドン！」で始めて「チーン！」で終わる、3ステップ動画作成ツール。" };
export default function ClipperPage() { return <VideoClipper />; }
