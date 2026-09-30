import VideoPage from "../[videoId]/page";

interface VideoCatchAllPageProps {
  params: Promise<{
    videoId: string[];
  }>;
}

export default async function VideoCatchAllPage({ params }: VideoCatchAllPageProps) {
  const { videoId } = await params;
  return <VideoPage params={Promise.resolve({ videoId: videoId.join(":") })} />;
}
