"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";

interface FilterCarouselProps {
  value?: string | null;
  isLoading?: boolean;
  onSelect: (value: string | null) => void;
  data: {
    value: string;
    label: string;
  }[];
}

export const FilterCarousel = ({
  value,
  onSelect,
  data,
  isLoading,
}: FilterCarouselProps) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }

    const updateSelection = () => {
      setCurrent(api.selectedScrollSnap() + 1);
    };

    const initialize = () => {
      setCount(api.scrollSnapList().length);
      updateSelection();
    };

    queueMicrotask(initialize);
    api.on("select", updateSelection);

    return () => {
      api.off("select", updateSelection);
    };
  }, [api]);
  
  return (
    <div className="relative w-full overflow-hidden rounded-[20px] border border-border/70 bg-background/75 px-2 py-2 shadow-[0_10px_30px_rgba(25,21,45,0.06)] backdrop-blur-sm">
      <div
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-linear-to-r from-background via-background/90 to-transparent",
          current === 1 && "hidden"
        )}
      />

      <Carousel
        setApi={setApi}
        opts={{
          align: "start",
        }}
        className="w-full px-10"
      >
        <CarouselContent className="-ml-2">
          {!isLoading && (
            <CarouselItem className="basis-auto pl-2">
              <button
                type="button"
                aria-pressed={!value}
                onClick={() => onSelect(null)}
                className={cn(
                  "whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium shadow-sm transition-all duration-200",
                  !value
                    ? "border-primary/60 bg-primary text-primary-foreground shadow-[0_8px_20px_rgba(124,58,237,0.28)]"
                    : "border-border bg-card/80 text-foreground hover:border-primary/40 hover:bg-muted/70"
                )}
              >
                All
              </button>
            </CarouselItem>
          )}
          {isLoading && (
            Array.from({ length: 12 }).map((_, index) => (
              <CarouselItem key={index} className="basis-auto pl-2">
                <Skeleton className="h-9 w-24 rounded-full bg-muted/80" />
              </CarouselItem>
            ))
          )}
          {!isLoading && data
            .filter((item) => item.label !== "All")
            .map((item) => (
              <CarouselItem key={item.value} className="basis-auto pl-2">
                <button
                  type="button"
                  aria-pressed={value === item.value}
                  onClick={() => onSelect(item.value)}
                  className={cn(
                    "whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium shadow-sm transition-all duration-200",
                    value === item.value
                      ? "border-primary/60 bg-primary text-primary-foreground shadow-[0_8px_20px_rgba(124,58,237,0.28)]"
                      : "border-border bg-card/80 text-foreground hover:border-primary/40 hover:bg-muted/70"
                  )}
                >
                  {item.label}
                </button>
              </CarouselItem>
            ))}
        </CarouselContent>
        <CarouselPrevious className="left-1 z-20 size-8 rounded-full border border-border bg-background/90 text-foreground shadow-sm hover:bg-muted" />
        <CarouselNext className="right-1 z-20 size-8 rounded-full border border-border bg-background/90 text-foreground shadow-sm hover:bg-muted" />
      </Carousel>

      <div
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-linear-to-l from-background via-background/90 to-transparent",
          current === count && "hidden"
        )}
      />
    </div>
  )
}