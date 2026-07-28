import Image from "next/image";
import { MemoryList } from "@/components/memory-list";
import { ToolList } from "@/components/tool-list";

const characters = [
  {
    name: "まぐろ",
    src: "/brand/characters/maguro.png",
    profile: "のんびりやさんで優しい性格。みんなの癒し担当。",
  },
  {
    name: "えび",
    src: "/brand/characters/ebi.png",
    profile: "まじめで努力家。ちょっぴり頑固な一面も？",
  },
  {
    name: "たまご",
    src: "/brand/characters/tamago.png",
    profile: "食いしんぼうで明るいムードメーカー。いつも元気いっぱい！",
  },
  {
    name: "さーもん",
    src: "/brand/characters/salmon.png",
    profile: "クールに見えて実は熱血。頼れるしっかり者。",
  },
] as const;

export default function Home() {
  return (
    <>
      <section className="home-hero">
        <div className="home-hero-copy">
          <span className="home-kicker">IRIAMライバー・小規模配信者向け</span>
          <h1>
            配信活動を、
            <br />
            <em>もっと楽しく。</em>
          </h1>
          <p>
            登録なし、スマホですぐ使える。
            <br />
            配信する人と応援する人のための、思い出体験とやさしいツール置き場です。
          </p>
          <div className="hero-actions">
            <a className="button" href="#memories">思い出を残してみる</a>
            <span>すべて無料でお試しいただけます</span>
          </div>
        </div>
        <div className="home-hero-character">
          <span className="character-bubble">いっしょにやってみよ〜</span>
          <Image
            src="/brand/characters/maguro.png"
            width={520}
            height={520}
            alt="まぐろ"
            priority
            unoptimized
          />
        </div>
      </section>

      <section className="home-points" aria-label="サイトの特徴">
        <div><b>登録なし</b><span>開いたらすぐ使えます</span></div>
        <div><b>スマホ中心</b><span>配信の合間にもさっと操作</span></div>
        <div><b>シンプル</b><span>複雑な設定はできるだけ省略</span></div>
      </section>

      <section id="tools" className="home-tools">
        <div className="section-heading">
          <div>
            <span className="eyebrow">available now</span>
            <h2>活動を助けるツール</h2>
            <p>配信準備や日々の作業を、少しだけ軽く。</p>
          </div>
        </div>
        <ToolList />
      </section>

      <section id="memories" className="memory-home" aria-labelledby="memory-heading">
        <div className="memory-home-heading">
          <div><span>FOR MEMORIES</span><h2 id="memory-heading">枠で過ごした時間を、<br/><em>特別なものに。</em></h2></div>
          <p>便利さだけではなく、続けたくなること、贈りたくなること。<br/>ライバーとリスナーの思い出を育てる4つの体験です。</p>
        </div>
        <MemoryList />
      </section>

      <section className="character-section" aria-labelledby="character-heading">
        <div className="character-section-copy">
          <span className="eyebrow">sushiusa friends</span>
          <h2 id="character-heading">すしうさのなかまたち</h2>
          <p>ツールのどこかで、そっとお手伝いします。</p>
        </div>
        <div className="character-list">
          {characters.map((character) => (
            <figure key={character.name}>
              <Image
                src={character.src}
                width={240}
                height={240}
                alt={character.name}
                unoptimized
              />
              <figcaption>
                <b>{character.name}</b>
                <p>{character.profile}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </>
  );
}
