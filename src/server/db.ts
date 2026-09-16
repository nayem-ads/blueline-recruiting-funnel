// Safe dynamic Postgres connection
let sqlInstance: any = null;
let initPromise: Promise<void> | undefined;

export async function getDb(): Promise<any | null> {
  if (sqlInstance) return sqlInstance;
  const databaseUrl = typeof process !== "undefined" ? process.env?.DATABASE_URL : undefined;
  if (!databaseUrl) {
    return null;
  }
  try {
    const postgres = (await import("postgres")).default;
    sqlInstance = postgres(databaseUrl, {
      max: 5,
      idle_timeout: 20,
      connect_timeout: 10,
    });
    return sqlInstance;
  } catch (err) {
    console.error("[db] Failed to initialize Postgres connection:", err);
    return null;
  }
}

export async function initializeDatabase() {
  const db = await getDb();
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
        console.error("[db] Database schema init failed (non-fatal):", error);
      }
    })();
  }
  return initPromise;
}
