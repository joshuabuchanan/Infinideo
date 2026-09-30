import Feed from "@/components/Feed/Feed";

export const TrendingView = () => {
  return (
    <div className="mx-auto mb-10 flex max-w-[2400px] flex-col gap-y-6 px-4 pt-2.5">
      <div>
        <h1 className="text-2xl font-bold">Trending</h1>
        <p className="text-sm text-muted-foreground">Popular videos from across Infinideo</p>
      </div>
      <Feed />
    </div>
  );
};
