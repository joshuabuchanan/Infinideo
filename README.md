# Infinideo

Infinideo is a video discovery and creator-platform portfolio project. It brings searchable video feeds, creator pages, and account features together in a responsive Next.js app, with optional integrations configured on the server.

## Highlights

- Explore feeds, categories, creators, and video details.
- Search and browse provider-backed video catalogs through server-side adapters.
- Sign-in and account features powered by Clerk, with PostgreSQL persistence.
- Video upload and playback integrations using UploadThing and Mux.
- Optional, consent-based first-party playback analytics.

## Stack

Next.js 16, React 19, TypeScript, Tailwind CSS, tRPC, Drizzle ORM, PostgreSQL, Clerk, Mux, and UploadThing.

## Run locally

Requirements: Node.js and npm. Database-backed and provider features also require their corresponding credentials.

```bash
npm ci
```

Copy `.env.example` to `.env.local`, then add the credentials for the services you want to enable. Keep `.env.local` out of Git. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Validate changes with:

```bash
npm test
npm run lint
npm run build
```

## Deploy

The app is structured for Vercel. Import this repository as a Next.js project, use the repository root, configure production environment variables in Vercel, and apply the Drizzle migrations to a hosted PostgreSQL database. See [DEPLOYMENT.md](DEPLOYMENT.md) for the required setup and release checklist.

Never put API secrets, database URLs, Clerk secret keys, or webhook secrets in `NEXT_PUBLIC_*` variables. Use server-only environment variables and Vercel's encrypted environment settings.

## Public-use notes

This is a portfolio project, not a managed production service. Configure production authentication, database access, storage, rate limits, and provider quotas before inviting public accounts. The current Mux setup issues public playback IDs, so a video's private visibility setting hides it from Infinideo discovery but does not secure its direct playback URL. Do not upload sensitive video.

Video fixtures, embeds, thumbnails, and provider results may have separate rights and terms. Verify that each item is permitted for your intended use; linking or embedding content does not grant redistribution rights. Playback analytics are opt-in and currently written to server logs rather than stored as app records.

Legal pages: `/privacy`, `/terms`, and `/legal`.
