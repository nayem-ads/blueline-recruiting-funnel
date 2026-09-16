import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

import { saveLead } from "@/server/leads";
import { sendBrevoLeadNotification } from "../notifications/brevo.server";

// HubSpot portal + form the live linerecruiting.com site already submits to.
const HUBSPOT_PORTAL = "50966263";
const HUBSPOT_FORM = "a09aa246-2380-4477-b243-f04c799c3457";
const HUBSPOT_URL = `https://api.hsforms.com/submissions/v3/integration/submit/${HUBSPOT_PORTAL}/${HUBSPOT_FORM}`;

const phoneSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, "").replace(/^1(\d{10})$/, "$1"))
  .refine((v) => v.length === 10, "Enter a 10-digit US mobile number");

export const leadSchema = z.object({
  source: z.string().optional().default("quick"),
  first_name: z.string().trim().optional().default("Driver"),
  last_name: z.string().trim().optional().default(""),
  phone: z.string().default("").transform((v) => v.replace(/\D/g, "").replace(/^1(\d{10})$/, "$1")),
  email: z.string().trim().optional().default(""),
  zip: z.string().trim().optional().default(""),
  state: z.string().trim().optional().default(""),
  city: z.string().trim().optional().default(""),
  lane: z.string().trim().optional().default(""),
  experience: z.string().trim().optional().default(""),
  home_time: z.string().trim().optional().default(""),
  matters: z.string().trim().optional().default(""),
  sms_consent: z.boolean().optional().default(true),
  consent_text: z.string().optional().default(""),
  utm_source: z.string().optional().default(""),
  utm_medium: z.string().optional().default(""),
  utm_campaign: z.string().optional().default(""),
  utm_content: z.string().optional().default(""),
  utm_term: z.string().optional().default(""),
  fbclid: z.string().optional().default(""),
  page_uri: z.string().optional().default(""),
  website: z.string().optional().default(""), // honeypot
});
export type LeadInput = z.infer<typeof leadSchema>;

type HsField = { objectTypeId: "0-1"; name: string; value: string };

function hubspotFields(d: LeadInput, tier: "full" | "standard" | "minimal"): HsField[] {
  const f = (name: string, value: string): HsField => ({ objectTypeId: "0-1", name, value });
  const notes = [
    d.lane && `Looking for: ${d.lane}`,
    d.experience && `CDL-A experience: ${d.experience}`,
    d.zip && `ZIP Code: ${d.zip}`,
    d.home_time && `Home time: ${d.home_time}`,
    d.matters && `Matters most: ${d.matters}`,
    `Source: linerecruiting funnel (${d.source})`,
    d.utm_campaign && `Campaign: ${d.utm_campaign}`,
    d.utm_content && `Ad: ${d.utm_content}`,
  ]
    .filter(Boolean)
    .join("\n");

  if (tier === "minimal") {
    const min: HsField[] = [
      f("firstname", d.first_name || "Driver"),
      f("phone", d.phone ? `+1${d.phone}` : ""),
      f("notes", notes),
    ];
    if (d.last_name) min.push(f("lastname", d.last_name));
    if (d.email) min.push(f("email", d.email));
    return min;
  }

  const base: HsField[] = [
    f("firstname", d.first_name || "Driver"),
    f("lastname", d.last_name || "-"),
    f("phone", d.phone ? `+1${d.phone}` : ""),
    f("city", d.city || "-"),
    f("state", d.state || "-"),
    f("notes", notes),
    f("sms_permission", d.sms_consent ? "true" : "false"),
  ];
  if (d.email) base.push(f("email", d.email));
  if (tier === "standard") return base;

  const src = [d.utm_source, d.utm_medium, d.utm_campaign].filter(Boolean).join(" / ");
  if (src) base.push(f("marketing_source", src));
  if (d.lane) base.push(f("driver_interest", d.lane));
  if (d.experience) base.push(f("experience", d.experience));
  if (d.home_time) base.push(f("preferred_home_time", d.home_time));
  if (d.matters) base.push(f("what_matters_most", d.matters));
  return base;
}

async function pushToHubspot(d: LeadInput, ip: string): Promise<{ status: string; error: string }> {
  const context = {
    pageUri: d.page_uri || "https://linerecruiting.com/",
    pageName: "BlueLine driver funnel",
    ipAddress: ip || undefined,
  };
  for (const tier of ["full", "standard", "minimal"] as const) {
    try {
      const res = await fetch(HUBSPOT_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fields: hubspotFields(d, tier), context }),
      });
      if (res.ok) return { status: `ok_${tier}`, error: "" };
      const text = (await res.text()).slice(0, 900);
      if (tier === "minimal") return { status: `http_${res.status}`, error: text };
    } catch (err) {
      if (tier === "minimal") return { status: "network_error", error: String(err).slice(0, 300) };
    }
  }
  return { status: "unknown", error: "" };
}

export const submitLead = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    try {
      return leadSchema.parse(input || {});
    } catch {
      return leadSchema.parse({});
    }
  })
  .handler(async ({ data }) => {
    try {
      // Honeypot check: if filled by bot, return early with ok
      if (data.website && data.website.trim().length > 0) {
        return { ok: true, spam: true };
      }

      const req = getRequest();
      const ip = req?.headers.get("cf-connecting-ip") ?? req?.headers.get("x-forwarded-for") ?? "";
      const ua = (req?.headers.get("user-agent") ?? "").slice(0, 300);
      const { DB } = bindings();

      // Concurrently dispatch HubSpot form submission and Brevo email notification
      const [hsResult, brevoResult] = await Promise.allSettled([
        pushToHubspot(data, ip),
        sendBrevoLeadNotification(data, { ip, ua }),
      ]);

      const hs = hsResult.status === "fulfilled" ? hsResult.value : { status: "rejected", error: String(hsResult.reason) };
      const brevo = brevoResult.status === "fulfilled" ? brevoResult.value : { ok: false, status: "rejected", error: String(brevoResult.reason) };

      let leadId: number | null = null;
      if (DB) {
        try {
          const r = await DB.prepare(
            `INSERT INTO leads (source, first_name, last_name, phone, email, state, city, lane, experience, home_time, matters,
              sms_consent, consent_text, utm_source, utm_medium, utm_campaign, utm_content, utm_term, fbclid, page_uri, user_agent, ip,
              hubspot_status, hubspot_error)
             VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,?19,?20,?21,?22,?23,?24)`,
          )
            .bind(
              data.source, data.first_name, data.last_name, data.phone, data.email, data.state, data.city, data.lane,
              data.experience, data.home_time, data.matters, data.sms_consent ? 1 : 0, data.consent_text, data.utm_source,
              data.utm_medium, data.utm_campaign, data.utm_content, data.utm_term, data.fbclid, data.page_uri, ua, ip,
              hs.status, hs.error,
            )
            .run();
          leadId = (r.meta?.last_row_id as number | undefined) ?? null;
        } catch (dbErr) {
          console.error("[leads] Cloudflare D1 insert error:", dbErr);
        }
      }
      const name = `${data.first_name} ${data.last_name}`.trim();
      const email = data.email || (data.phone ? `${data.phone}@no-email.linerecruiting.com` : `lead_${Date.now()}@no-email.linerecruiting.com`);
      const company = data.lane || null;
      const message = [
        data.experience && `CDL-A experience: ${data.experience}`,
        data.zip && `ZIP: ${data.zip}`,
        data.home_time && `Home time: ${data.home_time}`,
        data.matters && `Matters most: ${data.matters}`,
      ]
        .filter(Boolean)
        .join(" | ") || null;

      let savedLead = null;
      try {
        savedLead = await saveLead({ name, email, phone: data.phone, company, message, source: "form" });
      } catch (error) {
        console.error("Failed to persist lead to Postgres:", error);
      }

      return { ok: true, leadId, hubspot: hs.status, brevo: brevo.status, lead: savedLead };
    } catch (criticalError) {
      console.error("[leads] Critical unexpected error in submitLead:", criticalError);
      return { ok: true, status: "fallback_ok", error: String(criticalError) };
    }
  });
