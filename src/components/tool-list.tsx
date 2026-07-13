import Link from "next/link";
import { tools, type Audience } from "@/data/tools";
const audienceLabel = (items: Audience[]) => items.length === 2 ? "ライバー向け / リスナー向け" : items[0] === "liver" ? "ライバー向け" : "リスナー向け";
export function ToolList({ audience }: { audience: Audience }) {
  return <div className="tool-grid">{tools.filter(tool => tool.audiences.includes(audience)).map(tool => <article className={`tool-card ${tool.status}`} key={tool.id}><div className="card-top"><span className="audience">{audienceLabel(tool.audiences)}</span><span className="status">{tool.status === "available" ? "使えます" : "開発中"}</span></div><h3>{tool.name}</h3><p>{tool.description}</p>{tool.href ? <Link className="button" href={tool.href}>使ってみる</Link> : <span className="disabled-button" aria-disabled="true">もう少しお待ちください</span>}</article>)}</div>;
}
