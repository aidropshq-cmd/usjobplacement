# usjobplacement.zapkitt.com

End-to-end US full-time job placement — a ZapKitt subdomain.

Marketing site and (later) candidate portal for the placement service: profile
building, targeted applications, resume and LinkedIn rewrites, interview
coaching, background verification guidance, offer and onboarding support.

## Stack

| Layer    | Choice                                          | Host              |
| -------- | ----------------------------------------------- | ----------------- |
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind v4 | Vercel            |
| UI       | shadcn/ui on Radix — **no MUI**                  | —                 |
| Backend  | Django + DRF (phase 03)                          | Render            |
| Database | Neon (PostgreSQL, serverless)                    | Neon              |
| Domain   | `usjobplacement.zapkitt.com`                     | Route 53 → Vercel |

**No Material UI.** Tailwind is the only styling system. Adding MUI would mean
two design systems, two runtimes, and a fight with Material's defaults on every
component. If the internal admin later needs a heavy data grid, use TanStack
Table and keep it inside the logged-in area.

**TypeScript only.** `allowJs` is off. Do not add `.js` source files.

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

| Script              | Does                            |
| ------------------- | ------------------------------- |
| `npm run dev`       | Dev server on :3000             |
| `npm run build`     | Production build                |
| `npm run typecheck` | `tsc --noEmit`                  |
| `npm run lint`      | ESLint                          |
| `npm run format`    | Prettier + Tailwind class sort  |

## Design system

Tokens live in [`src/app/globals.css`](src/app/globals.css) and are the single
source of colour, type, radius and shadow. They inherit the ZapKitt brand:
violet `#6C3CE1`, Inter, light ground.

Visit **`/kitchen-sink`** to see every primitive in every state. It is
`noindex` and must stay out of the sitemap. When you change a token, check that
page before checking a feature page.

Rules that keep the site coherent:

- **One primary button per page.** `siteConfig.cta` is the only primary action
  on the marketing site. Everything else is secondary, ghost, or a text link.
- **Controls are 8px radius, cards are 14px.** Set via `--radius`.
- **One shadow token** (`shadow-card`), used only on cards sitting on a tinted
  ground.
- **Light only.** The `.dark` block exists for the future portal. Never put
  `class="dark"` on a marketing route.
- **Layout owns spacing.** Use `<Container>` and `<Section>`; sections do not
  set their own horizontal padding.

The eight placement stages live in [`src/lib/site.ts`](src/lib/site.ts). The
Placement Rail, the `/process` page, the "what you get" section and portal
progress all read from that one array.

## Build phases

- [x] **00 — Setup.** Repo, Vercel project, subdomain, HTTPS.
- [x] **01 — Design system.** Tokens, fonts, primitives, layout components,
      kitchen sink.
- [ ] **02 — Hero.** `PlacementRail` component, homepage sections 1–5,
      `/process` with the work-authorisation switcher.
- [ ] **03 — Capture.** Django + DRF on Render, Neon, `Lead` / `Consultation` /
      `Document` models, resume upload to S3 or R2, transactional email,
      `/book-demo` with Calendly.
- [ ] **04 — Depth.** `/pricing`, `/services`, `/success-stories`, `/faq`,
      `/contact`, legal pages.
- [ ] **05 — Polish.** Lighthouse, keyboard pass, per-route metadata, OG
      images, sitemap, JSON-LD, analytics.
- [ ] **06 — Portal.** Auth, dashboard, the rail as live progress.

## Copy rules

Two phrases carry real risk and are settled policy, not style preferences:

1. **Never write "interview support" unqualified.** In this market it is read as
   someone assisting during a live interview, which is fraud — it voids offers,
   gets candidates blacklisted, and puts visa status at risk. Write: *"We coach
   you before every round and debrief after. We prepare you — we are never on
   the call."*
2. **Background verification means genuine records.** We help candidates
   assemble and verify real employment and education history. Never imply
   anything else.

`/pricing` ships last: because the fee is paid by the candidate rather than the
employer, several US states treat this as a licensed employment agency. That
needs legal review before the page goes live. It does not block phases 00–03.

## Deploying

Push to `main` → Vercel builds and deploys. The Django backend deploys
separately to Render and is reached through `NEXT_PUBLIC_API_URL`.
