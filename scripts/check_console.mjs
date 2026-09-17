import { spawn } from "node:child_process";

const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new",
  "--incognito",
  "--disable-cache",
  "--remote-debugging-port=9234",
  "--window-size=390,844",
  "https://pro.linerecruiting.com/apply"
]);

await new Promise((r) => setTimeout(r, 2000));

const listRes = await fetch("http://127.0.0.1:9234/json/list");
const listData = await listRes.json();
const page = listData.find(t => t.type === "page") || listData[0];
const ws = new WebSocket(page.webSocketDebuggerUrl);

let id = 1;
const pending = new Map();

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.method === "Runtime.consoleAPICalled") {
    console.log("[BROWSER CONSOLE]", msg.params.type, msg.params.args.map(a => a.value || a.description).join(" "));
  }
  if (msg.method === "Runtime.exceptionThrown") {
    console.error("[BROWSER EXCEPTION]", msg.params.exceptionDetails);
  }
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

await send("Runtime.enable");
await send("Page.enable");

await new Promise((r) => setTimeout(r, 4000));

const res = await send("Runtime.evaluate", {
  expression: `(() => {
    const isHydrated = !!window.$TSR?.hydrated;
    const btns = document.querySelectorAll('.bl-option');
    return {
      isHydrated,
      buttonCount: btns.length,
      firstButtonText: btns[0]?.innerText
    };
  })()`,
  returnByValue: true
});

console.log("Status:", res.result?.result?.value);

ws.close();
chrome.kill();
