import Link from "next/link";
import { memoryExperiences } from "@/data/tools";

const memoryDetails = {
  "oshi-passport": { number: "01", verb: "育てる", audience: "全リスナー向け", flow: "ライバーが作成 → リスナーが進める", symbol: "✦" },
  "fan-awards": { number: "02", verb: "称える", audience: "特定リスナー向け", flow: "ライバーから一人へ贈る", symbol: "❧" },
  "project-relay": { number: "03", verb: "つながる", audience: "全リスナー向け", flow: "みんなで見るリレー表", symbol: "∞" },
  "reward-board": { number: "04", verb: "届ける", audience: "ライバー作業用", flow: "公開しない進行管理", symbol: "◇" },
} as const;

export function MemoryList() {
  return <div className="memory-grid">
    {memoryExperiences.map((experience) => {
      const detail = memoryDetails[experience.id as keyof typeof memoryDetails];
      return <article className={`memory-card memory-${experience.id}`} key={experience.id}>
        <div className="memory-card-shine" />
        <div className="memory-card-top"><span>{detail.number} / {detail.verb}</span><b>{detail.symbol}</b></div>
        <div className="memory-card-copy"><small>{detail.audience}</small><h3>{experience.name}</h3><p>{experience.description}</p></div>
        <div className="memory-card-footer"><span>{detail.flow}</span><Link href={experience.href!}>体験をひらく <b>→</b></Link></div>
      </article>;
    })}
  </div>;
}
