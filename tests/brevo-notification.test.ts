import { describe, expect, test, mock } from "bun:test";
import { sendBrevoLeadNotification } from "../src/lib/notifications/brevo.server";
import type { LeadInput } from "../src/lib/api/leads.functions";

describe("Brevo lead notification service", () => {
  const dummyLead: LeadInput = {
    source: "quiz",
    first_name: "John",
    last_name: "Doe",
    phone: "8165551234",
    email: "john.doe@example.com",
    zip: "64101",
    state: "MO",
    city: "Kansas City",
    lane: "Company OTR",
    experience: "3 to 5 years",
    home_time: "Home weekly",
    matters: "Pay per mile",
    sms_consent: true,
    consent_text: "I agree to receive calls and texts",
    utm_source: "facebook",
    utm_medium: "cpc",
    utm_campaign: "driver_acquisition_q3",
    utm_content: "truck_video_01",
    utm_term: "cdl jobs",
    fbclid: "fb_test_click_id_123",
    page_uri: "https://linerecruiting.com/apply",
  };

  test("skips sending if BREVO_API_KEY is missing", async () => {
    delete process.env.BREVO_API_KEY;
    const result = await sendBrevoLeadNotification(dummyLead);
    expect(result.ok).toBe(false);
    expect(result.status).toBe("skipped_no_api_key");
  });

  test("skips sending if BREVO_TO_EMAIL is missing", async () => {
    process.env.BREVO_API_KEY = "xkeysib-mock-key";
    delete process.env.BREVO_TO_EMAIL;
    const result = await sendBrevoLeadNotification(dummyLead);
    expect(result.ok).toBe(false);
    expect(result.status).toBe("skipped_no_recipient");
  });

  test("sends formatted email payload to Brevo API when configured", async () => {
    process.env.BREVO_API_KEY = "xkeysib-mock-key";
    process.env.BREVO_TO_EMAIL = "recruiter1@linerecruiting.com, recruiter2@linerecruiting.com";
    process.env.BREVO_SENDER_EMAIL = "leads@linerecruiting.com";
    process.env.BREVO_SENDER_NAME = "BlueLine Leads";

    let interceptedUrl = "";
    let interceptedBody: Record<string, unknown> = {};

    globalThis.fetch = mock(async (url: RequestInfo | URL, init?: RequestInit) => {
      interceptedUrl = String(url);
      interceptedBody = JSON.parse(init?.body as string);
      return new Response(JSON.stringify({ messageId: "<test-msg-123@brevo.com>" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    }) as unknown as typeof fetch;

    const result = await sendBrevoLeadNotification(dummyLead, { ip: "1.2.3.4" });
    expect(result.ok).toBe(true);
    expect(result.status).toBe("sent");
    expect(result.messageId).toBe("<test-msg-123@brevo.com>");

    expect(interceptedUrl).toBe("https://api.brevo.com/v3/smtp/email");
    expect(interceptedBody.sender).toEqual({ email: "leads@linerecruiting.com", name: "BlueLine Leads" });
    expect(interceptedBody.to).toEqual([
      { email: "recruiter1@linerecruiting.com", name: "BlueLine Recruiter" },
      { email: "recruiter2@linerecruiting.com", name: "BlueLine Recruiter" },
    ]);
    expect(interceptedBody.subject).toContain("John Doe");
    expect(interceptedBody.subject).toContain("3 to 5 years");
    expect(interceptedBody.htmlContent).toContain("John Doe");
    expect(interceptedBody.htmlContent).toContain("tel:+18165551234");
    expect(interceptedBody.htmlContent).toContain("driver_acquisition_q3");
  });
});
