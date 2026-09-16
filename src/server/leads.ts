import { getDb, initializeDatabase } from "./db";

export interface Lead {
  id?: number;
  name: string;
  email: string;
  phone: string;
  company?: string | null;
  source?: string;
  message?: string | null;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export async function saveLead(lead: Lead): Promise<Lead | null> {
  const db = getDb();
  if (!db) {
    return null;
  }
  try {
    await initializeDatabase();
    const result = await db`
      INSERT INTO leads (name, email, phone, company, source, message, status)
      VALUES (${lead.name}, ${lead.email}, ${lead.phone}, ${lead.company || null}, ${lead.source || "form"}, ${lead.message || null}, ${lead.status || "new"})
      ON CONFLICT (email) DO UPDATE
      SET updated_at = CURRENT_TIMESTAMP, status = 'duplicate'
      RETURNING *
    `;
    return (result[0] as Lead) || null;
  } catch (error) {
    console.error("Error saving lead to Postgres:", error);
    return null;
  }
}
