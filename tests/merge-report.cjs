const fs = require("fs");
const path = require("path");

function readJSON(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return fallback; }
}

function parseAppiumSummary(mdPath) {
  try {
    const md = fs.readFileSync(mdPath, "utf8");
    const num = (label) => {
      const m = md.match(new RegExp(label + ":\\s*(\\d+)"));
      return m ? parseInt(m[1], 10) : 0;
    };
    return { total: num("Total Tests"), pass: num("Passed"), fail: num("Failed") };
  } catch {
    return { total: 0, pass: 0, fail: 0 };
  }
}

function parseK6(p) {
  const data = readJSON(p, null);
  if (!data || !data.metrics) return null;
  const m = data.metrics;
  return {
    reqs: m.http_reqs ? m.http_reqs.values.count : null,
    failRate: m.http_req_failed ? (m.http_req_failed.values.rate * 100).toFixed(2) : null,
    p95: m.http_req_duration ? m.http_req_duration.values["p(95)"]?.toFixed(1) : null,
    avg: m.http_req_duration ? m.http_req_duration.values.avg?.toFixed(1) : null,
  };
}

const seleniumPath = process.argv[2] || "artifacts/selenium/selenium-report.json";
const appiumSummaryPath = process.argv[3] || "artifacts/appium/Summary/summary.md";
const dastPath = process.argv[4] || "artifacts/dast/report.json";
const k6Path = process.argv[5] || "artifacts/k6/k6-summary.json";
const outPath = process.argv[6] || "pages-out/reports/latest/index.html";

const selenium = readJSON(seleniumPath, { results: [], pass: 0, fail: 0, skip: 0, total: 0 });
const appium = parseAppiumSummary(appiumSummaryPath);
const dast = readJSON(dastPath, []);
const k6 = parseK6(k6Path);

const dastCritical = dast.filter(d => d.finding && d.severity === "Critical").length;
const dastHigh = dast.filter(d => d.finding && d.severity === "High").length;
const dastTotal = dast.length;

function rowsHtml(results) {
  return results.map(r => {
    const cls = r.status === "PASS" ? "pass" : r.status === "FAIL" ? "fail" : "skip";
    return `<tr class="${cls}"><td>${r.testId}</td><td>${r.name}</td><td>${r.status}</td><td>${(r.notes||"").toString().slice(0,200)}</td></tr>`;
  }).join("\n");
}

function dastRowsHtml(items) {
  return items.filter(d => d.finding).map(d => {
    const sev = (d.severity||"").toLowerCase();
    return `<tr class="${sev}"><td>${d.endpoint}</td><td>${d.method}</td><td>${d.severity}</td><td>${d.note||""}</td></tr>`;
  }).join("\n");
}

const generatedAt = new Date().toISOString();

const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>ChemoSense — Combined Test Report</title>
<style>
body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;margin:0;background:#f8fafc;color:#0f172a}
header{background:#0d9488;color:#fff;padding:24px 32px}
header h1{margin:0;font-size:22px}
header p{margin:4px 0 0;opacity:.85;font-size:13px}
.wrap{max-width:1100px;margin:0 auto;padding:24px 32px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:28px}
.card{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px}
.card .n{font-size:24px;font-weight:700}
.card .l{font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.03em}
section{background:#fff;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:24px;overflow:hidden}
section h2{margin:0;padding:14px 18px;background:#f1f5f9;font-size:14px;border-bottom:1px solid #e2e8f0}
table{width:100%;border-collapse:collapse;font-size:12px}
th{text-align:left;padding:8px 12px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-size:11px;text-transform:uppercase;color:#64748b}
td{padding:7px 12px;border-bottom:1px solid #f1f5f9;vertical-align:top}
tr.pass td:nth-child(3){color:#059669;font-weight:600}
tr.fail td:nth-child(3){color:#dc2626;font-weight:600}
tr.skip td:nth-child(3){color:#d97706;font-weight:600}
tr.critical td:nth-child(3){color:#dc2626;font-weight:700}
tr.high td:nth-child(3){color:#ea580c;font-weight:600}
.empty{padding:18px;color:#94a3b8;font-size:13px}
</style></head>
<body>
<header><h1>ChemoSense — Combined Test Report</h1><p>Generated ${generatedAt}</p></header>
<div class="wrap">

<div class="grid">
  <div class="card"><div class="n">${selenium.pass}/${selenium.total}</div><div class="l">Selenium Web Pass</div></div>
  <div class="card"><div class="n">${appium.pass}/${appium.total}</div><div class="l">Appium Android Pass</div></div>
  <div class="card"><div class="n">${dastCritical + dastHigh}</div><div class="l">DAST Critical+High</div></div>
  <div class="card"><div class="n">${k6 ? k6.failRate + "%" : "—"}</div><div class="l">k6 Error Rate</div></div>
</div>

<section>
  <h2>Selenium — Web E2E (${selenium.total} tests, ${selenium.pass} pass / ${selenium.fail} fail / ${selenium.skip} skip)</h2>
  ${selenium.results.length ? `<table><tr><th>ID</th><th>Test</th><th>Status</th><th>Notes</th></tr>${rowsHtml(selenium.results)}</table>` : `<div class="empty">No Selenium data found for this run.</div>`}
</section>

<section>
  <h2>Appium — Android E2E (${appium.total} tests, ${appium.pass} pass / ${appium.fail} fail)</h2>
  <div class="empty">Full per-case Appium results: see the linked native report below.</div>
</section>

<section>
  <h2>DAST — Security Scan (${dastTotal} checks, ${dastCritical} critical / ${dastHigh} high)</h2>
  ${dastTotal ? `<table><tr><th>Endpoint</th><th>Method</th><th>Severity</th><th>Note</th></tr>${dastRowsHtml(dast)}</table>` : `<div class="empty">No DAST run in this build (manual-trigger only). Run via "Run workflow" to include.</div>`}
</section>

<section>
  <h2>k6 — Load Test</h2>
  ${k6 ? `<table><tr><th>Metric</th><th>Value</th></tr>
    <tr><td>Total requests</td><td>${k6.reqs ?? "—"}</td></tr>
    <tr><td>Failure rate</td><td>${k6.failRate ?? "—"}%</td></tr>
    <tr><td>Avg response time</td><td>${k6.avg ?? "—"} ms</td></tr>
    <tr><td>p95 response time</td><td>${k6.p95 ?? "—"} ms</td></tr>
  </table>` : `<div class="empty">No k6 run in this build (manual-trigger only). Run via "Run workflow" to include.</div>`}
</section>

</div>
</body></html>`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, html);
console.log("Combined report written to " + outPath);
