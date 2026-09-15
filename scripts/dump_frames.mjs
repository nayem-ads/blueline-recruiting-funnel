import { spawn } from "node:child_process";
import fs from "node:fs";

const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new",
  "--remote-debugging-port=9224",
  "https://pro.linerecruiting.com"
]);

await new Promise((r) => setTimeout(r, 2000));

const list = await (await fetch("http://127.0.0.1:9224/json/list")).json();
const ws = new WebSocket(list[0].webSocketDebuggerUrl);
await new Promise((r) => ws.onopen = r);

let id = 1;
function send(method, params = {}) {
  return new Promise((resolve) => {
    const reqId = id++;
    const handler = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id === reqId) {
        ws.removeEventListener("message", handler);
        resolve(msg);
      }
    };
    ws.addEventListener("message", handler);
    ws.send(JSON.stringify({ id: reqId, method, params }));
  });
}

await send("Runtime.enable");

const res = await send("Runtime.evaluate", {
  expression: `(async () => {
    const clips = [
      "scene-01-mobile.mp4",
      "scene-02-mobile.mp4",
      "scene-03-mobile.mp4",
      "scene-01.mp4",
      "scene-02.mp4",
      "scene-03.mp4"
    ];
    const results = {};

    for (const clip of clips) {
      const v = document.createElement("video");
      v.crossOrigin = "anonymous";
      v.src = "/assets/world/" + clip;
      await new Promise(r => v.onloadedmetadata = r);
      results[clip] = { duration: v.duration, width: v.videoWidth, height: v.videoHeight };
      
      const canvas = document.createElement("canvas");
      canvas.width = v.videoWidth;
      canvas.height = v.videoHeight;
      const ctx = canvas.getContext("2d");
      
      // Seek to 1s
      v.currentTime = 1.0;
      await new Promise(r => v.onseeked = r);
      ctx.drawImage(v, 0, 0);
      results[clip].frameAt1s = canvas.toDataURL("image/jpeg", 0.7);
    }
    return results;
  })()`,
  awaitPromise: true,
  returnByValue: true
});

const frames = res.result?.result?.value;
console.log("Metadata:", Object.fromEntries(Object.entries(frames || {}).map(([k, v]) => [k, { duration: v.duration, width: v.width, height: v.height }])));

for (const [k, v] of Object.entries(frames || {})) {
  if (v.frameAt1s) {
    const base64 = v.frameAt1s.replace(/^data:image\/jpeg;base64,/, "");
    fs.writeFileSync(`/Users/j38/.gemini/antigravity/brain/a848c016-a2d8-4d1b-831a-69d3b956eb37/scratch/frame_${k}.jpg`, Buffer.from(base64, "base64"));
  }
}

ws.close();
chrome.kill();
