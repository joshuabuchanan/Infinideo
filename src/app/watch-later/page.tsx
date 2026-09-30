import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { HomeLayout } from "@/modules/home/ui/layouts/home-layouts";
import { WatchLaterVideosSection } from "@/modules/playlists/ui/components/sections/watch-later-videos-section";

export default async function WatchLaterPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=%2Fwatch-later");

  return (
    <HomeLayout>
      <main className="mx-auto min-h-[70vh] max-w-5xl px-4 py-8 sm:px-6">
        <header className="mb-6 border-b border-border/70 pb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">Saved for later</p>
          <h1 className="mt-2 text-2xl font-bold">Watch later</h1>
        </header>
        <WatchLaterVideosSection />
      </main>
    </HomeLayout>
  );
}
