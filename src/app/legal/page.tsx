import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Legal Notice | Infinideo",
  description: "Ownership, third-party content, and legal notices for Infinideo.",
};

export default function LegalPage() {
  return (
    <main className="mx-auto min-h-svh max-w-4xl px-5 py-8 text-foreground md:px-8 md:py-14">
      <header className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-border/70 pb-5">
        <Link className="text-lg font-black text-primary" href="/">Infinideo</Link>
        <nav aria-label="Legal pages" className="flex flex-wrap gap-5 text-sm text-muted-foreground">
          <Link className="hover:text-foreground" href="/privacy">Privacy</Link>
          <Link className="hover:text-foreground" href="/terms">Terms</Link>
          <Link aria-current="page" className="text-foreground" href="/legal">Legal</Link>
        </nav>
      </header>

      <article className="space-y-8">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-secondary">LAST UPDATED: SEPTEMBER 29, 2026</p>
          <h1 className="text-3xl font-bold tracking-normal md:text-4xl">Legal Notice</h1>
          <p className="max-w-3xl text-muted-foreground">
            Infinideo is an independent software portfolio project maintained by <a className="text-primary underline underline-offset-4" href="https://github.com/joshuabuchanan" target="_blank" rel="noreferrer">Joshua Buchanan (@joshuabuchanan)</a>. It is not affiliated with or endorsed by YouTube, Twitch, Mux, Clerk, UploadThing, or other services referenced by the app.
          </p>
        </div>

        <section className="space-y-3 border-t border-border/70 pt-6">
          <h2 className="text-xl font-semibold">Project and trademarks</h2>
          <p className="text-muted-foreground">
            Infinideo&apos;s original source code is published under the license included with its source repository, if one is provided. The project name, logos, and other marks are not granted for reuse by that code license. Third-party names and marks belong to their respective owners.
          </p>
        </section>

        <section className="space-y-3 border-t border-border/70 pt-6">
          <h2 className="text-xl font-semibold">Third-party media</h2>
          <p className="text-muted-foreground">
            Videos, thumbnails, embeds, and metadata may be supplied by third-party providers or users. They remain the property of their respective rights holders and may be governed by separate licenses and provider terms. Infinideo does not claim ownership of third-party material; availability in the app is not a representation that it is free to reuse.
          </p>
          <p className="text-muted-foreground">
            Rights holders may report a concern through the maintainer&apos;s <a className="text-primary underline underline-offset-4" href="https://github.com/joshuabuchanan" target="_blank" rel="noreferrer">GitHub profile</a>. Please avoid putting personal or confidential information in a public issue.
          </p>
        </section>

        <section className="space-y-3 border-t border-border/70 pt-6">
          <h2 className="text-xl font-semibold">Informational notice</h2>
          <p className="text-muted-foreground">
            This notice and the app are provided for general informational and demonstration purposes, not as legal, financial, or professional advice. These pages describe the project as currently configured and are not a substitute for jurisdiction-specific legal review before operating a public commercial service.
          </p>
        </section>

        <p className="border-t border-border/70 pt-6 text-sm text-muted-foreground">
          Read the <Link className="text-primary underline underline-offset-4" href="/privacy">Privacy Policy</Link> and <Link className="text-primary underline underline-offset-4" href="/terms">Terms of Service</Link>.
        </p>
      </article>
    </main>
  );
}