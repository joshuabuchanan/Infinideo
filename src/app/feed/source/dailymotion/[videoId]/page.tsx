import VideoPage from "../../../[videoId]/page";

interface DailymotionVideoPageProps {
  params: Promise<{
    videoId: string;
  }>;
}

export default async function DailymotionVideoPage({ params }: DailymotionVideoPageProps) {
  const { videoId } = await params;
  return <VideoPage params={Promise.resolve({ videoId: `dailymotion:${videoId}` })} />;
}
