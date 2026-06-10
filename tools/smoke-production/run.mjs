import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

const DEFAULT_BASE_URL = 'https://fengshuiism.org';
const DEFAULT_OUTPUT_DIR = 'output/smoke-production';
const REQUIRED_EVENTS = [
  'tool_complete',
  'items_primary_cta_click',
  'cta_exposure',
  'checkout_click',
  'lead_submit_success',
  'lead_submit_fallback',
  'lead_submit_error',
  'lead_submit_error_config',
  'lead_submit_error_create_subscriber',
  'lead_submit_error_tag_subscriber',
];

const ROUTE_CHECKS = [
  { path: '/', kind: 'html' },
  { path: '/tools/kua-calculator', kind: 'html' },
  { path: '/tools/kua-calculator/', kind: 'html' },
  { path: '/tools/wealth-finder', kind: 'html' },
  { path: '/tools/wealth-finder/', kind: 'html' },
  {
    path: '/tools/room-scanner',
    kind: 'html',
    expectedFinalPath: '/tools/wealth-finder',
    allowMetaRefreshTarget: '/tools/wealth-finder',
  },
  {
    path: '/tools/room-scanner/',
    kind: 'html',
    expectedFinalPath: '/tools/wealth-finder',
    allowMetaRefreshTarget: '/tools/wealth-finder',
  },
  { path: '/Essentials', kind: 'html' },
  { path: '/Essentials/', kind: 'html' },
  {
    path: '/items',
    kind: 'html',
    expectedFinalPath: '/Essentials/2026-complete-bundle',
    allowMetaRefreshTarget: '/Essentials/2026-complete-bundle',
  },
  {
    path: '/items/',
    kind: 'html',
    expectedFinalPath: '/Essentials/2026-complete-bundle',
    allowMetaRefreshTarget: '/Essentials/2026-complete-bundle',
  },
  {
    path: '/zh/items',
    kind: 'html',
    expectedFinalPath: '/zh/items/2026-complete-bundle',
    allowMetaRefreshTarget: '/zh/items/2026-complete-bundle',
  },
  {
    path: '/zh/items/',
    kind: 'html',
    expectedFinalPath: '/zh/items/2026-complete-bundle',
    allowMetaRefreshTarget: '/zh/items/2026-complete-bundle',
  },
  {
    path: '/zh/tools/room-scanner',
    kind: 'html',
    expectedFinalPath: '/zh/tools/wealth-finder',
    allowMetaRefreshTarget: '/zh/tools/wealth-finder',
  },
  {
    path: '/zh/tools/room-scanner/',
    kind: 'html',
    expectedFinalPath: '/zh/tools/wealth-finder',
    allowMetaRefreshTarget: '/zh/tools/wealth-finder',
  },
  { path: '/ops', kind: 'html' },
  { path: '/ops/', kind: 'html' },
  { path: '/ops/funnel-dashboard', kind: 'html' },
  { path: '/ops/funnel-dashboard/', kind: 'html' },
  { path: '/ops/cloudflare-analytics', kind: 'html' },
  { path: '/ops/cloudflare-analytics/', kind: 'html' },
  { path: '/ops/cloudflare-analytics-summary.json', kind: 'json' },
  { path: '/ops/automations', kind: 'html' },
  { path: '/ops/automations/', kind: 'html' },
  { path: '/ops/automation-status.json', kind: 'json' },
  { path: '/ops/p0-readiness', kind: 'html' },
  { path: '/ops/p0-readiness/', kind: 'html' },
  { path: '/ops/p0-readiness.json', kind: 'json' },
  { path: '/ops/funnel-ops-triage', kind: 'html' },
  { path: '/ops/funnel-ops-triage/', kind: 'html' },
  { path: '/ops/funnel-ops-triage.json', kind: 'json' },
  { path: '/ops/funnel-dashboard.json', kind: 'json' },
  { path: '/ops/funnel-dashboard-v2.json', kind: 'json' },
  { path: '/ops/funnel-health-gate.json', kind: 'json' },
];

function parseArgs(argv) {
  const options = {
    base: DEFAULT_BASE_URL,
    outdir: DEFAULT_OUTPUT_DIR,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }
    if (arg === '--base') {
      const value = argv[index + 1];
      if (!value) throw new Error('--base 缺少参数。');
      options.base = value;
      index += 1;
      continue;
    }
    if (arg === '--outdir') {
      const value = argv[index + 1];
      if (!value) throw new Error('--outdir 缺少参数。');
      options.outdir = value;
      index += 1;
      continue;
    }
    throw new Error(`不支持的参数: ${arg}`);
  }

  return options;
}

function normalizeBaseUrl(value) {
  const url = new URL(value);
  if (!url.pathname.endsWith('/')) {
    url.pathname = `${url.pathname}/`;
  }
  return url.toString();
}

async function checkRoute(baseUrl, route) {
  const url = new URL(route.path.replace(/^\//, ''), baseUrl).toString();
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'user-agent': 'fengshuiism-smoke-check/1.0',
      },
    });

    const body = await response.text();
    const contentType = response.headers.get('content-type') ?? '';
    const pass = response.ok;
    return {
      path: route.path,
      kind: route.kind,
      status: response.status,
      ok: pass,
      finalUrl: response.url,
      contentType,
      body,
      error: null,
    };
  } catch (error) {
    return {
      path: route.path,
      kind: route.kind,
      status: 0,
      ok: false,
      finalUrl: '',
      contentType: '',
      body: '',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function validateDashboardJson(result) {
  const issues = [];
  const warnings = [];
  if (!result.ok) {
    issues.push('请求失败，无法验证 JSON 结构。');
    return { pass: false, issues, warnings, checkedCoverage: false };
  }

  let payload;
  try {
    payload = JSON.parse(result.body);
  } catch {
    issues.push('返回内容不是合法 JSON。');
    return { pass: false, issues, warnings, checkedCoverage: false };
  }

  if (typeof payload.ready !== 'boolean') {
    issues.push('ready 字段缺失或类型错误。');
    return { pass: false, issues, warnings, checkedCoverage: false };
  }

  if (!Array.isArray(payload.missingEvents)) {
    issues.push('missingEvents 字段缺失或类型错误。');
  }

  if (!Array.isArray(payload.coverage)) {
    issues.push('coverage 字段缺失或类型错误。');
  }

  if (issues.length > 0) {
    return { pass: false, issues, warnings, checkedCoverage: false };
  }

  if (payload.ready !== true) {
    warnings.push('ready=false（说明线上尚未生成本地化的漏斗产物文件，接口仍可用）。');
    return { pass: true, issues, warnings, checkedCoverage: false };
  }

  const missingEvents = Array.isArray(payload.missingEvents) ? payload.missingEvents : [];
  if (missingEvents.length > 0) {
    issues.push(`missingEvents 非空: ${missingEvents.join(', ')}`);
  }

  const coverage = Array.isArray(payload.coverage) ? payload.coverage : [];
  const coveredEvents = new Set(coverage.map((item) => item?.name).filter(Boolean));
  for (const required of REQUIRED_EVENTS) {
    if (!coveredEvents.has(required)) {
      issues.push(`缺少事件覆盖: ${required}`);
    }
  }

  return {
    pass: issues.length === 0,
    issues,
    warnings,
    checkedCoverage: true,
  };
}

function validateHealthGateJson(result) {
  const issues = [];
  const warnings = [];
  if (!result.ok) {
    issues.push('请求失败，无法验证 JSON 结构。');
    return { pass: false, issues, warnings };
  }

  let payload;
  try {
    payload = JSON.parse(result.body);
  } catch {
    issues.push('返回内容不是合法 JSON。');
    return { pass: false, issues, warnings };
  }

  if (typeof payload.status !== 'string') {
    issues.push('status 字段缺失或类型错误。');
  }

  if (typeof payload.generatedAt !== 'string') {
    issues.push('generatedAt 字段缺失或类型错误。');
  }

  const metrics = payload.metrics;
  if (!metrics || typeof metrics !== 'object' || Array.isArray(metrics)) {
    issues.push('metrics 字段缺失或类型错误。');
    return { pass: false, issues, warnings };
  }

  const requiredMetricKeys = [
    'overallStatus',
    'primaryCtaPolicyStatus',
    'missingEventsCount',
    'leadHealthStatus',
    'funnelSampleStatus',
    'leadSampleStatus',
    'snapshotFreshnessStatus',
  ];
  for (const key of requiredMetricKeys) {
    if (!(key in metrics)) {
      issues.push(`metrics.${key} 字段缺失。`);
    }
  }

  const freshness = String(metrics.snapshotFreshnessStatus ?? '').toLowerCase();
  const allowedFreshness = new Set(['fresh', 'stale', 'unknown']);
  if (!allowedFreshness.has(freshness)) {
    issues.push(`metrics.snapshotFreshnessStatus 非法：${metrics.snapshotFreshnessStatus}`);
  } else if (freshness === 'stale') {
    warnings.push('snapshotFreshnessStatus=stale（快照可能超过 24h，建议先刷新快照）。');
  } else if (freshness === 'unknown') {
    warnings.push('snapshotFreshnessStatus=unknown（无法判断快照新鲜度）。');
  }

  if (typeof metrics.missingEventsCount !== 'number' || Number.isNaN(metrics.missingEventsCount)) {
    issues.push('metrics.missingEventsCount 应为 number。');
  }

  return { pass: issues.length === 0, issues, warnings };
}

function validateDashboardV2Json(result) {
  const issues = [];
  const warnings = [];
  if (!result.ok) {
    issues.push('请求失败，无法验证 JSON 结构。');
    return { pass: false, issues, warnings };
  }

  let payload;
  try {
    payload = JSON.parse(result.body);
  } catch {
    issues.push('返回内容不是合法 JSON。');
    return { pass: false, issues, warnings };
  }

  if (typeof payload.ready !== 'boolean') {
    issues.push('ready 字段缺失或类型错误。');
  }
  if (!payload.dataQuality || typeof payload.dataQuality !== 'object' || Array.isArray(payload.dataQuality)) {
    issues.push('dataQuality 字段缺失或类型错误。');
  }
  if (!payload.leadErrorStages || typeof payload.leadErrorStages !== 'object' || Array.isArray(payload.leadErrorStages)) {
    issues.push('leadErrorStages 字段缺失或类型错误。');
  }
  if (!payload.healthGate || typeof payload.healthGate !== 'object' || Array.isArray(payload.healthGate)) {
    issues.push('healthGate 字段缺失或类型错误。');
  }
  if (!payload.opsTriage || typeof payload.opsTriage !== 'object' || Array.isArray(payload.opsTriage)) {
    issues.push('opsTriage 字段缺失或类型错误。');
  }

  if (issues.length > 0) {
    return { pass: false, issues, warnings };
  }

  const triageLevel = String(payload.opsTriage?.overallLevel ?? '').toLowerCase();
  const allowedLevels = new Set(['ok', 'notice', 'warning', 'critical']);
  if (!allowedLevels.has(triageLevel)) {
    issues.push(`opsTriage.overallLevel 非法：${payload.opsTriage?.overallLevel}`);
  }

  if (!Array.isArray(payload.opsTriage?.items)) {
    issues.push('opsTriage.items 字段缺失或类型错误。');
  } else if (payload.opsTriage.items.length === 0) {
    warnings.push('opsTriage.items 为空（应至少包含一条状态说明）。');
  }

  const gateStatus = String(payload.healthGate?.status ?? '').toLowerCase();
  const allowedGateStatus = new Set(['ok', 'warn', 'alert', 'unknown']);
  if (!allowedGateStatus.has(gateStatus)) {
    issues.push(`healthGate.status 非法：${payload.healthGate?.status}`);
  }

  return { pass: issues.length === 0, issues, warnings };
}

function validateOpsTriageJson(result) {
  const issues = [];
  const warnings = [];
  if (!result.ok) {
    issues.push('请求失败，无法验证 JSON 结构。');
    return { pass: false, issues, warnings };
  }

  let payload;
  try {
    payload = JSON.parse(result.body);
  } catch {
    issues.push('返回内容不是合法 JSON。');
    return { pass: false, issues, warnings };
  }

  if (typeof payload.generatedAt !== 'string') {
    issues.push('generatedAt 字段缺失或类型错误。');
  }

  const overallLevel = String(payload.overallLevel ?? '').toLowerCase();
  const allowedLevels = new Set(['ok', 'notice', 'warning', 'critical']);
  if (!allowedLevels.has(overallLevel)) {
    issues.push(`overallLevel 非法：${payload.overallLevel}`);
  }

  if (!payload.counts || typeof payload.counts !== 'object' || Array.isArray(payload.counts)) {
    issues.push('counts 字段缺失或类型错误。');
  }

  if (!Array.isArray(payload.items)) {
    issues.push('items 字段缺失或类型错误。');
  } else if (payload.items.length === 0) {
    warnings.push('items 为空（应至少有一条分级说明）。');
  }

  return { pass: issues.length === 0, issues, warnings };
}

function validateP0ReadinessJson(result) {
  const issues = [];
  const warnings = [];
  if (!result.ok) {
    issues.push('请求失败，无法验证 JSON 结构。');
    return { pass: false, issues, warnings };
  }

  let payload;
  try {
    payload = JSON.parse(result.body);
  } catch {
    issues.push('返回内容不是合法 JSON。');
    return { pass: false, issues, warnings };
  }

  if (typeof payload.generatedAt !== 'string') {
    issues.push('generatedAt 字段缺失或类型错误。');
  }

  const status = String(payload.status ?? '').toLowerCase();
  const allowedStatus = new Set(['pass', 'warn', 'fail']);
  if (!allowedStatus.has(status)) {
    issues.push(`status 非法：${payload.status}`);
  }

  if (!payload.counts || typeof payload.counts !== 'object' || Array.isArray(payload.counts)) {
    issues.push('counts 字段缺失或类型错误。');
  }

  if (!Array.isArray(payload.checks)) {
    issues.push('checks 字段缺失或类型错误。');
  } else if (payload.checks.length === 0) {
    warnings.push('checks 为空（应至少包含一条检查项）。');
  }

  if (!payload.metrics || typeof payload.metrics !== 'object' || Array.isArray(payload.metrics)) {
    issues.push('metrics 字段缺失或类型错误。');
  } else {
    if (typeof payload.metrics.missingEventsCount !== 'number' || Number.isNaN(payload.metrics.missingEventsCount)) {
      issues.push('metrics.missingEventsCount 应为 number。');
    }
    if (typeof payload.metrics.primaryCtaPolicyStatus !== 'string') {
      issues.push('metrics.primaryCtaPolicyStatus 字段缺失或类型错误。');
    }
  }

  if (status === 'fail') {
    warnings.push('P0 readiness.status=fail（线上存在阻断项）。');
  }

  return { pass: issues.length === 0, issues, warnings };
}

function normalizePath(value) {
  return value.replace(/\/+$/, '') || '/';
}

function extractMetaRefreshTarget(html) {
  if (typeof html !== 'string' || html.length === 0) return null;
  const match = html.match(/<meta[^>]*http-equiv=["']refresh["'][^>]*content=["'][^"']*url=([^"'>\s]+)[^"']*["'][^>]*>/i);
  if (!match?.[1]) return null;
  return match[1].trim();
}

function validateRouteExpectations(results) {
  const issues = [];

  for (const route of ROUTE_CHECKS) {
    if (!route.expectedFinalPath) continue;
    const result = results.find((item) => item.path === route.path);
    if (!result || !result.ok) continue;

    let finalPathname = '';
    try {
      finalPathname = new URL(result.finalUrl).pathname.replace(/\/+$/, '') || '/';
    } catch {
      issues.push(`${route.path} 无法解析最终 URL：${result.finalUrl || '(empty)'}`);
      continue;
    }

    const expected = normalizePath(route.expectedFinalPath);
    if (finalPathname !== expected) {
      const allowedTarget = route.allowMetaRefreshTarget ? normalizePath(route.allowMetaRefreshTarget) : null;
      const metaRefreshTargetRaw = extractMetaRefreshTarget(result.body);
      let metaRefreshPath = null;

      if (metaRefreshTargetRaw) {
        try {
          metaRefreshPath = normalizePath(new URL(metaRefreshTargetRaw, result.finalUrl).pathname);
        } catch {
          metaRefreshPath = normalizePath(metaRefreshTargetRaw);
        }
      }

      if (allowedTarget && metaRefreshPath === allowedTarget) {
        continue;
      }

      issues.push(`${route.path} 最终落地应为 ${route.expectedFinalPath}，实际为 ${finalPathname}`);
    }
  }

  return issues;
}

function buildSummaryMarkdown({
  generatedAt,
  baseUrl,
  results,
  dashboardValidation,
  dashboardV2Validation,
  opsTriageValidation,
  p0ReadinessValidation,
  healthGateValidation,
  routeExpectationIssues,
  passed,
}) {
  const lines = [
    '# Production Smoke Check',
    '',
    `- 生成时间（UTC）：${generatedAt}`,
    `- 检查站点：${baseUrl}`,
    `- 总体状态：${passed ? 'PASS' : 'FAIL'}`,
    '',
    '## 路由检查',
    '',
    '| 路径 | 状态码 | 结果 | 最终 URL |',
    '| --- | ---: | --- | --- |',
  ];

  for (const item of results) {
    lines.push(`| ${item.path} | ${item.status} | ${item.ok ? 'PASS' : 'FAIL'} | ${item.finalUrl || '-'} |`);
  }

  lines.push('');
  lines.push('## 路由期望校验');
  lines.push('');
  lines.push(`- 结果：${routeExpectationIssues.length === 0 ? 'PASS' : 'FAIL'}`);
  if (routeExpectationIssues.length > 0) {
    for (const issue of routeExpectationIssues) {
      lines.push(`- ${issue}`);
    }
  } else {
    lines.push('- 关键重定向（含 /zh/items 与 room-scanner 历史路径）符合预期。');
  }

  lines.push('');
  lines.push('## Funnel JSON 校验');
  lines.push('');
  lines.push(`- 结果：${dashboardValidation.pass ? 'PASS' : 'FAIL'}`);
  if (dashboardValidation.warnings.length > 0) {
    for (const warning of dashboardValidation.warnings) {
      lines.push(`- [WARN] ${warning}`);
    }
  }
  if (dashboardValidation.issues.length > 0) {
    for (const issue of dashboardValidation.issues) {
      lines.push(`- ${issue}`);
    }
  } else {
    lines.push(
      dashboardValidation.checkedCoverage
        ? '- 必需事件覆盖完整，且 missingEvents 为空。'
        : '- JSON 接口结构正常；事件覆盖明细待每日产物生成后再校验。',
    );
  }

  lines.push('');
  lines.push('## Funnel V2 JSON 校验');
  lines.push('');
  lines.push(`- 结果：${dashboardV2Validation.pass ? 'PASS' : 'FAIL'}`);
  if (dashboardV2Validation.warnings.length > 0) {
    for (const warning of dashboardV2Validation.warnings) {
      lines.push(`- [WARN] ${warning}`);
    }
  }
  if (dashboardV2Validation.issues.length > 0) {
    for (const issue of dashboardV2Validation.issues) {
      lines.push(`- ${issue}`);
    }
  } else {
    lines.push('- V2 字段（dataQuality / leadErrorStages / healthGate / opsTriage）结构有效。');
  }

  lines.push('');
  lines.push('## Ops Triage JSON 校验');
  lines.push('');
  lines.push(`- 结果：${opsTriageValidation.pass ? 'PASS' : 'FAIL'}`);
  if (opsTriageValidation.warnings.length > 0) {
    for (const warning of opsTriageValidation.warnings) {
      lines.push(`- [WARN] ${warning}`);
    }
  }
  if (opsTriageValidation.issues.length > 0) {
    for (const issue of opsTriageValidation.issues) {
      lines.push(`- ${issue}`);
    }
  } else {
    lines.push('- Ops Triage 结构有效。');
  }

  lines.push('');
  lines.push('## P0 Readiness JSON 校验');
  lines.push('');
  lines.push(`- 结果：${p0ReadinessValidation.pass ? 'PASS' : 'FAIL'}`);
  if (p0ReadinessValidation.warnings.length > 0) {
    for (const warning of p0ReadinessValidation.warnings) {
      lines.push(`- [WARN] ${warning}`);
    }
  }
  if (p0ReadinessValidation.issues.length > 0) {
    for (const issue of p0ReadinessValidation.issues) {
      lines.push(`- ${issue}`);
    }
  } else {
    lines.push('- P0 readiness 结构有效。');
  }

  lines.push('');
  lines.push('## Health Gate JSON 校验');
  lines.push('');
  lines.push(`- 结果：${healthGateValidation.pass ? 'PASS' : 'FAIL'}`);
  if (healthGateValidation.warnings.length > 0) {
    for (const warning of healthGateValidation.warnings) {
      lines.push(`- [WARN] ${warning}`);
    }
  }
  if (healthGateValidation.issues.length > 0) {
    for (const issue of healthGateValidation.issues) {
      lines.push(`- ${issue}`);
    }
  } else {
    lines.push('- 门禁关键字段存在且结构有效。');
  }

  return `${lines.join('\n')}\n`;
}

function printHelp() {
  console.log(`
用法:
  node tools/smoke-check-production.mjs [--base https://fengshuiism.org] [--outdir output/smoke-production]
`.trim());
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const baseUrl = normalizeBaseUrl(options.base);
  const outputDir = resolve(process.cwd(), options.outdir);
  mkdirSync(outputDir, { recursive: true });

  const results = [];
  for (const route of ROUTE_CHECKS) {
    // 顺序执行，保证日志可读且避免瞬时并发触发边缘限流。
    // eslint-disable-next-line no-await-in-loop
    const result = await checkRoute(baseUrl, route);
    results.push(result);
  }

  const dashboardJsonResult = results.find((item) => item.path === '/ops/funnel-dashboard.json');
  const dashboardV2JsonResult = results.find((item) => item.path === '/ops/funnel-dashboard-v2.json');
  const opsTriageJsonResult = results.find((item) => item.path === '/ops/funnel-ops-triage.json');
  const p0ReadinessJsonResult = results.find((item) => item.path === '/ops/p0-readiness.json');
  const healthGateJsonResult = results.find((item) => item.path === '/ops/funnel-health-gate.json');
  const routeExpectationIssues = validateRouteExpectations(results);
  const dashboardValidation = dashboardJsonResult
    ? validateDashboardJson(dashboardJsonResult)
    : {
        pass: false,
        issues: ['未找到 /ops/funnel-dashboard.json 检查结果。'],
        warnings: [],
        checkedCoverage: false,
      };
  const healthGateValidation = healthGateJsonResult
    ? validateHealthGateJson(healthGateJsonResult)
    : {
        pass: false,
        issues: ['未找到 /ops/funnel-health-gate.json 检查结果。'],
        warnings: [],
      };
  const dashboardV2Validation = dashboardV2JsonResult
    ? validateDashboardV2Json(dashboardV2JsonResult)
    : {
        pass: false,
        issues: ['未找到 /ops/funnel-dashboard-v2.json 检查结果。'],
        warnings: [],
      };
  const opsTriageValidation = opsTriageJsonResult
    ? validateOpsTriageJson(opsTriageJsonResult)
    : {
        pass: false,
        issues: ['未找到 /ops/funnel-ops-triage.json 检查结果。'],
        warnings: [],
      };
  const p0ReadinessValidation = p0ReadinessJsonResult
    ? validateP0ReadinessJson(p0ReadinessJsonResult)
    : {
        pass: false,
        issues: ['未找到 /ops/p0-readiness.json 检查结果。'],
        warnings: [],
      };

  const routeFailed = results.some((item) => !item.ok);
  const passed = !routeFailed
    && routeExpectationIssues.length === 0
    && dashboardValidation.pass
    && dashboardV2Validation.pass
    && opsTriageValidation.pass
    && p0ReadinessValidation.pass
    && healthGateValidation.pass;

  const generatedAt = new Date().toISOString();
  const jsonOutput = {
    generatedAt,
    baseUrl,
    passed,
    routes: results.map((item) => ({
      path: item.path,
      kind: item.kind,
      status: item.status,
      ok: item.ok,
      finalUrl: item.finalUrl,
      error: item.error,
    })),
    routeExpectationIssues,
    dashboardValidation,
    dashboardV2Validation,
    opsTriageValidation,
    p0ReadinessValidation,
    healthGateValidation,
  };

  writeFileSync(join(outputDir, 'summary.json'), `${JSON.stringify(jsonOutput, null, 2)}\n`, 'utf8');
  writeFileSync(
    join(outputDir, 'summary.md'),
    buildSummaryMarkdown({
      generatedAt,
      baseUrl,
      results,
      dashboardValidation,
      dashboardV2Validation,
      opsTriageValidation,
      p0ReadinessValidation,
      healthGateValidation,
      routeExpectationIssues,
      passed,
    }),
    'utf8',
  );

  console.log(`[smoke-check] base=${baseUrl}`);
  console.log(`[smoke-check] output=${outputDir}`);
  console.log(`[smoke-check] result=${passed ? 'PASS' : 'FAIL'}`);

  if (!passed) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('[smoke-check] 执行失败:', error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
