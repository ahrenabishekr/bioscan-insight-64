const { remote } = require("webdriverio");
const ExcelJS = require("exceljs");
const path = require("path");

const APK_PATH = path.resolve(__dirname, "../../android/app/build/outputs/apk/debug/app-debug.apk");

const results = [];

function record(testId, name, status, notes = "") {
  const r = { testId, name, status, notes, timestamp: new Date().toLocaleString() };
  results.push(r);
  console.log(`[${status}] ${testId}: ${name}${notes ? " — " + notes : ""}`);
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function saveReport() {
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

  results.forEach(r => {
    const row = ws.addRow(r);
    const color = r.status === "PASS" ? "FFD1FAE5" : r.status === "FAIL" ? "FFFEE2E2" : "FFFEF3C7";
    row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: color } };
    row.getCell("status").font = { bold: true };
  });

  ws.addRow([]);
  const pass = results.filter(r => r.status === "PASS").length;
  const fail = results.filter(r => r.status === "FAIL").length;
  const skip = results.filter(r => r.status === "SKIP").length;
  ws.addRow(["SUMMARY", `Total: ${results.length}`, `Pass: ${pass}`, `Fail: ${fail}`, `Skip: ${skip}`]);

  const reportPath = path.join(__dirname, "../reports/appium-report.xlsx");
  await wb.xlsx.writeFile(reportPath);
  console.log(`\n📊 Appium Report: ${reportPath}`);
  console.log(`✅ PASS: ${pass} | ❌ FAIL: ${fail} | ⏭ SKIP: ${skip}`);
}

async function runTests() {
  let driver;
  try {
    driver = await remote({
      hostname: "localhost",
      port: 4723,
      logLevel: "error",
      capabilities: {
        platformName: "Android",
        "appium:deviceName": "Android Device",
        "appium:app": APK_PATH,
        "appium:automationName": "UiAutomator2",
        "appium:noReset": false,
        "appium:newCommandTimeout": 120,
      },
    });

    await sleep(5000);

    // AM001 — App launches
    try {
      const el = await driver.$("android=new UiSelector().textContains(\"ChemoSense\")");
      const displayed = await el.isDisplayed();
      record("AM001", "App launches and shows ChemoSense branding", displayed ? "PASS" : "FAIL");
    } catch (e) { record("AM001", "App launches and shows ChemoSense branding", "FAIL", e.message); }

    // AM002 — Login screen loads
    try {
      const el = await driver.$("android=new UiSelector().textContains(\"Student ID\")");
      const displayed = await el.isDisplayed();
      record("AM002", "Login screen shows Student ID field", displayed ? "PASS" : "FAIL");
    } catch (e) { record("AM002", "Login screen shows Student ID field", "FAIL", e.message); }

    // AM003 — Demo login
    try {
      const inputs = await driver.$$("android=new UiSelector().className(\"android.widget.EditText\")");
      if (inputs.length >= 2) {
        await inputs[0].setValue("demo");
        await inputs[1].setValue("demo123");
        const loginBtn = await driver.$("android=new UiSelector().textContains(\"Sign in\")");
        await loginBtn.click();
        await sleep(5000);
        const dashboard = await driver.$("android=new UiSelector().textContains(\"Dashboard\")");
        const shown = await dashboard.isDisplayed();
        record("AM003", "Demo login navigates to Dashboard", shown ? "PASS" : "FAIL");
      } else { record("AM003", "Demo login navigates to Dashboard", "SKIP", "Inputs not found"); }
    } catch (e) { record("AM003", "Demo login navigates to Dashboard", "FAIL", e.message); }

    // AM004 — Dashboard stats visible
    try {
      const el = await driver.$("android=new UiSelector().textContains(\"Total Scans\")");
      const shown = await el.isDisplayed();
      record("AM004", "Dashboard shows Total Scans stat card", shown ? "PASS" : "FAIL");
    } catch (e) { record("AM004", "Dashboard shows Total Scans stat card", "FAIL", e.message); }

    // AM005 — Bottom navigation
    try {
      const scan = await driver.$("android=new UiSelector().textContains(\"Scan\")");
      const shown = await scan.isDisplayed();
      record("AM005", "Bottom navigation bar visible with Scan button", shown ? "PASS" : "FAIL");
    } catch (e) { record("AM005", "Bottom navigation bar visible with Scan button", "FAIL", e.message); }

    // AM006 — Navigate to Scan
    try {
      const scanBtn = await driver.$("android=new UiSelector().textContains(\"Scan\")");
      await scanBtn.click();
      await sleep(3000);
      const el = await driver.$("android=new UiSelector().textContains(\"Clinical\")");
      const shown = await el.isDisplayed();
      record("AM006", "Tap Scan navigates to Clinical scan page", shown ? "PASS" : "FAIL");
    } catch (e) { record("AM006", "Tap Scan navigates to Clinical scan page", "FAIL", e.message); }

    // AM007 — Scan input
    try {
      const textarea = await driver.$("android=new UiSelector().className(\"android.widget.EditText\")");
      await textarea.setValue("burn wound green pus ICU");
      const val = await textarea.getText();
      record("AM007", "Scan text input accepts clinical description", val.length > 0 ? "PASS" : "FAIL");
    } catch (e) { record("AM007", "Scan text input accepts clinical description", "FAIL", e.message); }

    // AM008 — Run scan button
    try {
      const btn = await driver.$("android=new UiSelector().textContains(\"Run scan\")");
      await btn.click();
      await sleep(8000);
      const result = await driver.$("android=new UiSelector().textContains(\"Results\")");
      const shown = await result.isDisplayed();
      record("AM008", "Run scan button triggers AI pathogen matching", shown ? "PASS" : "FAIL");
    } catch (e) { record("AM008", "Run scan button triggers AI pathogen matching", "FAIL", e.message); }

    // AM009 — Cases tab
    try {
      const casesBtn = await driver.$("android=new UiSelector().textContains(\"Cases\")");
      await casesBtn.click();
      await sleep(3000);
      const el = await driver.$("android=new UiSelector().textContains(\"total\")");
      const shown = await el.isDisplayed();
      record("AM009", "Cases tab loads with case list from database", shown ? "PASS" : "FAIL");
    } catch (e) { record("AM009", "Cases tab loads with case list from database", "FAIL", e.message); }

    // AM010 — Alerts tab
    try {
      const alertBtn = await driver.$("android=new UiSelector().textContains(\"Alerts\")");
      await alertBtn.click();
      await sleep(2000);
      const el = await driver.$("android=new UiSelector().textContains(\"Alert\")");
      const shown = await el.isDisplayed();
      record("AM010", "Alerts tab shows notification list", shown ? "PASS" : "FAIL");
    } catch (e) { record("AM010", "Alerts tab shows notification list", "FAIL", e.message); }

    // AM011 — More drawer
    try {
      const moreBtn = await driver.$("android=new UiSelector().textContains(\"More\")");
      await moreBtn.click();
      await sleep(2000);
      const el = await driver.$("android=new UiSelector().textContains(\"Sensors\")");
      const shown = await el.isDisplayed();
      record("AM011", "More drawer opens with all navigation options", shown ? "PASS" : "FAIL");
    } catch (e) { record("AM011", "More drawer opens with all navigation options", "FAIL", e.message); }

    // AM012 — Sensors
    try {
      const sensorsBtn = await driver.$("android=new UiSelector().textContains(\"Sensors\")");
      await sensorsBtn.click();
      await sleep(3000);
      const el = await driver.$("android=new UiSelector().textContains(\"LOD\")");
      const shown = await el.isDisplayed();
      record("AM012", "Sensors page shows live sensor readings", shown ? "PASS" : "FAIL");
    } catch (e) { record("AM012", "Sensors page shows live sensor readings", "FAIL", e.message); }

    // AM013 — Sign out
    try {
      const moreBtn = await driver.$("android=new UiSelector().textContains(\"More\")");
      await moreBtn.click();
      await sleep(1000);
      const signOut = await driver.$("android=new UiSelector().descriptionContains(\"Sign out\")");
      await signOut.click();
      await sleep(2000);
      const login = await driver.$("android=new UiSelector().textContains(\"Sign in\")");
      const shown = await login.isDisplayed();
      record("AM013", "Sign out returns to login screen", shown ? "PASS" : "FAIL");
    } catch (e) { record("AM013", "Sign out returns to login screen", "FAIL", e.message); }

  } catch (e) {
    console.error("Fatal error:", e.message);
    record("AM000", "Appium driver connection", "FAIL", e.message + " — Is Appium server running? (appium &)");
  } finally {
    if (driver) await driver.deleteSession();
    await saveReport();
  }
}

runTests().catch(console.error);
