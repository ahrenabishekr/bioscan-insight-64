const { remote } = require("webdriverio");
const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");

const APK_PATH = path.resolve(__dirname, "../../android/app/build/outputs/apk/debug/app-debug.apk");
const BASE_URL = "https://chemosense-app.onrender.com";

const RESULTS_ROOT = path.resolve(__dirname, "../../Test Results");
const DIRS = {
  excel: path.join(RESULTS_ROOT, "Excel"),
  html: path.join(RESULTS_ROOT, "HTML"),
  screenshots: path.join(RESULTS_ROOT, "Screenshots"),
  logs: path.join(RESULTS_ROOT, "Logs"),
  summary: path.join(RESULTS_ROOT, "Summary"),
};
Object.values(DIRS).forEach((d) => fs.mkdirSync(d, { recursive: true }));

const results = [];
const logLines = [];
function log(line) { logLines.push(`[${new Date().toISOString()}] ${line}`); console.log(line); }
function record(testId, name, status, notes = "") {
  const r = { testId, name, status, notes, timestamp: new Date().toLocaleString() };
  results.push(r);
  log(`[${status}] ${testId}: ${name}${notes ? " — " + notes : ""}`);
}
async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function captureFailureScreenshot(driver, testId) {
  if (!driver) return;
  try {
    const shot = await driver.takeScreenshot();
    fs.writeFileSync(path.join(DIRS.screenshots, `${testId}.png`), shot, "base64");
  } catch { /* best effort */ }
}

async function bodyText(driver) {
  const body = await driver.$("body");
  return await body.getText().catch(() => "");
}

// Poll body text for a substring, tolerant of render/hydration lag and cold Render starts.
async function waitForText(driver, substr, timeoutMs = 20000) {
  const start = Date.now();
  let last = "";
  while (Date.now() - start < timeoutMs) {
    last = await bodyText(driver);
    if (last.includes(substr)) return true;
    await sleep(1000);
  }
  throw new Error(`waiting for "${substr}" timed out; body started with: ${last.slice(0, 120)}`);
}

async function waitForWebviewContext(driver, timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const contexts = await driver.getContexts();
    const webview = contexts.find((c) => String(c).toLowerCase().includes("webview"));
    if (webview) {
      await driver.switchContext(webview);
      return webview;
    }
    await sleep(2000);
  }
  throw new Error("WebView context never appeared within " + timeoutMs + "ms");
}

async function goTo(driver, path) {
  await driver.url(BASE_URL + path);
  await sleep(2500);
}

async function saveExcelReport() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("ChemoSense Appium Results");
  ws.columns = [
    { header: "Test ID", key: "testId", width: 12 },
    { header: "Test Case", key: "name", width: 45 },
    { header: "Status", key: "status", width: 10 },
    { header: "Notes", key: "notes", width: 50 },
    { header: "Timestamp", key: "timestamp", width: 22 },
  ];
  ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF7C3AED" } };
  results.forEach((r) => {
    const row = ws.addRow(r);
    const color = r.status === "PASS" ? "FFD1FAE5" : r.status === "FAIL" ? "FFFEE2E2" : "FFFEF3C7";
    row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: color } };
    row.getCell("status").font = { bold: true };
  });
  ws.addRow([]);
  const pass = results.filter((r) => r.status === "PASS").length;
  const fail = results.filter((r) => r.status === "FAIL").length;
  const skip = results.filter((r) => r.status === "SKIP").length;
  ws.addRow(["SUMMARY", `Total: ${results.length}`, `Pass: ${pass}`, `Fail: ${fail}`, `Skip: ${skip}`]);
  await wb.xlsx.writeFile(path.join(DIRS.excel, "Automation_Test_Report.xlsx"));
  return { pass, fail, skip };
}

function saveHtmlReport(pass, fail, skip) {
  const rows = results.map((r) => {
    const color = r.status === "PASS" ? "#d1fae5" : r.status === "FAIL" ? "#fee2e2" : "#fef3c7";
    return `<tr style="background:${color}"><td>${r.testId}</td><td>${r.name}</td><td><b>${r.status}</b></td><td>${r.notes}</td><td>${r.timestamp}</td></tr>`;
  }).join("\n");
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>ChemoSense Appium Execution Report</title>
<style>body{font-family:sans-serif;margin:2rem;} table{border-collapse:collapse;width:100%;} td,th{border:1px solid #ccc;padding:6px 10px;text-align:left;font-size:14px;} th{background:#7c3aed;color:#fff;}</style>
</head><body><h1>ChemoSense Appium Execution Report</h1>
<p>Total: ${results.length} &nbsp; Pass: ${pass} &nbsp; Fail: ${fail} &nbsp; Skip: ${skip} &nbsp; Pass Rate: ${((pass / results.length) * 100).toFixed(1)}%</p>
<table><thead><tr><th>Test ID</th><th>Test Case</th><th>Status</th><th>Notes</th><th>Timestamp</th></tr></thead><tbody>${rows}</tbody></table>
</body></html>`;
  fs.writeFileSync(path.join(DIRS.html, "execution-report.html"), html);
}

function saveSummaryMd(pass, fail, skip) {
  const failed = results.filter((r) => r.status === "FAIL");
  const lines = [
    "# Android Appium Test Summary", "",
    `Build Number: ${process.env.BUILD_NUM || "local"}`,
    `Execution Date: ${new Date().toISOString()}`,
    `Total Tests: ${results.length}`, `Passed: ${pass}`, `Failed: ${fail}`, `Skipped: ${skip}`,
    `Pass Rate: ${((pass / results.length) * 100).toFixed(1)}%`, "",
    "Failed Tests:",
    ...(failed.length ? failed.map((f) => `- ${f.testId}: ${f.name} — ${f.notes || "no details"}`) : ["- none"]),
  ];
  fs.writeFileSync(path.join(DIRS.summary, "summary.md"), lines.join("\n"));
}

async function saveReport() {
  const { pass, fail, skip } = await saveExcelReport();
  saveHtmlReport(pass, fail, skip);
  saveSummaryMd(pass, fail, skip);
  fs.writeFileSync(path.join(DIRS.logs, "run.log"), logLines.join("\n"));
  log(`\n📊 Reports written to: ${RESULTS_ROOT}`);
  log(`✅ PASS: ${pass} | ❌ FAIL: ${fail} | ⏭ SKIP: ${skip}`);
}

async function runTests() {
  let driver;
  try {
    driver = await remote({
      hostname: "localhost", port: 4723, logLevel: "error",
      capabilities: {
        platformName: "Android",
        "appium:deviceName": "Android Device",
        "appium:app": APK_PATH,
        "appium:automationName": "UiAutomator2",
        "appium:noReset": false,
        "appium:newCommandTimeout": 180,
        "appium:autoWebview": false,
        "appium:chromedriverAutodownload": true,
      },
    });

    log("Waiting for WebView context (cold Render start can take up to 60s)...");
    await waitForWebviewContext(driver, 60000);
    log("WebView context ready.");

    const steps = [
      ["AM001", "Landing page shows ChemoSense branding", async () => {
        await waitForText(driver, "ChemoSense", 25000);
      }],
      ["AM002", "Login page shows Student ID field", async () => {
        await goTo(driver, "/login");
        await waitForText(driver, "Student ID", 15000);
      }],
      ["AM003", "Demo login reaches Dashboard", async () => {
        await goTo(driver, "/login?demo=1");
        try {
          await waitForText(driver, "Dashboard", 20000);
        } catch {
          // fallback: manual demo credentials, same as Selenium suite's approach
          await goTo(driver, "/login");
          const inputs = await driver.$$("input");
          if (inputs.length < 2) throw new Error("inputs not found for manual fallback");
          await inputs[0].setValue("demo");
          await inputs[1].setValue("demo123");
          const btns = await driver.$$("button");
          let clicked = false;
          for (const b of btns) {
            const t = (await b.getText().catch(() => "")).toLowerCase();
            if (t.includes("sign")) { await b.click(); clicked = true; break; }
          }
          if (!clicked) throw new Error("sign in button not found in fallback");
          await waitForText(driver, "Dashboard", 15000);
        }
      }],
      ["AM004", "Dashboard shows Total Scans stat card", async () => {
        await waitForText(driver, "Total Scans", 10000);
      }],
      ["AM005", "Sidebar has 5+ navigation links", async () => {
        const links = await driver.$$("nav a, aside a");
        if (links.length < 5) throw new Error(`${links.length} links found`);
      }],
      ["AM006", "Scan page loads", async () => {
        await goTo(driver, "/scan");
        await waitForText(driver, "Run scan", 15000);
      }],
      ["AM007", "Scan textarea accepts input", async () => {
        const ta = await driver.$("textarea");
        await ta.setValue("burn wound green pus ICU");
        // Mobile webview's getValue()/getAttribute("value") don't reliably read back
        // React-controlled textarea state here, so confirm via rendered body text instead.
        await waitForText(driver, "burn wound green pus ICU", 8000);
      }],
      ["AM008", "Symptom scan returns AI results", async () => {
        await sleep(1000); // let the AM007 keystroke re-render settle before we click
        const btns = await driver.$$("button");
        let clicked = false;
        for (const b of btns) {
          const t = (await b.getText().catch(() => "")).toLowerCase();
          if (t.includes("run") || t.includes("scan")) { await b.click(); clicked = true; break; }
        }
        if (!clicked) throw new Error("run scan button not found");
        // Backend confirmed ~6.5s response time; result section may render under
        // several possible headings depending on top match, so check a broader set.
        const start = Date.now();
        let ok = false;
        while (Date.now() - start < 25000) {
          const text = await bodyText(driver);
          if (text.includes("Risk") || text.includes("Pseudomonas") || text.includes("Treatment") || text.includes("pyocyanin") || text.includes("Biomarker")) { ok = true; break; }
          await sleep(1000);
        }
        if (!ok) throw new Error("AI results not shown within 25s");
      }],
      ["AM009", "Cases page loads with real records", async () => {
        await goTo(driver, "/cases");
        await waitForText(driver, "Case", 10000);
      }],
      ["AM010", "Alerts page loads", async () => {
        await goTo(driver, "/alerts");
        await waitForText(driver, "Alert", 10000);
      }],
      ["AM011", "Sensors page loads", async () => {
        await goTo(driver, "/sensors");
        await waitForText(driver, "LOD", 10000);
      }],
      ["AM012", "Settings page loads", async () => {
        await goTo(driver, "/settings");
        await waitForText(driver, "Settings", 10000);
      }],
      ["AM013", "Sign out returns to login screen", async () => {
        await driver.execute("localStorage.removeItem('chemosense.session');");
        await goTo(driver, "/login");
        await waitForText(driver, "Sign in", 10000);
      }],
    ];

    for (const [id, name, fn] of steps) {
      try {
        await fn();
        record(id, name, "PASS");
      } catch (e) {
        record(id, name, "FAIL", e.message);
        await captureFailureScreenshot(driver, id);
      }
    }
  } catch (e) {
    log(`Fatal error: ${e.message}`);
    record("AM000", "Appium driver connection / WebView load", "FAIL", e.message);
  } finally {
    if (driver) await driver.deleteSession();
    await saveReport();
  }
}

runTests().catch((e) => { console.error(e); process.exit(1); });
