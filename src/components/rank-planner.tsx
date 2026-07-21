"use client";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  RANKS,
  type DayPlan,
  type PlannerInput,
  type PlanValue,
  type SimulationDay,
  type SimulationMonths,
} from "@/types/planner";
import { simulate } from "@/lib/simulator";
import { generateAnniversaries } from "@/lib/anniversaries";
import { createIcs } from "@/lib/ics";
import { formatDate, parseDate } from "@/lib/date-utils";
import { getActionErrors, getNextRankDecision, getRankProgress } from "@/lib/planner-view";
import { shareOrDownloadCalendar } from "@/lib/calendar-share";
import { createRankBandSegments, type RankBandSegment } from "@/lib/rank-bands";
import { getRankPalette } from "@/lib/rank-colors";
import { getCalendarCell, getWeekdayKind, WEEKDAY_COLORS, WEEKDAY_HEADERS } from "@/lib/calendar-display";
import { getCalendarEventLabels, getPngMemoLines, normalizeCalendarMemo } from "@/lib/calendar-content";
import { decodePlannerState, encodePlannerState, normalizePlannerMemo, PLANNER_MEMO_LIMIT, PLANNER_STATE_VERSION, PLANNER_STORAGE_KEY, readSharedPlannerState, type PlannerPersistedState } from "@/lib/planner-state";
import { countInclusiveDays, getDisplayMonths, getDisplayRange, getSimulationRange, type DisplayMonth } from "@/lib/simulation-range";

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
const simulationMonthOptions: SimulationMonths[] = [1, 2, 3];
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
    simulationMonths: 1,
  });
  const [plans, setPlans] = useState<Record<string, DayPlan>>({});
  const [selected, setSelected] = useState<string>();
  const [exportNotice, setExportNotice] = useState<string>();
  const [storageReady, setStorageReady] = useState(false);
  const [sharedMode, setSharedMode] = useState(false);
  const [persistenceNotice, setPersistenceNotice] = useState<string>();
  const sheetRef = useRef<HTMLDialogElement>(null);
  const resetDialogRef = useRef<HTMLDialogElement>(null);
  const resetCancelRef = useRef<HTMLButtonElement>(null);
  const simulationRange = useMemo(() => getSimulationRange(input.baseDate, input.simulationMonths), [input.baseDate, input.simulationMonths]);
  const displayMonths = useMemo<DisplayMonth[]>(() => getDisplayMonths(getDisplayRange(simulationRange)), [simulationRange]);
  const result = useMemo(() => simulate(input, plans, countInclusiveDays(simulationRange.start, simulationRange.end), 1), [input, plans, simulationRange]);
  const anniversaries = useMemo(
    () =>
      input.debutDate
        ? generateAnniversaries(
            input.debutDate,
            simulationRange.start,
            simulationRange.end,
          )
        : [],
    [input.debutDate, simulationRange],
  );
  const anniversaryMap = useMemo(
    () => Object.groupBy(anniversaries, (item) => item.date),
    [anniversaries],
  );
  const simulationDaysByDate = useMemo(() => Object.fromEntries(result.days.map((day) => [day.date, day])), [result.days]);
  const current = result.days[0];
  const nextRankDecision = getNextRankDecision(result.days);
  const actionErrors = getActionErrors(result.warnings);
  const rankProgress = getRankProgress(current?.scoreBefore ?? 0);
  const rankBands = useMemo(() => createRankBandSegments(result.days), [result.days]);
  const persistedState = useMemo<PlannerPersistedState>(() => ({ version: PLANNER_STATE_VERSION, input, plans }), [input, plans]);

  useEffect(() => {
    const shared = readSharedPlannerState(window.location.hash);
    let restored: PlannerPersistedState | undefined = shared;
    if (!restored) {
      try { restored = decodePlannerState(localStorage.getItem(PLANNER_STORAGE_KEY) ?? ""); } catch { /* storage unavailable */ }
    }
    if (restored) {
      // 初回マウント時に外部保存データを一度だけ復元する。
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInput(restored.input);
      setPlans(restored.plans);
      setSharedMode(Boolean(shared));
      setPersistenceNotice(shared ? "共有URLの計画を表示しています。端末の保存内容は変更していません。" : "この端末に保存した計画を復元しました。");
    } else if (window.location.hash.includes("plan=")) {
      setPersistenceNotice("この共有URLは旧形式または読み込めない形式です。端末の保存内容は変更していません。");
    }
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady || sharedMode) return;
    try { localStorage.setItem(PLANNER_STORAGE_KEY, encodePlannerState(persistedState)); } catch { /* storage unavailable */ }
  }, [persistedState, sharedMode, storageReady]);

  const saveSharedToDevice = () => {
    try {
      localStorage.setItem(PLANNER_STORAGE_KEY, encodePlannerState(persistedState));
      history.replaceState(null, "", window.location.pathname + window.location.search);
      setSharedMode(false);
      setPersistenceNotice("この内容を端末に保存しました。以降の変更は自動保存されます。");
    } catch { setPersistenceNotice("端末へ保存できませんでした。ブラウザの設定をご確認ください。"); }
  };

  const sharePlan = async () => {
    const url = `${window.location.origin}${window.location.pathname}#plan=${encodePlannerState(persistedState)}`;
    try {
      if (navigator.share) { await navigator.share({ title: input.planName || "ランク計画カレンダー", text: "ランク計画の共有URLです。", url }); setPersistenceNotice("共有メニューを開きました。"); }
      else { await navigator.clipboard.writeText(url); setPersistenceNotice("共有URLをコピーしました。"); }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      try { await navigator.clipboard.writeText(url); setPersistenceNotice("共有URLをコピーしました。"); } catch { setPersistenceNotice("共有URLをコピーできませんでした。"); }
    }
  };
  const updateInput = <K extends keyof PlannerInput>(
    key: K,
    value: PlannerInput[K],
  ) => setInput((previous) => ({ ...previous, [key]: value }));
  const openDay = (date: string) => {
    setSelected(date);
    sheetRef.current?.showModal();
  };
  const updateDay = (patch: Partial<DayPlan>) =>
    selected &&
    setPlans((previous) => ({
      ...previous,
      [selected]: { ...(previous[selected] ?? { value: 1 }), ...patch, ...(patch.memo !== undefined ? { memo: normalizePlannerMemo(patch.memo) } : {}) },
    }));
  const openResetDialog = () => {
    resetDialogRef.current?.showModal();
    requestAnimationFrame(() => resetCancelRef.current?.focus());
  };
  const resetCalendar = () => {
    setPlans({});
    resetDialogRef.current?.close();
    setPersistenceNotice("カレンダーの入力をリセットしました。対象日はすべて+1に戻っています。");
  };
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
    const monthDates = displayMonths.find((item) => item.month === month)?.dates ?? [];
    const days = monthDates
      .map((date) => simulationDaysByDate[date])
      .filter((day): day is SimulationDay => Boolean(day));
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 1100;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#FFFDFE";
    ctx.fillRect(0, 0, 1200, 1100);
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
    monthDates.forEach((dateString) => {
      const date = parseDate(dateString),
        cell = first + date.getDate() - 1,
        x = 54 + (cell % 7) * 154,
        y = 160 + Math.floor(cell / 7) * 146;
      ctx.fillStyle = simulationDaysByDate[dateString] ? "#FFF5F8" : "#F2ECE8";
      ctx.beginPath();
      ctx.roundRect(x, y, 138, 132, 18);
      ctx.fill();
      ctx.font = "22px sans-serif";
      ctx.fillStyle = simulationDaysByDate[dateString] ? WEEKDAY_COLORS[getWeekdayKind(dateString)] : "#A69A94";
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
  const selectedPlan = selected
    ? (plans[selected] ?? { value: 1 as const })
    : undefined;
  const selectedDay = selected
    ? result.days.find((day) => day.date === selected)
    : undefined;
  const selectedAnniversaries = selected
    ? (anniversaryMap[selected] ?? [])
    : [];
  return (
    <section className="planner-shell">
      <div className="planner-intro">
        <span className="eyebrow">IRIAM rank planner</span>
        <h1>IRIAMランク管理カレンダー</h1>
        <p>毎日の予定を入れると、ランクとスコアの推移を自動で確認できます。</p>
      </div>
      <aside className="access-notice">
        <b>現在はすべて無料</b>
        <span>現在、すべての機能を無料でご利用いただけます。今後の機能追加やアップデートに伴い、一部の高度な機能を有料オプション（プレミアムプラン等）として提供する場合があります。あらかじめご了承ください。</span>
      </aside>
      <aside className="planner-guide" aria-label="使い方">
        <h2>かんたん3ステップ</h2>
        <ol>
          <li><b>1</b><span>現在のランク・スコア・スキパ数等を入力</span></li>
          <li><b>2</b><span>カレンダーの日付をタップして、スコアやスキパの予定、メモを入力</span></li>
          <li><b>3</b><span>PNG保存またはカレンダーへ追加</span></li>
        </ol>
        <p>入力変更後はランク推移を自動再計算します。「スキパ+1、SP+1」は定期的に自動で付与されるスキップパスの増加を表しています。</p>
      </aside>
      <details className="planner-settings" open>
        <summary>
          <span>現在の状態とシミュレーション期間</span>
          <small>{input.baseDate} / {input.rank} / {input.simulationMonths}か月</small>
        </summary>
        <div className="form-grid planner-settings-grid">
          <label>ライバー名<input value={input.displayName ?? ""} onChange={(event) => updateInput("displayName", event.target.value)} placeholder="例：すしうさ" /></label>
          <label>計画名<input value={input.planName ?? ""} onChange={(event) => updateInput("planName", event.target.value)} placeholder="例：今月のランク計画" /></label>
          <label>基準日<input type="date" value={input.baseDate} onChange={(event) => updateInput("baseDate", event.target.value)} /></label>
          <label>シミュレーション期間<select value={input.simulationMonths} onChange={(event) => updateInput("simulationMonths", Number(event.target.value) as SimulationMonths)}>{simulationMonthOptions.map((month) => <option key={month} value={month}>{month}か月</option>)}</select></label>
          <label>現在ランク<select value={input.rank} onChange={(event) => updateInput("rank", event.target.value as PlannerInput["rank"])}>{RANKS.map((rank) => <option key={rank}>{rank}</option>)}</select></label>
          <label>累計スコア<select value={input.score} onChange={(event) => updateInput("score", Number(event.target.value))}>{numberOptions(17).map((score) => <option key={score} value={score}>{score}</option>)}</select></label>
          <label>ランク判定まで<select value={input.remainingDaysDisplay} onChange={(event) => updateInput("remainingDaysDisplay", Number(event.target.value))}>{numberOptions(6).map((days) => <option key={days} value={days}>{days === 0 ? "あと0日（当日）" : `あと${days}日`}</option>)}</select></label>
          <label>スキパ所持数<select value={input.skipPasses} onChange={(event) => updateInput("skipPasses", Number(event.target.value))}>{numberOptions(10).map((passes) => <option key={passes} value={passes}>{passes}枚</option>)}</select></label>
          <label>
            デビュー日（任意）
            <input type="date" value={input.debutDate ?? ""} onChange={(event) => updateInput("debutDate", event.target.value || undefined)} />
            <span className="field-note">入力するとアニバーサリーやゾロ目日（デビュー100日目、111日目）等の記念日が表示されます。</span>
          </label>
        </div>
      </details>
      {sharedMode && <aside className="shared-plan-banner"><div><b>共有URLの計画を表示中</b><span>このままでは端末の保存内容を上書きしません。</span></div><button className="button" type="button" onClick={saveSharedToDevice}>この内容を端末に保存</button></aside>}
      {!sharedMode && persistenceNotice && <p className="planner-persistence-notice" role="status">{persistenceNotice}</p>}
      <div className="planner-title">
        <div>
          <span className="eyebrow">rank plan</span>
          <h2>{input.planName || "ランク計画"}</h2>
          <p>
            {input.displayName ? `${input.displayName}さんの` : ""}
            {input.simulationMonths}か月シミュレーション
          </p>
        </div>
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
          <p className="current-base-date">基準日 <b>{input.baseDate}</b></p>
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
          {displayMonths.map(({ month, dates }) => (
            <MonthCalendar
              key={month}
              month={month}
              dates={dates}
              simulationDaysByDate={simulationDaysByDate}
              rankBands={rankBands.filter((band) => band.month === month)}
              anniversaries={anniversaryMap}
              onDay={openDay}
              onPng={() => exportPng(month)}
            />
          ))}
        </div>
        <aside className="planner-side">
          <h2>計画を共有</h2>
          <p>現在の入力内容とメモを、別端末でも開けるURLにします。</p>
          <button className="button secondary calendar-share-button" onClick={sharePlan}>共有URLを送る・コピー</button>
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
          <div className="future-feature-note">
            <b>今後の機能</b>
            <span>カラーテーマ変更は今後対応予定です。</span>
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
        <div className="day-sheet-panel">
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
          <div className="day-sheet-body">
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
              maxLength={PLANNER_MEMO_LIMIT}
              value={selectedPlan?.memo ?? ""}
              onChange={(e) => updateDay({ memo: e.target.value })}
              placeholder="10文字まで"
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
            {selectedDay?.rankEvent && selectedDay.decisionScore !== undefined ? (
              <div className={`day-result decision ${selectedDay.rankEvent.type}`}>
                <strong>
                  判定結果：合計{selectedDay.decisionScore}点 → {selectedDay.rankEvent.label}
                </strong>
                <span>次期間スコア：{selectedDay.scoreAfter}点</span>
                <span>スキパ残数：{selectedDay.skipPasses}枚</span>
              </div>
            ) : selectedDay ? (
              <p className="day-result">
                計算後：{selectedDay.rankAfter} / {selectedDay.scoreAfter}点 /
                スキパ{selectedDay.skipPasses}枚
              </p>
            ) : null}
            {selectedAnniversaries.map((item) => (
            <p className="anniversary-detail" key={item.label}>
              {item.label}
            </p>
            ))}
          </div>
          <footer className="day-sheet-footer">
            <button
              className="button primary-wide"
              onClick={() => sheetRef.current?.close()}
            >
              保存して閉じる
            </button>
          </footer>
        </div>
      </dialog>
      <section className="planner-danger-zone" aria-labelledby="reset-warning-title">
        <div>
          <h2 id="reset-warning-title">注意</h2>
          <p>日ごとの予定・メモ・付与設定だけを消去します。基準日やランクなどの設定は残ります。</p>
        </div>
        <button className="danger-button" type="button" onClick={openResetDialog}>カレンダーを一括リセット</button>
      </section>
      <dialog
        className="reset-dialog"
        ref={resetDialogRef}
        onClick={(event) => {
          if (event.target === resetDialogRef.current) resetDialogRef.current.close();
        }}
      >
        <div className="reset-dialog-panel">
          <span className="eyebrow">reset calendar</span>
          <h2>カレンダーをリセットしますか？</h2>
          <p>日ごとの予定・メモ・付与設定は元に戻せません。現在の状態とシミュレーション期間は保持されます。</p>
          <div className="reset-dialog-actions">
            <button ref={resetCancelRef} className="button secondary" type="button" onClick={() => resetDialogRef.current?.close()}>キャンセル</button>
            <button className="danger-button solid" type="button" onClick={resetCalendar}>リセットする</button>
          </div>
        </div>
      </dialog>
      <Disclaimer />
    </section>
  );
}

function MonthCalendar({
  month,
  dates,
  simulationDaysByDate,
  rankBands,
  anniversaries,
  onDay,
  onPng,
}: {
  month: string;
  dates: string[];
  simulationDaysByDate: Record<string, SimulationDay>;
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
        {dates.map((date) => {
          const day = simulationDaysByDate[date];
          const position = getCalendarCell(date);
          return (
            <button
              className={`day-cell ${day?.rankEvent?.type ?? ""} ${day ? "" : "display-only"}`}
              style={{ gridColumn: position.column, gridRow: position.row }}
              key={date}
              onClick={() => day && onDay(date)}
              disabled={!day}
              aria-label={day ? `${date}の予定を編集` : `${date}（シミュレーション期間外）`}
            >
              <span className={`day-number ${getWeekdayKind(date)}`}>
                {parseDate(date).getDate()}
              </span>
              {day && day.plan.value !== "unset" && (
                <b className={`chip value-${day.plan.value} ${day.skipValid ? "" : "invalid"}`}>
                  {labelPlan(day.plan.value)}
                </b>
              )}
              {day && getCalendarEventLabels(day).map((event) => (
                <small className={event.className} key={event.key}>
                  <span className="event-label-full">{event.full}</span>
                  <span className="event-label-compact">{event.compact}</span>
                </small>
              ))}
              {day && anniversaries[date]?.map((event) => (
                <small className="anniversary-chip" key={event.label}>
                  {event.label}
                </small>
              ))}
              {day && normalizeCalendarMemo(day.plan.memo) && (
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
