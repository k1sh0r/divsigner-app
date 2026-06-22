const puppeteer = require("puppeteer");

const IDS = [
  "aurora","balatro","ballpit","beams","colorbends","darkveil","dither","dotfield",
  "dotgrid","evileye","faultyterminal","ferrofluid","floatinglines","galaxy",
  "gradientblinds","grainient","griddistortion","gridmotion","gridscan","hyperspeed",
  "iridescence","letterglitch","lightfall","lightning","lightpillar","lightrays",
  "linewaves","liquidchrome","liquidether","orb","particles","pixelblast","pixelsnow",
  "plasma","plasmawave","prism","prismaticburst","radar","ripplegrid","shapegrid",
  "siderays","silk","softaurora","threads","waves",
];

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox","--enable-webgl","--ignore-gpu-blocklist",
      "--enable-unsafe-swiftshader","--use-gl=angle","--use-angle=swiftshader",
    ],
  });
  for (const id of IDS) {
    const page = await browser.newPage();
    const errs = [];
    page.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message));
    page.on("requestfailed", (r) => {
      const u = r.url();
      if (!u.includes("main.tsx")) errs.push("REQFAIL: " + u);
    });
    try {
      await page.goto(`http://localhost:5174/bgtest.html?id=${id}`, {
        waitUntil: "networkidle0", timeout: 15000,
      });
    } catch (e) { errs.push("GOTO: " + e.message); }
    await new Promise((r) => setTimeout(r, 1800));
    const status = errs.length === 0 ? "OK" : "CRASH";
    console.log(`${status.padEnd(6)} ${id}`);
    errs.slice(0, 2).forEach((e) => console.log("        " + e.slice(0, 160)));
    await page.close();
  }
  await browser.close();
})();
