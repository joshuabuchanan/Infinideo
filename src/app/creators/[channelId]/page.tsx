import { notFound } from "next/navigation";

import Feed from "@/components/Feed/Feed";
import { HomeLayout } from "@/modules/home/ui/layouts/home-layouts";

interface CreatorPageProps {
  params: Promise<{ channelId: string }>;
}

export default async function CreatorPage({ params }: CreatorPageProps) {
  const { channelId } = await params;
  if (!/^UC[A-Za-z0-9_-]{20,24}$/.test(channelId)) notFound();

  return (
    <HomeLayout>
      <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
        <header className="mb-6 border-b border-border/70 pb-5">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-red-500">YouTube channel</p>
          <h1 className="mt-2 text-3xl font-bold">Channel videos</h1>
          <a
            href={`https://www.youtube.com/channel/${channelId}`}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Open channel on YouTube
          </a>
        </header>
        <Feed source="youtube" channelId={channelId} />
      </main>
    </HomeLayout>
  );
}