"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { FeedVideo } from "@/lib/feed-videos";
import "./Recommended.css";

interface RecommendedProps {
  currentVideoId: string;
}

const Recommended = ({ currentVideoId }: RecommendedProps) => {
  const [videos, setVideos] = useState<FeedVideo[]>([]);

  useEffect(() => {
    let active = true;

    fetch(`/api/videos?recommendFor=${encodeURIComponent(currentVideoId)}&limit=6`)
      .then((response) => (response.ok ? response.json() as Promise<{ videos: FeedVideo[] }> : Promise.reject()))
      .then((data) => {
        if (active) setVideos(data.videos);
      })
      .catch(() => {
        if (active) setVideos([]);
      });

    return () => {
      active = false;
    };
  }, [currentVideoId]);

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
    </div>
  );
};

export default Recommended;
