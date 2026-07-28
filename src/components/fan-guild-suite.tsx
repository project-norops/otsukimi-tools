"use client";

import Link from "next/link";
import { type CSSProperties, useEffect, useMemo, useState } from "react";
import {
  FAN_GUILD_STORAGE_KEY,
  getNextPassportGrade,
  getPassportGrade,
  PASSPORT_GRADES,
  REWARD_STATUS_LABELS,
  stampsUntilNextGrade,
  summarizeRewards,
  type GuildMode,
  type PassportGrade,
  type RewardStatus,
} from "@/lib/fan-guild";

const MODE_META: Record<GuildMode, { label: string; short: string; href: string; mark: string }> = {
  passport: { label: "推し枠パスポート", short: "育てる", href: "/tools/oshi-passport", mark: "P" },
  awards: { label: "月末ファン表彰式", short: "称える", href: "/tools/fan-awards", mark: "A" },
  relay: { label: "企画リレー", short: "つながる", href: "/tools/project-relay", mark: "R" },
  rewards: { label: "返礼かんばん", short: "届ける", href: "/tools/reward-board", mark: "G" },
};

type Mission = { id: string; label: string; done: boolean };
type RelayMember = { id: string; name: string; date: string; done: boolean };
type RewardItem = { id: string; listener: string; reward: string; due: string; status: RewardStatus };
type GuildState = {
  hostName: string;
  listenerName: string;
  passportTitle: string;
  missions: Mission[];
  awardRecipient: string;
  awardTitle: string;
  awardMessage: string;
  awardTheme: "rose" | "night" | "mint";
  relayTitle: string;
  relayTag: string;
  relayMembers: RelayMember[];
  rewards: RewardItem[];
};

const defaults: GuildState = {
  hostName: "月見みれい",
  listenerName: "うさぎさん",
  passportTitle: "月夜のすしうさ王国",
  missions: [
    "はじめましての挨拶", "好きなものを教える", "合言葉を見つける", "2回目のただいま",
    "おすすめをひとつ交換", "企画に参加する", "名言を目撃する", "月末を一緒に迎える",
    "誰かをあたたかく迎える", "思い出をひとつ増やす",
  ].map((label, index) => ({ id: `mission-${index}`, label, done: index < 4 })),
  awardRecipient: "うさぎさん",
  awardTitle: "深夜の守護者賞",
  awardMessage: "眠たい夜も、あなたのひとことが枠を明るくしてくれました。いつもありがとう。",
  awardTheme: "night",
  relayTitle: "夏色ボイスリレー",
  relayTag: "#IRIAM夏色リレー",
  relayMembers: [
    { id: "relay-1", name: "月見みれい", date: "7/29", done: true },
    { id: "relay-2", name: "星乃しおり", date: "7/30", done: false },
    { id: "relay-3", name: "甘羽ここあ", date: "7/31", done: false },
  ],
  rewards: [
    { id: "reward-1", listener: "うさぎさん", reward: "お礼ボイス", due: "2026-08-03", status: "making" },
    { id: "reward-2", listener: "ねこさん", reward: "表彰カード", due: "2026-07-31", status: "checking" },
    { id: "reward-3", listener: "くらげさん", reward: "アイコンリング", due: "2026-08-05", status: "todo" },
  ],
};

const gradeStyle = (grade: PassportGrade) => ({
  "--grade-deep": grade.colors[0],
  "--grade-main": grade.colors[1],
  "--grade-light": grade.colors[2],
}) as CSSProperties;

function safeFileName(value: string) {
  return value.replace(/[\\/:*?"<>|]/g, "-").trim() || "card";
}

function drawWrappedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines: number) {
  let line = "";
  let row = 0;
  for (const char of [...text]) {
    const next = line + char;
    if (line && ctx.measureText(next).width > maxWidth) {
      ctx.fillText(line, x, y + row * lineHeight);
      line = char;
      row += 1;
      if (row >= maxLines) return;
    } else line = next;
  }
  if (line && row < maxLines) ctx.fillText(line, x, y + row * lineHeight);
}

async function downloadCard(kind: "passport" | "award", state: GuildState, grade: PassportGrade) {
  await document.fonts.ready;
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 675;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const colors = kind === "passport"
    ? grade.colors
    : state.awardTheme === "rose" ? ["#541f36", "#d66b91", "#ffe0ea"]
      : state.awardTheme === "mint" ? ["#103d3b", "#49b9a7", "#d9fff5"] : ["#171536", "#6557c8", "#eee8ff"];
  const bg = ctx.createLinearGradient(0, 0, 1200, 675);
  bg.addColorStop(0, colors[0]); bg.addColorStop(.58, colors[1]); bg.addColorStop(1, colors[2]);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 1200, 675);
  for (let i = 0; i < 44; i += 1) {
    const x = (i * 197) % 1200; const y = (i * 113) % 675; const size = i % 5 === 0 ? 4 : 2;
    ctx.fillStyle = `rgba(255,255,255,${.18 + (i % 4) * .08})`;
    ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
  }
  ctx.strokeStyle = "rgba(255,255,255,.72)"; ctx.lineWidth = 2; ctx.strokeRect(28, 28, 1144, 619);
  ctx.strokeStyle = "rgba(255,255,255,.24)"; ctx.strokeRect(41, 41, 1118, 593);
  ctx.fillStyle = "rgba(255,255,255,.13)"; ctx.beginPath(); ctx.arc(1060, 92, 150, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.textBaseline = "alphabetic";
  if (kind === "passport") {
    ctx.font = "800 25px 'Noto Sans JP', sans-serif"; ctx.fillText("OSHIWAKU PASSPORT", 72, 92);
    ctx.font = "900 60px 'Noto Sans JP', sans-serif"; ctx.fillText(state.passportTitle.slice(0, 18), 70, 184);
    ctx.font = "900 112px 'Noto Sans JP', sans-serif"; ctx.fillText(grade.name, 67, 340);
    ctx.font = "700 28px 'Noto Sans JP', sans-serif"; ctx.fillText(grade.title, 74, 392);
    ctx.fillStyle = "rgba(255,255,255,.2)"; ctx.fillRect(70, 447, 760, 2);
    ctx.fillStyle = "#fff"; ctx.font = "700 24px 'Noto Sans JP', sans-serif"; ctx.fillText(`MEMBER  ${state.listenerName}`, 72, 505); ctx.fillText(`HOST  ${state.hostName}`, 72, 552);
    ctx.font = "900 21px 'Noto Sans JP', sans-serif"; ctx.fillText(`${state.missions.filter((m) => m.done).length} / ${state.missions.length} MEMORIES`, 866, 576);
  } else {
    ctx.textAlign = "center";
    ctx.font = "800 25px 'Noto Sans JP', sans-serif"; ctx.fillText("MONTHLY FAN AWARD", 600, 100);
    ctx.font = "900 40px 'Noto Sans JP', sans-serif"; ctx.fillText("SPECIAL COMMENDATION", 600, 160);
    ctx.font = "900 68px 'Noto Sans JP', sans-serif"; ctx.fillText(state.awardTitle.slice(0, 16), 600, 280);
    ctx.font = "900 38px 'Noto Sans JP', sans-serif"; ctx.fillText(state.awardRecipient.slice(0, 20), 600, 350);
    ctx.font = "600 24px 'Noto Sans JP', sans-serif"; drawWrappedText(ctx, state.awardMessage, 600, 430, 850, 37, 3);
    ctx.font = "800 22px 'Noto Sans JP', sans-serif"; ctx.fillText(`贈呈  ${state.hostName}`, 600, 578);
    ctx.textAlign = "left";
  }
  const link = document.createElement("a");
  link.download = `${safeFileName(kind === "passport" ? state.listenerName : state.awardRecipient)}-${kind}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function PassportCard({ grade, state, locked = false }: { grade: PassportGrade; state: GuildState; locked?: boolean }) {
  return <article className={`guild-passport-card grade-${grade.id}${locked ? " is-locked" : ""}`} style={gradeStyle(grade)}>
    <span className="guild-card-glow" />
    <div className="guild-card-top"><b>OSHIWAKU PASSPORT</b><span>{grade.name}</span></div>
    <div className="guild-card-orbit"><i /><i /><i /></div>
    <div className="guild-card-copy"><small>{state.passportTitle || "あなたの推し枠"}</small><strong>{grade.title}</strong><span>MEMBER / {state.listenerName || "リスナー名"}</span></div>
    <div className="guild-card-bottom"><span>HOST / {state.hostName || "ライバー名"}</span><b>{locked ? "NEXT GRADE" : "MEMBER PASS"}</b></div>
    {locked && <div className="guild-card-lock"><span>✦</span><b>次に出会えるカード</b></div>}
  </article>;
}

export function FanGuildSuite({ initialMode }: { initialMode: GuildMode }) {
  const [state, setState] = useState<GuildState>(defaults);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState("");
  const completed = state.missions.filter((mission) => mission.done).length;
  const grade = getPassportGrade(completed);
  const nextGrade = getNextPassportGrade(completed);
  const remaining = stampsUntilNextGrade(completed);
  const rewardSummary = useMemo(() => summarizeRewards(state.rewards), [state.rewards]);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const saved = localStorage.getItem(FAN_GUILD_STORAGE_KEY);
        if (saved) setState({ ...defaults, ...JSON.parse(saved) });
      } catch { /* keep a usable default */ }
      setReady(true);
    });
  }, []);
  useEffect(() => { if (ready) localStorage.setItem(FAN_GUILD_STORAGE_KEY, JSON.stringify(state)); }, [ready, state]);

  const patch = <K extends keyof GuildState>(key: K, value: GuildState[K]) => setState((current) => ({ ...current, [key]: value }));
  const announce = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2400); };
  const copy = async (value: string) => { await navigator.clipboard.writeText(value); announce("共有文をコピーしました"); };

  return <main className="guild-shell">
    <header className="guild-hero">
      <div><p className="guild-kicker">FAN EXPERIENCE SUITE</p><h1>好きな枠で過ごした時間を、<em>特別な証</em>に。</h1><p>育てる、称える、つながる、届ける。リスナーとの思い出を一度きりにしない4つのツールです。</p></div>
      <div className="guild-hero-seal"><span>✦</span><b>MEMORIES<br/>BECOME<br/>TREASURES</b></div>
    </header>

    <nav className="guild-mode-nav" aria-label="ファン体験ツール">
      {(Object.keys(MODE_META) as GuildMode[]).map((mode) => <Link key={mode} href={MODE_META[mode].href} className={mode === initialMode ? "is-active" : ""} aria-current={mode === initialMode ? "page" : undefined}><span>{MODE_META[mode].mark}</span><small>{MODE_META[mode].short}</small><b>{MODE_META[mode].label}</b></Link>)}
    </nav>

    <p className="guild-privacy">入力内容はこの端末だけに自動保存されます。IRIAMとの連携やサーバー送信はありません。</p>

    {initialMode === "passport" && <section className="guild-workspace">
      <div className="guild-section-heading"><div><span>01 / GROW</span><h2>推し枠パスポート</h2><p>思い出を集めるほど、カードが豪華に進化します。</p></div><div className="guild-progress-badge"><b>{completed}</b><span>MEMORIES</span></div></div>
      <div className="guild-two-column">
        <div className="guild-panel guild-editor"><h3>パスポート設定</h3><div className="guild-form-grid"><label>ライバー名<input value={state.hostName} maxLength={24} onChange={(e) => patch("hostName", e.target.value)} /></label><label>リスナー名<input value={state.listenerName} maxLength={24} onChange={(e) => patch("listenerName", e.target.value)} /></label><label className="wide">枠・王国の名前<input value={state.passportTitle} maxLength={32} onChange={(e) => patch("passportTitle", e.target.value)} /></label></div>
          <div className="guild-missions"><div className="guild-panel-title"><h3>思い出ミッション</h3><span>{completed}/{state.missions.length}</span></div>{state.missions.map((mission, index) => <label className={mission.done ? "is-done" : ""} key={mission.id}><input type="checkbox" checked={mission.done} onChange={(e) => patch("missions", state.missions.map((item) => item.id === mission.id ? { ...item, done: e.target.checked } : item))}/><span>{String(index + 1).padStart(2, "0")}</span><input aria-label={`ミッション${index + 1}`} value={mission.label} maxLength={32} onChange={(e) => patch("missions", state.missions.map((item) => item.id === mission.id ? { ...item, label: e.target.value } : item))}/></label>)}</div>
        </div>
        <div className="guild-preview-stack"><div className="guild-preview-label"><span>NOW</span><b>現在のカード</b></div><PassportCard grade={grade} state={state}/><div className="guild-grade-progress"><span style={{ width: `${nextGrade ? ((completed - grade.threshold) / (nextGrade.threshold - grade.threshold)) * 100 : 100}%` }}/></div><p className="guild-next-message">{nextGrade ? <><b>あと{remaining}個</b>の思い出で <strong>{nextGrade.name}</strong> に進化</> : <><b>最高グレード達成。</b>これからの思い出も、このカードに刻まれます。</>}</p><button className="guild-primary" onClick={() => downloadCard("passport", state, grade)}>パスポートをPNG保存</button>
          {nextGrade && <div className="guild-next-card"><div className="guild-preview-label"><span>NEXT</span><b>次に手に入るカード</b></div><PassportCard grade={nextGrade} state={state} locked/><div className="guild-next-perks"><span>✦ 新しい箔カラー</span><span>✦ 専用称号</span><span>✦ コレクション更新</span></div></div>}
          {!nextGrade && <div className="guild-grade-collection"><b>COLLECTION COMPLETE</b>{PASSPORT_GRADES.map((item) => <span key={item.id} style={gradeStyle(item)}>{item.name}</span>)}</div>}
        </div>
      </div>
    </section>}

    {initialMode === "awards" && <section className="guild-workspace">
      <div className="guild-section-heading"><div><span>02 / CELEBRATE</span><h2>月末ファン表彰式</h2><p>金額や順位では表せない「ありがとう」を、一人だけの勲章に。</p></div><div className="guild-progress-badge"><b>✦</b><span>SPECIAL</span></div></div>
      <div className="guild-two-column">
        <div className="guild-panel guild-editor"><h3>表彰カードを仕立てる</h3><div className="guild-form-grid"><label>贈る相手<input value={state.awardRecipient} maxLength={24} onChange={(e) => patch("awardRecipient", e.target.value)} /></label><label>贈呈者<input value={state.hostName} maxLength={24} onChange={(e) => patch("hostName", e.target.value)} /></label><label className="wide">賞の名前<input value={state.awardTitle} maxLength={30} onChange={(e) => patch("awardTitle", e.target.value)} /></label><label className="wide">感謝のメッセージ<textarea rows={5} value={state.awardMessage} maxLength={120} onChange={(e) => patch("awardMessage", e.target.value)} /></label></div><fieldset className="guild-theme-picker"><legend>カードの装い</legend>{(["night", "rose", "mint"] as const).map((theme) => <label key={theme} className={`theme-${theme}`}><input type="radio" name="award-theme" checked={state.awardTheme === theme} onChange={() => patch("awardTheme", theme)}/><span/><b>{theme === "night" ? "星夜" : theme === "rose" ? "祝祭" : "翡翠"}</b></label>)}</fieldset><div className="guild-suggestions"><small>称号のヒント</small>{["初見から仲間になったで賞", "ナイスツッコミ賞", "朝枠皆勤賞", "いつも見守ってくれたで賞"].map((title) => <button key={title} onClick={() => patch("awardTitle", title)}>{title}</button>)}</div></div>
        <div className="guild-preview-stack"><div className="guild-preview-label"><span>PREVIEW</span><b>贈られる表彰カード</b></div><article className={`guild-award-card theme-${state.awardTheme}`}><div className="guild-award-stars">✦　·　✧　·　✦</div><small>MONTHLY FAN AWARD</small><span className="guild-award-laurel">❧</span><h3>{state.awardTitle || "特別賞"}</h3><b>{state.awardRecipient || "あなたへ"}</b><p>{state.awardMessage || "いつもありがとう。"}</p><footer>AWARDED BY {state.hostName || "ライバー名"}</footer></article><button className="guild-primary" onClick={() => downloadCard("award", state, grade)}>表彰カードをPNG保存</button><button className="guild-secondary" onClick={() => copy(`${state.awardRecipient}さんへ「${state.awardTitle}」を贈りました。\n${state.awardMessage}\n#IRIAMファン表彰式`)}>X用の紹介文をコピー</button></div>
      </div>
    </section>}

    {initialMode === "relay" && <section className="guild-workspace">
      <div className="guild-section-heading"><div><span>03 / CONNECT</span><h2>IRIAM企画リレー</h2><p>次のライバーへ物語を渡し、みんなの企画を一本の軌跡に。</p></div><div className="guild-progress-badge"><b>{state.relayMembers.filter((m) => m.done).length}/{state.relayMembers.length}</b><span>BATON</span></div></div>
      <div className="guild-two-column relay-layout"><div className="guild-panel guild-editor"><h3>リレーを編成</h3><div className="guild-form-grid"><label className="wide">企画名<input value={state.relayTitle} maxLength={40} onChange={(e) => patch("relayTitle", e.target.value)}/></label><label className="wide">共通ハッシュタグ<input value={state.relayTag} maxLength={40} onChange={(e) => patch("relayTag", e.target.value)}/></label></div><div className="guild-relay-editor">{state.relayMembers.map((member, index) => <div key={member.id}><button aria-label="完了状態を変更" className={member.done ? "done" : ""} onClick={() => patch("relayMembers", state.relayMembers.map((item) => item.id === member.id ? { ...item, done: !item.done } : item))}>{member.done ? "✓" : index + 1}</button><input aria-label={`走者${index + 1}`} value={member.name} maxLength={24} onChange={(e) => patch("relayMembers", state.relayMembers.map((item) => item.id === member.id ? { ...item, name: e.target.value } : item))}/><input aria-label={`日程${index + 1}`} value={member.date} maxLength={14} onChange={(e) => patch("relayMembers", state.relayMembers.map((item) => item.id === member.id ? { ...item, date: e.target.value } : item))}/><button className="remove" aria-label="走者を削除" onClick={() => patch("relayMembers", state.relayMembers.filter((item) => item.id !== member.id))}>×</button></div>)}</div><button className="guild-secondary" onClick={() => patch("relayMembers", [...state.relayMembers, { id: crypto.randomUUID(), name: "次のライバー", date: "未定", done: false }])}>＋ 次の走者を追加</button></div>
        <div className="guild-panel guild-relay-preview"><div className="relay-ticket-head"><span>OFFICIAL RELAY PASS</span><b>{state.relayTag}</b></div><h3>{state.relayTitle}</h3><div className="relay-route">{state.relayMembers.map((member, index) => <div className={member.done ? "is-done" : ""} key={member.id}><i>{member.done ? "✓" : index + 1}</i><span><b>{member.name || "走者未定"}</b><small>{member.date || "日程未定"}</small></span>{index < state.relayMembers.length - 1 && <em>BATON</em>}</div>)}</div><div className="relay-footer"><b>{state.relayMembers.filter((m) => m.done).length} PASSED</b><span>つぎの声へ、物語をつなぐ。</span></div><button className="guild-primary" onClick={() => copy(`🎙 ${state.relayTitle}\n${state.relayMembers.map((member, index) => `${index + 1}. ${member.name}｜${member.date}`).join("\n")}\n${state.relayTag}`)}>リレー告知文をコピー</button></div></div>
    </section>}

    {initialMode === "rewards" && <section className="guild-workspace">
      <div className="guild-section-heading"><div><span>04 / DELIVER</span><h2>返礼・特典かんばん</h2><p>大切な約束を、忘れず、焦らず、ひとつずつ届けます。</p></div><div className="guild-progress-badge"><b>{rewardSummary.sent}/{state.rewards.length}</b><span>DELIVERED</span></div></div>
      <div className="guild-reward-summary">{(Object.keys(REWARD_STATUS_LABELS) as RewardStatus[]).map((status) => <div key={status} className={`status-${status}`}><span>{REWARD_STATUS_LABELS[status]}</span><b>{rewardSummary[status]}</b></div>)}</div>
      <div className="guild-kanban">{(Object.keys(REWARD_STATUS_LABELS) as RewardStatus[]).map((status) => <section key={status} className={`guild-kanban-column status-${status}`}><header><span/><h3>{REWARD_STATUS_LABELS[status]}</h3><b>{rewardSummary[status]}</b></header><div>{state.rewards.filter((item) => item.status === status).map((item) => <article key={item.id}><label>お相手<input value={item.listener} maxLength={24} onChange={(e) => patch("rewards", state.rewards.map((reward) => reward.id === item.id ? { ...reward, listener: e.target.value } : reward))}/></label><label>返礼・特典<input value={item.reward} maxLength={40} onChange={(e) => patch("rewards", state.rewards.map((reward) => reward.id === item.id ? { ...reward, reward: e.target.value } : reward))}/></label><div><label>お渡し予定<input type="date" value={item.due} onChange={(e) => patch("rewards", state.rewards.map((reward) => reward.id === item.id ? { ...reward, due: e.target.value } : reward))}/></label><button aria-label="返礼を削除" onClick={() => patch("rewards", state.rewards.filter((reward) => reward.id !== item.id))}>×</button></div><select aria-label="進捗" value={item.status} onChange={(e) => patch("rewards", state.rewards.map((reward) => reward.id === item.id ? { ...reward, status: e.target.value as RewardStatus } : reward))}>{(Object.keys(REWARD_STATUS_LABELS) as RewardStatus[]).map((option) => <option key={option} value={option}>{REWARD_STATUS_LABELS[option]}</option>)}</select></article>)}</div>{status === "todo" && <button className="guild-add-reward" onClick={() => patch("rewards", [...state.rewards, { id: crypto.randomUUID(), listener: "リスナー名", reward: "返礼内容", due: "", status: "todo" }])}>＋ 返礼を追加</button>}</section>)}</div>
      <aside className="guild-delivery-note"><span>✦</span><div><b>お渡し済みにしたら、ひとこと伝えよう</b><p>「待ってくれてありがとう」を添えると、受け取る瞬間も大切な思い出になります。</p></div><button onClick={() => copy("返礼をお届けしました。待っていてくれてありがとう！受け取れたら、ひとこと教えてもらえるとうれしいです。")}>連絡文をコピー</button></aside>
    </section>}
    {toast && <div className="guild-toast" role="status">✓ {toast}</div>}
  </main>;
}
