import { spawn } from "node:child_process";
import fs from "node:fs";

const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new",
  "--incognito",
  "--disable-cache",
  "--remote-debugging-port=9225",
  "--window-size=390,844",
  "--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  "https://pro.linerecruiting.com"
]);

await new Promise((r) => setTimeout(r, 2500));

const listRes = await fetch("http://127.0.0.1:9225/json/list");
const listData = await listRes.json();
const page = listData.find(t => t.type === "page") || listData[0];
const ws = new WebSocket(page.webSocketDebuggerUrl);

let id = 1;
const pending = new Map();

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
};

await new Promise((r) => ws.onopen = r);

function send(method, params = {}) {
  const reqId = id++;
  return new Promise((resolve) => {
    pending.set(reqId, resolve);
    ws.send(JSON.stringify({ id: reqId, method, params }));
  });
}

await send("Page.enable");
await send("Runtime.enable");
await send("Network.enable");
await send("Network.setCacheDisabled", { cacheDisabled: true });
await send("Page.reload", { ignoreCache: true });

await new Promise((r) => setTimeout(r, 3000));

const scrollPositions = [0, 400, 800, 1200, 1600, 2000, 2400];

for (const pos of scrollPositions) {
  await send("Runtime.evaluate", {
    expression: `window.scrollTo(0, ${pos}); window.dispatchEvent(new Event('scroll'));`
  });
  await new Promise((r) => setTimeout(r, 500));

  const ss = await send("Page.captureScreenshot", { format: "png" });
  if (ss.result?.data) {
    fs.writeFileSync(`/Users/j38/.gemini/antigravity/brain/a848c016-a2d8-4d1b-831a-69d3b956eb37/scratch/fresh_scroll_${pos}.png`, Buffer.from(ss.result.data, "base64"));
  }
}

ws.close();
chrome.kill();
console.log("Fresh screenshots captured successfully.");
