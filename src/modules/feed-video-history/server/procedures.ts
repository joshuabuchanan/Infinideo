import { and, desc, eq, lt, or } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { feedVideoHistory } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

const feedVideoHistoryInput = z.object({
  sourceId: z.string().min(1).max(50),
  videoId: z.string().min(1).max(255),
  title: z.string().max(500),
  channelTitle: z.string().max(200),
  thumbnail: z.string().max(2048),
  publishedAt: z.string().max(100),
  viewCount: z.string().max(100),
  duration: z.string().max(100),
  sourceUrl: z.string().max(2048).nullish(),
  videoUrl: z.string().max(2048).nullish(),
  embedUrl: z.string().max(2048).nullish(),
  description: z.string().max(5000).nullish(),
});

export const feedVideoHistoryRouter = createTRPCRouter({
  record: protectedProcedure
    .input(feedVideoHistoryInput)
    .mutation(async ({ ctx, input }) => {
      const [historyEntry] = await db
        .insert(feedVideoHistory)
        .values({
          ...input,
          userId: ctx.user.id,
          sourceUrl: input.sourceUrl ?? null,
          videoUrl: input.videoUrl ?? null,
          embedUrl: input.embedUrl ?? null,
          description: input.description ?? null,
        })
        .onConflictDoUpdate({
          target: [feedVideoHistory.userId, feedVideoHistory.sourceId, feedVideoHistory.videoId],
          set: {
            title: input.title,
            channelTitle: input.channelTitle,
            thumbnail: input.thumbnail,
            publishedAt: input.publishedAt,
            viewCount: input.viewCount,
            duration: input.duration,
            sourceUrl: input.sourceUrl ?? null,
            videoUrl: input.videoUrl ?? null,
            embedUrl: input.embedUrl ?? null,
            description: input.description ?? null,
            watchedAt: new Date(),
          },
        })
        .returning();

      return historyEntry;
    }),
  getMany: protectedProcedure
    .input(z.object({
      cursor: z.object({
        sourceId: z.string(),
        videoId: z.string(),
        watchedAt: z.date(),
      }).nullish(),
      limit: z.number().min(1).max(100),
    }))
    .query(async ({ ctx, input }) => {
      const { cursor, limit } = input;
      const rows = await db
        .select()
        .from(feedVideoHistory)
        .where(and(
          eq(feedVideoHistory.userId, ctx.user.id),
          cursor
            ? or(
                lt(feedVideoHistory.watchedAt, cursor.watchedAt),
                and(
                  eq(feedVideoHistory.watchedAt, cursor.watchedAt),
                  or(
                    lt(feedVideoHistory.sourceId, cursor.sourceId),
                    and(
                      eq(feedVideoHistory.sourceId, cursor.sourceId),
                      lt(feedVideoHistory.videoId, cursor.videoId),
                    ),
                  ),
                ),
              )
            : undefined,
        ))
        .orderBy(desc(feedVideoHistory.watchedAt), desc(feedVideoHistory.sourceId), desc(feedVideoHistory.videoId))
        .limit(limit + 1);

      const hasMore = rows.length > limit;
      const items = hasMore ? rows.slice(0, -1) : rows;
      const lastItem = items.at(-1);

      return {
        items,
        nextCursor: hasMore && lastItem
          ? { sourceId: lastItem.sourceId, videoId: lastItem.videoId, watchedAt: lastItem.watchedAt }
          : null,
      };
    }),
});