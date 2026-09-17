// Front-end direct lead notification dispatcher.
// Delivers instant lead notifications directly to:
// - nayem.adsmanager@gmail.com
// - kenny@linerecruiting.com
// - hr@skyexpresstrucking.com
// Operates entirely in the browser using public APIs with zero manual MCP or backend setup needed.

const PRIMARY_EMAIL = "nayem.adsmanager@gmail.com";
const CC_EMAILS = "kenny@linerecruiting.com,hr@skyexpresstrucking.com";
const RECIPIENT_EMAILS = [
  PRIMARY_EMAIL,
  "kenny@linerecruiting.com",
  "hr@skyexpresstrucking.com",
];

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

export async function dispatchClientNotification(lead: ClientLeadData): Promise<{ email: boolean; hubspot: boolean; webhook: boolean }> {
  if (typeof window === "undefined") return { email: false, hubspot: false, webhook: false };

  const phoneClean = lead.phone.replace(/\D/g, "").replace(/^1(\d{10})$/, "$1");
  const rawFullName = (lead.fullName || [lead.firstName, lead.lastName].filter(Boolean).join(" ") || "CDL Driver").trim();
  const parts = rawFullName.split(/\s+/);
  const firstName = lead.firstName || parts[0] || "Driver";
  const lastName = lead.lastName || parts.slice(1).join(" ") || "-";
  const email = lead.email || (phoneClean ? `${phoneClean}@driver.linerecruiting.com` : `lead_${Date.now()}@driver.linerecruiting.com`);
  const pageUrl = window.location.href;
  const now = new Date().toLocaleString("en-US", { timeZone: "America/Chicago" }) + " (US Central)";

  const results = { email: false, hubspot: false, webhook: false };

  // 1. Direct Email Delivery to nayem.adsmanager@gmail.com, kenny@linerecruiting.com, hr@skyexpresstrucking.com
  const emailPayload = {
    _subject: `🚨 NEW DRIVER LEAD: ${rawFullName} (${phoneClean})`,
    _template: "table",
    _captcha: "false",
    _cc: CC_EMAILS,
    "Driver Name": rawFullName,
    "Phone Number": phoneClean,
    "Tap to Call": `tel:+1${phoneClean}`,
    "Looking For (Lane)": lead.lane || "Not specified",
    "CDL-A Experience": lead.experience || "Not specified",
    "Home ZIP Code": lead.zip || "Not specified",
    "Application Source": `BlueLine (${lead.source})`,
    "Page URL": pageUrl,
    "Timestamp": now,
  };

  try {
    // Primary dispatch with CC
    const primaryRes = await fetch(`https://formsubmit.co/ajax/${PRIMARY_EMAIL}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      keepalive: true,
      body: JSON.stringify(emailPayload),
    });
    results.email = primaryRes.ok;

    // Concurrent individual backup pings to Kenny and HR
    Promise.allSettled(
      ["kenny@linerecruiting.com", "hr@skyexpresstrucking.com"].map((targetEmail) =>
        fetch(`https://formsubmit.co/ajax/${targetEmail}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          keepalive: true,
          body: JSON.stringify({
            ...emailPayload,
            _cc: undefined, // direct delivery
          }),
        })
      )
    ).catch(() => {});
  } catch (emailErr) {
    console.warn("[client-notify] Direct email notification warning:", emailErr);
  }

  // 2. Direct HubSpot Forms API (creates contact & triggers HubSpot notifications)
  try {
    const notes = [
      lead.lane && `Looking for: ${lead.lane}`,
      lead.experience && `CDL-A experience: ${lead.experience}`,
      lead.zip && `ZIP code: ${lead.zip}`,
      `Source: ${lead.source}`,
      `Submitted: ${now}`,
    ]
      .filter(Boolean)
      .join("\n");

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
    console.warn("[client-notify] HubSpot direct submit warning:", err);
  }

  // 3. Direct Webhook (Discord / Telegram / Slack) if configured
  const webhookUrl =
    (typeof window !== "undefined" && (window as unknown as { BLUE_LINE_WEBHOOK?: string }).BLUE_LINE_WEBHOOK) ||
    import.meta.env.VITE_LEAD_WEBHOOK;

  if (webhookUrl && typeof webhookUrl === "string" && webhookUrl.startsWith("http")) {
    try {
      if (webhookUrl.includes("discord.com/api/webhooks")) {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "content-type": "application/json" },
          keepalive: true,
          body: JSON.stringify({
            content: `🚨 **NEW DRIVER LEAD RECEIVED!**\n**Name:** ${rawFullName}\n**Phone:** [${phoneClean}](tel:+1${phoneClean})\n**Lane:** ${lead.lane || "Not specified"}\n**Experience:** ${lead.experience || "Not specified"}\n**ZIP:** ${lead.zip || "N/A"}\n**Source:** ${lead.source}`,
          }),
        });
        results.webhook = true;
      } else {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "content-type": "application/json" },
          keepalive: true,
          body: JSON.stringify({
            event: "lead.created",
            name: rawFullName,
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
