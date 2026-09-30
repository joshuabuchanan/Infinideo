type FeaturePageProps = {
  eyebrow?: string;
  title: string;
  description: string;
  ctaLabel?: string;
};

export function FeaturePage({
  eyebrow = "Infinideo",
  title,
  description,
  ctaLabel = "Continue browsing",
}: FeaturePageProps) {
  return (
    <main className="min-h-screen bg-background px-4 py-10 md:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          {eyebrow}
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
          {title}
        </h1>

        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{description}</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "Fresh picks",
            "Trending clips",
            "Recommended for you",
            "Saved for later",
            "Watchlist updates",
            "Creator highlights",
          ].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40"
            >
              <div className="mb-3 h-28 rounded-xl bg-gradient-to-br from-primary/20 via-secondary/15 to-accent/20" />
              <p className="text-sm font-medium text-card-foreground">{item}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 inline-flex items-center rounded-full border border-border bg-muted px-4 py-2 text-sm text-muted-foreground">
          {ctaLabel}
        </div>
      </div>
    </main>
  );
}
