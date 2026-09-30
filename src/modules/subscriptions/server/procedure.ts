import { and, desc, eq, getTableColumns, lt, or } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { subscriptions, users } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

const subscriptionInput = z.object({
  userId: z.string().uuid(),
});

export const subscriptionsRouter = createTRPCRouter({
  getMany: protectedProcedure
    .input(z.object({
      cursor: z.object({
        creatorId: z.string().uuid(),
        updatedAt: z.date(),
      }).nullish(),
      limit: z.number().min(1).max(100),
    }))
    .query(async ({ ctx, input }) => {
      const data = await db
        .select({
          ...getTableColumns(subscriptions),
          creator: {
            ...getTableColumns(users),
            subscriberCount: db.$count(subscriptions, eq(subscriptions.creatorId, users.id)),
          },
        })
        .from(subscriptions)
        .innerJoin(users, eq(subscriptions.creatorId, users.id))
        .where(and(
          eq(subscriptions.viewerId, ctx.user.id),
          input.cursor
            ? or(
                lt(subscriptions.updatedAt, input.cursor.updatedAt),
                and(
                  eq(subscriptions.updatedAt, input.cursor.updatedAt),
                  lt(subscriptions.creatorId, input.cursor.creatorId),
                ),
              )
            : undefined,
        ))
        .orderBy(desc(subscriptions.updatedAt), desc(subscriptions.creatorId))
        .limit(input.limit + 1);

      const hasMore = data.length > input.limit;
      const items = hasMore ? data.slice(0, -1) : data;
      const lastItem = items[items.length - 1];

      return {
        items,
        nextCursor: hasMore && lastItem
          ? { creatorId: lastItem.creatorId, updatedAt: lastItem.updatedAt }
          : null,
      };
    }),
  create: protectedProcedure
    .input(subscriptionInput)
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.id === input.userId) {
        return;
      }

      await db
        .insert(subscriptions)
        .values({ viewerId: ctx.user.id, creatorId: input.userId })
        .onConflictDoNothing();
    }),
  remove: protectedProcedure
    .input(subscriptionInput)
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(subscriptions)
        .where(
          and(
            eq(subscriptions.viewerId, ctx.user.id),
            eq(subscriptions.creatorId, input.userId),
          ),
        );
    }),
});