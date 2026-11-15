"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import type { FeedVideo } from "@/lib/feed-videos";
import "./Recommended.css";

interface RecommendedProps {
  currentVideoId: string;
}

interface RecommendedPage {
  videos: FeedVideo[];
  nextPageToken?: string;
  hasMore?: boolean;
}

const recommendationPageSize = 24;

const Recommended = ({ currentVideoId }: RecommendedProps) => {
  const [videos, setVideos] = useState<FeedVideo[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string>();
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);
  const isFetchingRef = useRef(false);
  const seenVideoIdsRef = useRef(new Set<string>());

  useEffect(() => {
    let active = true;
    const requestId = ++requestIdRef.current;
    const controller = new AbortController();
    const params = new URLSearchParams({
      recommendFor: currentVideoId,
      limit: String(recommendationPageSize),
    });

    seenVideoIdsRef.current.clear();
    isFetchingRef.current = true;
    setVideos([]);
    setNextPageToken(undefined);
    setHasMore(false);
    setIsLoadingMore(false);

    const loadRecommendations = async () => {
      try {
        const response = await fetch(`/api/videos?${params.toString()}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Unable to load recommendations");
        const data = await response.json() as RecommendedPage;
        if (!active || requestId !== requestIdRef.current) return;

        const recommendations = data.videos.filter((video) => video.id !== currentVideoId);
        recommendations.forEach((video) => seenVideoIdsRef.current.add(video.id));
        setVideos(recommendations);
        setNextPageToken(data.nextPageToken);
        setHasMore(Boolean(data.hasMore && data.nextPageToken));
      } catch {
        if (active) setVideos([]);
      } finally {
        if (requestId === requestIdRef.current) isFetchingRef.current = false;
      }
    };

    void loadRecommendations();

    return () => {
      active = false;
      controller.abort();
    };
  }, [currentVideoId]);

  const loadNextPage = useCallback(async () => {
    if (!hasMore || !nextPageToken || isFetchingRef.current) return;

    const requestId = requestIdRef.current;
    const params = new URLSearchParams({
      recommendFor: currentVideoId,
      limit: String(recommendationPageSize),
      pageToken: nextPageToken,
    });

    isFetchingRef.current = true;
    setIsLoadingMore(true);

    try {
      const response = await fetch(`/api/videos?${params.toString()}`);
      if (!response.ok) throw new Error("Unable to load more recommendations");
      const data = await response.json() as RecommendedPage;
      if (requestId !== requestIdRef.current) return;

      const newVideos = data.videos.filter((video) => (
        video.id !== currentVideoId && !seenVideoIdsRef.current.has(video.id)
      ));
      newVideos.forEach((video) => seenVideoIdsRef.current.add(video.id));
      setVideos((current) => [...current, ...newVideos]);
      setNextPageToken(data.nextPageToken);
      setHasMore(Boolean(data.hasMore && data.nextPageToken));
    } catch {
      if (requestId === requestIdRef.current) setHasMore(false);
    } finally {
      if (requestId === requestIdRef.current) {
        isFetchingRef.current = false;
        setIsLoadingMore(false);
      }
    }
  }, [currentVideoId, hasMore, nextPageToken]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasMore) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) void loadNextPage();
    }, { rootMargin: "600px" });

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loadNextPage]);

  return (
    <div className="recommended">
      {videos.map((video) => (
          <Link key={video.id} href={`/feed/${video.id.replace(":", "/")}`} className="side-video-list">
            <img src={video.thumbnail} alt="" />
            <div className="vid-info">
              <h2>{video.title}</h2>
              <p>{video.channelTitle}</p>
              <p>{Number(video.viewCount).toLocaleString()} views</p>
            </div>
          </Link>
        ))}
      <div ref={loadMoreRef} aria-hidden="true" />
      {isLoadingMore && <p className="recommended-loading">Loading more videos...</p>}
    </div>
  );
};

export default Recommended;
