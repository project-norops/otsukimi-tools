export type Audience = "liver" | "listener";
export interface ToolMetadata { id: string; name: string; description: string; audiences: Audience[]; status: "available" | "in_development"; href?: string }
export const tools: ToolMetadata[] = [
  { id: "rank-calendar", name: "ランク計画カレンダー", description: "日別スコアとスキパから、3か月先までのランク推移を計画します。", audiences: ["liver"], status: "available", href: "/tools/rank-calendar" },
  { id: "daily-mirei", name: "本日の美玲ちゃん", description: "今日の美玲ちゃんを楽しく観測。可愛さはいつでも120%。", audiences: ["liver", "listener"], status: "available", href: "/tools/daily-mirei" },
  { id: "tsukimikko-fortune", name: "つきみっこ専用くじ", description: "今日のコンディションに、美玲ちゃんバフをひとつ。", audiences: ["listener"], status: "available", href: "/tools/tsukimikko-fortune" },
  { id: "mirei-alert", name: "美玲ちゃん注意報", description: "何をしていても結局刺さる。今日の注意報を観測します。", audiences: ["liver", "listener"], status: "available", href: "/tools/mirei-alert" },
  { id: "liver-match", name: "おすすめライバー診断", description: "宇宙規模のデータから、あなたに合うライバーを診断します。", audiences: ["listener"], status: "available", href: "/tools/liver-match" },
  { id: "event-pace", name: "イベント着地予測", description: "現在ポイントと残り時間から着地や必要ペースを試算します。", audiences: ["liver", "listener"], status: "in_development" },
  { id: "oshi-budget", name: "推し活予算ペースメーカー", description: "月末までの安全な利用ペースを見える化します。", audiences: ["listener"], status: "in_development" },
  { id: "anniversary-calendar", name: "記念日カレンダー", description: "基準日から周年や100日単位の記念日を一覧にします。", audiences: ["liver", "listener"], status: "in_development" },
  { id: "schedule-image", name: "配信スケジュール共有画像", description: "配信予定をSNSで共有しやすい画像にします。", audiences: ["liver"], status: "in_development" },
  { id: "icon-ring", name: "アイコンリング装着ツール", description: "プロフィール画像とリング画像の重ね合わせを補助します。", audiences: ["liver", "listener"], status: "in_development" },
  { id: "event-split", name: "イベント告知4分割画像", description: "既存素材を4分割投稿向けに整えます。", audiences: ["liver"], status: "in_development" },
  { id: "event-goal", name: "イベント目標逆算", description: "目標と残り期間から必要ポイントを逆算します。", audiences: ["liver", "listener"], status: "in_development" }
];

/** ポータルには、現在利用できるツールだけを掲載する。 */
export const availableTools = tools.filter((tool) => tool.status === "available" && tool.href);
