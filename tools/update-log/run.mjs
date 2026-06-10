#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const UPDATE_FILE = "WEBSITE_UPDATES.md";

function getArg(name) {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : "";
}

function isAllZeros(value) {
  return Boolean(value) && /^0+$/.test(value);
}

function commitExists(ref) {
  return Boolean(runGit(["rev-parse", "--verify", "--quiet", `${ref}^{commit}`]));
}

function runGit(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8", maxBuffer: 50 * 1024 * 1024 }).trim();
  } catch {
    return "";
  }
}

function splitLines(text) {
  return text ? text.split("\n").filter(Boolean) : [];
}

function shouldRequireUpdate(filePath) {
  return Boolean(filePath) && filePath !== UPDATE_FILE;
}

function parseStatusLine(line) {
  const parts = line.split("\t");
  if (parts.length < 2) return null;

  const code = parts[0][0];
  if (!["A", "C", "M", "R", "D"].includes(code)) return null;

  const path = code === "R" || code === "C" ? parts[2] : parts[1];
  if (!path) return null;
  return { code, path };
}

function collectStagedEntries() {
  const lines = splitLines(runGit(["diff", "--cached", "--name-status", "--diff-filter=ACMRD"]));
  return lines
    .map(parseStatusLine)
    .filter(Boolean)
    .filter((entry) => shouldRequireUpdate(entry.path));
}

function readStagedDigestSource() {
  return runGit(["diff", "--cached", "--raw", "--diff-filter=ACMRD", "--", ".", `:(exclude)${UPDATE_FILE}`]);
}

function collectRangeEntries(base, head) {
  const lines = splitLines(runGit(["diff", "--name-status", "--diff-filter=ACMRD", `${base}..${head}`]));
  return lines
    .map(parseStatusLine)
    .filter(Boolean)
    .filter((entry) => shouldRequireUpdate(entry.path));
}

function readRangeDigestSource(base, head) {
  return runGit(["diff", "--raw", "--diff-filter=ACMRD", `${base}..${head}`, "--", ".", `:(exclude)${UPDATE_FILE}`]);
}

function collectSingleCommitEntries(head) {
  const lines = splitLines(runGit(["diff-tree", "--no-commit-id", "--name-status", "-r", "--diff-filter=ACMRD", head]));
  return lines
    .map(parseStatusLine)
    .filter(Boolean)
    .filter((entry) => shouldRequireUpdate(entry.path));
}

function readSingleCommitDigestSource(head) {
  return runGit(["show", "--format=", "--raw", "--diff-filter=ACMRD", head, "--", ".", `:(exclude)${UPDATE_FILE}`]);
}

function resolveMode() {
  const base = getArg("base");
  const head = getArg("head");

  if (!base && !head) {
    return { mode: "staged" };
  }

  if (!base || !head) {
    throw new Error("参数错误：--base 和 --head 必须同时提供。");
  }

  if (!commitExists(head)) {
    throw new Error(`无法解析 head 提交：${head}`);
  }

  if (isAllZeros(base)) {
    if (commitExists(`${head}^`)) {
      return { mode: "range", base: `${head}^`, head };
    }
    return { mode: "single", head };
  }

  if (!commitExists(base)) {
    throw new Error(`无法解析 base 提交：${base}`);
  }

  return { mode: "range", base, head };
}

function getEntriesAndDiff(modeInfo) {
  if (modeInfo.mode === "staged") {
    return {
      mode: "staged",
      entries: collectStagedEntries(),
      digestSource: readStagedDigestSource(),
    };
  }

  if (modeInfo.mode === "single") {
    return {
      mode: "single-commit",
      entries: collectSingleCommitEntries(modeInfo.head),
      digestSource: readSingleCommitDigestSource(modeInfo.head),
    };
  }

  return {
    mode: "range",
    entries: collectRangeEntries(modeInfo.base, modeInfo.head),
    digestSource: readRangeDigestSource(modeInfo.base, modeInfo.head),
  };
}

function getDigest(text) {
  return createHash("sha1").update(text).digest("hex").slice(0, 10);
}

function getTimestamp() {
  const now = new Date();
  const local = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);
  return local.replace(/\//g, "-");
}

function getIsoTimestamp() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(now);

  const map = Object.fromEntries(parts.filter((p) => p.type !== "literal").map((p) => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}:${map.second}+08:00`;
}

function getPullRequestNumber() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath || !existsSync(eventPath)) return null;

  try {
    const event = JSON.parse(readFileSync(eventPath, "utf8"));
    if (event?.pull_request?.number) {
      return Number(event.pull_request.number);
    }
  } catch {
    // ignore parse errors and fallback to null
  }

  return null;
}

function getDeployHint() {
  if (process.env.GITHUB_ACTIONS !== "true") return "local";

  if (process.env.GITHUB_EVENT_NAME === "push") return "pending";
  if (process.env.GITHUB_EVENT_NAME === "pull_request") return "not_applicable";
  return "unknown";
}

function categorize(path) {
  if (path.startsWith(".github/workflows/")) return "CI流程";
  if (path.startsWith("tools/")) return "工程脚本";
  if (path.startsWith("tests/")) return "测试质量";
  if (path.endsWith(".md") || path.endsWith(".mdx")) return "文档内容";
  if (path.startsWith("src/pages/")) return "页面路由";
  if (path.startsWith("src/components/")) return "组件交互";
  if (path.startsWith("src/content/")) return "内容数据";
  if (path.startsWith("src/styles/") || path === "tailwind.config.mjs") return "样式主题";
  if (path.startsWith("public/")) return "静态资源";
  if (path === "astro.config.mjs") return "路由配置";
  if (path === "package.json" || path === "pnpm-lock.yaml") return "依赖构建";
  return "站点实现";
}

function topCategories(entries, limit = 3) {
  const counts = new Map();
  for (const entry of entries) {
    const key = categorize(entry.path);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name]) => name);
}

function sectionName(entries) {
  const hasUserFacing = entries.some((e) => e.path.startsWith("src/") || e.path.startsWith("public/"));
  return hasUserFacing ? "Changed" : "Infra";
}

function buildSummary(entries, digest, modeInfo, mode) {
  const summary = { A: 0, M: 0, D: 0 };

  for (const entry of entries) {
    if (entry.code === "A" || entry.code === "C" || entry.code === "R") summary.A += 1;
    if (entry.code === "M") summary.M += 1;
    if (entry.code === "D") summary.D += 1;
  }

  const time = getTimestamp();
  const isoTime = getIsoTimestamp();
  const total = entries.length;
  const countText = `A${summary.A}/M${summary.M}/D${summary.D}`;
  const scopes = topCategories(entries);
  const scopeText = scopes.join("、") || "站点实现";
  const meta = {
    base: modeInfo.base ?? null,
    head: modeInfo.head ?? null,
    mode,
    timestamp: isoTime,
    files: { A: summary.A, M: summary.M, D: summary.D, total },
    topScopes: scopes,
    pr: getPullRequestNumber(),
    deploy: getDeployHint(),
  };

  return {
    section: sectionName(entries),
    bullet: `- [自动记录 ${time}] 本次更新涉及 ${total} 个文件（${countText}），主要范围：${scopeText}。`,
    marker: `<!-- auto-log:${digest} -->`,
    metaMarker: `<!-- auto-meta: ${JSON.stringify(meta)} -->`,
  };
}

function ensureFileExists() {
  if (existsSync(UPDATE_FILE)) return;
  const initial = [
    "# 网站更新记录（Website Updates）",
    "",
    "## [Unreleased]",
    "",
    "### Changed",
    "",
    "- 初始化自动更新日志。",
    "",
  ].join("\n");
  writeFileSync(UPDATE_FILE, initial, "utf8");
}

function getHeadings(lines) {
  const headings = [];
  let inFence = false;

  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i].trim();

    if (trimmed.startsWith("```")) {
      inFence = !inFence;
      continue;
    }

    if (inFence) continue;

    const match = trimmed.match(/^(#{2,3})\s+(.+)$/);
    if (!match) continue;

    headings.push({
      index: i,
      level: match[1].length,
      text: trimmed,
    });
  }

  return headings;
}

function findUnreleasedRange(lines) {
  const headings = getHeadings(lines);
  const start = headings.find((h) => h.level === 2 && h.text === "## [Unreleased]");
  if (!start) return null;

  const nextL2 = headings.find((h) => h.level === 2 && h.index > start.index);
  const scanEnd = nextL2 ? nextL2.index : lines.length;
  let end = scanEnd;

  let inFence = false;
  for (let i = start.index + 1; i < scanEnd; i += 1) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (trimmed === "---") {
      end = i;
      break;
    }
  }

  return { start: start.index, end };
}

function findSectionRange(lines, unreleasedRange, section) {
  const heading = `### ${section}`;
  const headings = getHeadings(lines).filter(
    (h) => h.index > unreleasedRange.start && h.index < unreleasedRange.end && h.level === 3,
  );

  const current = headings.find((h) => h.text === heading);
  if (!current) return null;

  const next = headings.find((h) => h.index > current.index);
  const end = next ? next.index : unreleasedRange.end;

  return { start: current.index, end };
}

function ensureSection(lines, unreleasedRange, section) {
  let sectionRange = findSectionRange(lines, unreleasedRange, section);
  if (sectionRange) return sectionRange;

  const block = ["", `### ${section}`, "", "- （待补充）", ""];
  lines.splice(unreleasedRange.end, 0, ...block);

  const nextRange = {
    start: unreleasedRange.start,
    end: unreleasedRange.end + block.length,
  };

  sectionRange = findSectionRange(lines, nextRange, section);
  if (!sectionRange) {
    throw new Error(`无法创建 ### ${section} 区块。`);
  }

  return sectionRange;
}

function insertAutoEntry(section, bullet, marker, metaMarker) {
  const content = readFileSync(UPDATE_FILE, "utf8");
  const lines = content.split("\n");

  if (lines.some((line) => line.includes(marker))) {
    return { changed: false, reason: "duplicate" };
  }

  const unreleasedRange = findUnreleasedRange(lines);
  if (!unreleasedRange) {
    throw new Error("未找到 ## [Unreleased] 区块，无法自动写入更新日志。");
  }

  const sectionRange = ensureSection(lines, unreleasedRange, section);

  let placeholderIndex = -1;
  for (let i = sectionRange.start + 1; i < sectionRange.end; i += 1) {
    if (lines[i].trim() === "- （待补充）") {
      placeholderIndex = i;
      break;
    }
  }

  let effectiveEnd = sectionRange.end;
  if (placeholderIndex !== -1) {
    lines.splice(placeholderIndex, 1);
    effectiveEnd -= 1;
  }

  let insertAt = effectiveEnd;
  while (insertAt > sectionRange.start + 1 && lines[insertAt - 1].trim() === "") {
    insertAt -= 1;
  }

  const payload = ["", bullet, marker, metaMarker, ""];
  lines.splice(insertAt, 0, ...payload);

  writeFileSync(UPDATE_FILE, `${lines.join("\n")}\n`, "utf8");
  return { changed: true, reason: "inserted" };
}

function main() {
  ensureFileExists();

  const modeInfo = resolveMode();
  const { mode, entries, digestSource } = getEntriesAndDiff(modeInfo);

  if (!digestSource) {
    console.log("[updates-auto] 跳过：未检测到可比较的变更。");
    return;
  }

  if (entries.length === 0) {
    console.log(`[updates-auto] 跳过：${mode} 模式下无网站关键变更。`);
    return;
  }

  const digest = getDigest(digestSource);
  const { section, bullet, marker, metaMarker } = buildSummary(entries, digest, modeInfo, mode);
  const result = insertAutoEntry(section, bullet, marker, metaMarker);

  if (result.changed) {
    console.log(`[updates-auto] 已自动写入 WEBSITE_UPDATES.md（${section}，模式: ${mode}）。`);
  } else {
    console.log("[updates-auto] 跳过：相同变更摘要已存在。");
  }
}

main();
