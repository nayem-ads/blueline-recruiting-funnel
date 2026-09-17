import { spawn } from "node:child_process";
import fs from "node:fs";

const ARTIFACTS_DIR = "/Users/j38/.gemini/antigravity/brain/707ed1ee-f302-484f-9c56-52245dca883f";

const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new",
  "--incognito",
  "--disable-cache",
  "--remote-debugging-port=9233",
  "--window-size=390,844",
  "--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  "https://pro.linerecruiting.com/apply"
]);

await new Promise((r) => setTimeout(r, 2500));

const listRes = await fetch("http://127.0.0.1:9233/json/list");
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
await send("DOM.enable");

async function snap(name) {
  const ss = await send("Page.captureScreenshot", { format: "png" });
  if (ss.result?.data) {
    fs.writeFileSync(`${ARTIFACTS_DIR}/${name}.png`, Buffer.from(ss.result.data, "base64"));
    console.log(`Saved screenshot: ${name}.png`);
  }
}

// Wait for page load & hydration
await new Promise((r) => setTimeout(r, 3000));
await snap("step1_live");

// Step 1: Click first option ("Company OTR")
console.log("Selecting Step 1 option...");
await send("Runtime.evaluate", {
  expression: `(() => {
    const btn = document.querySelector('.bl-option');
    if (btn) btn.click();
  })()`
});

await new Promise((r) => setTimeout(r, 600));
await snap("step2_live");

// Step 2: Click "5+ years"
console.log("Selecting Step 2 experience...");
await send("Runtime.evaluate", {
  expression: `(() => {
    const btn = document.querySelector('.bl-option');
    if (btn) btn.click();
  })()`
});

await new Promise((r) => setTimeout(r, 600));
await snap("step3_live");

// Step 3: Fill ZIP code
console.log("Filling ZIP code...");
await send("Runtime.evaluate", {
  expression: `(() => {
    const input = document.querySelector('input[type="tel"]');
    if (input) {
      input.value = "75001";
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  })()`
});

await new Promise((r) => setTimeout(r, 500));
await snap("step3_zip_filled");

// Click Continue to final step
console.log("Clicking Continue to final step...");
await send("Runtime.evaluate", {
  expression: `(() => {
    const btn = document.querySelector('.bl-cta-submit');
    if (btn) btn.click();
  })()`
});

await new Promise((r) => setTimeout(r, 600));
await snap("step4_live");

// Step 4: Fill Full Name & Phone
console.log("Filling Step 4 contact info...");
await send("Runtime.evaluate", {
  expression: `(() => {
    const nameInput = document.querySelector('input[name="full_name"]');
    if (nameInput) {
      nameInput.value = "Marcus Vance";
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));
      nameInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
    const phoneInput = document.querySelector('input[name="phone"]');
    if (phoneInput) {
      phoneInput.value = "8162568329";
      phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
      phoneInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  })()`
});

await new Promise((r) => setTimeout(r, 500));
await snap("step4_filled");

// Submit form
console.log("Submitting lead from pro.linerecruiting.com...");
await send("Runtime.evaluate", {
  expression: `(() => {
    const btn = document.querySelector('.bl-cta-submit');
    if (btn) btn.click();
  })()`
});

// Wait for submission and redirection to /applied
await new Promise((r) => setTimeout(r, 4000));
await snap("applied_live_success");

const currentUrl = await send("Runtime.evaluate", {
  expression: `window.location.href`
});
console.log("Final URL:", currentUrl.result?.result?.value);

ws.close();
chrome.kill();
console.log("Done!");
