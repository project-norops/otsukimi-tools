"use client";

import { useRef, useState } from "react";
import { createShareText, FAN_MARK, hashSeed, selectFanResult, type FanResult, type FanToolConfig } from "@/lib/fan-tools";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function wrapCanvasText(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  let line = "";
  for (const char of text) {
    if (context.measureText(line + char).width > maxWidth && line) {
      lines.push(line);
      line = char;
    } else line += char;
  }
  if (line) lines.push(line);
  return lines;
}

export function FanTool({ config }: { config: FanToolConfig }) {
  const [name, setName] = useState("");
  const [result, setResult] = useState<FanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [notice, setNotice] = useState("");
  const runCount = useRef(0);

  async function run() {
    const cleanName = name.trim().slice(0, 40);
    if (config.needsName && !cleanName) {
      setNotice("リスナー名を入力してください。");
      return;
    }
    setNotice("");
    setResult(null);
    setLoading(true);
    for (const line of config.loading) {
      setLoadingText(line);
      await wait(430);
    }
    runCount.current += 1;
    const seed = config.needsName
      ? hashSeed(`${config.id}:${cleanName.normalize("NFKC").toLowerCase()}`)
      : hashSeed(`${config.id}:${Date.now()}:${runCount.current}:${Math.random()}`);
    setResult(selectFanResult(config, seed));
    setLoading(false);
  }

  const shareText = result ? createShareText(config, result, name.trim().slice(0, 40)) : "";

  async function copyResult() {
    try {
      await navigator.clipboard.writeText(shareText);
      setNotice("結果をコピーしました。");
    } catch {
      setNotice("コピーできませんでした。結果文を選択してコピーしてください。");
    }
  }

  function savePng() {
    if (!result) return;
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;
    const context = canvas.getContext("2d");
    if (!context) return;
    const gradient = context.createLinearGradient(0, 0, 1080, 1350);
    gradient.addColorStop(0, "#fff5f8");
    gradient.addColorStop(1, "#f4fff6");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 1080, 1350);
    context.fillStyle = "#ffffff";
    context.beginPath();
    context.roundRect(70, 75, 940, 1200, 48);
    context.fill();
    context.textAlign = "center";
    context.fillStyle = "#d83e68";
    context.font = "700 42px sans-serif";
    context.fillText(config.name, 540, 190);
    context.fillStyle = "#292529";
    context.font = "800 64px sans-serif";
    wrapCanvasText(context, result.title, 830).forEach((line, index) => context.fillText(line, 540, 330 + index * 78));
    context.font = "36px sans-serif";
    const bodyLines = wrapCanvasText(context, result.body, 820);
    bodyLines.forEach((line, index) => context.fillText(line, 540, 535 + index * 58));
    let footerY = Math.max(930, 570 + bodyLines.length * 58);
    if (config.id === "liver-match") {
      context.fillStyle = "#d83e68";
      context.font = "800 56px sans-serif";
      context.fillText(`月乃美玲 ${FAN_MARK}`, 540, footerY);
      footerY += 110;
    }
    context.fillStyle = "#666";
    context.font = "700 32px sans-serif";
    context.fillText("#みてみてみれい", 540, footerY);
    context.font = "26px sans-serif";
    context.fillText("おつきみつーるず", 540, footerY + 65);
    const link = document.createElement("a");
    link.download = `${config.id}-${result.id}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    setNotice("結果カードをPNGで保存しました。");
  }

  return <section className={`fan-shell fan-${config.id}`}>
    <header className="fan-intro">
      <span className="fan-icon" aria-hidden="true">{config.icon}</span>
      <span className="eyebrow">Mirei & Tsukimikko mini content</span>
      <h1>{config.name}</h1>
      <p>{config.description}</p>
    </header>

    <div className="fan-play-card">
      {config.needsName && <label className="fan-name">リスナー名
        <input value={name} onChange={(event) => setName(event.target.value)} maxLength={40} placeholder="例：つきみっこ" autoComplete="nickname" />
        <span className="field-note">名前は診断のseedにだけ使用し、送信・保存しません。同じ名前には同じ結果が表示されます。</span>
      </label>}
      <button className="button fan-main-button" type="button" onClick={run} disabled={loading}>{loading ? "判定中…" : config.action}</button>
      {loading && <div className="fan-loading" role="status"><span aria-hidden="true">{config.icon}</span><p>{loadingText}</p></div>}
      {notice && <p className="fan-notice" role="status">{notice}</p>}
    </div>

    {result && <article className="fan-result" aria-live="polite">
      <span className="fan-result-label">今回の結果</span>
      <h2>{result.title}</h2>
      <p className="fan-result-body">{result.body}</p>
      {result.stats && <dl className="fan-stats">{Object.entries(result.stats).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}%</dd><span><i style={{ width: `${Math.min(value, 100)}%` }} /></span></div>)}</dl>}
      {config.id === "liver-match" && <div className="fan-match"><small>宇宙規模の検索結果</small><strong>月乃美玲 {FAN_MARK}</strong></div>}
      <div className="fan-actions">
        <a className="button" href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noreferrer">Xに投稿する</a>
        <button className="button secondary" type="button" onClick={copyResult}>結果をコピー</button>
        <button className="button secondary" type="button" onClick={savePng}>PNGで保存</button>
      </div>
      <button className="fan-retry" type="button" onClick={run}>{config.needsName ? "同じ名前でもう一度表示" : "もう一度やってみる"}</button>
    </article>}
    <p className="fan-footnote">このコンテンツはファン向けのお遊びです。結果はAIで生成していません。</p>
  </section>;
}
