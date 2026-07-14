import Link from "next/link";
import { availableTools } from "@/data/tools";
export function ToolList() {
  return <div className="tool-grid">{availableTools.map(tool => <article className="tool-card" key={tool.id}><div className="card-top"><span className="status">使えます</span></div><h3>{tool.name}</h3><p>{tool.description}</p><Link className="button" href={tool.href!}>使ってみる</Link></article>)}</div>;
}
