import { notFound } from "next/navigation";
import Feed from "@/components/Feed/Feed";
import { HomeLayout } from "@/modules/home/ui/layouts/home-layouts";

const categoryTopics: Record<string, { title: string; query: string }> = {
  music: { title: "Music", query: "music performance" },
  gaming: { title: "Gaming", query: "gaming gameplay" },
  news: { title: "News", query: "news" },
  sports: { title: "Sports", query: "sports" },
  live: { title: "Live", query: "live stream" },
  entertainment: { title: "Entertainment", query: "entertainment" },
  technology: { title: "Technology", query: "technology" },
  videos: { title: "Videos", query: "popular videos" },
  education: { title: "Education", query: "educational science" },
  science: { title: "Science", query: "science education" },
  coding: { title: "Coding", query: "programming coding tutorial" },
  chemistry: { title: "Chemistry", query: "chemistry organic chemistry" },
};

export default async function ExploreCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;

  const topic = categoryTopics[category];
  if (!topic) {
    notFound();
  }

  return (
    <HomeLayout>
      <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
        <header className="mb-6 border-b border-border/70 pb-5">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-400">Explore</p>
          <h1 className="mt-2 text-3xl font-bold">{topic.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Videos and creators for {topic.title.toLowerCase()}.</p>
        </header>
        <Feed search={topic.query} />
      </main>
    </HomeLayout>
  );
}

export async function generateStaticParams() {
  return Object.keys(categoryTopics).map((category) => ({ category }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;

  const topic = categoryTopics[category];
  if (!topic) {
    return { title: "Explore" };
  }

  return {
    title: `${topic.title} | Explore`,
  };
}
