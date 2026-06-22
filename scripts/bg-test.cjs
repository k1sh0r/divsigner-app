const puppeteer = require("puppeteer");

(async () => {
  const id = process.argv[2] || "ballpit";
  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--enable-webgl",
      "--ignore-gpu-blocklist",
      "--enable-unsafe-swiftshader",
      "--use-gl=angle",
      "--use-angle=swiftshader",
    ],
  });
  const page = await browser.newPage();
  const errors = [];
  const consoleMsgs = [];
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") {
      consoleMsgs.push(`CONSOLE.${m.type()}: ${m.text()}`);
    }
  });
  page.on("requestfailed", (r) =>
    errors.push("REQFAIL: " + r.url() + " " + (r.failure()?.errorText || "")),
  );
  const url = `http://localhost:5174/bgtest.html?id=${id}`;
  try {
    await page.goto(url, { waitUntil: "networkidle0", timeout: 20000 });
  } catch (e) {
    errors.push("GOTO: " + e.message);
  }
  await new Promise((r) => setTimeout(r, 2500));
  console.log("=== TEST:", id, "===");
  if (errors.length === 0) console.log("NO ERRORS");
  else errors.forEach((e) => console.log(e));
  consoleMsgs.slice(0, 10).forEach((m) => console.log(m));
  await browser.close();
})();
