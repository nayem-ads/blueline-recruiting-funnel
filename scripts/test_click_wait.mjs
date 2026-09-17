import { spawn } from "node:child_process";

const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new",
  "--remote-debugging-port=9235",
  "--window-size=390,844",
  "https://pro.linerecruiting.com/apply"
]);

await new Promise((r) => setTimeout(r, 2000));

const listRes = await fetch("http://127.0.0.1:9235/json/list");
const listData = await listRes.json();
const page = listData.find(t => t.type === "page") || listData[0];
const ws = new WebSocket(page.webSocketDebuggerUrl);

let id = 1;
const pending = new Map();

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.method === "Runtime.consoleAPICalled") {
    console.log("[CONSOLE]", msg.params.type, msg.params.args.map(a => a.value || a.description).join(" "));
  }
  if (msg.method === "Runtime.exceptionThrown") {
    console.error("[EXCEPTION]", msg.params.exceptionDetails?.text, msg.params.exceptionDetails?.exception?.description);
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

// Poll for hydration
let hydrated = false;
for (let i = 0; i < 25; i++) {
  const check = await send("Runtime.evaluate", {
    expression: `!!(window.$_TSR?.hydrated || window.$TSR?.hydrated)`
  });
  hydrated = !!check.result?.result?.value;
  if (hydrated) {
    console.log(`Hydrated at ${i * 500}ms!`);
    break;
  }
  await new Promise((r) => setTimeout(r, 500));
}

console.log("Hydration status:", hydrated);

// Now click Step 1
console.log("Clicking Step 1...");
const clickRes = await send("Runtime.evaluate", {
  expression: `(() => {
    const btn = document.querySelector('.bl-option');
    if (!btn) return 'no button';
    btn.click();
    return 'clicked ' + btn.innerText.split('\\n')[0];
  })()`
});
console.log("Click result:", clickRes.result?.result?.value);

// Wait for step transition (160ms + React render)
await new Promise((r) => setTimeout(r, 600));

const stepCheck = await send("Runtime.evaluate", {
  expression: `(() => {
    return {
      stepText: document.querySelector('.bl-quiz__step')?.innerText,
      heading: document.querySelector('h1')?.innerText
    };
  })()`,
  returnByValue: true
});
console.log("Current Step:", stepCheck.result?.result?.value);

ws.close();
chrome.kill();
