import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy | Infinideo",
  description: "How Infinideo handles account, content, and playback data.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-svh max-w-4xl px-5 py-8 text-foreground md:px-8 md:py-14">
      <header className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-border/70 pb-5">
        <Link className="text-lg font-black text-primary" href="/">Infinideo</Link>
        <nav aria-label="Legal pages" className="flex gap-5 text-sm text-muted-foreground">
          <Link aria-current="page" className="text-foreground" href="/privacy">Privacy</Link>
          <Link className="hover:text-foreground" href="/terms">Terms</Link>
          <Link className="hover:text-foreground" href="/legal">Legal</Link>
        </nav>
      </header>

      <article className="space-y-8">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-secondary">LAST UPDATED: SEPTEMBER 29, 2026</p>
          <h1 className="text-3xl font-bold tracking-normal md:text-4xl">Privacy Policy</h1>
          <p className="max-w-3xl text-muted-foreground">
            This policy describes information handled by Infinideo, a portfolio project maintained by GitHub user
            {" "}<a className="text-primary underline underline-offset-4" href="https://github.com/joshuabuchanan" target="_blank" rel="noreferrer">@joshuabuchanan</a>.
          </p>
        </div>

        <section className="space-y-3 border-t border-border/70 pt-6">
          <h2 className="text-xl font-semibold">Information the app handles</h2>
          <p className="text-muted-foreground">
            If you create an account, Clerk processes sign-in information. When account sync is configured, Infinideo stores your Clerk account identifier, display name, and profile image. Account features can also store profile banners, uploaded video metadata, comments, reactions, subscriptions, playlists, and watch history.
          </p>
          <p className="text-muted-foreground">
            Videos are uploaded to Mux for processing and playback. Profile banners, thumbnails, and related image files are handled by UploadThing. Database records are stored by the PostgreSQL provider configured for the deployment. These providers process data under their own terms and privacy policies.
          </p>
        </section>

        <section className="space-y-3 border-t border-border/70 pt-6">
          <h2 className="text-xl font-semibold">Video visibility</h2>
          <p className="text-muted-foreground">
            Infinideo marks new video records private until their owner changes visibility. However, the current Mux configuration issues public playback IDs. The private setting limits discovery in Infinideo; it does not make a direct playback URL confidential. Do not upload sensitive or confidential video. This limitation must be addressed before relying on private uploads for security.
          </p>
        </section>

        <section className="space-y-3 border-t border-border/70 pt-6">
          <h2 className="text-xl font-semibold">Playback analytics</h2>
          <p className="text-muted-foreground">
            Playback analytics are optional. If you choose “Allow analytics,” the app sends play, pause, progress, and completion events with a video identifier, source, playback position, and event time to its first-party endpoint. The endpoint currently writes these events to server logs; it does not store them in the app database. Declining analytics prevents the app from sending these playback events. Hosting providers may retain operational and security logs under their own policies.
          </p>
        </section>

        <section className="space-y-3 border-t border-border/70 pt-6">
          <h2 className="text-xl font-semibold">Browser storage and embeds</h2>
          <p className="text-muted-foreground">
            The app stores your analytics choice, theme preference, and clip likes in browser local storage. It uses a cookie to remember sidebar state. Clerk may set authentication cookies. Embedded players and linked video services, including YouTube, Twitch, Dailymotion, and PeerTube, may receive connection and device information or use their own storage when loaded. Their handling is governed by their respective policies.
          </p>
        </section>

        <section className="space-y-3 border-t border-border/70 pt-6">
          <h2 className="text-xl font-semibold">Retention and deletion</h2>
          <p className="text-muted-foreground">
            App records are kept while needed to provide account and video features. If account deletion is delivered to the configured Clerk webhook, the corresponding Infinideo database account and related records are deleted according to database relationships. That process does not currently guarantee that separately stored Mux or UploadThing files are also deleted. Contact the maintainer for a deletion request; do not post account credentials or private personal information in a public GitHub issue.
          </p>
        </section>

        <section className="space-y-3 border-t border-border/70 pt-6">
          <h2 className="text-xl font-semibold">Contact</h2>
          <p className="text-muted-foreground">
            For questions about this policy, visit the maintainer’s <a className="text-primary underline underline-offset-4" href="https://github.com/joshuabuchanan" target="_blank" rel="noreferrer">GitHub profile</a>. Do not include sensitive information in a public post.
          </p>
        </section>

        <p className="border-t border-border/70 pt-6 text-sm text-muted-foreground">
          See the <Link className="text-primary underline underline-offset-4" href="/terms">Terms of Service</Link> and <Link className="text-primary underline underline-offset-4" href="/legal">Legal Notice</Link>.
        </p>
      </article>
    </main>
  );
}