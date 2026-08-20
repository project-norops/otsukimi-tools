import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const layout = readFileSync(resolve(root, "app/layout.tsx"), "utf8");
const privacy = readFileSync(resolve(root, "app/privacy/page.tsx"), "utf8");
const rankPlanner = readFileSync(resolve(root, "components/rank-planner.tsx"), "utf8");

describe("anonymous page analytics boundary", () => {
  it("loads Vercel Web Analytics and links its disclosure", () => {
    expect(layout).toContain('import { Analytics } from "@vercel/analytics/next"');
    expect(layout).toContain("<Analytics />");
    expect(layout).toContain('href="/privacy"');
  });

  it("discloses what is and is not collected", () => {
    expect(privacy).toContain("Vercel Web Analytics");
    expect(privacy).toContain("入力した計画、ランク、スコア、メモ、ライバー名はアクセス解析へ送信しません");
    expect(privacy).toContain("計画保存、共有URL、PNG保存、カレンダー追加などの操作内容や入力値は計測しません");
  });

  it("does not add analytics calls to the rank planner", () => {
    expect(rankPlanner).not.toContain("@vercel/analytics");
    expect(rankPlanner).not.toContain("track(");
  });
});
