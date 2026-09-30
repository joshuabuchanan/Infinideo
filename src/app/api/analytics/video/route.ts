import { NextResponse } from "next/server";

const allowedEvents = new Set(["play", "pause", "progress", "complete"]);
const allowedSources = new Set(["internet-archive", "wikimedia", "wikimedia-commons", "nasa", "peertube", "youtube", "twitch", "pexels", "pixabay", "dailymotion", "blender", "ihavenotv", "free-stock"]);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      event?: string;
      videoId?: string;
      source?: string;
      positionSeconds?: number;
    };

    if (
      !body.videoId ||
      body.videoId.length > 160 ||
      !body.event ||
      !allowedEvents.has(body.event) ||
      !body.source ||
      !allowedSources.has(body.source)
    ) {
      return NextResponse.json({ ok: false, error: "Invalid analytics event" }, { status: 400 });
    }

    const positionSeconds = Number(body.positionSeconds ?? 0);
    if (!Number.isFinite(positionSeconds) || positionSeconds < 0 || positionSeconds > 86_400) {
      return NextResponse.json({ ok: false, error: "Invalid playback position" }, { status: 400 });
    }

    // Keep this endpoint first-party and privacy-minimal. Persist only after adding
    // a retention policy and a consent-aware analytics table.
    console.info("video_event", {
      event: body.event,
      videoId: body.videoId,
      source: body.source,
      positionSeconds: Math.round(positionSeconds),
      recordedAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }
}
