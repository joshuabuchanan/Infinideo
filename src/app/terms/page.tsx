import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | Infinideo",
  description: "Terms for using the Infinideo portfolio project.",
};

export default function TermsPage() {
  return (
    <main className="mx-auto min-h-svh max-w-4xl px-5 py-8 text-foreground md:px-8 md:py-14">
      <header className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-border/70 pb-5">
        <Link className="text-lg font-black text-primary" href="/">Infinideo</Link>
        <nav aria-label="Legal pages" className="flex flex-wrap gap-5 text-sm text-muted-foreground">
          <Link className="hover:text-foreground" href="/privacy">Privacy</Link>
          <Link aria-current="page" className="text-foreground" href="/terms">Terms</Link>
          <Link className="hover:text-foreground" href="/legal">Legal</Link>
        </nav>
      </header>

      <article className="space-y-8">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-secondary">LAST UPDATED: SEPTEMBER 29, 2026</p>
          <h1 className="text-3xl font-bold tracking-normal md:text-4xl">Terms of Service</h1>
          <p className="max-w-3xl text-muted-foreground">
            Infinideo is a portfolio project maintained by <a className="text-primary underline underline-offset-4" href="https://github.com/joshuabuchanan" target="_blank" rel="noreferrer">@joshuabuchanan</a>. By using the app, you agree to these terms. If you do not agree, do not use account, upload, or interaction features.
          </p>
        </div>

        <section className="space-y-3 border-t border-border/70 pt-6">
          <h2 className="text-xl font-semibold">Using the service</h2>
          <p className="text-muted-foreground">
            Use Infinideo lawfully and do not disrupt the service, probe accounts or systems without permission, evade access controls, or upload harmful code or content that violates another person&apos;s rights. You are responsible for activity on your account and for keeping your sign-in credentials secure.
          </p>
          <p className="text-muted-foreground">
            The app is provided as a portfolio demonstration. Features may change, become unavailable, or be removed without notice. Do not rely on it for critical, regulated, or confidential work.
          </p>
        </section>

        <section className="space-y-3 border-t border-border/70 pt-6">
          <h2 className="text-xl font-semibold">Content and rights</h2>
          <p className="text-muted-foreground">
            You retain rights to content you create. If you upload or submit content, you confirm that you have the rights and permissions needed to do so and grant Infinideo permission to host, process, display, and transmit it only as needed to operate the features you use. You are responsible for setting an appropriate visibility level and for honoring any license or attribution terms that apply.
          </p>
          <p className="text-muted-foreground">
            Content from linked or integrated third-party services remains subject to its creator&apos;s rights and that provider&apos;s terms. A public listing or playable embed does not grant you permission to download, copy, redistribute, or reuse that content.
          </p>
        </section>

        <section className="space-y-3 border-t border-border/70 pt-6">
          <h2 className="text-xl font-semibold">Visibility and third-party services</h2>
          <p className="text-muted-foreground">
            The current Mux setup uses public playback IDs. Marking a video private limits its discovery in Infinideo but does not protect a direct playback URL. Do not upload sensitive or confidential video. Authentication, storage, playback, and embedded services may also be subject to their own provider terms.
          </p>
        </section>

        <section className="space-y-3 border-t border-border/70 pt-6">
          <h2 className="text-xl font-semibold">Availability and liability</h2>
          <p className="text-muted-foreground">
            Infinideo is provided as-is and as-available, without promises that it will be uninterrupted, secure, error-free, or suitable for a particular purpose. To the extent permitted by law, the maintainer is not liable for indirect or consequential losses arising from use of the app. Nothing here excludes rights or liability that cannot lawfully be excluded.
          </p>
        </section>

        <section className="space-y-3 border-t border-border/70 pt-6">
          <h2 className="text-xl font-semibold">Changes and contact</h2>
          <p className="text-muted-foreground">
            These terms may be updated as the project changes. Continued use after an update means you accept the revised terms. For questions or content concerns, contact the maintainer through the <a className="text-primary underline underline-offset-4" href="https://github.com/joshuabuchanan" target="_blank" rel="noreferrer">GitHub profile</a>; do not post private information in a public issue.
          </p>
        </section>

        <p className="border-t border-border/70 pt-6 text-sm text-muted-foreground">
          Read the <Link className="text-primary underline underline-offset-4" href="/privacy">Privacy Policy</Link> and <Link className="text-primary underline underline-offset-4" href="/legal">Legal Notice</Link>.
        </p>
      </article>
    </main>
  );
}