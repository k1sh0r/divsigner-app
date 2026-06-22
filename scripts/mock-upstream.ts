// Mock upstream SSE server for end-to-end testing of the Vite dev relay.
// Stands in for api.openai.com and emits realistic OpenAI-format chunks
// with configurable first-byte delay (to simulate a thinking model).
// Run on api.openai.com:4567 so the dev-server relay's allowlist accepts
// it. Requires `sudo tee -a /etc/hosts` of `127.0.0.1 api.openai.com` to
// resolve in this sandbox, or use the MOCK_HOST override.
import { createServer } from "node:http";

const PORT = Number(process.env.MOCK_PORT || 4567);
const HOST = process.env.MOCK_HOST || "127.0.0.1";
const FIRST_BYTE_MS = Number(process.env.FIRST_BYTE_MS || 0);
const CHUNK_DELAY_MS = Number(process.env.CHUNK_DELAY_MS || 0);
const CHUNKS = Number(process.env.CHUNKS || 5);
const FAIL_AFTER = Number(process.env.FAIL_AFTER || 0); // 0 = never
const STATUS = Number(process.env.STATUS || 200);

const html = "<!doctype html><html><body>" + "x".repeat(50) + "</body></html>";
const chunkLen = Math.ceil(html.length / CHUNKS);

createServer((req, res) => {
  res.writeHead(STATUS, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
  });
  let i = 0;
  const tick = () => {
    if (FAIL_AFTER > 0 && i >= FAIL_AFTER) {
      // simulate a network drop mid-stream
      res.destroy();
      return;
    }
    if (i >= CHUNKS) {
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }
    const slice = html.slice(i * chunkLen, (i + 1) * chunkLen);
    const payload = JSON.stringify({
      choices: [{ delta: { content: slice } }],
    });
    res.write(`data: ${payload}\n\n`);
    i++;
    if (i === 1 && FIRST_BYTE_MS > 0) {
      setTimeout(tick, FIRST_BYTE_MS);
    } else if (CHUNK_DELAY_MS > 0) {
      setTimeout(tick, CHUNK_DELAY_MS);
    } else {
      setImmediate(tick);
    }
  };
  if (FIRST_BYTE_MS > 0) setTimeout(tick, FIRST_BYTE_MS);
  else tick();
}).listen(PORT, HOST, () => {
  console.log(`mock upstream on http://${HOST}:${PORT}`);
  console.log(
    `  first-byte=${FIRST_BYTE_MS}ms  chunk-delay=${CHUNK_DELAY_MS}ms  chunks=${CHUNKS}  fail-after=${FAIL_AFTER}`,
  );
});
