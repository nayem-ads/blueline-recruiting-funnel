# BlueLine Recruiting Funnel

Cinema-grade recruiting funnel and application portal for CDL-A drivers, featuring scroll-driven scene scrubber hero sections, quick application flows, and multi-step qualification quizzes.

Built with **TanStack Start**, **React 19**, **Vite**, **Tailwind CSS v4**, and configured for **Railway** and **Cloudflare Workers**.

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

1. Install dependencies:
   ```bash
   bun install
   ```

2. Start the local development server:
   ```bash
   bun run dev
   ```
   Or with the design inspector enabled:
   ```bash
   bun run dev:design
   ```

3. Build for production:
   ```bash
   bun run build
   ```

4. Preview production build locally:
   ```bash
   bun run preview
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

### Railway (One-Click Deploy)
This repository is configured with `railway.json` and `nixpacks.toml`:
1. Connect this GitHub repository to Railway.
2. Railway automatically detects Bun + Node and runs:
   - **Build:** `bun install && bun run build`
   - **Start:** `bun run preview` (Vite preview on `0.0.0.0:$PORT` with `allowedHosts: true`)

### Cloudflare Workers
Deploy directly using Wrangler:
```bash
bun run build
bunx wrangler deploy
```
*Make sure your `DB` D1 database binding is configured in Cloudflare / `wrangler.jsonc`.*
