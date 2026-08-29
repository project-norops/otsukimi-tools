"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { decodePlannerState, PLANNER_STORAGE_KEY } from "@/lib/planner-state";
import { EVENT_CATEGORIES, LIVER_PLANNER_STORAGE_KEY, TASK_CATEGORIES, type EventCategory, type LiverEvent, type LiverPlannerState, type LiverTask, type RankCalendarItem, type TaskCategory, addDays, datesBetween, formatDate, labelDate, makeLiverId, rankCalendarItems, readLiverPlannerState, tuesdayFor } from "@/lib/liver-planner";
import { drawWeeklyPlannerImage, extractRankBonus, resizeThumbnail, weeklyShareFilename, type WeeklyShareDay } from "@/lib/liver-planner-image";

type Tab = "home" | "week" | "ten" | "month";
type RankItem = RankCalendarItem;
const today = () => formatDate(new Date());
const download = (content: string, name: string) => { const url = URL.createObjectURL(new Blob([content], { type: "application/json" })); const link = document.createElement("a"); link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url); };
const timeSort = <T extends { startTime?: string; time?: string; allDay?: boolean }>(a: T, b: T) => Number(Boolean(a.allDay)) - Number(Boolean(b.allDay)) || (a.startTime ?? a.time ?? "99:99").localeCompare(b.startTime ?? b.time ?? "99:99");
const itemTime = (item: LiverEvent | LiverTask | RankItem) => "startTime" in item ? item.startTime ?? (item.allDay ? "98:00" : "99:00") : "time" in item ? item.time ?? "99:00" : "98:00";
const displayItemTime = (item: LiverEvent | LiverTask | RankItem) => { const time = itemTime(item); return time === "99:00" ? "" : time === "98:00" ? ("startTime" in item || "time" in item ? "終日" : "") : time; };
const timeOptions = Array.from({ length: 48 }, (_, index) => `${String(Math.floor(index / 2)).padStart(2, "0")}:${index % 2 ? "30" : "00"}`);
const categoryClass = (category: string, kind: "event" | "task") => `category-tag category-${kind} category-${({ "配信": "red", "作業": "orange", "連絡": "yellow", "打合せ": "blue", "交流": "green", "プライベート": "gray", "申込": "blue", "発注": "orange", "問合せ": "yellow", "提出": "red", "その他": "gray" } as Record<string, string>)[category] ?? "gray"}`;
const dueClass = (date?: string) => {
  if (!date) return "";
  const days = Math.round((new Date(`${date}T12:00:00`).getTime() - new Date(`${today()}T12:00:00`).getTime()) / 86400000);
  return days <= 0 ? "due-red" : days <= 3 ? "due-orange" : days <= 5 ? "due-yellow" : days <= 7 ? "due-green" : "due-blue";
};

export function LiverPlanner() {
  const [state, setState] = useState<LiverPlannerState>({ version: 1, events: [], tasks: [] });
  const [rankItems, setRankItems] = useState<RankItem[]>([]);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("home");
  const [shareWeekStart, setShareWeekStart] = useState(tuesdayFor(today()));
  const [selectedDate, setSelectedDate] = useState(today());
  const [filter, setFilter] = useState("全て");
  const [editing, setEditing] = useState<{ kind: "event" | "task"; id?: string }>();
  const [shareEditorOpen, setShareEditorOpen] = useState(false);
  const [notice, setNotice] = useState<string>();
  const importRef = useRef<HTMLInputElement>(null);
  const currentToday = today();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(readLiverPlannerState(localStorage.getItem(LIVER_PLANNER_STORAGE_KEY)));
    try {
      const planner = decodePlannerState(localStorage.getItem(PLANNER_STORAGE_KEY) ?? "");
      setRankItems(rankCalendarItems(planner));
    } catch { /* rank calendar is optional */ }
    setReady(true);
    if (new URLSearchParams(window.location.search).get("weeklyImage") === "1") setShareEditorOpen(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem(LIVER_PLANNER_STORAGE_KEY, JSON.stringify(state)); }, [ready, state]);

  const eventsFor = (date: string) => state.events.filter((item) => item.date === date).sort(timeSort);
  const rankFor = (date: string) => rankItems.filter((item) => item.date === date);
  const tasksFor = (date: string) => state.tasks.filter((item) => item.scheduledDate === date || item.dueDate === date).sort(timeSort);
  const todayTasks = state.tasks.filter((item) => !item.completed && (item.scheduledDate === currentToday || item.dueDate === currentToday));
  const deadlines = state.tasks.filter((item) => !item.completed && item.dueDate && item.dueDate > currentToday && item.dueDate <= addDays(currentToday, 3)).sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""));
  const range7 = datesBetween(currentToday, 7), range10 = datesBetween(currentToday, 10), shareRange7 = datesBetween(shareWeekStart, 7);
  const allUpcoming = range10.flatMap((date) => [...eventsFor(date).map((item) => ({ kind: "予定" as const, date, item })), ...rankFor(date).map((item) => ({ kind: "IRIAM" as const, date, item })), ...tasksFor(date).filter((item) => !item.completed).map((item) => ({ kind: "タスク" as const, date, item }))]).sort((a, b) => a.date.localeCompare(b.date) || itemTime(a.item).localeCompare(itemTime(b.item)));
  const shownUpcoming = allUpcoming.filter((row) => filter === "全て" || row.kind === filter || (filter === "カテゴリ" && "category" in row.item));
  const toggleTask = (id: string) => setState((previous) => ({ ...previous, tasks: previous.tasks.map((task) => task.id === id ? { ...task, completed: !task.completed } : task) }));
  const deleteItem = (kind: "event" | "task", id: string) => { if (!confirm("この項目を削除しますか？")) return; setState((previous) => kind === "event" ? { ...previous, events: previous.events.filter((item) => item.id !== id) } : { ...previous, tasks: previous.tasks.filter((item) => item.id !== id) }); };
  const monthStart = new Date(`${selectedDate.slice(0, 7)}-01T12:00:00`);
  const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
  const calendarDays = Array.from({ length: daysInMonth }, (_, index) => `${selectedDate.slice(0, 7)}-${String(index + 1).padStart(2, "0")}`);

  const exportJson = () => { download(JSON.stringify(state, null, 2), "liver-planner.json"); setNotice("手帳の控えを保存しました。"); };
  const importJson = async (file?: File) => { if (!file) return; try { const saved = readLiverPlannerState(await file.text()); setState(saved); setNotice("保存していた手帳を復元しました。"); } catch { setNotice("保存ファイルを読み込めませんでした。"); } };
  const shareDays: WeeklyShareDay[] = shareRange7.map((date) => ({
      date,
      bonus: rankFor(date).map((item) => extractRankBonus(item.title)).find(Boolean),
      memo: rankFor(date).find((item) => item.memo)?.memo,
      items: [],
  }));

  return <section className="liver-planner planner-shell">
    <div className="tool-intro liver-intro"><span className="eyebrow">liver planner</span><h1>ライバー手帳</h1><p>配信以外の予定や締切タスクを管理し、IRIAMランク管理カレンダーからリスナー向け週間画像も作れる活動手帳です。</p></div>
    <aside className="planner-persistence-notice liver-storage-note">入力内容と、週間画像に追加したサムネ画像はこの端末内だけで処理・保存され、サーバーには送信されません。</aside>
    <aside className="liver-rank-note"><b>IRIAMの配信予定はランク管理カレンダーに登録してください</b><span>週間画像には、ランク管理カレンダーの＋値とメモが反映されます。配信内容や開始時刻は各日のメモ欄へ入力できます。</span><span><strong>ライバー手帳の予定・締切タスクは週間画像に反映されません。</strong>リスナーへ共有する画像に非公開情報が入ることはありません。</span><Link className="liver-rank-link" href="/tools/rank-calendar">IRIAMランク管理カレンダーを開く</Link></aside>
    <div className="liver-toolbar"><div className="liver-tabs" aria-label="表示切替">{([ ["home", "ホーム"], ["week", "今週"], ["ten", "直近10日"], ["month", "月" ]] as const).map(([key, label]) => <button type="button" className={tab === key ? "active" : ""} onClick={() => setTab(key)} key={key}>{label}</button>)}</div><div className="liver-actions"><button className="button secondary week-image-launch" type="button" onClick={() => setShareEditorOpen(true)}>週間画像を作る<span>Xでリスナーに共有</span></button><button className="button secondary" type="button" onClick={() => setEditing({ kind: "event" })}>その他の予定を登録<span>外出・打合せなど</span></button><button className="button" type="button" onClick={() => setEditing({ kind: "task" })}>タスクを登録<span>締切や期日のある作業</span></button></div></div>
    {notice && <p className="planner-persistence-notice" role="status">{notice}</p>}
    {tab === "home" && <div className="liver-sections">
      <PlannerSection title="今日締切"><TaskList tasks={state.tasks.filter((item) => !item.completed && item.dueDate === currentToday)} onToggle={toggleTask} onEdit={(id) => setEditing({ kind: "task", id })} /></PlannerSection>
      <PlannerSection title="今日の予定"><Agenda events={eventsFor(currentToday)} rank={rankFor(currentToday)} onEdit={(id) => setEditing({ kind: "event", id })} onDelete={(id) => deleteItem("event", id)} /></PlannerSection>
      <PlannerSection title="今日のタスク"><TaskList tasks={todayTasks} onToggle={toggleTask} onEdit={(id) => setEditing({ kind: "task", id })} /></PlannerSection>
      <PlannerSection title="締切が近いタスク"><TaskList tasks={deadlines} onToggle={toggleTask} onEdit={(id) => setEditing({ kind: "task", id })} /></PlannerSection>
      <PlannerSection title="今週の予定"><WeekRows dates={range7} eventsFor={eventsFor} rankFor={rankFor} tasksFor={tasksFor} onToggleTask={toggleTask} onEditEvent={(id) => setEditing({ kind: "event", id })} onEditTask={(id) => setEditing({ kind: "task", id })} /></PlannerSection>
    </div>}
    {tab === "week" && <PlannerSection title="今週"><WeekRows dates={range7} eventsFor={eventsFor} rankFor={rankFor} tasksFor={tasksFor} onToggleTask={toggleTask} onEditEvent={(id) => setEditing({ kind: "event", id })} onEditTask={(id) => setEditing({ kind: "task", id })} /></PlannerSection>}
    {tab === "ten" && <PlannerSection title="直近10日"><div className="liver-filter">{["全て", "予定", "タスク", "IRIAM", "カテゴリ"].map((value) => <button type="button" className={filter === value ? "active" : ""} onClick={() => setFilter(value)} key={value}>{value}</button>)}</div><div className="agenda-list">{shownUpcoming.length ? shownUpcoming.map(({ kind, date, item }, index) => <div className="agenda-row agenda-row-dated" key={`${kind}-${index}`}><b>{labelDate(date)}</b><span>{displayItemTime(item)}</span><div><em className={"category" in item ? categoryClass(item.category, kind === "予定" ? "event" : "task") : "category-tag category-event category-red"}>{"category" in item ? item.category : kind}</em><strong>{item.title}</strong>{item.memo && <small>{item.memo}</small>}</div></div>) : <Empty />}</div></PlannerSection>}
    {tab === "month" && <PlannerSection title={`${selectedDate.slice(0, 7).replace("-", "年")}月`}><div className="month-nav"><button type="button" onClick={() => setSelectedDate(addDays(`${selectedDate.slice(0, 7)}-01`, -1))}>前の月</button><button type="button" onClick={() => setSelectedDate(currentToday)}>今日</button><button type="button" onClick={() => setSelectedDate(addDays(`${selectedDate.slice(0, 7)}-28`, 40))}>次の月</button></div><div className="liver-calendar">{["日", "月", "火", "水", "木", "金", "土"].map((day) => <b key={day}>{day}</b>)}{Array.from({ length: monthStart.getDay() }, (_, i) => <span key={`blank-${i}`} />)}{calendarDays.map((date) => <button type="button" className={selectedDate === date ? "selected" : ""} onClick={() => setSelectedDate(date)} key={date}><b>{Number(date.slice(-2))}</b>{rankFor(date).length + eventsFor(date).length + tasksFor(date).length > 0 && <small>{rankFor(date).length + eventsFor(date).length + tasksFor(date).length}件</small>}</button>)}</div><div className="selected-day"><h3>{labelDate(selectedDate)}</h3><Agenda events={eventsFor(selectedDate)} rank={rankFor(selectedDate)} onEdit={(id) => setEditing({ kind: "event", id })} onDelete={(id) => deleteItem("event", id)} /><TaskList tasks={tasksFor(selectedDate)} onToggle={toggleTask} onEdit={(id) => setEditing({ kind: "task", id })} /></div></PlannerSection>}
    <div className="liver-backup"><span>手帳の引き継ぎ</span><button className="text-button" type="button" onClick={exportJson}>この手帳を保存する</button><button className="text-button" type="button" onClick={() => importRef.current?.click()}>保存した手帳を復元する</button><input ref={importRef} type="file" accept="application/json" hidden onChange={(event) => void importJson(event.target.files?.[0])} /></div>
    {shareEditorOpen && <WeeklyImageEditor days={shareDays} weekStart={shareWeekStart} onWeekChange={setShareWeekStart} onClose={() => setShareEditorOpen(false)} onSaved={() => setNotice("週間スケジュール画像を保存しました。Xにそのまま投稿できます。")} />}
    {editing?.kind === "event" && <EventEditor item={state.events.find((item) => item.id === editing.id)} defaultDate={selectedDate} onClose={() => setEditing(undefined)} onSave={(item) => { setState((previous) => ({ ...previous, events: editing.id ? previous.events.map((event) => event.id === editing.id ? item : event) : [...previous.events, item] })); setEditing(undefined); }} onDelete={editing.id ? () => { deleteItem("event", editing.id!); setEditing(undefined); } : undefined} />}
    {editing?.kind === "task" && <TaskEditor item={state.tasks.find((item) => item.id === editing.id)} onClose={() => setEditing(undefined)} onSave={(item) => { setState((previous) => ({ ...previous, tasks: editing.id ? previous.tasks.map((task) => task.id === editing.id ? item : task) : [...previous.tasks, item] })); setEditing(undefined); }} onDelete={editing.id ? () => { deleteItem("task", editing.id!); setEditing(undefined); } : undefined} />}
  </section>;
}

function PlannerSection({ title, children }: { title: string; children: React.ReactNode }) { return <section className="liver-section"><h2>{title}</h2>{children}</section>; }
function Empty() { return <p className="liver-empty">まだありません。右上のボタンから追加できます。</p>; }
function Agenda({ events, rank, onEdit, onDelete }: { events: LiverEvent[]; rank: RankItem[]; onEdit: (id: string) => void; onDelete: (id: string) => void }) { return <div className="agenda-list">{events.length || rank.length ? <>{events.sort(timeSort).map((item) => <div className="agenda-row" key={item.id}><span>{item.startTime ?? (item.allDay ? "終日" : "")}</span><div><em className={categoryClass(item.category, "event")}>{item.category}</em><strong>{item.title}</strong>{item.memo && <small>{item.memo}</small>}</div><aside><button type="button" onClick={() => onEdit(item.id)}>編集</button><button type="button" onClick={() => onDelete(item.id)}>削除</button></aside></div>)}{rank.map((item) => <div className="agenda-row" key={`${item.date}-${item.title}`}><span></span><div><em className="category-tag category-event category-red">IRIAM</em><strong>{item.title}</strong>{item.memo && <small>{item.memo}</small>}</div></div>)}</> : <Empty />}</div>; }
function TaskList({ tasks, onToggle, onEdit }: { tasks: LiverTask[]; onToggle: (id: string) => void; onEdit: (id: string) => void }) { return <div className="task-list">{tasks.length ? tasks.map((task) => <div className={`task-row ${task.completed ? "done" : ""}`} key={task.id}><input aria-label={`${task.title}を完了`} type="checkbox" checked={task.completed} onChange={() => onToggle(task.id)} /><div><em className={categoryClass(task.category, "task")}>{task.category}</em><strong>{task.title}</strong><small className="task-meta">{task.dueDate && <b className={`task-due ${dueClass(task.dueDate)}`}>締切 {task.dueDate}</b>}{task.memo && <span>{task.memo}</span>}</small></div><button type="button" onClick={() => onEdit(task.id)}>編集</button></div>) : <Empty />}</div>; }
function WeekRows({ dates, eventsFor, rankFor, tasksFor, onToggleTask, onEditEvent, onEditTask }: { dates: string[]; eventsFor: (date: string) => LiverEvent[]; rankFor: (date: string) => RankItem[]; tasksFor: (date: string) => LiverTask[]; onToggleTask: (id: string) => void; onEditEvent: (id: string) => void; onEditTask: (id: string) => void }) { return <div className="week-rows">{dates.map((date) => <div className="week-row" key={date}><h3>{labelDate(date)}</h3><Agenda events={eventsFor(date)} rank={rankFor(date)} onEdit={onEditEvent} onDelete={() => {}} /><TaskList tasks={tasksFor(date)} onToggle={onToggleTask} onEdit={onEditTask} /></div>)}</div>; }

function WeeklyImageEditor({ days, weekStart, onWeekChange, onClose, onSaved }: { days: WeeklyShareDay[]; weekStart: string; onWeekChange: (date: string) => void; onClose: () => void; onSaved: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [heading, setHeading] = useState("");
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [downloadUrl, setDownloadUrl] = useState<string>();
  const [shareFile, setShareFile] = useState<File>();
  const [saveStarted, setSaveStarted] = useState(false);
  const previewDays = useMemo(() => days.map((day) => {
    const thumbnail = thumbnails[day.date];
    if (!thumbnail) return day;
    const items = day.items.length ? day.items.map((item, index) => index === 0 ? { ...item, thumbnail } : item) : [{ kind: "配信" as const, title: "配信予定", thumbnail }];
    return { ...day, items };
  }), [days, thumbnails]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let objectUrl: string | undefined;
    setDownloadUrl(undefined);
    setShareFile(undefined);
    setSaveStarted(false);
    void (async () => {
      await document.fonts.ready;
      if (cancelled) return;
      await drawWeeklyPlannerImage(canvas, previewDays, { heading });
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (cancelled || !blob) return;
      const file = new File([blob], weeklyShareFilename(weekStart), { type: "image/png" });
      objectUrl = URL.createObjectURL(blob);
      setShareFile(file);
      setDownloadUrl(objectUrl);
    })();
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [heading, previewDays, weekStart]);

  const readImage = async (file: File | undefined, date: string) => {
    if (!file) return;
    try {
      const image = await resizeThumbnail(file);
      setThumbnails((previous) => ({ ...previous, [date]: image }));
    } catch (error) { alert(error instanceof Error ? error.message : "画像を読み込めませんでした。"); }
  };
  const canShareImage = (() => {
    if (!shareFile || typeof navigator === "undefined" || !navigator.share || !navigator.canShare) return false;
    try { return navigator.canShare({ files: [shareFile] }); } catch { return false; }
  })();
  const shareImage = () => {
    if (!shareFile || !navigator.share) return;
    try {
      const result = navigator.share({ files: [shareFile] });
      setSaveStarted(true);
      onSaved();
      void result.catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        alert("画像を共有できませんでした。もう一度お試しください。");
      });
    } catch {
      alert("画像を共有できませんでした。もう一度お試しください。");
    }
  };
  return <div className="liver-modal weekly-image-modal" role="dialog" aria-modal="true" aria-label="週間スケジュール画像を作る"><section className="weekly-image-editor"><header><div><span>火曜日〜月曜日</span><h2>週間スケジュール画像を作る</h2></div><button type="button" onClick={onClose}>閉じる</button></header><div className="weekly-image-nav"><button type="button" onClick={() => onWeekChange(addDays(weekStart, -7))}>前の週</button><b>{labelDate(days[0].date)} 〜 {labelDate(days[6].date)}</b><button type="button" onClick={() => onWeekChange(addDays(weekStart, 7))}>次の週</button></div><p className="weekly-image-help">ランク管理カレンダーの＋値とメモを反映した標準版を、そのまま保存できます。好みに合わせたい場合だけ各日のサムネを追加してください。</p><canvas ref={canvasRef} aria-label="週間スケジュール画像のプレビュー" /><details><summary>サムネを追加する（任意）</summary><div className="weekly-image-options"><label>見出し文字<input maxLength={40} placeholder="今週の配信スケジュール" value={heading} onChange={(event) => setHeading(event.target.value)} /></label><div className="weekly-thumbnail-grid">{days.map((day) => <label key={day.date}><b>{labelDate(day.date)}</b><span>{day.memo || "メモ未入力"}</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void readImage(event.target.files?.[0], day.date)} />{thumbnails[day.date] && <img src={thumbnails[day.date]} alt={`${labelDate(day.date)}のサムネ`} />}</label>)}</div></div></details>{canShareImage && <p className="weekly-mobile-save-help">iPhoneでは、表示される共有メニューから「画像を保存」を選んでください。</p>}<footer><button type="button" className="button secondary" onClick={onClose}>キャンセル</button>{saveStarted && <span className="weekly-save-status" role="status">保存を開始しました</span>}{canShareImage ? <button type="button" className="button weekly-download" onClick={() => void shareImage()}>PNG画像を保存</button> : <a className="button weekly-download" href={downloadUrl} download={weeklyShareFilename(weekStart)} aria-disabled={!downloadUrl} onClick={(event) => { if (!downloadUrl) { event.preventDefault(); return; } setSaveStarted(true); onSaved(); }}>PNG画像を保存</a>}</footer></section></div>;
}

function EditorShell({ title, children, onClose, onDelete, onSave }: { title: string; children: React.ReactNode; onClose: () => void; onDelete?: () => void; onSave: () => void }) { return <div className="liver-modal" role="dialog" aria-modal="true"><form className="liver-editor" onSubmit={(event) => { event.preventDefault(); onSave(); }}><header><h2>{title}</h2><button type="button" onClick={onClose}>閉じる</button></header>{children}<footer>{onDelete && <button className="delete-button" type="button" onClick={onDelete}>削除</button>}<button className="button" type="submit">保存</button></footer></form></div>; }
function EventEditor({ item, defaultDate, onClose, onSave, onDelete }: { item?: LiverEvent; defaultDate: string; onClose: () => void; onSave: (item: LiverEvent) => void; onDelete?: () => void }) {
  const [value, setValue] = useState<LiverEvent>(item ?? { id: makeLiverId(), title: "", date: defaultDate, allDay: false, category: "作業" });
  return <EditorShell title={item ? "予定を編集" : "その他の予定を登録"} onClose={onClose} onDelete={onDelete} onSave={() => onSave(value)}><div className="editor-fields"><label>タイトル<input autoFocus required value={value.title} onChange={(e) => setValue({ ...value, title: e.target.value })} /></label><label>日付<input type="date" required value={value.date} onChange={(e) => setValue({ ...value, date: e.target.value })} /></label><label className="check-label"><input type="checkbox" checked={value.allDay} onChange={(e) => setValue({ ...value, allDay: e.target.checked })} />終日</label>{!value.allDay && <><p className="time-select-note">時刻は30分刻みで登録できます</p><label>開始時刻<select value={value.startTime ?? ""} onChange={(e) => setValue({ ...value, startTime: e.target.value || undefined })}><option value="">選択しない</option>{timeOptions.map((time) => <option value={time} key={time}>{time}</option>)}</select></label><label>終了時刻<select value={value.endTime ?? ""} onChange={(e) => setValue({ ...value, endTime: e.target.value || undefined })}><option value="">選択しない</option>{timeOptions.map((time) => <option value={time} key={time}>{time}</option>)}</select></label></>}<label>カテゴリ<select value={value.category} onChange={(e) => setValue({ ...value, category: e.target.value as EventCategory })}>{EVENT_CATEGORIES.map((x) => <option disabled={x === "配信"} value={x} key={x}>{x === "配信" ? "配信（ランク管理カレンダーへ移行）" : x}</option>)}</select></label>{value.category === "配信" && <p className="legacy-stream-note">この予定は旧形式です。IRIAM配信予定はランク管理カレンダーへ登録してください。</p>}<label>メモ<textarea value={value.memo ?? ""} onChange={(e) => setValue({ ...value, memo: e.target.value || undefined })} /></label></div></EditorShell>;
}
function TaskEditor({ item, onClose, onSave, onDelete }: { item?: LiverTask; onClose: () => void; onSave: (item: LiverTask) => void; onDelete?: () => void }) { const [value, setValue] = useState<LiverTask>(item ?? { id: makeLiverId(), title: "", category: "その他", completed: false }); return <EditorShell title={item ? "タスクを編集" : "タスクを登録"} onClose={onClose} onDelete={onDelete} onSave={() => onSave(value)}><div className="editor-fields"><label>タイトル<input autoFocus required value={value.title} onChange={(e) => setValue({ ...value, title: e.target.value })} /></label><label>締切日<input type="date" required value={value.dueDate ?? ""} onChange={(e) => setValue({ ...value, dueDate: e.target.value || undefined })} /></label><p className="time-select-note">時刻は30分刻みで登録できます</p><label>締切り時刻<select value={value.time ?? ""} onChange={(e) => setValue({ ...value, time: e.target.value || undefined })}><option value="">選択しない</option>{timeOptions.map((time) => <option value={time} key={time}>{time}</option>)}</select></label><label>カテゴリ<select value={value.category} onChange={(e) => setValue({ ...value, category: e.target.value as TaskCategory })}>{TASK_CATEGORIES.map((x) => <option key={x}>{x}</option>)}</select></label><label>メモ<textarea value={value.memo ?? ""} onChange={(e) => setValue({ ...value, memo: e.target.value || undefined })} /></label></div></EditorShell>; }
