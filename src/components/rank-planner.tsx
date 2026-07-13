"use client";
import { useMemo, useRef, useState, type CSSProperties } from "react";
import {
  RANKS,
  type DayPlan,
  type PlannerInput,
  type PlanValue,
} from "@/types/planner";
import { simulate } from "@/lib/simulator";
import { generateAnniversaries } from "@/lib/anniversaries";
import { createIcs } from "@/lib/ics";
import { addDays, formatDate, parseDate } from "@/lib/date-utils";
import { getActionErrors, getNextRankDecision, getRankProgress } from "@/lib/planner-view";
import { shareOrDownloadCalendar } from "@/lib/calendar-share";
import { createRankBandSegments, type RankBandSegment } from "@/lib/rank-bands";
import { getRankPalette } from "@/lib/rank-colors";
import { getCalendarCell, getWeekdayKind, WEEKDAY_COLORS, WEEKDAY_HEADERS } from "@/lib/calendar-display";
import { getCalendarEventLabels, getPngMemoLines, normalizeCalendarMemo } from "@/lib/calendar-content";

const values: { value: PlanValue; label: string }[] = [
  { value: 6, label: "+6" },
  { value: 4, label: "+4" },
  { value: 2, label: "+2" },
  { value: 1, label: "+1" },
  { value: "skip", label: "SKIP" },
  { value: "rest", label: "休み" },
  { value: "unset", label: "未設定" },
];
const labelPlan = (value: PlanValue) =>
  values.find((item) => item.value === value)?.label ?? "";
const numberOptions = (maximum: number) =>
  Array.from({ length: maximum + 1 }, (_, value) => value);
const rankColorStyle = (rank: (typeof RANKS)[number]) => {
  const palette = getRankPalette(rank);
  return {
    "--rank-background": palette.background,
    "--rank-text": palette.text,
    "--rank-border": palette.border,
  } as CSSProperties;
};
const today = formatDate(new Date());
const download = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

export function RankPlanner() {
  const [input, setInput] = useState<PlannerInput>({
    baseDate: today,
    rank: "C1",
    score: 0,
    remainingDaysDisplay: 6,
    skipPasses: 0,
  });
  const [draft, setDraft] = useState(input);
  const [started, setStarted] = useState(false);
  const [plans, setPlans] = useState<Record<string, DayPlan>>({});
  const [selected, setSelected] = useState<string>();
  const [exportNotice, setExportNotice] = useState<string>();
  const sheetRef = useRef<HTMLDialogElement>(null);
  const result = useMemo(() => simulate(input, plans), [input, plans]);
  const anniversaries = useMemo(
    () =>
      input.debutDate
        ? generateAnniversaries(
            input.debutDate,
            input.baseDate,
            addDays(input.baseDate, 91),
          )
        : [],
    [input],
  );
  const anniversaryMap = useMemo(
    () => Object.groupBy(anniversaries, (item) => item.date),
    [anniversaries],
  );
  const months = useMemo(
    () =>
      Object.entries(
        Object.groupBy(result.days, (day) => day.date.slice(0, 7)),
      ),
    [result],
  );
  const current = result.days[0];
  const nextRankDecision = getNextRankDecision(result.days);
  const actionErrors = getActionErrors(result.warnings);
  const rankProgress = getRankProgress(current?.scoreBefore ?? 0);
  const rankBands = useMemo(() => createRankBandSegments(result.days), [result.days]);
  const updateDraft = <K extends keyof PlannerInput>(
    key: K,
    value: PlannerInput[K],
  ) => setDraft((previous) => ({ ...previous, [key]: value }));
  const openDay = (date: string) => {
    setSelected(date);
    sheetRef.current?.showModal();
  };
  const updateDay = (patch: Partial<DayPlan>) =>
    selected &&
    setPlans((previous) => ({
      ...previous,
      [selected]: { ...(previous[selected] ?? { value: "unset" }), ...patch },
    }));
  const addToCalendar = async () => {
    setExportNotice(undefined);
    const file = new File(
      [createIcs(result.days, input.planName)],
      "rank-plan.ics",
      { type: "text/calendar;charset=utf-8" },
    );
    try {
      const outcome = await shareOrDownloadCalendar(file, navigator, () =>
        download(file, file.name),
      );
      if (outcome === "downloaded") {
        setExportNotice(
          "カレンダーファイルを保存しました。ファイルを開いて、お使いのカレンダーへ追加してください。",
        );
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      download(file, file.name);
      setExportNotice(
        "カレンダーファイルを保存しました。ファイルを開いて、お使いのカレンダーへ追加してください。",
      );
    }
  };
  const exportPng = (month: string) => {
    const days = result.days.filter((day) => day.date.startsWith(month));
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 1100;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#FFFDFE";
    ctx.fillRect(0, 0, 1200, 900);
    ctx.fillStyle = "#333";
    ctx.font = "700 48px sans-serif";
    ctx.fillText(
      `${input.planName || "ランク計画"}  ${month.replace("-", "年")}月`,
      64,
      78,
    );
    ctx.font = "24px sans-serif";
    WEEKDAY_HEADERS.forEach((item, index) => {
      ctx.fillStyle = WEEKDAY_COLORS[item.kind];
      ctx.fillText(item.label, 86 + index * 154, 132);
    });
    const first = parseDate(`${month}-01`).getDay();
    days.forEach((day) => {
      const date = parseDate(day.date),
        cell = first + date.getDate() - 1,
        x = 54 + (cell % 7) * 154,
        y = 160 + Math.floor(cell / 7) * 146;
      ctx.fillStyle = "#FFF5F8";
      ctx.beginPath();
      ctx.roundRect(x, y, 138, 132, 18);
      ctx.fill();
      ctx.font = "22px sans-serif";
      ctx.fillStyle = WEEKDAY_COLORS[getWeekdayKind(day.date)];
      ctx.fillText(String(date.getDate()), x + 12, y + 28);
    });
    rankBands.filter((band) => band.month === month).forEach((band) => {
      const x = 54 + (band.startColumn - 1) * 154;
      const y = 160 + (band.row - 1) * 146 + 35;
      const width = band.span * 154 - 16;
      const palette = getRankPalette(band.rank);
      ctx.fillStyle = palette.background;
      ctx.beginPath();
      ctx.roundRect(x, y, width, 20, band.continuesBefore || band.continuesAfter ? 5 : 10);
      ctx.fill();
      ctx.strokeStyle = palette.border;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = palette.text;
      ctx.font = "700 14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(band.rank, x + width / 2, y + 15);
      ctx.textAlign = "left";
    });
    days.forEach((day) => {
      const date = parseDate(day.date),
        cell = first + date.getDate() - 1,
        x = 54 + (cell % 7) * 154,
        y = 160 + Math.floor(cell / 7) * 146;
      ctx.fillStyle = day.plan.value === "skip" ? "#39864c" : "#d83e68";
      ctx.font = "700 25px sans-serif";
      ctx.fillText(day.skipValid ? labelPlan(day.plan.value) : "SKIP不可", x + 12, y + 82);
      const events = getCalendarEventLabels(day);
      if (events.length > 0) {
        ctx.fillStyle = "#555";
        ctx.font = "700 13px sans-serif";
        ctx.fillText(events.map((event) => event.compact).join(" / "), x + 12, y + 101, 116);
      }
      const memoLines = getPngMemoLines(day.plan.memo);
      ctx.fillStyle = "#755F25";
      ctx.font = "12px sans-serif";
      memoLines.forEach((line, index) => ctx.fillText(line, x + 12, y + 117 + index * 13, 116));
    });
    canvas.toBlob(
      (blob) => blob && download(blob, `rank-plan-${month}.png`),
      "image/png",
    );
  };
  if (!started)
    return (
      <section className="planner-shell">
        <div className="tool-intro">
          <span className="eyebrow">unofficial rank planner</span>
          <h1>ランク計画カレンダー</h1>
          <p>いまの状態を入力して、3か月先までのランク推移を組み立てます。</p>
        </div>
        <form
          className="setup-card"
          onSubmit={(event) => {
            event.preventDefault();
            setInput(draft);
            setStarted(true);
          }}
        >
          <h2>現在の状態</h2>
          <div className="form-grid">
            <label>
              基準日
              <input
                type="date"
                required
                value={draft.baseDate}
                onChange={(e) => updateDraft("baseDate", e.target.value)}
              />
            </label>
            <label>
              現在ランク
              <select
                value={draft.rank}
                onChange={(e) =>
                  updateDraft("rank", e.target.value as PlannerInput["rank"])
                }
              >
                {RANKS.map((rank) => (
                  <option key={rank}>{rank}</option>
                ))}
              </select>
            </label>
            <label>
              累計スコア
              <select
                required
                value={draft.score}
                onChange={(e) => updateDraft("score", Number(e.target.value))}
              >
                {numberOptions(17).map((value) => (
                  <option value={value} key={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label>
              IRIAM表示「あとN日」
              <select
                required
                value={draft.remainingDaysDisplay}
                onChange={(e) =>
                  updateDraft("remainingDaysDisplay", Number(e.target.value))
                }
              >
                {numberOptions(6).map((value) => (
                  <option value={value} key={value}>
                    あと{value}日
                  </option>
                ))}
              </select>
            </label>
            <label>
              スキップパス
              <select
                required
                value={draft.skipPasses}
                onChange={(e) =>
                  updateDraft("skipPasses", Number(e.target.value))
                }
              >
                {numberOptions(10).map((value) => (
                  <option value={value} key={value}>
                    {value}枚
                  </option>
                ))}
              </select>
            </label>
            <label>
              デビュー日（任意）
              <input
                type="date"
                value={draft.debutDate ?? ""}
                onChange={(e) =>
                  updateDraft("debutDate", e.target.value || undefined)
                }
              />
            </label>
            <label>
              計画名（任意）
              <input
                maxLength={30}
                value={draft.planName ?? ""}
                onChange={(e) => updateDraft("planName", e.target.value)}
                placeholder="夏のランク計画"
              />
            </label>
            <label>
              表示名（任意）
              <input
                maxLength={30}
                value={draft.displayName ?? ""}
                onChange={(e) => updateDraft("displayName", e.target.value)}
              />
            </label>
          </div>
          <button className="button primary-wide" type="submit">
            3か月の計画を作る
          </button>
        </form>
        <Disclaimer />
      </section>
    );
  const selectedPlan = selected
    ? (plans[selected] ?? { value: "unset" as const })
    : undefined;
  const selectedDay = selected
    ? result.days.find((day) => day.date === selected)
    : undefined;
  const selectedAnniversaries = selected
    ? (anniversaryMap[selected] ?? [])
    : [];
  return (
    <section className="planner-shell">
      <div className="planner-title">
        <div>
          <span className="eyebrow">rank plan</span>
          <h1>{input.planName || "ランク計画カレンダー"}</h1>
          <p>
            {input.displayName ? `${input.displayName}さんの` : ""}
            3か月シミュレーション
          </p>
        </div>
        <button
          className="text-button"
          onClick={() => {
            setDraft(input);
            setStarted(false);
          }}
        >
          初期設定を変更
        </button>
      </div>
      <div className="current-rank-card">
        <div className="current-rank-main">
          <span>現在ランク</span>
          <strong
            className="current-rank-value"
            style={current ? rankColorStyle(current.rankBefore) : undefined}
          >
            {current?.rankBefore}
          </strong>
          <p>
            累計スコア <b>{rankProgress.currentScore} / 18</b>
          </p>
        </div>
        <div className="rank-goals">
          <div className="keep-goal">
            <span>ランクキープ</span>
            <strong>{rankProgress.keepAchieved ? "達成" : `あと +${rankProgress.keepRemaining}`}</strong>
          </div>
          <div className="up-goal">
            <span>ランクアップ</span>
            <strong>あと +{rankProgress.upRemaining}</strong>
          </div>
        </div>
        <p className="current-skip-passes">スキパ {current?.skipPasses}枚</p>
      </div>
      {nextRankDecision?.rankEvent && (
        <aside className={`next-decision ${nextRankDecision.rankEvent.type}`}>
          <span>
            次のランク判定：
            {new Intl.DateTimeFormat("ja-JP", {
              month: "long",
              day: "numeric",
            }).format(parseDate(nextRankDecision.date))}
          </span>
          <strong>予測：{nextRankDecision.rankEvent.label}</strong>
        </aside>
      )}
      {actionErrors.length > 0 && (
        <aside className="warnings">
          <h2>操作を確認してください</h2>
          {actionErrors.map((warning, i) => (
            <p className="error" key={`${warning.date}-${i}`}>
              <b>ERROR</b>{" "}
              {warning.date && `${warning.date}：`}
              {warning.message}
            </p>
          ))}
        </aside>
      )}
      <div className="planner-layout">
        <div className="calendar-stack">
          {months.map(
            ([month, monthDays]) =>
              monthDays && (
                <MonthCalendar
                  key={month}
                  month={month}
                  days={monthDays}
                  rankBands={rankBands.filter((band) => band.month === month)}
                  anniversaries={anniversaryMap}
                  onDay={openDay}
                  onPng={() => exportPng(month)}
                />
              ),
          )}
        </div>
        <aside className="planner-side">
          <h2>カレンダー連携</h2>
          <p>予定を終日イベントとして端末のカレンダーへ追加できます。</p>
          <button
            className="button calendar-share-button"
            onClick={addToCalendar}
          >
            カレンダーに追加
          </button>
          {exportNotice && (
            <p className="export-notice" role="status">
              {exportNotice}
            </p>
          )}
          <div className="image-export-note">
            <b>画像で共有</b>
            <span>各月の「この月をPNG保存」を使ってください。</span>
          </div>
          <h2>見かた</h2>
          <ul className="legend">
            <li>
              <i className="plan6" />
              スコア予定
            </li>
            <li>
              <i className="skip" />
              SKIP
            </li>
            <li>
              <i className="anniversary" />
              記念日
            </li>
            <li>
              <i className="grant" />
              スキパ付与
            </li>
          </ul>
        </aside>
      </div>
      <dialog
        className="day-sheet"
        ref={sheetRef}
        onClick={(e) => {
          if (e.target === sheetRef.current) sheetRef.current.close();
        }}
      >
        <div>
          <header>
            <div>
              <span className="eyebrow">day plan</span>
              <h2>
                {selected &&
                  new Intl.DateTimeFormat("ja-JP", {
                    month: "long",
                    day: "numeric",
                    weekday: "short",
                  }).format(parseDate(selected))}
              </h2>
            </div>
            <button
              aria-label="閉じる"
              className="close"
              onClick={() => sheetRef.current?.close()}
            >
              ×
            </button>
          </header>
          <div className="value-picker">
            {values.map((item) => (
              <button
                key={String(item.value)}
                className={`value-${item.value} ${selectedPlan?.value === item.value ? "active" : ""}`}
                onClick={() => updateDay({ value: item.value })}
              >
                {item.label}
              </button>
            ))}
          </div>
          <label>
            メモ
            <textarea
              maxLength={50}
              value={selectedPlan?.memo ?? ""}
              onChange={(e) => updateDay({ memo: e.target.value })}
              placeholder="50文字まで"
            />
          </label>
          {selected && parseDate(selected).getDay() === 1 && (
            <label className="weekly-grant-setting">
              <span>
                <b>週次スキパ付与</b>
                <small>月曜日の付与予定を計算に含めます</small>
              </span>
              <input
                type="checkbox"
                checked={selectedPlan?.weeklyGrant ?? true}
                onChange={(e) => updateDay({ weeklyGrant: e.target.checked })}
                aria-label="月曜の週次スキパ付与を予定する"
              />
            </label>
          )}
          <div className="form-grid manual-grant-fields">
            <label>
              臨時スキパ付与
              <input
                type="number"
                min="0"
                value={selectedPlan?.manualGrant ?? 0}
                onChange={(e) =>
                  updateDay({ manualGrant: Number(e.target.value) })
                }
              />
            </label>
            <label>
              付与メモ
              <input
                maxLength={50}
                value={selectedPlan?.manualGrantMemo ?? ""}
                onChange={(e) => updateDay({ manualGrantMemo: e.target.value })}
              />
            </label>
          </div>
          {selectedDay && (
            <p className="day-result">
              計算後：{selectedDay.rankAfter} / {selectedDay.scoreAfter}点 /
              スキパ{selectedDay.skipPasses}枚
            </p>
          )}
          {selectedAnniversaries.map((item) => (
            <p className="anniversary-detail" key={item.label}>
              {item.label}
            </p>
          ))}
          <button
            className="button primary-wide"
            onClick={() => sheetRef.current?.close()}
          >
            保存して閉じる
          </button>
        </div>
      </dialog>
      <Disclaimer />
    </section>
  );
}

function MonthCalendar({
  month,
  days,
  rankBands,
  anniversaries,
  onDay,
  onPng,
}: {
  month: string;
  days: ReturnType<typeof simulate>["days"];
  rankBands: RankBandSegment[];
  anniversaries: Partial<
    Record<string, ReturnType<typeof generateAnniversaries>>
  >;
  onDay: (date: string) => void;
  onPng: () => void;
}) {
  return (
    <article className="month-card">
      <header>
        <h2>{month.replace("-", "年")}月</h2>
        <button className="text-button" onClick={onPng}>
          この月をPNG保存
        </button>
      </header>
      <div className="weekdays">
        {WEEKDAY_HEADERS.map((day) => (
          <span className={day.kind} key={day.label}>{day.label}</span>
        ))}
      </div>
      <div className="month-grid">
        {days.map((day) => {
          const position = getCalendarCell(day.date);
          return (
            <button
              className={`day-cell ${day.rankEvent?.type ?? ""}`}
              style={{ gridColumn: position.column, gridRow: position.row }}
              key={day.date}
              onClick={() => onDay(day.date)}
            >
              <span className={`day-number ${getWeekdayKind(day.date)}`}>
                {parseDate(day.date).getDate()}
              </span>
              {day.plan.value !== "unset" && (
                <b className={`chip value-${day.plan.value} ${day.skipValid ? "" : "invalid"}`}>
                  {labelPlan(day.plan.value)}
                </b>
              )}
              {getCalendarEventLabels(day).map((event) => (
                <small className={event.className} key={event.key}>
                  <span className="event-label-full">{event.full}</span>
                  <span className="event-label-compact">{event.compact}</span>
                </small>
              ))}
              {anniversaries[day.date]?.map((event) => (
                <small className="anniversary-chip" key={event.label}>
                  {event.label}
                </small>
              ))}
              {normalizeCalendarMemo(day.plan.memo) && (
                <small className="memo">{normalizeCalendarMemo(day.plan.memo)}</small>
              )}
            </button>
          );
        })}
        {rankBands.map((band) => (
          <div
            className={`rank-period-band ${band.continuesBefore ? "continues-before" : "starts"} ${band.continuesAfter ? "continues-after" : "ends"}`}
            style={{ ...rankColorStyle(band.rank), gridColumn: `${band.startColumn} / span ${band.span}`, gridRow: band.row }}
            key={`${band.month}-${band.row}-${band.startColumn}-${band.rank}`}
          >
            <span>{band.rank}</span>
          </div>
        ))}
      </div>
    </article>
  );
}
function Disclaimer() {
  return (
    <p className="disclaimer">
      本サービスはIRIAMの非公式ツールであり、IRIAM運営会社とは関係ありません。計算結果は入力された予定値に基づくシミュレーションです。実際のランク変動はIRIAM公式表示をご確認ください。
    </p>
  );
}
