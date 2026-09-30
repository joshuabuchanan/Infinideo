import Feed from "@/components/Feed/Feed";
import { HomeLayout } from "@/modules/home/ui/layouts/home-layouts";
import { CategoriesSection } from "@/modules/home/ui/section/catergories-section";

export default function ExplorePage() {
  return (
    <HomeLayout>
      <main className="mx-auto max-w-[2400px] space-y-6 px-4 py-8">
        <header className="border-b border-border/70 pb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">Discover</p>
          <h1 className="mt-2 text-2xl font-bold">Explore</h1>
          <p className="mt-2 text-sm text-muted-foreground">Browse videos from across the open web.</p>
        </header>
        <CategoriesSection />
        <Feed />
      </main>
    </HomeLayout>
  );
}
