import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { HomeLayout } from "@/modules/home/ui/layouts/home-layouts";
import { HistoryVideosSection } from "@/modules/playlists/ui/components/sections/history-videos-section";
import { LikedVideosSection } from "@/modules/playlists/ui/components/sections/liked-videos-section";
import { WatchLaterVideosSection } from "@/modules/playlists/ui/components/sections/watch-later-videos-section";

export default async function LibraryPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=%2Flibrary");

  return (
    <HomeLayout>
      <main className="mx-auto max-w-5xl space-y-10 px-4 py-8 sm:px-6">
        <header className="border-b border-border/70 pb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">Your library</p>
          <h1 className="mt-2 text-2xl font-bold">Library</h1>
          <p className="mt-2 text-sm text-muted-foreground">Saved videos, likes, and recent watches.</p>
        </header>
        <section>
          <h2 className="mb-3 text-lg font-semibold">Watch later</h2>
          <WatchLaterVideosSection />
        </section>
        <section>
          <h2 className="mb-3 text-lg font-semibold">Liked videos</h2>
          <LikedVideosSection />
        </section>
        <section>
          <h2 className="mb-3 text-lg font-semibold">Watch history</h2>
          <HistoryVideosSection />
        </section>
      </main>
    </HomeLayout>
  );
}
