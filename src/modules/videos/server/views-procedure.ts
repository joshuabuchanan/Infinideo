import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { users, videoViewEvents, videoViews } from "@/db/schema";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";

export const videoViewsRouter = createTRPCRouter({
  create: baseProcedure
    .input(z.object({ videoId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [user] = ctx.clerkUserId
        ? await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.clerkId, ctx.clerkUserId))
        : [];

      const [viewEvent] = await db
        .insert(videoViewEvents)
        .values({ userId: user?.id ?? null, videoId: input.videoId })
        .returning();

      const [historyEntry] = user
        ? await db
            .insert(videoViews)
            .values({ userId: user.id, videoId: input.videoId })
            .onConflictDoUpdate({
              target: [videoViews.userId, videoViews.videoId],
              set: { updatedAt: new Date() },
            })
            .returning()
        : [];

      return { viewEvent, historyEntry: historyEntry ?? null };
    }),
});