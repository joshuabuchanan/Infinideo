import { PlaylistHeaderSection } from "../components/sections/playlist-header-section";
import { VideosSection } from "../components/sections/videos-section";

interface VideosViewProps {
  playlistId: string;
}

export const VideosView = ({ playlistId }: VideosViewProps) => {
  return (
    <div className="mx-auto mb-10 flex max-w-[2400px] flex-col gap-y-6 px-4 pt-2.5">
      <PlaylistHeaderSection playlistId={playlistId} />
      <VideosSection playlistId={playlistId} />
    </div>
  );
};
