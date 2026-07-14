import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { FanTool } from "@/components/fan-tool";
import { fanTools, type FanToolId } from "@/lib/fan-tools";

type Props = { params: Promise<{ fanTool: string }> };

export function generateStaticParams() {
  return Object.keys(fanTools).map((fanTool) => ({ fanTool }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { fanTool } = await params;
  const config = fanTools[fanTool as FanToolId];
  return config ? { title: config.name, description: config.description } : {};
}

export default async function FanToolPage({ params }: Props) {
  const { fanTool } = await params;
  const config = fanTools[fanTool as FanToolId];
  if (!config) notFound();
  return <FanTool config={config} />;
}
