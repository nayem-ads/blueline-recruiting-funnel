import postgres from "postgres";

let sqlInstance: postgres.Sql | null = null;
let initPromise: Promise<void> | undefined;

export function getDb(): postgres.Sql | null {
  if (sqlInstance) return sqlInstance;
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return null;
  }
  try {
    sqlInstance = postgres(databaseUrl, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });
    return sqlInstance;
  } catch (err) {
    console.error("Failed to connect to Postgres:", err);
    return null;
  }
}

export async function initializeDatabase() {
  const db = getDb();
  if (!db) return;
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
      }
    })();
  }
  return initPromise;
}
