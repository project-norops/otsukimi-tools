import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("gacha CSV template route", () => {
  it("downloads a BOM-prefixed UTF-8 CSV with a Japanese filename", async () => {
    const response = GET();
    expect(response.headers.get("content-type")).toBe("text/csv; charset=utf-8");
    expect(response.headers.get("content-disposition")).toContain("attachment;");
    expect(response.headers.get("content-disposition")).toContain(encodeURIComponent("ガチャ景品読み込みテンプレート.csv"));
    const bytes = new Uint8Array(await response.arrayBuffer());
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    expect(new TextDecoder().decode(bytes.slice(3))).toBe("レアリティ,景品名,確率,原価,在庫\r\nS,特賞,2,1000,2\r\nN,参加賞,98,0,");
  });
});
