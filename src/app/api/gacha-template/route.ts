import { GACHA_IMPORT_TEMPLATE, GACHA_IMPORT_TEMPLATE_FILENAME } from "@/lib/gacha-planner";

export function GET() {
  return new Response(`\uFEFF${GACHA_IMPORT_TEMPLATE}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(GACHA_IMPORT_TEMPLATE_FILENAME)}`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
