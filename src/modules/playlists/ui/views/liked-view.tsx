import { LikedVideosSection } from "../components/sections/liked-videos-section";

export const LikedView = () => {
  return (
    <div className="mx-auto mb-10 flex max-w-[2400px] flex-col gap-y-6 px-4 pt-2.5">
      <h1 className="text-2xl font-bold">Liked videos</h1>
      <LikedVideosSection />
    </div>
  );
};
