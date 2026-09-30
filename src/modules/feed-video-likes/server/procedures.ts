import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { feedVideoLikes } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

const videoKeySchema = z.object({
  sourceId: z.string().trim().min(1).max(64),
  videoId: z.string().trim().min(1).max(512),
});

const feedVideoSchema = videoKeySchema.extend({
  title: z.string().trim().min(1).max(500),
  channelTitle: z.string().trim().min(1).max(300),
  thumbnail: z.string().max(2048),
  publishedAt: z.string().max(100),
  viewCount: z.string().max(100),
  duration: z.string().max(100),
  sourceUrl: z.string().max(2048).nullish(),
  videoUrl: z.string().max(2048).nullish(),
  embedUrl: z.string().max(2048).nullish(),
  description: z.string().max(5000).nullish(),
});

export const feedVideoLikesRouter = createTRPCRouter({
  getStatus: protectedProcedure
    .input(videoKeySchema)
    .query(async ({ ctx, input }) => {
      const [likedVideo] = await db
        .select({ videoId: feedVideoLikes.videoId })
        .from(feedVideoLikes)
        .where(and(
          eq(feedVideoLikes.userId, ctx.user.id),
          eq(feedVideoLikes.sourceId, input.sourceId),
          eq(feedVideoLikes.videoId, input.videoId),
        ))
        .limit(1);

      return { isLiked: Boolean(likedVideo) };
    }),
  getMany: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(feedVideoLikes)
      .where(eq(feedVideoLikes.userId, ctx.user.id))
      .orderBy(desc(feedVideoLikes.likedAt));
  }),
  setLiked: protectedProcedure
    .input(feedVideoSchema.extend({ liked: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const { liked, ...video } = input;
      const key = and(
        eq(feedVideoLikes.userId, ctx.user.id),
        eq(feedVideoLikes.sourceId, video.sourceId),
        eq(feedVideoLikes.videoId, video.videoId),
      );

      if (!liked) {
        await db.delete(feedVideoLikes).where(key);
        return { isLiked: false };
      }

      await db
        .insert(feedVideoLikes)
        .values({ ...video, userId: ctx.user.id })
        .onConflictDoUpdate({
          target: [feedVideoLikes.userId, feedVideoLikes.sourceId, feedVideoLikes.videoId],
          set: { ...video, likedAt: new Date() },
        });

      return { isLiked: true };
    }),
});
