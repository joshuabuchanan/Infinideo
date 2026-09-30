import { HistoryVideosSection } from "../components/sections/history-videos-section";

export const HistoryView = () => {
  return (
    <div className="mx-auto mb-10 flex max-w-[2400px] flex-col gap-y-6 px-4 pt-2.5">
      <h1 className="text-2xl font-bold">Watch history</h1>
      <HistoryVideosSection />
    </div>
  );
};
