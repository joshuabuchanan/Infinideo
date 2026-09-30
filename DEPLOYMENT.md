# Public Portfolio Deployment

Infinideo is a portfolio application, not a managed production service. A public Vercel deployment needs production provider accounts, configured server-side environment variables, and reviewed video/media rights. Do not upload sensitive videos: the current Mux setup uses public playback IDs, so the app's private visibility setting only limits discovery and does not protect a direct playback URL.

## GitHub

Create a dedicated public repository for this app with `apps/infinideo` as its repository root. Do not publish the parent workspace. The app `.gitignore` excludes local environment files, build output, dependencies, editor settings, and local scratch files. Review the staged files and repository history before publishing. Never commit `.env.local`, credentials, database URLs, generated output, personal data, or media without appropriate rights.

## Vercel

1. Import the dedicated repository into Vercel as a Next.js project with Root Directory `.`. The build and start commands are `npm run build` and `npm run start`.
2. Create a production Clerk instance, add the Vercel domain to its allowed origins and redirect URLs, and set these Vercel environment variables:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
```

`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is designed to be public. Keep `CLERK_SECRET_KEY` and all other provider secrets server-side; never use a `NEXT_PUBLIC_*` prefix for secrets.

3. Create a hosted PostgreSQL database and set `DATABASE_URL`. From the app root, run `npm run db:migrate` once for each new environment or migration release. Drizzle applies all pending migrations in the checked-in journal, currently `0000` through `0006`. Do not run migrations as part of every Vercel build.
4. Set `NEXT_PUBLIC_APP_URL` to the deployed HTTPS origin. Add only the optional integrations you intend to use, such as `YOUTUBE_API_KEY`, `PEXELS_API_KEY`, `PIXABAY_API_KEY`, `TWITCH_CLIENT_ID`, and `TWITCH_CLIENT_SECRET`, as server-side environment variables.
5. Configure Mux, UploadThing, and Redis environment values only if enabling those features. Use production keys and restrict provider access to the deployed app.
6. Deploy, then verify the public feed, sign-in/sign-up, a public video, account-protected routes, uploads, and webhooks. Keep uploads disabled or switch Mux playback to signed IDs before relying on private video access.

## Release Checks

Run these commands from the app root before each public release:

```bash
npm test
npm run lint
npm run build
```

Review each video, thumbnail, and embed for its own rights and provider terms. Publish user content only with permission and clear attribution where required. Analytics are opt-in; playback events currently go to server logs and are not stored in the app database. Review `/privacy`, `/terms`, and `/legal` as the deployment's providers and practices change.
