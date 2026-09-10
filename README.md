# BlueLine Recruiting Funnel

Cinema-grade recruiting funnel and application portal for CDL-A drivers, featuring scroll-driven scene scrubber hero sections, quick application flows, and multi-step qualification quizzes.

Built with **TanStack Start**, **React 19**, **Vite**, **Tailwind CSS v4**, and designed for Cloudflare Workers / Railway deployments.

---

## 🚀 Features

- **Cinema Scroll Scrubbing:** 15s pre-dawn blue hour journey across 3 scenes (desktop & mobile optimized MP4s + posters).
- **Application Flow:** Fast multi-step CDL-A driver qualification and quick-apply flows (`/`, `/apply`, `/applied`).
- **Backend Integrations:** D1 database binding (`DB`) for lead capture and status management with Cloudflare Workers.
- **Responsive & Mobile First:** Tailored for drivers viewing on mobile cabs with sticky quick-action bars (Call / Text / Apply).

---

## 🛠️ Tech Stack

- **Framework:** [TanStack Start](https://tanstack.com/start) + [TanStack Router](https://tanstack.com/router)
- **Runtime:** [Bun](https://bun.sh) / [Node.js](https://nodejs.org)
- **UI & Styling:** React 19, Tailwind CSS v4, Radix UI / Shadcn UI components, Lucide & Phosphor icons
- **Database & Server:** Cloudflare Workers + D1 (`0001_leads.sql` schema)

---

## 💻 Local Development

1. Navigate to the `app` directory:
   ```bash
   cd app
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Start the local development server:
   ```bash
   bun run dev
   ```
   Or with the design inspector enabled:
   ```bash
   bun run dev:design
   ```

4. Build for production:
   ```bash
   bun run build
   ```

---

## 🗄️ Database & Migrations

The lead capture backend uses Cloudflare D1 with a binding named `DB`.

To apply migrations locally or to your remote D1 database:
```bash
# Local
bunx wrangler d1 execute DB --local --file=migrations/0001_leads.sql

# Production
bunx wrangler d1 execute DB --remote --file=migrations/0001_leads.sql
```

---

## 🚢 Deployment

### Cloudflare Workers
Deploy directly using Wrangler from the `app/` folder:
```bash
cd app
bun run build
bunx wrangler deploy
```
*Make sure your `DB` D1 database binding is configured in Cloudflare / `wrangler.jsonc`.*

### Railway
To deploy on Railway:
1. Connect this GitHub repository to a new Railway project.
2. Set the root directory to `app` (or configure the build command `cd app && bun install && bun run build`).
3. Set your start command and environment variables as needed.
