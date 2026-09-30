import { db } from "@/db";
import { categories, users, videoReactions, videos, videoViews } from "@/db/schema";
import { and, count, eq, isNotNull, sql } from "drizzle-orm";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";

export const categoriesRouter = createTRPCRouter({
	getMany: baseProcedure.query(async () => {
		return db.select().from(categories);
	}),
	getSuggested: baseProcedure.query(async ({ ctx }) => {
		const data = await db.select().from(categories);
		if (!ctx.clerkUserId) return data;

		const [user] = await db
			.select({ id: users.id })
			.from(users)
			.where(eq(users.clerkId, ctx.clerkUserId))
			.limit(1);
		if (!user) return data;

		const interactions = await db
			.select({
				categoryId: videos.categoryId,
				views: count(videoViews.videoId),
				likes: count(sql`case when ${videoReactions.type} = 'like' then ${videoReactions.videoId} end`),
				dislikes: count(sql`case when ${videoReactions.type} = 'dislike' then ${videoReactions.videoId} end`),
			})
			.from(videos)
			.leftJoin(videoViews, and(
				eq(videoViews.videoId, videos.id),
				eq(videoViews.userId, user.id),
			))
			.leftJoin(videoReactions, and(
				eq(videoReactions.videoId, videos.id),
				eq(videoReactions.userId, user.id),
			))
			.where(isNotNull(videos.categoryId))
			.groupBy(videos.categoryId);

		const scores = new Map(
			interactions.map(({ categoryId, views, likes, dislikes }) => [
				categoryId,
				views + likes * 3 - dislikes * 2,
			]),
		);

		return data
			.map((category, index) => ({
				category,
				index,
				score: scores.get(category.id) ?? 0,
			}))
			.sort((left, right) => right.score - left.score || left.index - right.index)
			.map(({ category }) => category);
	}),
});		