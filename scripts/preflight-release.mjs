import { execFileSync } from "node:child_process";

function git(args) {
  return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function fail(message) {
  console.error(`\nRelease preflight failed: ${message}`);
  process.exit(1);
}

const changes = git(["status", "--porcelain=v1"]);
if (changes) fail("未コミットの変更があります。コミットするか、安全な場所へ退避してからpushしてください。");

const branch = git(["branch", "--show-current"]);
if (branch === "main" || branch === "master") {
  fail("mainへの直接pushは禁止です。作業ブランチからPRを作成してください。");
}

try {
  const [behind] = git(["rev-list", "--left-right", "--count", "@{u}...HEAD"])
    .split(/\s+/)
    .map(Number);
  if (behind > 0) fail("リモートブランチより遅れています。先に最新状態を取り込んでください。");
} catch {
  console.log("No tracking branch yet; allowing the initial branch push.");
}

console.log("Release preflight passed.");
