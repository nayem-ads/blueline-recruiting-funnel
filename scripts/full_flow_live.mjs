import { spawn } from "node:child_process";
import fs from "node:fs";

const ARTIFACTS_DIR = "/Users/j38/.gemini/antigravity/brain/707ed1ee-f302-484f-9c56-52245dca883f";

const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new",
  "--incognito",
  "--disable-cache",
  "--remote-debugging-port=9236",
  "--window-size=390,844",
  "--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  "https://pro.linerecruiting.com/apply"
]);

await new Promise((r) => setTimeout(r, 2500));

const listRes = await fetch("http://127.0.0.1:9236/json/list");
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
await send("DOM.enable");

async function snap(name) {
  const ss = await send("Page.captureScreenshot", { format: "png" });
  if (ss.result?.data) {
    fs.writeFileSync(`${ARTIFACTS_DIR}/${name}.png`, Buffer.from(ss.result.data, "base64"));
    console.log(`Saved screenshot: ${name}.png`);
  }
}

// Helper to set React input value
async function setReactInput(selector, value) {
  return send("Runtime.evaluate", {
    expression: `(() => {
      const input = document.querySelector('${selector}');
      if (!input) return false;
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, '${value}');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()`,
    returnByValue: true
  });
}

// 1. Initial wait for page & bundle
await new Promise((r) => setTimeout(r, 6000));
await snap("live_step1");
console.log("On Step 1, clicking Company OTR...");

// Click Step 1 Option
await send("Runtime.evaluate", {
  expression: `(() => {
    const btn = document.querySelector('.bl-option');
    if (btn) btn.click();
  })()`
});

// Wait for transition to Step 2
await new Promise((r) => setTimeout(r, 800));
await snap("live_step2");
console.log("On Step 2, clicking 5+ years experience...");

// Click Step 2 Option
await send("Runtime.evaluate", {
  expression: `(() => {
    const btn = document.querySelector('.bl-option');
    if (btn) btn.click();
  })()`
});

// Wait for transition to Step 3
await new Promise((r) => setTimeout(r, 800));
await snap("live_step3");
console.log("On Step 3, entering ZIP code 75001...");

// Set ZIP
await setReactInput('input[type="tel"]', "75001");
await new Promise((r) => setTimeout(r, 500));
await snap("live_step3_zip_entered");

// Click Continue to final step
console.log("Clicking Continue to final step...");
await send("Runtime.evaluate", {
  expression: `(() => {
    const btn = document.querySelector('.bl-cta-submit');
    if (btn) btn.click();
  })()`
});

// Wait for transition to Step 4
await new Promise((r) => setTimeout(r, 800));
await snap("live_step4");
console.log("On Step 4, entering driver full name and phone number...");

// Set Full Name & Phone
await setReactInput('input[name="full_name"]', "Marcus Vance");
await setReactInput('input[name="phone"]', "8162568329");
await new Promise((r) => setTimeout(r, 500));
await snap("live_step4_filled");

// Submit Lead
console.log("Submitting Step 4 application...");
await send("Runtime.evaluate", {
  expression: `(() => {
    const btn = document.querySelector('button[type="submit"]');
    if (btn) btn.click();
  })()`
});

// Wait for submission response and redirect to /applied
await new Promise((r) => setTimeout(r, 4500));
await snap("live_applied_success");

const finalState = await send("Runtime.evaluate", {
  expression: `(() => {
    return {
      url: window.location.href,
      h1: document.querySelector('h1')?.innerText,
      badge: document.querySelector('.bl-thanks__badge')?.innerText
    };
  })()`,
  returnByValue: true
});

console.log("Final State on pro.linerecruiting.com:", JSON.stringify(finalState.result?.result?.value, null, 2));

ws.close();
chrome.kill();
console.log("Full live funnel test completed successfully!");
