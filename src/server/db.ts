import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error("DATABASE_URL not set");

export const db = postgres(DATABASE_URL);

let initPromise: Promise<void> | undefined;

export async function initializeDatabase() {
  if (!initPromise) {
    initPromise = (async () => {
      try {
        await db`
          CREATE TABLE IF NOT EXISTS leads (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            company TEXT,
            source TEXT DEFAULT 'form',
            message TEXT,
            status TEXT DEFAULT 'new',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `;
        await db`CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_email ON leads(email)`;
        await db`CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)`;
        await db`CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at)`;
        console.log("✓ Database initialized: leads table ready");
      } catch (error) {
        console.error("✗ Database init failed:", error);
        throw error;
      }
    })();
  }
  return initPromise;
}
