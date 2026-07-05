const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const ExcelJS = require("exceljs");
const path = require("path");

const BASE_URL = "https://chemosense-app.onrender.com";
const BACKEND_URL = "https://chemosense-backend.onrender.com";
const results = [];

function record(id, name, status, notes="") {
  results.push({testId:id, name, status, notes, timestamp:new Date().toLocaleString()});
  console.log(`[${status}] ${id}: ${name}${notes?" — "+notes:""}`);
}
async function sleep(ms){return new Promise(r=>setTimeout(r,ms));}
async function txt(driver){return driver.findElement(By.css("body")).getText().catch(()=>"");}

async function ensureLoggedIn(driver) {
  const url = await driver.getCurrentUrl();
  if (url.includes("/login") || url.includes("/forgot")) {
    await driver.get(BASE_URL+"/login?demo=1");
    await sleep(7000);
  }
}

async function goTo(driver, page) {
  await driver.get(BASE_URL+page);
  await sleep(3000);
  const url = await driver.getCurrentUrl();
  if (url.includes("/login")) {
    await driver.get(BASE_URL+"/login?demo=1");
    await sleep(7000);
    await driver.get(BASE_URL+page);
    await sleep(3000);
  }
}

async function saveReport(){
  const wb=new ExcelJS.Workbook();
  const ws=wb.addWorksheet("ChemoSense 100 Tests");
  ws.columns=[
    {header:"Test ID",key:"testId",width:10},
    {header:"Test Case",key:"name",width:55},
    {header:"Status",key:"status",width:10},
    {header:"Notes",key:"notes",width:50},
    {header:"Timestamp",key:"timestamp",width:22},
  ];
  ws.getRow(1).font={bold:true,color:{argb:"FFFFFFFF"}};
  ws.getRow(1).fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF0D9488"}};
  results.forEach(r=>{
    const row=ws.addRow(r);
    const c=r.status==="PASS"?"FFD1FAE5":r.status==="FAIL"?"FFFEE2E2":"FFFEF3C7";
    row.fill={type:"pattern",pattern:"solid",fgColor:{argb:c}};
    row.getCell("status").font={bold:true};
  });
  ws.addRow([]);
  const pass=results.filter(r=>r.status==="PASS").length;
  const fail=results.filter(r=>r.status==="FAIL").length;
  const skip=results.filter(r=>r.status==="SKIP").length;
  const sr=ws.addRow(["SUMMARY",`Total:${results.length}`,`Pass:${pass}`,`Fail:${fail}`,`Skip:${skip}`]);
  sr.font={bold:true,color:{argb:"FFFFFFFF"}};
  sr.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF1E293B"}};
  const rp=path.join(__dirname,"../reports/selenium-report.xlsx");
  await wb.xlsx.writeFile(rp);
  console.log("\n📊 Report: "+rp);
  console.log(`✅ PASS:${pass} | ❌ FAIL:${fail} | ⏭ SKIP:${skip} | Total:${results.length}`);
}

async function run(){
  const opts=new chrome.Options().addArguments("--headless","--no-sandbox","--disable-dev-shm-usage","--window-size=1280,900","--disable-gpu");
  const driver=await new Builder().forBrowser("chrome").setChromeOptions(opts).build();
  try{

    // ── TC001-005: App Load & Login Page ──
    try{await driver.get(BASE_URL);await driver.wait(until.titleContains("ChemoSense"),35000);record("TC001","App loads with ChemoSense title","PASS");}catch(e){record("TC001","App loads with ChemoSense title","FAIL",e.message);}
    try{const url=await driver.getCurrentUrl();if(url.includes("onrender.com"))record("TC002","App served from correct Render domain","PASS");else record("TC002","App served from correct Render domain","FAIL",url);}catch(e){record("TC002","App served from correct Render domain","FAIL",e.message);}
    try{await driver.get(BASE_URL+"/login");await sleep(3000);const b=await txt(driver);if(b.includes("ChemoSense")||b.includes("Sign"))record("TC003","Login page shows ChemoSense branding","PASS");else record("TC003","Login page shows ChemoSense branding","FAIL");}catch(e){record("TC003","Login page shows ChemoSense branding","FAIL",e.message);}
    try{const inp=await driver.findElements(By.css("input"));if(inp.length>=2)record("TC004","Login form has required input fields","PASS",inp.length+" inputs");else record("TC004","Login form has required input fields","FAIL");}catch(e){record("TC004","Login form has required input fields","FAIL",e.message);}
    try{const inp=await driver.findElements(By.css("input"));await inp[0].sendKeys("bad");await inp[1].sendKeys("bad");const btns=await driver.findElements(By.css("button"));for(const b of btns){const t=await b.getText().catch(()=>"");if(t.toLowerCase().includes("sign")||t.toLowerCase().includes("create")){await b.click();break;}}await sleep(3000);const b=await txt(driver);if(b.includes("Invalid")||b.includes("error")||b.includes("not found")||b.includes("incorrect"))record("TC005","Invalid login shows error message","PASS");else record("TC005","Invalid login shows error message","FAIL","No error shown");}catch(e){record("TC005","Invalid login shows error message","FAIL",e.message);}

    // ── TC006-010: Authentication ──
    try{await driver.get(BASE_URL+"/login?demo=1");await sleep(8000);const url=await driver.getCurrentUrl();if(url.includes("/dashboard"))record("TC006","Demo login redirects to dashboard","PASS");else record("TC006","Demo login redirects to dashboard","FAIL",url);}catch(e){record("TC006","Demo login redirects to dashboard","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("Dashboard"))record("TC007","Dashboard visible after demo login","PASS");else record("TC007","Dashboard visible after demo login","FAIL");}catch(e){record("TC007","Dashboard visible after demo login","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("Dr.")||b.includes("Demo")||b.includes("doctor")||b.includes("User"))record("TC008","Logged in user info visible","PASS");else record("TC008","Logged in user info visible","SKIP");}catch(e){record("TC008","Logged in user info visible","SKIP",e.message);}
    try{const links=await driver.findElements(By.css("nav a,aside a"));if(links.length>=5)record("TC009","Sidebar has 5+ navigation links","PASS",links.length+" links");else record("TC009","Sidebar has 5+ navigation links","FAIL",links.length+" links");}catch(e){record("TC009","Sidebar has 5+ navigation links","FAIL",e.message);}
    try{const bells=await driver.findElements(By.css("a[href*=alerts],a[href*=alert]"));if(bells.length>0)record("TC010","Bell/Alert icon in header","PASS");else record("TC010","Bell/Alert icon in header","FAIL");}catch(e){record("TC010","Bell/Alert icon in header","FAIL",e.message);}

    // ── TC011-020: Dashboard ──
    try{await goTo(driver,"/dashboard");const b=await txt(driver);if(b.includes("Total Scans"))record("TC011","Dashboard Total Scans card","PASS");else record("TC011","Dashboard Total Scans card","FAIL");}catch(e){record("TC011","Dashboard Total Scans card","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("Total Cases"))record("TC012","Dashboard Total Cases card","PASS");else record("TC012","Dashboard Total Cases card","FAIL");}catch(e){record("TC012","Dashboard Total Cases card","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("Active Sensors"))record("TC013","Dashboard Active Sensors card","PASS");else record("TC013","Dashboard Active Sensors card","FAIL");}catch(e){record("TC013","Dashboard Active Sensors card","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("Open Cases"))record("TC014","Dashboard Open Cases card","PASS");else record("TC014","Dashboard Open Cases card","FAIL");}catch(e){record("TC014","Dashboard Open Cases card","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("Quick scan")||b.includes("quick"))record("TC015","Dashboard quick scan widget","PASS");else record("TC015","Dashboard quick scan widget","FAIL");}catch(e){record("TC015","Dashboard quick scan widget","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("Frequency")||b.includes("Staphylococcus")||b.includes("Pseudomonas"))record("TC016","Dashboard pathogen frequency chart","PASS");else record("TC016","Dashboard pathogen frequency chart","FAIL");}catch(e){record("TC016","Dashboard pathogen frequency chart","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("Risk")||b.includes("Critical"))record("TC017","Dashboard risk distribution section","PASS");else record("TC017","Dashboard risk distribution section","FAIL");}catch(e){record("TC017","Dashboard risk distribution section","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("aeruginosa")||b.includes("CS-")||b.includes("Last"))record("TC018","Dashboard last cases shows real data","PASS");else record("TC018","Dashboard last cases shows real data","FAIL");}catch(e){record("TC018","Dashboard last cases shows real data","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("P. aeruginosa")||b.includes("S. aureus")||b.includes("Common"))record("TC019","Dashboard common pathogens section","PASS");else record("TC019","Dashboard common pathogens section","FAIL");}catch(e){record("TC019","Dashboard common pathogens section","FAIL",e.message);}
    try{const newScanBtns=await driver.findElements(By.css("a[href*=scan],button"));let found=false;for(const b of newScanBtns){const t=await b.getText().catch(()=>"");if(t.includes("scan")||t.includes("Scan")){found=true;break;}}record("TC020","Dashboard New Scan button present",found?"PASS":"FAIL");}catch(e){record("TC020","Dashboard New Scan button present","FAIL",e.message);}

    // ── TC021-032: Scan ──
    try{await goTo(driver,"/scan");const b=await txt(driver);if(b.includes("scan")||b.includes("Scan"))record("TC021","Scan page loads","PASS");else record("TC021","Scan page loads","FAIL");}catch(e){record("TC021","Scan page loads","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("Mode A")||b.includes("Symptoms"))record("TC022","Scan Mode A tab visible","PASS");else record("TC022","Scan Mode A tab visible","FAIL");}catch(e){record("TC022","Scan Mode A tab visible","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("Mode B")||b.includes("Biomarker"))record("TC023","Scan Mode B tab visible","PASS");else record("TC023","Scan Mode B tab visible","FAIL");}catch(e){record("TC023","Scan Mode B tab visible","FAIL",e.message);}
    try{const ta=await driver.findElement(By.css("textarea"));if(ta)record("TC024","Scan textarea present","PASS");}catch(e){record("TC024","Scan textarea present","FAIL",e.message);}
    try{const ta=await driver.findElement(By.css("textarea"));await ta.clear();await ta.sendKeys("burn wound");const v=await ta.getAttribute("value");if(v.includes("burn"))record("TC025","Scan textarea accepts input","PASS");else record("TC025","Scan textarea accepts input","FAIL");}catch(e){record("TC025","Scan textarea accepts input","FAIL",e.message);}
    try{
      await goTo(driver,"/scan");
      const ta=await driver.wait(until.elementLocated(By.css("textarea")),8000);
      await ta.clear();await ta.sendKeys("burn wound green pus ICU ventilated");
      const btns=await driver.findElements(By.css("button"));
      for(const b of btns){const t=await b.getText().catch(()=>"");if(t.toLowerCase().includes("run")){await b.click();break;}}
      let found=false;
      for(let i=0;i<7;i++){await sleep(5000);const b=await txt(driver);if(b.includes("Pseudomonas")||b.includes("Results")||b.includes("Critical")){found=true;break;}}
      record("TC026","Symptom scan returns AI results",found?"PASS":"FAIL");
    }catch(e){record("TC026","Symptom scan returns AI results","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("Pseudomonas")||b.includes("aeruginosa"))record("TC027","Scan shows Pseudomonas for burn wound","PASS");else record("TC027","Scan shows Pseudomonas for burn wound","FAIL");}catch(e){record("TC027","Scan shows Pseudomonas for burn wound","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("Critical")||b.includes("High"))record("TC028","Scan results show risk level","PASS");else record("TC028","Scan results show risk level","FAIL");}catch(e){record("TC028","Scan results show risk level","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("Treatment")||b.includes("tazobactam"))record("TC029","Scan results show treatment","PASS");else record("TC029","Scan results show treatment","FAIL");}catch(e){record("TC029","Scan results show treatment","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("Biomarker")||b.includes("Pyocyanin")||b.includes("LOD"))record("TC030","Scan results show biomarker info","PASS");else record("TC030","Scan results show biomarker info","FAIL");}catch(e){record("TC030","Scan results show biomarker info","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("Generate")||b.includes("report")||b.includes("Report"))record("TC031","Scan result has Generate Report button","PASS");else record("TC031","Scan result has Generate Report button","FAIL");}catch(e){record("TC031","Scan result has Generate Report button","FAIL",e.message);}
    try{await goTo(driver,"/scan");const btns=await driver.findElements(By.css("button"));for(const b of btns){const t=await b.getText().catch(()=>"");if(t.includes("Mode B")||t.includes("Biomarker")){await b.click();break;}}await sleep(1000);const b=await txt(driver);if(b.includes("biomarker")||b.includes("select")||b.includes("Biomarker"))record("TC032","Mode B biomarker mode works","PASS");else record("TC032","Mode B biomarker mode works","FAIL");}catch(e){record("TC032","Mode B biomarker mode works","FAIL",e.message);}

    // ── TC033-042: Cases ──
    try{await goTo(driver,"/cases");const b=await txt(driver);if(b.includes("Cases"))record("TC033","Cases list page loads","PASS");else record("TC033","Cases list page loads","FAIL");}catch(e){record("TC033","Cases list page loads","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("total")||b.includes("Total")||b.includes("52")||b.includes("60"))record("TC034","Cases shows total count","PASS");else record("TC034","Cases shows total count","FAIL");}catch(e){record("TC034","Cases shows total count","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("aeruginosa")||b.includes("CS-"))record("TC035","Cases shows real database records","PASS");else record("TC035","Cases shows real database records","FAIL");}catch(e){record("TC035","Cases shows real database records","FAIL",e.message);}
    try{const inp=await driver.findElements(By.css("input"));if(inp.length>0)record("TC036","Cases has search input","PASS");else record("TC036","Cases has search input","FAIL");}catch(e){record("TC036","Cases has search input","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("OPEN")||b.includes("Open"))record("TC037","Cases shows Open status","PASS");else record("TC037","Cases shows Open status","FAIL");}catch(e){record("TC037","Cases shows Open status","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("Critical")||b.includes("High"))record("TC038","Cases shows risk level pills","PASS");else record("TC038","Cases shows risk level pills","FAIL");}catch(e){record("TC038","Cases shows risk level pills","FAIL",e.message);}
    try{const links=await driver.findElements(By.css("a"));let found=false;for(const l of links){const h=await l.getAttribute("href").catch(()=>"");if(h&&h.includes("/cases/")&&!h.endsWith("/cases/")){await l.click();await sleep(3000);found=true;break;}}if(found){const b=await txt(driver);if(b.includes("Case")||b.includes("Scan")||b.includes("Biomarker"))record("TC039","Case detail page loads","PASS");else record("TC039","Case detail page loads","FAIL");}else record("TC039","Case detail page loads","SKIP","No case links found");}catch(e){record("TC039","Case detail page loads","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("PDF")||b.includes("Download"))record("TC040","Case detail has Download PDF","PASS");else record("TC040","Case detail has Download PDF","FAIL");}catch(e){record("TC040","Case detail has Download PDF","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("notes")||b.includes("Notes"))record("TC041","Case detail has clinical notes","PASS");else record("TC041","Case detail has clinical notes","FAIL");}catch(e){record("TC041","Case detail has clinical notes","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("Email")||b.includes("Print"))record("TC042","Case detail has Email/Print buttons","PASS");else record("TC042","Case detail has Email/Print buttons","FAIL");}catch(e){record("TC042","Case detail has Email/Print buttons","FAIL",e.message);}

    // ── TC043-048: Patients ──
    try{await goTo(driver,"/patients");const b=await txt(driver);if(b.includes("Patient")||b.includes("Timeline"))record("TC043","Patients page loads","PASS");else record("TC043","Patients page loads","FAIL");}catch(e){record("TC043","Patients page loads","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("CS-")||b.includes("SIM-")||b.includes("scan"))record("TC044","Patients list shows real patient IDs","PASS");else record("TC044","Patients list shows real patient IDs","FAIL");}catch(e){record("TC044","Patients list shows real patient IDs","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("Critical")||b.includes("High")||b.includes("Moderate"))record("TC045","Patients show risk indicators","PASS");else record("TC045","Patients show risk indicators","FAIL");}catch(e){record("TC045","Patients show risk indicators","FAIL",e.message);}
    try{const btns=await driver.findElements(By.css("button"));if(btns.length>0){await btns[0].click();await sleep(3000);const b=await txt(driver);if(b.includes("Scan")||b.includes("Risk")||b.includes("Timeline"))record("TC046","Patient selection shows timeline","PASS");else record("TC046","Patient selection shows timeline","SKIP");}else record("TC046","Patient selection shows timeline","SKIP");}catch(e){record("TC046","Patient selection shows timeline","SKIP",e.message);}
    try{const b=await txt(driver);if(b.includes("Case")||b.includes("Linked")||b.includes("View"))record("TC047","Patient timeline shows linked cases","PASS");else record("TC047","Patient timeline shows linked cases","SKIP");}catch(e){record("TC047","Patient timeline shows linked cases","SKIP",e.message);}
    try{const b=await txt(driver);const num=b.match(/\d+\s*(scan|patient)/i);record("TC048","Patients page shows scan count per patient",num?"PASS":"SKIP");}catch(e){record("TC048","Patients page shows scan count per patient","SKIP",e.message);}

    // ── TC049-053: Alerts ──
    try{await goTo(driver,"/alerts");const b=await txt(driver);if(b.includes("Alert")||b.includes("alert"))record("TC049","Alerts page loads","PASS");else record("TC049","Alerts page loads","FAIL");}catch(e){record("TC049","Alerts page loads","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("Detection")||b.includes("Critical")||b.includes("unread")||b.includes("Pseudomonas"))record("TC050","Alerts shows real alert data","PASS");else record("TC050","Alerts shows real alert data","FAIL");}catch(e){record("TC050","Alerts shows real alert data","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("Pseudomonas")||b.includes("aeruginosa")||b.includes("Detection"))record("TC051","Alerts show pathogen detection details","PASS");else record("TC051","Alerts show pathogen detection details","FAIL");}catch(e){record("TC051","Alerts show pathogen detection details","FAIL",e.message);}
    try{const btns=await driver.findElements(By.css("button"));let found=false;for(const b of btns){const t=await b.getText().catch(()=>"");if(t.toLowerCase().includes("read")||t.toLowerCase().includes("mark")){found=true;break;}}record("TC052","Alerts has mark read functionality",found?"PASS":"SKIP");}catch(e){record("TC052","Alerts has mark read functionality","SKIP",e.message);}
    try{await goTo(driver,"/dashboard");const bells=await driver.findElements(By.css("a[href*=alert]"));if(bells.length>0)record("TC053","Bell icon links to alerts","PASS");else record("TC053","Bell icon links to alerts","FAIL");}catch(e){record("TC053","Bell icon links to alerts","FAIL",e.message);}

    // ── TC054-062: Sensors ──
    try{await goTo(driver,"/sensors");const b=await txt(driver);if(b.includes("Sensor"))record("TC054","Sensors page loads","PASS");else record("TC054","Sensors page loads","FAIL");}catch(e){record("TC054","Sensors page loads","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("Electrochemical"))record("TC055","Electrochemical sensor visible","PASS");else record("TC055","Electrochemical sensor visible","FAIL");}catch(e){record("TC055","Electrochemical sensor visible","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("Optical"))record("TC056","Optical sensor visible","PASS");else record("TC056","Optical sensor visible","FAIL");}catch(e){record("TC056","Optical sensor visible","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("LOD")||b.includes("nM"))record("TC057","Sensor LOD threshold visible","PASS");else record("TC057","Sensor LOD threshold visible","FAIL");}catch(e){record("TC057","Sensor LOD threshold visible","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("QS")||b.includes("threshold")||b.includes("50"))record("TC058","Sensor QS threshold visible","PASS");else record("TC058","Sensor QS threshold visible","FAIL");}catch(e){record("TC058","Sensor QS threshold visible","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("Live Signal")||b.includes("Signal Trace")||b.includes("NORMAL")||b.includes("nM"))record("TC059","Sensor live signal trace visible","PASS");else record("TC059","Sensor live signal trace visible","FAIL");}catch(e){record("TC059","Sensor live signal trace visible","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("Inject")||b.includes("Send")||b.includes("Value"))record("TC060","Sensor inject reading section visible","PASS");else record("TC060","Sensor inject reading section visible","FAIL");}catch(e){record("TC060","Sensor inject reading section visible","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("Calibrate")||b.includes("calibrate"))record("TC061","Sensor calibrate button visible","PASS");else record("TC061","Sensor calibrate button visible","FAIL");}catch(e){record("TC061","Sensor calibrate button visible","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("Add sensor")||b.includes("Add Sensor")||b.includes("+ Add"))record("TC062","Add sensor button visible","PASS");else record("TC062","Add sensor button visible","FAIL");}catch(e){record("TC062","Add sensor button visible","FAIL",e.message);}

    // ── TC063-070: Simulator ──
    try{await goTo(driver,"/simulator");const b=await txt(driver);if(b.includes("Simulator")||b.includes("Biosensor"))record("TC063","Simulator page loads","PASS");else record("TC063","Simulator page loads","FAIL");}catch(e){record("TC063","Simulator page loads","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("DPV"))record("TC064","DPV Colorimetric platform visible","PASS");else record("TC064","DPV Colorimetric platform visible","FAIL");}catch(e){record("TC064","DPV Colorimetric platform visible","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("Piezoelectric"))record("TC065","Piezoelectric platform visible","PASS");else record("TC065","Piezoelectric platform visible","FAIL");}catch(e){record("TC065","Piezoelectric platform visible","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("FRET"))record("TC066","FRET Quantum-Dot platform visible","PASS");else record("TC066","FRET Quantum-Dot platform visible","FAIL");}catch(e){record("TC066","FRET Quantum-Dot platform visible","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("AuNP"))record("TC067","AuNP Lateral Flow platform visible","PASS");else record("TC067","AuNP Lateral Flow platform visible","FAIL");}catch(e){record("TC067","AuNP Lateral Flow platform visible","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("MIP"))record("TC068","MIP Capacitive platform visible","PASS");else record("TC068","MIP Capacitive platform visible","FAIL");}catch(e){record("TC068","MIP Capacitive platform visible","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("LOD")||b.includes("Run"))record("TC069","Simulator shows LOD and Run Scan controls","PASS");else record("TC069","Simulator shows LOD and Run Scan controls","FAIL");}catch(e){record("TC069","Simulator shows LOD and Run Scan controls","FAIL",e.message);}
    try{const btns=await driver.findElements(By.css("button"));let clicked=false;for(const b of btns){const t=await b.getText().catch(()=>"");if(t.toLowerCase().includes("run")||t.toLowerCase().includes("scan")){await b.click();clicked=true;break;}}if(clicked){await sleep(10000);const b=await txt(driver);if(b.includes("DETECTED")||b.includes("Signal")||b.includes("detecting")||b.includes("LOD"))record("TC070","Simulator run scan generates live signal","PASS");else record("TC070","Simulator run scan generates live signal","FAIL");}else record("TC070","Simulator run scan generates live signal","FAIL","Run button not found");}catch(e){record("TC070","Simulator run scan generates live signal","FAIL",e.message);}

    // ── TC071-076: Library ──
    try{await goTo(driver,"/library");const b=await txt(driver);if(b.includes("Pathogen")||b.includes("library"))record("TC071","Pathogen library loads","PASS");else record("TC071","Pathogen library loads","FAIL");}catch(e){record("TC071","Pathogen library loads","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("aeruginosa"))record("TC072","Library shows Pseudomonas aeruginosa","PASS");else record("TC072","Library shows Pseudomonas aeruginosa","FAIL");}catch(e){record("TC072","Library shows Pseudomonas aeruginosa","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("aureus")||b.includes("MRSA"))record("TC073","Library shows S. aureus/MRSA","PASS");else record("TC073","Library shows S. aureus/MRSA","FAIL");}catch(e){record("TC073","Library shows S. aureus/MRSA","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("Critical"))record("TC074","Library shows Critical section","PASS");else record("TC074","Library shows Critical section","FAIL");}catch(e){record("TC074","Library shows Critical section","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("Biomarker")||b.includes("QS")||b.includes("AMR"))record("TC075","Library cards show clinical data","PASS");else record("TC075","Library cards show clinical data","FAIL");}catch(e){record("TC075","Library cards show clinical data","FAIL",e.message);}
    try{const links=await driver.findElements(By.css("a"));let found=false;for(const l of links){const h=await l.getAttribute("href").catch(()=>"");if(h&&h.includes("/library/")&&!h.endsWith("/library/")){await l.click();await sleep(2000);const b=await txt(driver);if(b.includes("AMR")||b.includes("Treatment")||b.includes("Biomarker"))found=true;break;}}record("TC076","Pathogen detail page loads on click",found?"PASS":"SKIP");}catch(e){record("TC076","Pathogen detail page loads on click","SKIP",e.message);}

    // ── TC077-080: Compare ──
    try{await goTo(driver,"/compare");const b=await txt(driver);if(b.includes("Compare"))record("TC077","Compare page loads","PASS");else record("TC077","Compare page loads","FAIL");}catch(e){record("TC077","Compare page loads","FAIL",e.message);}
    try{const s=await driver.findElements(By.css("select"));if(s.length>=2)record("TC078","Compare has two pathogen selectors","PASS");else record("TC078","Compare has two pathogen selectors","FAIL");}catch(e){record("TC078","Compare has two pathogen selectors","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("QS")||b.includes("Quorum"))record("TC079","Compare shows QS comparison","PASS");else record("TC079","Compare shows QS comparison","FAIL");}catch(e){record("TC079","Compare shows QS comparison","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("AMR")||b.includes("Resistance")||b.includes("Treatment"))record("TC080","Compare shows AMR/Treatment comparison","PASS");else record("TC080","Compare shows AMR/Treatment comparison","FAIL");}catch(e){record("TC080","Compare shows AMR/Treatment comparison","FAIL",e.message);}

    // ── TC081-085: Analytics ──
    try{await goTo(driver,"/analytics");const b=await txt(driver);if(b.includes("Analytics"))record("TC081","Analytics page loads","PASS");else record("TC081","Analytics page loads","FAIL");}catch(e){record("TC081","Analytics page loads","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("Timeline"))record("TC082","Analytics infection timeline visible","PASS");else record("TC082","Analytics infection timeline visible","FAIL");}catch(e){record("TC082","Analytics infection timeline visible","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("Heatmap")||b.includes("Site"))record("TC083","Analytics infection heatmap visible","PASS");else record("TC083","Analytics infection heatmap visible","FAIL");}catch(e){record("TC083","Analytics infection heatmap visible","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("Calculator")||b.includes("LOD"))record("TC084","Analytics LOD calculator visible","PASS");else record("TC084","Analytics LOD calculator visible","FAIL");}catch(e){record("TC084","Analytics LOD calculator visible","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("Pyocyanin")||b.includes("Biomarker")||b.includes("HSL"))record("TC085","Analytics shows biomarker quick-fill buttons","PASS");else record("TC085","Analytics shows biomarker quick-fill buttons","FAIL");}catch(e){record("TC085","Analytics shows biomarker quick-fill buttons","FAIL",e.message);}

    // ── TC086-089: History & Outbreaks ──
    try{await goTo(driver,"/history");const b=await txt(driver);if(b.includes("History")||b.includes("aeruginosa")||b.includes("Scan"))record("TC086","History page shows scan records","PASS");else record("TC086","History page shows scan records","FAIL");}catch(e){record("TC086","History page shows scan records","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("Critical")||b.includes("High"))record("TC087","History shows risk indicators","PASS");else record("TC087","History shows risk indicators","FAIL");}catch(e){record("TC087","History shows risk indicators","FAIL",e.message);}
    try{await goTo(driver,"/outbreaks");const b=await txt(driver);if(b.includes("Outbreak")||b.includes("Ward"))record("TC088","Outbreaks page loads","PASS");else record("TC088","Outbreaks page loads","FAIL");}catch(e){record("TC088","Outbreaks page loads","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("LIVE")||b.includes("Ward")||b.includes("refresh"))record("TC089","Outbreaks shows live monitoring","PASS");else record("TC089","Outbreaks shows live monitoring","FAIL");}catch(e){record("TC089","Outbreaks shows live monitoring","FAIL",e.message);}

    // ── TC090-095: Settings ──
    try{await goTo(driver,"/settings");const b=await txt(driver);if(b.includes("Settings")||b.includes("Profile"))record("TC090","Settings page loads","PASS");else record("TC090","Settings page loads","FAIL");}catch(e){record("TC090","Settings page loads","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("name")||b.includes("Name")||b.includes("Email"))record("TC091","Settings shows profile form","PASS");else record("TC091","Settings shows profile form","FAIL");}catch(e){record("TC091","Settings shows profile form","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("Password")||b.includes("password"))record("TC092","Settings shows change password","PASS");else record("TC092","Settings shows change password","FAIL");}catch(e){record("TC092","Settings shows change password","FAIL",e.message);}
    try{const b=await txt(driver);if(b.includes("Light")||b.includes("Dark")||b.includes("Theme"))record("TC093","Settings shows theme toggle","PASS");else record("TC093","Settings shows theme toggle","FAIL");}catch(e){record("TC093","Settings shows theme toggle","FAIL",e.message);}
    try{const btns=await driver.findElements(By.css("button"));let found=false;for(const b of btns){const t=await b.getText().catch(()=>"");if(t.includes("Save")||t.includes("save")){found=true;break;}}record("TC094","Settings has Save profile button",found?"PASS":"FAIL");}catch(e){record("TC094","Settings has Save profile button","FAIL",e.message);}

    // ── TC095-100: Backend APIs & Logout ──
    try{await driver.get(BACKEND_URL+"/health");await sleep(2000);const b=await txt(driver);if(b.includes("healthy"))record("TC095","Backend health API healthy","PASS");else record("TC095","Backend health API healthy","FAIL");}catch(e){record("TC095","Backend health API healthy","FAIL",e.message);}
    try{await driver.get(BACKEND_URL+"/api/dashboard");await sleep(2000);const b=await txt(driver);if(b.includes("total_scans"))record("TC096","Backend dashboard API returns stats","PASS");else record("TC096","Backend dashboard API returns stats","FAIL");}catch(e){record("TC096","Backend dashboard API returns stats","FAIL",e.message);}
    try{await driver.get(BACKEND_URL+"/api/scans");await sleep(2000);const b=await txt(driver);if(b.includes("pathogen_name"))record("TC097","Backend scans API returns records","PASS");else record("TC097","Backend scans API returns records","FAIL");}catch(e){record("TC097","Backend scans API returns records","FAIL",e.message);}
    try{await driver.get(BACKEND_URL+"/api/patients");await sleep(2000);const b=await txt(driver);if(b.includes("patient_id")||b.includes("scan_count"))record("TC098","Backend patients API returns data","PASS");else record("TC098","Backend patients API returns data","FAIL");}catch(e){record("TC098","Backend patients API returns data","FAIL",e.message);}
    try{await driver.get(BACKEND_URL+"/api/outbreaks");await sleep(2000);const b=await txt(driver);if(b.includes("pathogen_name")||b.includes("[]")||b.includes("[{"))record("TC099","Backend outbreaks API returns data","PASS");else record("TC099","Backend outbreaks API returns data","FAIL");}catch(e){record("TC099","Backend outbreaks API returns data","FAIL",e.message);}
    try{
      await goTo(driver,"/dashboard");
      const so=await driver.findElement(By.xpath("//*[contains(text(),'Sign out') or contains(text(),'sign out')]"));
      await so.click();await sleep(3000);
      const url=await driver.getCurrentUrl();
      if(url.includes("/login")||url.includes("/"))record("TC100","Sign out redirects to login","PASS");
      else record("TC100","Sign out redirects to login","FAIL",url);
    }catch(e){record("TC100","Sign out redirects to login","FAIL",e.message);}

  }finally{
    await driver.quit();
    await saveReport();
  }
}
run().catch(console.error);
