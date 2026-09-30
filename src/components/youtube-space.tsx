"use client";

import { useEffect, useState } from "react";
import { devFeedVideos } from "@/lib/feed-videos";
import { getYouTubeEmbedUrl } from "@/lib/youtube";

export default function YouTubeSpace() {
  const [selectedId, setSelectedId] = useState(devFeedVideos[0]?.id ?? "");
  const [origin, setOrigin] = useState("");
  const selectedVideo = devFeedVideos.find((video) => video.id === selectedId) ?? devFeedVideos[0];

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setOrigin(window.location.origin), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  if (!selectedVideo) return null;

  const embedUrl = origin ? getYouTubeEmbedUrl(selectedVideo.id, origin) : null;

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1.7fr)_320px]">
      <section>
        <div className="overflow-hidden rounded-2xl bg-black shadow-2xl shadow-primary/10">
          <div className="aspect-video">
            {embedUrl ? (
              <iframe
                className="h-full w-full border-0"
                src={embedUrl}
                title={selectedVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            ) : null}
          </div>
        </div>
        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">{selectedVideo.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{selectedVideo.channelTitle}</p>
          </div>
          <a
            className="shrink-0 text-sm font-semibold text-red-500 hover:underline"
            href={`https://www.youtube.com/watch?v=${selectedVideo.id}`}
            target="_blank"
            rel="noreferrer"
          >
            Watch on YouTube
          </a>
        </div>
      </section>

      <aside className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-muted-foreground">YouTube picks</h2>
        {devFeedVideos.map((video) => (
          <button
            key={video.id}
            type="button"
            onClick={() => setSelectedId(video.id)}
            className={`flex w-full gap-3 rounded-xl border p-2 text-left transition-colors ${
              video.id === selectedVideo.id
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:border-primary/50"
            }`}
          >
            <img className="h-16 w-28 shrink-0 rounded-md object-cover" src={video.thumbnail} alt="" />
            <span className="min-w-0">
              <strong className="line-clamp-2 text-sm">{video.title}</strong>
              <span className="mt-1 block text-xs text-muted-foreground">{video.channelTitle}</span>
            </span>
          </button>
        ))}
      </aside>
    </div>
  );
}