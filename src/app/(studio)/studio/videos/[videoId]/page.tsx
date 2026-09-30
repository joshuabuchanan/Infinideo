import Link from "next/link";

import { VideoSection } from "@/modules/videos/ui/sections/video-section";

interface StudioVideoPageProps {
  params: Promise<{
    videoId: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function StudioVideoPage({ params }: StudioVideoPageProps) {
  const { videoId } = await params;

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      <Link
        href="/studio"
        className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"
      >
        <span aria-hidden="true">&larr;</span>
        Back to Studio
      </Link>
      <div className="mt-6">
        <VideoSection videoId={videoId} />
      </div>
    </main>
  );
}
