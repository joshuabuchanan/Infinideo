import Feed from "@/components/Feed/Feed";

import { ResultsSection } from "../sections/results-section";
import { CategoriesSection } from "../sections/categories-section";

interface PageProps {
  query: string | undefined;
  categoryId: string | undefined;
};

export const SearchView = ({
  query,
  categoryId,
}: PageProps) => {
  const normalizedQuery = query?.trim();

  return (
    <main className="mx-auto mb-10 flex max-w-[2400px] flex-col gap-y-6 px-4 pt-2.5">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">Search</p>
        <h1 className="mt-2 text-2xl font-bold">
          {normalizedQuery ? `Results for “${normalizedQuery}”` : "Search videos and channels"}
        </h1>
      </header>
      <CategoriesSection categoryId={categoryId} />
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Infinideo uploads</h2>
        <ResultsSection query={normalizedQuery} categoryId={categoryId} />
      </section>
      {normalizedQuery ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">More videos across the web</h2>
          <Feed search={normalizedQuery} />
        </section>
      ) : null}
    </main>
  );
};
