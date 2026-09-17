// Front-end direct lead notification dispatcher.
// Operates entirely in the browser using public APIs and webhooks.
// Requires zero manual MCP setup, zero server maintenance, and uses keepalive: true.

const HUBSPOT_PORTAL = "50966263";
const HUBSPOT_FORM = "a09aa246-2380-4477-b243-f04c799c3457";
const HUBSPOT_URL = `https://api.hsforms.com/submissions/v3/integration/submit/${HUBSPOT_PORTAL}/${HUBSPOT_FORM}`;

export type ClientLeadData = {
  source: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  email?: string;
  lane?: string;
  experience?: string;
  zip?: string;
  consent?: boolean;
};

export async function dispatchClientNotification(lead: ClientLeadData): Promise<{ hubspot: boolean; webhook: boolean }> {
  if (typeof window === "undefined") return { hubspot: false, webhook: false };

  const phoneClean = lead.phone.replace(/\D/g, "").replace(/^1(\d{10})$/, "$1");
  const parts = (lead.fullName || "").trim().split(/\s+/);
  const firstName = lead.firstName || parts[0] || "Driver";
  const lastName = lead.lastName || parts.slice(1).join(" ") || "-";
  const email = lead.email || (phoneClean ? `${phoneClean}@driver.linerecruiting.com` : `lead_${Date.now()}@driver.linerecruiting.com`);
  const pageUrl = window.location.href;

  const notes = [
    lead.lane && `Looking for: ${lead.lane}`,
    lead.experience && `CDL-A experience: ${lead.experience}`,
    lead.zip && `ZIP code: ${lead.zip}`,
    `Source: ${lead.source}`,
    `Submitted: ${new Date().toLocaleString()}`,
  ]
    .filter(Boolean)
    .join("\n");

  const results = { hubspot: false, webhook: false };

  // 1. Direct HubSpot Forms API (creates contact & triggers HubSpot email alert)
  try {
    const hsRes = await fetch(HUBSPOT_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        fields: [
          { objectTypeId: "0-1", name: "firstname", value: firstName },
          { objectTypeId: "0-1", name: "lastname", value: lastName },
          { objectTypeId: "0-1", name: "phone", value: phoneClean ? `+1${phoneClean}` : "" },
          { objectTypeId: "0-1", name: "email", value: email },
          ...(lead.lane ? [{ objectTypeId: "0-1", name: "driver_interest", value: lead.lane }] : []),
          ...(lead.experience ? [{ objectTypeId: "0-1", name: "experience", value: lead.experience }] : []),
          ...(lead.zip ? [{ objectTypeId: "0-1", name: "zip", value: lead.zip }] : []),
          { objectTypeId: "0-1", name: "notes", value: notes },
          { objectTypeId: "0-1", name: "sms_permission", value: lead.consent !== false ? "true" : "false" },
        ],
        context: {
          pageUri: pageUrl,
          pageName: `BlueLine Lead (${lead.source})`,
        },
      }),
    });
    results.hubspot = hsRes.ok;
  } catch (err) {
    console.warn("[client-notify] HubSpot direct submit non-fatal warning:", err);
  }

  // 2. Direct Webhook (Discord / Telegram / Slack / FormSubmit) if configured in window or env
  const webhookUrl =
    (typeof window !== "undefined" && (window as unknown as { BLUE_LINE_WEBHOOK?: string }).BLUE_LINE_WEBHOOK) ||
    import.meta.env.VITE_LEAD_WEBHOOK;

  if (webhookUrl && typeof webhookUrl === "string" && webhookUrl.startsWith("http")) {
    try {
      // If Discord Webhook
      if (webhookUrl.includes("discord.com/api/webhooks")) {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "content-type": "application/json" },
          keepalive: true,
          body: JSON.stringify({
            content: `🚨 **NEW DRIVER LEAD RECEIVED!**\n**Name:** ${firstName} ${lastName}\n**Phone:** [${phoneClean}](tel:+1${phoneClean})\n**Lane:** ${lead.lane || "Not specified"}\n**Experience:** ${lead.experience || "Not specified"}\n**ZIP:** ${lead.zip || "N/A"}\n**Source:** ${lead.source}`,
          }),
        });
        results.webhook = true;
      } else {
        // Generic Webhook (Slack, Zapier, Make, Telegram bridge)
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "content-type": "application/json" },
          keepalive: true,
          body: JSON.stringify({
            event: "lead.created",
            name: `${firstName} ${lastName}`.trim(),
            first_name: firstName,
            last_name: lastName,
            phone: phoneClean,
            phone_tel: `tel:+1${phoneClean}`,
            lane: lead.lane || "",
            experience: lead.experience || "",
            zip: lead.zip || "",
            source: lead.source,
            page_url: pageUrl,
            timestamp: new Date().toISOString(),
          }),
        });
        results.webhook = true;
      }
    } catch (whErr) {
      console.warn("[client-notify] Webhook dispatch warning:", whErr);
    }
  }

  return results;
}
