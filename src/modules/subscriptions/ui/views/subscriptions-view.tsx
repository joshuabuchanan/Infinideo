import { SubscribedVideosSection } from "@/modules/home/ui/section/subscribed-videos-section";
import { SubscriptionsListSection } from "../sections/subscriptions-list-section";

export const SubscriptionsView = () => {
  return (
    <div className="mx-auto mb-10 flex max-w-[2400px] flex-col gap-y-6 px-4 pt-2.5">
      <div className="space-y-8">
        <section className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold">Subscriptions</h1>
            <p className="text-sm text-muted-foreground">Videos from creators you follow</p>
          </div>
          <SubscribedVideosSection />
        </section>
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Creators you follow</h2>
          <SubscriptionsListSection />
        </section>
      </div>
    </div>
  );
};
