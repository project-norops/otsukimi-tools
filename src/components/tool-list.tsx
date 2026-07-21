import Image from "next/image";
import Link from "next/link";
import { homeTools, type Audience } from "@/data/tools";

const audienceLabel: Record<Audience, string> = {
  liver: "ライバー",
  listener: "リスナー",
};

const cardCharacters = [
  { id: "maguro", src: "/brand/characters/maguro.png" },
  { id: "ebi", src: "/brand/characters/ebi.png" },
  { id: "salmon", src: "/brand/characters/salmon.png" },
  { id: "tamago", src: "/brand/characters/tamago.png" },
] as const;

export function ToolList() {
  return (
    <div className="tool-grid">
      {homeTools.map((tool, index) => {
        const character = cardCharacters[index % cardCharacters.length];
        return <article className={`tool-card tool-${tool.id} character-${character.id}`} key={tool.id}>
          <div className="card-top">
            <span className="status">使えます</span>
            <span className="audience">
              {tool.audiences.map((audience) => audienceLabel[audience]).join("・")}向け
            </span>
          </div>
          <h3><Image className="tool-card-icon" src={character.src} width={48} height={48} alt="" unoptimized /><span>{tool.name}</span></h3>
          <p>{tool.description}</p>
          <Link className="button" href={tool.href!}>使ってみる</Link>
        </article>;
      })}
    </div>
  );
}
