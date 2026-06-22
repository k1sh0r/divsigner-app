const puppeteer = require("puppeteer");
const fs = require("fs");

const IDS = process.argv.slice(2);

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
    await page.setViewport({ width: 820, height: 620, deviceScaleFactor: 1 });
    try {
      await page.goto(`http://localhost:5174/layer.html?id=${id}`, {
        waitUntil: "networkidle0", timeout: 15000,
      });
    } catch (e) {}
    await new Promise((r) => setTimeout(r, 2500));
    await page.screenshot({ path: `/tmp/bg_${id}.png` });
    console.log("shot", id);
    await page.close();
  }
  await browser.close();
})();
