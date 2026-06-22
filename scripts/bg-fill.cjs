const puppeteer = require("puppeteer");
const fs = require("fs");
const { PNG } = require("pngjs");

const IDS = process.argv.slice(2);
const ENTRY = process.env.ENTRY || "bgtest"; // bgtest (direct) or layer

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
    const errs = [];
    page.on("pageerror", (e) => errs.push(e.message));
    const html = ENTRY === "layer" ? "layer.html" : "bgtest.html";
    try {
      await page.goto(`http://localhost:5174/${html}?id=${id}`, {
        waitUntil: "networkidle0", timeout: 15000,
      });
    } catch (e) {}
    await new Promise((r) => setTimeout(r, 2500));
    const file = `/tmp/bgfill_${id}.png`;
    await page.screenshot({ path: file, clip: { x: 0, y: 0, width: 800, height: 600 } });
    await page.close();
    // analyze fill: count pixels that differ from #222 (34,34,34) by > 12
    const png = PNG.sync.read(fs.readFileSync(file));
    const { data, width, height } = png;
    let filled = 0, total = 0;
    for (let y = 0; y < height; y += 4) {
      for (let x = 0; x < width; x += 4) {
        const i = (y * width + x) * 4;
        const r = data[i], g = data[i + 1], b = data[i + 2];
        total++;
        if (Math.abs(r - 34) > 14 || Math.abs(g - 34) > 14 || Math.abs(b - 34) > 14) filled++;
      }
    }
    const pct = Math.round((filled / total) * 100);
    const flag = pct < 90 ? "  <-- LOW FILL" : "";
    const eflag = errs.length ? " ERR=" + errs[0].slice(0, 60) : "";
    console.log(`${id.padEnd(16)} fill=${pct}%${flag}${eflag}`);
  }
  await browser.close();
})();
