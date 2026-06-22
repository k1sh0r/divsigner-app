const puppeteer = require("puppeteer");

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
    const errs = [];
    page.on("pageerror", (e) => errs.push(e.message));
    try {
      await page.goto(`http://localhost:5174/bgtest.html?id=${id}`, {
        waitUntil: "networkidle0", timeout: 15000,
      });
    } catch (e) {}
    await new Promise((r) => setTimeout(r, 2200));
    const info = await page.evaluate(() => {
      const root = document.getElementById("root");
      const canvases = [...document.querySelectorAll("canvas")];
      const cs = canvases.map((c) => {
        const r = c.getBoundingClientRect();
        return {
          cw: c.width, ch: c.height,
          rectW: Math.round(r.width), rectH: Math.round(r.height),
          cssW: c.style.width, cssH: c.style.height,
        };
      });
      // first non-canvas child with content
      const firstDiv = root?.querySelector("div > div");
      let fr = null;
      if (firstDiv) {
        const r = firstDiv.getBoundingClientRect();
        fr = { rectW: Math.round(r.width), rectH: Math.round(r.height) };
      }
      return { canvasCount: canvases.length, canvases: cs, firstInner: fr };
    });
    console.log(`${id.padEnd(16)} canvases=${info.canvasCount} ${JSON.stringify(info.canvases)} firstInner=${JSON.stringify(info.firstInner)}${errs.length ? " ERR=" + errs[0].slice(0,80) : ""}`);
    await page.close();
  }
  await browser.close();
})();
