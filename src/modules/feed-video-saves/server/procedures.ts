import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { feedVideoSaves } from "@/db/schema";
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

export const feedVideoSavesRouter = createTRPCRouter({
  getStatus: protectedProcedure
    .input(videoKeySchema)
    .query(async ({ ctx, input }) => {
      const [savedVideo] = await db
        .select({ videoId: feedVideoSaves.videoId })
        .from(feedVideoSaves)
        .where(and(
          eq(feedVideoSaves.userId, ctx.user.id),
          eq(feedVideoSaves.sourceId, input.sourceId),
          eq(feedVideoSaves.videoId, input.videoId),
        ))
        .limit(1);

      return { isSaved: Boolean(savedVideo) };
    }),
  getMany: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(feedVideoSaves)
      .where(eq(feedVideoSaves.userId, ctx.user.id))
      .orderBy(desc(feedVideoSaves.savedAt));
  }),
  setSaved: protectedProcedure
    .input(feedVideoSchema.extend({ saved: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const { saved, ...video } = input;
      const key = and(
        eq(feedVideoSaves.userId, ctx.user.id),
        eq(feedVideoSaves.sourceId, video.sourceId),
        eq(feedVideoSaves.videoId, video.videoId),
      );

      if (!saved) {
        await db.delete(feedVideoSaves).where(key);
        return { isSaved: false };
      }

      await db
        .insert(feedVideoSaves)
        .values({ ...video, userId: ctx.user.id })
        .onConflictDoUpdate({
          target: [feedVideoSaves.userId, feedVideoSaves.sourceId, feedVideoSaves.videoId],
          set: { ...video, savedAt: new Date() },
        });

      return { isSaved: true };
    }),
});
