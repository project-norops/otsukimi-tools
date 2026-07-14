import type { Metadata } from "next";
import { IconRingTool } from "@/components/icon-ring-tool";

export const metadata: Metadata = { title: "アイコンリング装着ツール", description: "アイコン画像に透過PNGリングを重ね、513×513pxで保存できます。" };
export default function IconRingPage() { return <IconRingTool />; }
