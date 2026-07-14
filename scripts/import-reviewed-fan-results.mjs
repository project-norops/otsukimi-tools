import { readFileSync, writeFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const reviewedPath = new URL("docs/FAN_RESULTS_REVIEWED.md", root);
const sourcePath = new URL("src/lib/fan-tools.ts", root);
const reviewed = readFileSync(reviewedPath, "utf8");
let source = readFileSync(sourcePath, "utf8");

const unescapeCell = (value) => value.trim().replaceAll("\\|", "|").replaceAll("<br>", "\n");
const rows = reviewed.split(/\r?\n/).flatMap((line) => {
  if (!/^\| (daily|fortune|alert|match)-\d+ \|/.test(line)) return [];
  const cells = line.slice(2, -2).split(" | ").map(unescapeCell);
  return [{ id: cells[0], title: cells[2], body: cells[3] }];
});

if (rows.length !== 88) throw new Error(`Expected 88 reviewed rows, found ${rows.length}.`);

const escapeTs = (value) => JSON.stringify(value).slice(1, -1);
const replacePairAt = (block, index, title, body) => {
  let current = -1;
  return block.replace(/^  \["(?:[^"\\]|\\.)*", "(?:[^"\\]|\\.)*"\],$/gm, (line) => {
    current += 1;
    return current === index ? `  ["${escapeTs(title)}", "${escapeTs(body)}"],` : line;
  });
};

for (const [prefix, blockName] of [["daily", "dailyTexts"], ["fortune", "fortuneTexts"], ["alert", "alertTexts"]]) {
  const pattern = new RegExp(`const ${blockName} = \\[([\\s\\S]*?)\\n\\] as const;`);
  const match = source.match(pattern);
  if (!match) throw new Error(`Could not find ${blockName}.`);
  let block = match[0];
  const group = rows.filter((row) => row.id.startsWith(`${prefix}-`));
  group.forEach((row, index) => { block = replacePairAt(block, index, row.title, row.body); });
  source = source.replace(match[0], block);
}

const matchPattern = /const matchTexts = \[([\s\S]*?)\n\] as const;/;
const matchBlock = source.match(matchPattern);
if (!matchBlock) throw new Error("Could not find matchTexts.");
let matchIndex = -1;
const matchRows = rows.filter((row) => row.id.startsWith("match-"));
const updatedMatchBlock = matchBlock[0].replace(/^  "(?:[^"\\]|\\.)*",$/gm, (line) => {
  matchIndex += 1;
  const row = matchRows[matchIndex];
  return row ? `  "${escapeTs(row.body)}",` : line;
});
if (matchIndex + 1 !== matchRows.length) throw new Error("Reviewed match result count did not match source.");
source = source.replace(matchBlock[0], updatedMatchBlock);

writeFileSync(sourcePath, source, "utf8");
console.log(`Imported ${rows.length} reviewed results.`);
