import Feed from "@/components/Feed/Feed";

interface FeedPageProps {
  searchParams: Promise<{
    search?: string;
  }>;
}

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const { search } = await searchParams;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-3 border-b border-border/70 pb-6">
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-400">
            Open Knowledge Stream
          </span>

          <div className="flex items-end justify-between gap-4">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{search ? `Results for "${search}"` : "Open Knowledge Stream"}</h1>

              <p className="text-sm text-muted-foreground">
              Science, history, nature, and creative-coding videos with transparent attribution
            </p>
          </div>
        </header>

        <Feed search={search} />
      </div>
    </main>
  );
}