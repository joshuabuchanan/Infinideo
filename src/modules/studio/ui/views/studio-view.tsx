"use client";

import { StudioUploadModal } from "../components/studio-upload-modal";
import { VideosSection } from "../sections/videos-section";

export function StudioView() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border/70 pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Infinideo Studio</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Your videos</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Upload, review, and manage videos connected to your Infinideo account.
          </p>
        </div>
        <StudioUploadModal />
      </header>
      <VideosSection />
    </div>
  );
}
