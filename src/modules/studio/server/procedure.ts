import { and, desc, eq, getTableColumns, lt, or } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { comments, videoReactions, videos, videoViewEvents } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

export const studioRouter = createTRPCRouter({
  getMany: protectedProcedure
    .input(z.object({
      cursor: z.object({ id: z.string().uuid(), updatedAt: z.date() }).nullish(),
      limit: z.number().min(1).max(100),
    }))
    .query(async ({ ctx, input }) => {
      const { cursor, limit } = input;
      const data = await db
        .select({
          ...getTableColumns(videos),
          viewCount: db.$count(videoViewEvents, eq(videoViewEvents.videoId, videos.id)),
          commentCount: db.$count(comments, eq(comments.videoId, videos.id)),
          likeCount: db.$count(
            videoReactions,
            and(eq(videoReactions.videoId, videos.id), eq(videoReactions.type, "like")),
          ),
        })
        .from(videos)
        .where(and(
          eq(videos.userId, ctx.user.id),
          cursor
            ? or(
                lt(videos.updatedAt, cursor.updatedAt),
                and(eq(videos.updatedAt, cursor.updatedAt), lt(videos.id, cursor.id)),
              )
            : undefined,
        ))
        .orderBy(desc(videos.updatedAt), desc(videos.id))
        .limit(limit + 1);

      const hasMore = data.length > limit;
      const items = hasMore ? data.slice(0, -1) : data;
      const lastItem = items.at(-1);

      return {
        items,
        nextCursor: hasMore && lastItem
          ? { id: lastItem.id, updatedAt: lastItem.updatedAt }
          : null,
      };
    }),
});