import { bindings } from "../bindings.server";
import type { LeadInput } from "../api/leads.functions";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

export type BrevoNotificationResult = {
  ok: boolean;
  status: string;
  error?: string;
  messageId?: string;
};

function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "").replace(/^1(\d{10})$/, "$1");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendBrevoLeadNotification(
  lead: LeadInput,
  meta?: { ip?: string; ua?: string; leadId?: number | null },
): Promise<BrevoNotificationResult> {
  const env = bindings();
  const apiKey = env.BREVO_API_KEY || (typeof process !== "undefined" ? process.env?.BREVO_API_KEY : undefined);
  const toEmailsRaw = env.BREVO_TO_EMAIL || (typeof process !== "undefined" ? process.env?.BREVO_TO_EMAIL : undefined) || "nayem.adsmanager@gmail.com, kenny@linerecruiting.com, hr@skyexpresstrucking.com";
  const senderEmail = env.BREVO_SENDER_EMAIL || (typeof process !== "undefined" ? process.env?.BREVO_SENDER_EMAIL : undefined) || "leads@linerecruiting.com";
  const senderName = env.BREVO_SENDER_NAME || (typeof process !== "undefined" ? process.env?.BREVO_SENDER_NAME : undefined) || "BlueLine Lead Notification";

  if (!apiKey) {
    console.warn("[brevo] BREVO_API_KEY is not configured. Email notification skipped.");
    return { ok: false, status: "skipped_no_api_key" };
  }

  if (!toEmailsRaw) {
    console.warn("[brevo] BREVO_TO_EMAIL is not configured. Email notification skipped.");
    return { ok: false, status: "skipped_no_recipient" };
  }

  const toList = toEmailsRaw
    .split(",")
    .map((e) => e.trim())
    .filter((e) => e.length > 0 && e.includes("@"))
    .map((email) => ({ email, name: "BlueLine Recruiter" }));

  if (toList.length === 0) {
    return { ok: false, status: "invalid_recipient_format" };
  }

  const fullName = [lead.first_name, lead.last_name].filter(Boolean).join(" ");
  const formattedPhone = formatPhoneDisplay(lead.phone);
  const phoneRaw = lead.phone.replace(/\D/g, "").replace(/^1(\d{10})$/, "$1");
  const callUrl = `tel:+1${phoneRaw}`;
  const now = new Date().toUTCString();

  const subject = `🚨 New CDL-A Lead: ${fullName} (${lead.experience || "2+ yrs"} | ${lead.lane || "General"})`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#0B111E;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#F1F5F9;">
  <div style="max-width:600px;margin:24px auto;background:#131C2E;border:1px solid #1E293B;border-radius:12px;overflow:hidden;">
    
    <!-- Header -->
    <div style="background:#0F172A;padding:24px 28px;border-bottom:1px solid #1E293B;">
      <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:#38BDF8;text-transform:uppercase;margin-bottom:6px;">
        BlueLine Recruiting &bull; Inbound Driver Lead
      </div>
      <h1 style="margin:0;font-size:22px;color:#FFFFFF;line-height:1.3;">
        ${escapeHtml(fullName)}
      </h1>
      <div style="margin-top:6px;font-size:13px;color:#94A3B8;">
        Submitted via <strong>${escapeHtml(lead.source === "quiz" ? "6-Step Quiz" : "Quick Form")}</strong> &bull; ${now}
      </div>
    </div>

    <!-- Quick Action Bar -->
    <div style="background:#1E293B;padding:16px 28px;text-align:center;">
      <a href="${callUrl}" style="display:inline-block;background:#2563EB;color:#FFFFFF;font-weight:700;font-size:16px;text-decoration:none;padding:12px 28px;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.2);">
        📞 Call Driver (${escapeHtml(formattedPhone)})
      </a>
    </div>

    <!-- Driver Info Table -->
    <div style="padding:24px 28px;">
      <h2 style="font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#94A3B8;margin:0 0 16px 0;padding-bottom:8px;border-bottom:1px solid #334155;">
        Driver Details
      </h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr>
          <td style="padding:8px 0;color:#94A3B8;width:140px;">Full Name</td>
          <td style="padding:8px 0;color:#FFFFFF;font-weight:600;">${escapeHtml(fullName)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#94A3B8;">Phone</td>
          <td style="padding:8px 0;color:#38BDF8;font-weight:600;">
            <a href="${callUrl}" style="color:#38BDF8;text-decoration:underline;">${escapeHtml(formattedPhone)}</a>
          </td>
        </tr>
        ${lead.email ? `
        <tr>
          <td style="padding:8px 0;color:#94A3B8;">Email</td>
          <td style="padding:8px 0;color:#FFFFFF;">
            <a href="mailto:${escapeHtml(lead.email)}" style="color:#38BDF8;text-decoration:none;">${escapeHtml(lead.email)}</a>
          </td>
        </tr>` : ""}
        <tr>
          <td style="padding:8px 0;color:#94A3B8;">Location</td>
          <td style="padding:8px 0;color:#FFFFFF;">${escapeHtml([lead.city, lead.state, lead.zip ? `ZIP: ${lead.zip}` : ""].filter(Boolean).join(", ") || "Not specified")}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#94A3B8;">CDL-A Experience</td>
          <td style="padding:8px 0;color:#34D399;font-weight:600;">${escapeHtml(lead.experience || "Not specified")}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#94A3B8;">Preferred Lane</td>
          <td style="padding:8px 0;color:#FBBF24;font-weight:600;">${escapeHtml(lead.lane || "Not specified")}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#94A3B8;">Home Time</td>
          <td style="padding:8px 0;color:#FFFFFF;">${escapeHtml(lead.home_time || "Not specified")}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#94A3B8;">Matters Most</td>
          <td style="padding:8px 0;color:#FFFFFF;">${escapeHtml(lead.matters || "Not specified")}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#94A3B8;">SMS Consent</td>
          <td style="padding:8px 0;color:#A7F3D0;">${lead.sms_consent ? "✅ Agreed to SMS/Calls" : "❌ No"}</td>
        </tr>
      </table>

      <!-- Attribution & Marketing Source -->
      <h2 style="font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#94A3B8;margin:24px 0 16px 0;padding-bottom:8px;border-bottom:1px solid #334155;">
        Attribution & Source
      </h2>
      <table style="width:100%;border-collapse:collapse;font-size:13px;color:#CBD5E1;">
        ${lead.utm_source ? `<tr><td style="padding:4px 0;color:#94A3B8;width:140px;">Source</td><td>${escapeHtml(lead.utm_source)}</td></tr>` : ""}
        ${lead.utm_medium ? `<tr><td style="padding:4px 0;color:#94A3B8;">Medium</td><td>${escapeHtml(lead.utm_medium)}</td></tr>` : ""}
        ${lead.utm_campaign ? `<tr><td style="padding:4px 0;color:#94A3B8;">Campaign</td><td>${escapeHtml(lead.utm_campaign)}</td></tr>` : ""}
        ${lead.utm_content ? `<tr><td style="padding:4px 0;color:#94A3B8;">Ad Content</td><td>${escapeHtml(lead.utm_content)}</td></tr>` : ""}
        ${lead.utm_term ? `<tr><td style="padding:4px 0;color:#94A3B8;">Term / Keyword</td><td>${escapeHtml(lead.utm_term)}</td></tr>` : ""}
        ${lead.fbclid ? `<tr><td style="padding:4px 0;color:#94A3B8;">Meta fbclid</td><td style="word-break:break-all;font-family:monospace;font-size:11px;">${escapeHtml(lead.fbclid)}</td></tr>` : ""}
        ${lead.page_uri ? `<tr><td style="padding:4px 0;color:#94A3B8;">Page URL</td><td style="word-break:break-all;font-size:12px;">${escapeHtml(lead.page_uri)}</td></tr>` : ""}
        ${meta?.ip ? `<tr><td style="padding:4px 0;color:#94A3B8;">IP Address</td><td>${escapeHtml(meta.ip)}</td></tr>` : ""}
      </table>
    </div>

    <!-- Footer -->
    <div style="background:#0F172A;padding:16px 28px;text-align:center;font-size:12px;color:#64748B;border-top:1px solid #1E293B;">
      BlueLine Driver Recruiting Funnel &bull; Automated Instant Alert
    </div>
  </div>
</body>
</html>
`.trim();

  const textContent = `
NEW CDL-A LEAD RECEIVED
=======================
Name: ${fullName}
Phone: ${formattedPhone}
Call Now: tel:+1${phoneRaw}
${lead.email ? `Email: ${lead.email}` : ""}
Location: ${[lead.city, lead.state].filter(Boolean).join(", ") || "N/A"}
Experience: ${lead.experience || "N/A"}
Lane: ${lead.lane || "N/A"}
Home Time: ${lead.home_time || "N/A"}
Matters Most: ${lead.matters || "N/A"}
SMS Consent: ${lead.sms_consent ? "Yes" : "No"}

ATTRIBUTION
===========
Source: ${lead.utm_source || lead.source}
Medium: ${lead.utm_medium || "N/A"}
Campaign: ${lead.utm_campaign || "N/A"}
Content/Ad: ${lead.utm_content || "N/A"}
Page: ${lead.page_uri || "N/A"}
Date: ${now}
`.trim();

  try {
    const res = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: { email: senderEmail, name: senderName },
        to: toList,
        subject,
        htmlContent,
        textContent,
      }),
    });

    if (res.ok) {
      const data = (await res.json()) as { messageId?: string };
      return { ok: true, status: "sent", messageId: data.messageId };
    }

    const errText = (await res.text()).slice(0, 500);
    console.error(`[brevo] Failed to send email notification (HTTP ${res.status}): ${errText}`);
    return { ok: false, status: `http_${res.status}`, error: errText };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[brevo] Network/runtime error sending notification:", errorMsg);
    return { ok: false, status: "network_error", error: errorMsg };
  }
}
