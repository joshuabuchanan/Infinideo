"use client";

import { Suspense } from "react";
import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { ErrorBoundary } from "react-error-boundary";

import { trpc } from "@/trpc/client";
import { FilterCarousel } from "@/components/filter-carousel";

interface CategoriesSectionProps {
  categoryId?: string;
};

export const CategoriesSection = ({ categoryId }: CategoriesSectionProps) => {
  return (
    <Suspense fallback={<CategoriesSectionSkeleton />}>
      <ErrorBoundary fallback={<p>Error...</p>}>
        <CategoriesSectionSuspense categoryId={categoryId} />
      </ErrorBoundary>
    </Suspense>
  )
}

export const CategoriesSectionSkeleton = () => {
  return <FilterCarousel isLoading data={[]} onSelect={() => {}} />
};

const CategoriesSectionSuspense = ({ categoryId }: CategoriesSectionProps) => {
  const router = useRouter();
  const { isLoaded, userId } = useAuth();
  const utils = trpc.useUtils();
  const [categories] = trpc.categories.getSuggested.useSuspenseQuery();

  useEffect(() => {
    if (isLoaded) void utils.categories.getSuggested.invalidate();
  }, [isLoaded, userId, utils]);

  const data = categories.map((category) => ({
    value: category.id,
    label: category.name,
  }));

  const onSelect = (value: string | null) => {
    const url = new URL(window.location.href);

    if (value) {
      url.searchParams.set("categoryId", value);
    } else {
      url.searchParams.delete("categoryId");
    }

    router.push(url.toString());
  };

  return <FilterCarousel onSelect={onSelect} value={categoryId} data={data} />
};
