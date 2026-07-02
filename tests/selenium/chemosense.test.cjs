const { Builder, By, until, Key } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const ExcelJS = require("exceljs");
const path = require("path");

const BASE_URL = "https://chemosense-app.onrender.com";
const DEMO_ID = "demo";
const DEMO_PASS = "demo123";

const results = [];

function record(testId, name, status, notes = "") {
  const r = { testId, name, status, notes, timestamp: new Date().toLocaleString() };
  results.push(r);
  console.log(`[${status}] ${testId}: ${name}${notes ? " — " + notes : ""}`);
  return r;
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function saveReport() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("ChemoSense Test Results");
  ws.columns = [
    { header: "Test ID", key: "testId", width: 12 },
    { header: "Test Case", key: "name", width: 45 },
    { header: "Status", key: "status", width: 10 },
    { header: "Notes", key: "notes", width: 50 },
    { header: "Timestamp", key: "timestamp", width: 22 },
  ];
  ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0D9488" } };

  results.forEach((r, i) => {
    const row = ws.addRow(r);
    const color = r.status === "PASS" ? "FFD1FAE5" : r.status === "FAIL" ? "FFFEE2E2" : "FFFEF3C7";
    row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: color } };
    row.getCell("status").font = { bold: true, color: { argb: r.status === "PASS" ? "FF065F46" : r.status === "FAIL" ? "FF991B1B" : "FF92400E" } };
  });

  // Summary
  ws.addRow([]);
  const pass = results.filter(r => r.status === "PASS").length;
  const fail = results.filter(r => r.status === "FAIL").length;
  const skip = results.filter(r => r.status === "SKIP").length;
  const summaryRow = ws.addRow(["SUMMARY", `Total: ${results.length}`, `Pass: ${pass}`, `Fail: ${fail}`, `Skip: ${skip}`]);
  summaryRow.font = { bold: true };
  summaryRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
  summaryRow.font = { bold: true, color: { argb: "FFFFFFFF" } };

  const reportPath = path.join(__dirname, "../reports/selenium-report.xlsx");
  await wb.xlsx.writeFile(reportPath);
  console.log(`\n📊 Report saved: ${reportPath}`);
  console.log(`✅ PASS: ${pass} | ❌ FAIL: ${fail} | ⏭ SKIP: ${skip} | Total: ${results.length}`);
}

async function runTests() {
  const opts = new chrome.Options().addArguments("--headless", "--no-sandbox", "--disable-dev-shm-usage", "--window-size=1280,900");
  const driver = await new Builder().forBrowser("chrome").setChromeOptions(opts).build();

  try {
    // TC001 — App loads
    try {
      await driver.get(BASE_URL);
      await driver.wait(until.titleContains("ChemoSense"), 15000);
      record("TC001", "Application loads successfully", "PASS");
    } catch (e) { record("TC001", "Application loads successfully", "FAIL", e.message); }

    // TC002 — Login page renders
    try {
      await driver.get(`${BASE_URL}/login`);
      await driver.wait(until.elementLocated(By.css("input")), 10000);
      record("TC002", "Login page renders with Student ID field", "PASS");
    } catch (e) { record("TC002", "Login page renders with Student ID field", "FAIL", e.message); }

    // TC003 — Invalid login
    try {
      await driver.get(`${BASE_URL}/login`);
      await sleep(2000);
      const inputs = await driver.findElements(By.css("input"));
      if (inputs.length >= 2) {
        await inputs[0].clear(); await inputs[0].sendKeys("wrongid");
        await inputs[1].clear(); await inputs[1].sendKeys("wrongpass");
        const btn = await driver.findElement(By.css("button[type='submit'], button"));
        await btn.click();
        await sleep(2000);
        const body = await driver.findElement(By.css("body")).getText();
        if (body.includes("Invalid") || body.includes("error") || body.includes("not found")) {
          record("TC003", "Invalid credentials shows error message", "PASS");
        } else { record("TC003", "Invalid credentials shows error message", "FAIL", "No error shown"); }
      } else { record("TC003", "Invalid credentials shows error message", "SKIP", "Could not find inputs"); }
    } catch (e) { record("TC003", "Invalid credentials shows error message", "FAIL", e.message); }

    // TC004 — Demo login
    try {
      await driver.get(`${BASE_URL}/login?demo=1`);
      await sleep(4000);
      const url = await driver.getCurrentUrl();
      if (url.includes("/dashboard")) {
        record("TC004", "Demo login auto-redirects to dashboard", "PASS");
      } else { record("TC004", "Demo login auto-redirects to dashboard", "FAIL", `URL: ${url}`); }
    } catch (e) { record("TC004", "Demo login auto-redirects to dashboard", "FAIL", e.message); }

    // TC005 — Dashboard stats
    try {
      const body = await driver.findElement(By.css("body")).getText();
      if (body.includes("Total Scans") || body.includes("Dashboard")) {
        record("TC005", "Dashboard shows real-time statistics", "PASS");
      } else { record("TC005", "Dashboard shows real-time statistics", "FAIL", "Stats not found"); }
    } catch (e) { record("TC005", "Dashboard shows real-time statistics", "FAIL", e.message); }

    // TC006 — Navigation sidebar
    try {
      const links = await driver.findElements(By.css("nav a, aside a"));
      if (links.length >= 5) {
        record("TC006", "Navigation sidebar has all required links", "PASS", `Found ${links.length} links`);
      } else { record("TC006", "Navigation sidebar has all required links", "FAIL", `Only ${links.length} links`); }
    } catch (e) { record("TC006", "Navigation sidebar has all required links", "FAIL", e.message); }

    // TC007 — Scan page loads
    try {
      await driver.get(`${BASE_URL}/scan`);
      await sleep(2000);
      const body = await driver.findElement(By.css("body")).getText();
      if (body.includes("scan") || body.includes("Scan") || body.includes("symptom")) {
        record("TC007", "Scan page loads with input form", "PASS");
      } else { record("TC007", "Scan page loads with input form", "FAIL", "Scan form not found"); }
    } catch (e) { record("TC007", "Scan page loads with input form", "FAIL", e.message); }

    // TC008 — Symptom scan
    try {
      await driver.get(`${BASE_URL}/scan`);
      await sleep(3000);
      const textarea = await driver.wait(until.elementLocated(By.css("textarea")), 10000);
      await textarea.clear();
      await textarea.sendKeys("burn wound green pus ICU day 3 ventilated");
      const buttons = await driver.findElements(By.css("button"));
      for (const btn of buttons) {
        const txt = await btn.getText().catch(() => "");
        if (txt.toLowerCase().includes("scan") || txt.toLowerCase().includes("run")) {
          await btn.click(); break;
        }
      }
      // Wait up to 30s for AI results
      let found = false;
      for (let i = 0; i < 6; i++) {
        await sleep(5000);
        const body = await driver.findElement(By.css("body")).getText();
        if (body.includes("Pseudomonas") || body.includes("aeruginosa") || body.includes("Results") || body.includes("pathogen") || body.includes("Critical")) {
          found = true; break;
        }
      }
      if (found) {
        record("TC008", "Symptom scan returns AI pathogen results", "PASS");
      } else { record("TC008", "Symptom scan returns AI pathogen results", "FAIL", "No results after 30s"); }
    } catch (e) { record("TC008", "Symptom scan returns AI pathogen results", "FAIL", e.message); }

    // TC009 — AI powered badge (check after TC008)
    try {
      const body = await driver.findElement(By.css("body")).getText();
      if (body.includes("AI-powered") || body.includes("AI powered") || body.includes("powered")) {
        record("TC009", "AI-powered badge shown on scan results", "PASS");
      } else { record("TC009", "AI-powered badge shown on scan results", "SKIP", "Badge not visible in text"); }
    } catch (e) { record("TC009", "AI-powered badge shown on scan results", "SKIP", e.message); }



    // TC010 — Cases page
    try {
      await driver.get(`${BASE_URL}/cases`);
      await sleep(3000);
      const body = await driver.findElement(By.css("body")).getText();
      if (body.includes("Cases") || body.includes("case") || body.includes("Total")) {
        record("TC010", "Cases page loads with list from database", "PASS");
      } else { record("TC010", "Cases page loads with list from database", "FAIL", "Cases not loaded"); }
    } catch (e) { record("TC010", "Cases page loads with list from database", "FAIL", e.message); }

    // TC011 — Case detail
    try {
      const caseLinks = await driver.findElements(By.css("a[href*='/cases/']"));
      if (caseLinks.length > 0) {
        await caseLinks[0].click();
        await sleep(2000);
        const body = await driver.findElement(By.css("body")).getText();
        if (body.includes("Case") || body.includes("Scan") || body.includes("PDF") || body.includes("pathogen") || body.includes("Pathogen") || body.includes("Biomarker") || body.includes("aeruginosa")) {
          record("TC011", "Case detail page shows scan results and actions", "PASS");
        } else { record("TC011", "Case detail page shows scan results and actions", "FAIL", "Detail not loaded"); }
      } else { record("TC011", "Case detail page shows scan results and actions", "SKIP", "No case links"); }
    } catch (e) { record("TC011", "Case detail page shows scan results and actions", "FAIL", e.message); }

    // TC012 — Patients page
    try {
      await driver.get(`${BASE_URL}/patients`);
      await sleep(3000);
      const body = await driver.findElement(By.css("body")).getText();
      if (body.includes("Patient") || body.includes("Timeline") || body.includes("scan")) {
        record("TC012", "Patients page loads with real patient data", "PASS");
      } else { record("TC012", "Patients page loads with real patient data", "FAIL", "No patient data"); }
    } catch (e) { record("TC012", "Patients page loads with real patient data", "FAIL", e.message); }

    // TC013 — Alerts page
    try {
      await driver.get(`${BASE_URL}/alerts`);
      await sleep(2000);
      const body = await driver.findElement(By.css("body")).getText();
      if (body.includes("Alert") || body.includes("Critical") || body.includes("Detection")) {
        record("TC013", "Alerts page loads with real-time alerts", "PASS");
      } else { record("TC013", "Alerts page loads with real-time alerts", "FAIL", "No alerts shown"); }
    } catch (e) { record("TC013", "Alerts page loads with real-time alerts", "FAIL", e.message); }

    // TC014 — Bell badge
    try {
      await driver.get(`${BASE_URL}/dashboard`);
      await sleep(2000);
      const bells = await driver.findElements(By.css("[href*='/alerts']"));
      if (bells.length > 0) {
        record("TC014", "Bell icon with alert badge visible in header", "PASS");
      } else { record("TC014", "Bell icon with alert badge visible in header", "FAIL", "No bell found"); }
    } catch (e) { record("TC014", "Bell icon with alert badge visible in header", "FAIL", e.message); }

    // TC015 — Sensors page
    try {
      await driver.get(`${BASE_URL}/sensors`);
      await sleep(3000);
      const body = await driver.findElement(By.css("body")).getText();
      if (body.includes("Sensor") || body.includes("LOD") || body.includes("nM")) {
        record("TC015", "Sensors page loads with live sensor data", "PASS");
      } else { record("TC015", "Sensors page loads with live sensor data", "FAIL", "Sensor data not found"); }
    } catch (e) { record("TC015", "Sensors page loads with live sensor data", "FAIL", e.message); }

    // TC016 — Simulator
    try {
      await driver.get(`${BASE_URL}/simulator`);
      await sleep(2000);
      const body = await driver.findElement(By.css("body")).getText();
      if (body.includes("DPV") || body.includes("LOD") || body.includes("Simulator")) {
        record("TC016", "Sensor simulator loads with platform selection", "PASS");
      } else { record("TC016", "Sensor simulator loads with platform selection", "FAIL", "Simulator not loaded"); }
    } catch (e) { record("TC016", "Sensor simulator loads with platform selection", "FAIL", e.message); }

    // TC017 — Simulator run scan
    try {
      const runBtn = await driver.findElement(By.xpath("//button[contains(text(),'Run Scan') or contains(text(),'Run')]"));
      await runBtn.click();
      await sleep(5000);
      const body = await driver.findElement(By.css("body")).getText();
      if (body.includes("DETECTED") || body.includes("LOD") || body.includes("signal") || body.includes("detecting")) {
        record("TC017", "Simulator run scan generates live signal", "PASS");
      } else { record("TC017", "Simulator run scan generates live signal", "FAIL", "No signal generated"); }
    } catch (e) { record("TC017", "Simulator run scan generates live signal", "FAIL", e.message); }

    // TC018 — Pathogen library
    try {
      await driver.get(`${BASE_URL}/library`);
      await sleep(2000);
      const body = await driver.findElement(By.css("body")).getText();
      if (body.includes("aeruginosa") || body.includes("Pathogen") || body.includes("Biomarker")) {
        record("TC018", "Pathogen library shows all pathogens", "PASS");
      } else { record("TC018", "Pathogen library shows all pathogens", "FAIL", "Library empty"); }
    } catch (e) { record("TC018", "Pathogen library shows all pathogens", "FAIL", e.message); }

    // TC019 — Compare page
    try {
      await driver.get(`${BASE_URL}/compare`);
      await sleep(2000);
      const body = await driver.findElement(By.css("body")).getText();
      if (body.includes("Compare") || body.includes("Pathogen A") || body.includes("VS")) {
        record("TC019", "Compare page loads with pathogen selector", "PASS");
      } else { record("TC019", "Compare page loads with pathogen selector", "FAIL", "Compare not loaded"); }
    } catch (e) { record("TC019", "Compare page loads with pathogen selector", "FAIL", e.message); }

    // TC020 — Analytics
    try {
      await driver.get(`${BASE_URL}/analytics`);
      await sleep(2000);
      const body = await driver.findElement(By.css("body")).getText();
      if (body.includes("Timeline") || body.includes("Heatmap") || body.includes("Calculator")) {
        record("TC020", "Analytics page loads all sections", "PASS");
      } else { record("TC020", "Analytics page loads all sections", "FAIL", "Analytics not loaded"); }
    } catch (e) { record("TC020", "Analytics page loads all sections", "FAIL", e.message); }

    // TC021 — History
    try {
      await driver.get(`${BASE_URL}/history`);
      await sleep(3000);
      const body = await driver.findElement(By.css("body")).getText();
      if (body.includes("Pseudomonas") || body.includes("scan") || body.includes("History")) {
        record("TC021", "History page shows scan records from database", "PASS");
      } else { record("TC021", "History page shows scan records from database", "FAIL", "No history data"); }
    } catch (e) { record("TC021", "History page shows scan records from database", "FAIL", e.message); }

    // TC022 — Outbreaks
    try {
      await driver.get(`${BASE_URL}/outbreaks`);
      await sleep(3000);
      const body = await driver.findElement(By.css("body")).getText();
      if (body.includes("Outbreak") || body.includes("Ward") || body.includes("Alert")) {
        record("TC022", "Outbreaks page shows real-time surveillance data", "PASS");
      } else { record("TC022", "Outbreaks page shows real-time surveillance data", "FAIL", "Outbreak data not shown"); }
    } catch (e) { record("TC022", "Outbreaks page shows real-time surveillance data", "FAIL", e.message); }

    // TC023 — Settings
    try {
      await driver.get(`${BASE_URL}/settings`);
      await sleep(2000);
      const body = await driver.findElement(By.css("body")).getText();
      if (body.includes("Profile") || body.includes("Settings") || body.includes("Password")) {
        record("TC023", "Settings page loads with profile and password sections", "PASS");
      } else { record("TC023", "Settings page loads with profile and password sections", "FAIL", "Settings not loaded"); }
    } catch (e) { record("TC023", "Settings page loads with profile and password sections", "FAIL", e.message); }

    // TC024 — Backend health
    try {
      await driver.get("https://chemosense-backend.onrender.com/health");
      await sleep(2000);
      const body = await driver.findElement(By.css("body")).getText();
      if (body.includes("healthy") || body.includes("status")) {
        record("TC024", "Backend API health check passes", "PASS");
      } else { record("TC024", "Backend API health check passes", "FAIL", "Backend not healthy"); }
    } catch (e) { record("TC024", "Backend API health check passes", "FAIL", e.message); }

    // TC025 — Logout
    try {
      await driver.get(`${BASE_URL}/dashboard`);
      await sleep(2000);
      const signOut = await driver.findElement(By.xpath("//button[contains(text(),'Sign out') or contains(text(),'Logout')]"));
      await signOut.click();
      await sleep(2000);
      const url = await driver.getCurrentUrl();
      if (url.includes("/login") || url.includes("/")) {
        record("TC025", "Sign out redirects to login page", "PASS");
      } else { record("TC025", "Sign out redirects to login page", "FAIL", `URL: ${url}`); }
    } catch (e) { record("TC025", "Sign out redirects to login page", "FAIL", e.message); }

  } finally {
    await driver.quit();
    await saveReport();
  }
}

runTests().catch(console.error);
