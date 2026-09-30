import { HomeView } from "@/modules/home/ui/views/home-view";

export const dynamic = "force-dynamic";

interface HomePageProps {
  searchParams: Promise<{
    categoryId?: string;
    category?: string;
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { categoryId, category } = await searchParams;

  return <HomeView categoryId={categoryId} category={category} />;
}
