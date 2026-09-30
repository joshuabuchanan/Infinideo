import PlayVideo from "@/components/Playvideo/Playvideo";
import Recommended from "@/components/Recommended/Recommended";
import { devFeedVideos } from "@/lib/feed-videos";
import "./Video.css";

interface VideoProps {
  videoId?: string;
}

export default function Video({ videoId = "qciHPEHxUAo" }: VideoProps) {
  const video = devFeedVideos.find((item) => item.id === videoId) ?? {
    id: videoId,
    title: "Dile A Tu Gato Hoodtrap",
    channelTitle: "Thery - Topic",
    viewCount: "0",
    publishedAt: "Today",
  };

  return (
    <div className="play-container">
      <PlayVideo
        videoId={video.id}
        title={video.title}
        channelTitle={video.channelTitle}
        viewCount={video.viewCount}
        publishedAt={video.publishedAt}
      />
      <Recommended currentVideoId={video.id} />
    </div>
  );
}