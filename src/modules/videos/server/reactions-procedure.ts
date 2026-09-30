import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { videoReactions } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

const reactionInput = z.object({ videoId: z.string().uuid() });

const toggleReaction = (type: "like" | "dislike") =>
  protectedProcedure
    .input(reactionInput)
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user;
      const [existingReaction] = await db
        .select()
        .from(videoReactions)
        .where(and(
          eq(videoReactions.userId, userId),
          eq(videoReactions.videoId, input.videoId),
        ));

      if (existingReaction?.type === type) {
        await db
          .delete(videoReactions)
          .where(and(
            eq(videoReactions.userId, userId),
            eq(videoReactions.videoId, input.videoId),
          ));
        return null;
      }

      if (existingReaction) {
        const [updatedReaction] = await db
          .update(videoReactions)
          .set({ type, updatedAt: new Date() })
          .where(and(
            eq(videoReactions.userId, userId),
            eq(videoReactions.videoId, input.videoId),
          ))
          .returning();
        return updatedReaction;
      }

      const [createdReaction] = await db
        .insert(videoReactions)
        .values({ userId, videoId: input.videoId, type })
        .returning();
      return createdReaction;
    });

export const videoReactionsRouter = createTRPCRouter({
  like: toggleReaction("like"),
  dislike: toggleReaction("dislike"),
});