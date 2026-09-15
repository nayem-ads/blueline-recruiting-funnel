import { spawn } from "node:child_process";
import fs from "node:fs";

const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new",
  "--remote-debugging-port=9222",
  "--window-size=390,844",
  "--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  "https://pro.linerecruiting.com"
]);

await new Promise((r) => setTimeout(r, 2500));

const listRes = await fetch("http://127.0.0.1:9222/json/list");
const listData = await listRes.json();
const page = listData.find(t => t.type === "page") || listData[0];
const wsUrl = page.webSocketDebuggerUrl;

console.log("Page WebSocket URL:", wsUrl);

const ws = new WebSocket(wsUrl);
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
await send("DOM.enable");

await new Promise((r) => setTimeout(r, 2500));

const evalRes = await send("Runtime.evaluate", {
  expression: `(() => {
    const layers = [...document.querySelectorAll('[data-scroll-scrub-layer]')].map(l => ({
      opacity: l.style.opacity,
      zIndex: l.style.zIndex,
      video: !!l.querySelector('video'),
      videoSrc: l.querySelector('video')?.src,
      videoCurrentTime: l.querySelector('video')?.currentTime,
      videoReady: l.querySelector('video')?.readyState,
      videoPainted: l.dataset.videoPainted,
      videoFailed: l.dataset.videoFailed
    }));
    return {
      scrollY: window.scrollY,
      innerHeight: window.innerHeight,
      scrollHeight: document.documentElement.scrollHeight,
      layers
    };
  })()`,
  returnByValue: true
});

console.log("Initial state:", JSON.stringify(evalRes.result?.result?.value, null, 2));

const scrollPositions = [0, 500, 1000, 1500, 2000, 2500, 3000];

for (const pos of scrollPositions) {
  await send("Runtime.evaluate", {
    expression: `window.scrollTo(0, ${pos}); window.dispatchEvent(new Event('scroll'));`
  });
  await new Promise((r) => setTimeout(r, 600));

  const state = await send("Runtime.evaluate", {
    expression: `(() => {
      const layers = [...document.querySelectorAll('[data-scroll-scrub-layer]')].map(l => ({
        opacity: l.style.opacity,
        zIndex: l.style.zIndex,
        hasVideo: !!l.querySelector('video'),
        videoCurrentTime: l.querySelector('video')?.currentTime,
        videoReady: l.querySelector('video')?.readyState,
        videoPainted: l.dataset.videoPainted,
        videoFailed: l.dataset.videoFailed
      }));
      return { scrollY: window.scrollY, layers };
    })()`,
    returnByValue: true
  });

  const ss = await send("Page.captureScreenshot", { format: "png" });
  if (ss.result?.data) {
    fs.writeFileSync(`/Users/j38/.gemini/antigravity/brain/a848c016-a2d8-4d1b-831a-69d3b956eb37/scratch/scroll_${pos}.png`, Buffer.from(ss.result.data, "base64"));
  }
  console.log(`Scroll pos ${pos}:`, JSON.stringify(state.result?.result?.value));
}

ws.close();
chrome.kill();
process.exit(0);
