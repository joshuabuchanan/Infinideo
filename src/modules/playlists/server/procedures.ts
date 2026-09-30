import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, getTableColumns, lt, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { feedPlaylistVideos, playlists, playlistVideos, users, videoReactions, videos, videoViewEvents, videoViews } from "@/db/schema";

export const playlistsRouter = createTRPCRouter({
  getFeedVideos: protectedProcedure
    .input(z.object({
      playlistId: z.string().uuid(),
      cursor: z.object({ sourceId: z.string(), videoId: z.string(), addedAt: z.date() }).nullish(),
      limit: z.number().min(1).max(100),
    }))
    .query(async ({ input, ctx }) => {
      const [playlist] = await db
        .select({ id: playlists.id })
        .from(playlists)
        .where(and(eq(playlists.id, input.playlistId), eq(playlists.userId, ctx.user.id)))
        .limit(1);
      if (!playlist) throw new TRPCError({ code: "NOT_FOUND" });

      const rows = await db
        .select()
        .from(feedPlaylistVideos)
        .where(and(
          eq(feedPlaylistVideos.playlistId, input.playlistId),
          input.cursor
            ? or(
                lt(feedPlaylistVideos.addedAt, input.cursor.addedAt),
                and(
                  eq(feedPlaylistVideos.addedAt, input.cursor.addedAt),
                  or(
                    lt(feedPlaylistVideos.sourceId, input.cursor.sourceId),
                    and(
                      eq(feedPlaylistVideos.sourceId, input.cursor.sourceId),
                      lt(feedPlaylistVideos.videoId, input.cursor.videoId),
                    ),
                  ),
                ),
              )
            : undefined,
        ))
        .orderBy(desc(feedPlaylistVideos.addedAt), desc(feedPlaylistVideos.sourceId), desc(feedPlaylistVideos.videoId))
        .limit(input.limit + 1);

      const hasMore = rows.length > input.limit;
      const items = hasMore ? rows.slice(0, -1) : rows;
      const lastItem = items.at(-1);
      return {
        items,
        nextCursor: hasMore && lastItem
          ? { sourceId: lastItem.sourceId, videoId: lastItem.videoId, addedAt: lastItem.addedAt }
          : null,
      };
    }),
  getManyForFeedVideo: protectedProcedure
    .input(z.object({
      sourceId: z.string().min(1).max(50),
      videoId: z.string().min(1).max(255),
      cursor: z.object({ id: z.string().uuid(), updatedAt: z.date() }).nullish(),
      limit: z.number().min(1).max(100),
    }))
    .query(async ({ input, ctx }) => {
      const rows = await db
        .select({
          ...getTableColumns(playlists),
          videoCount: sql<number>`(
            (SELECT COUNT(*) FROM ${playlistVideos} pv WHERE pv.playlist_id = ${playlists.id}) +
            (SELECT COUNT(*) FROM ${feedPlaylistVideos} fpv WHERE fpv.playlist_id = ${playlists.id})
          )`.mapWith(Number),
          user: users,
          containsVideo: sql<boolean>`EXISTS (
            SELECT 1 FROM ${feedPlaylistVideos} fpv
            WHERE fpv.playlist_id = ${playlists.id}
              AND fpv.source_id = ${input.sourceId}
              AND fpv.video_id = ${input.videoId}
          )`,
        })
        .from(playlists)
        .innerJoin(users, eq(playlists.userId, users.id))
        .where(and(
          eq(playlists.userId, ctx.user.id),
          input.cursor
            ? or(
                lt(playlists.updatedAt, input.cursor.updatedAt),
                and(
                  eq(playlists.updatedAt, input.cursor.updatedAt),
                  lt(playlists.id, input.cursor.id),
                ),
              )
            : undefined,
        ))
        .orderBy(desc(playlists.updatedAt), desc(playlists.id))
        .limit(input.limit + 1);

      const hasMore = rows.length > input.limit;
      const items = hasMore ? rows.slice(0, -1) : rows;
      const lastItem = items.at(-1);
      return {
        items,
        nextCursor: hasMore && lastItem ? { id: lastItem.id, updatedAt: lastItem.updatedAt } : null,
      };
    }),
  addFeedVideo: protectedProcedure
    .input(z.object({
      playlistId: z.string().uuid(),
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
    }))
    .mutation(async ({ input, ctx }) => {
      const [playlist] = await db
        .select({ id: playlists.id })
        .from(playlists)
        .where(and(eq(playlists.id, input.playlistId), eq(playlists.userId, ctx.user.id)))
        .limit(1);
      if (!playlist) throw new TRPCError({ code: "NOT_FOUND" });

      const [entry] = await db
        .insert(feedPlaylistVideos)
        .values({
          ...input,
          sourceUrl: input.sourceUrl ?? null,
          videoUrl: input.videoUrl ?? null,
          embedUrl: input.embedUrl ?? null,
          description: input.description ?? null,
        })
        .onConflictDoNothing()
        .returning();
      return entry ?? { playlistId: input.playlistId, sourceId: input.sourceId, videoId: input.videoId };
    }),
  removeFeedVideo: protectedProcedure
    .input(z.object({ playlistId: z.string().uuid(), sourceId: z.string(), videoId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [playlist] = await db
        .select({ id: playlists.id })
        .from(playlists)
        .where(and(eq(playlists.id, input.playlistId), eq(playlists.userId, ctx.user.id)))
        .limit(1);
      if (!playlist) throw new TRPCError({ code: "NOT_FOUND" });

      const [entry] = await db
        .delete(feedPlaylistVideos)
        .where(and(
          eq(feedPlaylistVideos.playlistId, input.playlistId),
          eq(feedPlaylistVideos.sourceId, input.sourceId),
          eq(feedPlaylistVideos.videoId, input.videoId),
        ))
        .returning();
      if (!entry) throw new TRPCError({ code: "NOT_FOUND" });
      return entry;
    }),
  remove: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { id } = input;
      const { id: userId } = ctx.user;

      const [deletedPlaylist] = await db
      .delete(playlists)
      .where(and(
        eq(playlists.id, id),
        eq(playlists.userId, userId),
      ))
      .returning();

      if (!deletedPlaylist) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return deletedPlaylist;
    }),
  getOne: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const { id } = input;
      const { id: userId } = ctx.user;

      const [existingPlaylist] = await db
        .select()
        .from(playlists)
        .where(
          and(
            eq(playlists.id, id),
            eq(playlists.userId, userId),
          )
        );

      if (!existingPlaylist) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return existingPlaylist;
    }),
  getVideos: protectedProcedure
    .input(
      z.object({
        playlistId: z.string().uuid(),
        cursor: z.object({
          id: z.string().uuid(),
          updatedAt: z.date(),
        })
        .nullish(),
        limit: z.number().min(1).max(100),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { id: userId } = ctx.user;
      const { cursor, limit, playlistId } = input;

      const [existingPlaylist] = await db
        .select()
        .from(playlists)
        .where(and(
          eq(playlists.id, playlistId),
          eq(playlists.userId, userId)
        ))

      if (!existingPlaylist) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const videosFromPlaylist = db.$with("playlist_videos").as(
        db
          .select({
            videoId: playlistVideos.videoId,
          })
          .from(playlistVideos)
          .where(eq(playlistVideos.playlistId, playlistId))
      );

      const data = await db
        .with(videosFromPlaylist)
        .select({
          ...getTableColumns(videos),
          user: users,
          viewCount: db.$count(videoViewEvents, eq(videoViewEvents.videoId, videos.id)),
          likeCount: db.$count(videoReactions, and(
            eq(videoReactions.videoId, videos.id),
            eq(videoReactions.type, "like"),
          )),
          dislikeCount: db.$count(videoReactions, and(
            eq(videoReactions.videoId, videos.id),
            eq(videoReactions.type, "dislike"),
          )),
        })
        .from(videos)
        .innerJoin(users, eq(videos.userId, users.id))
        .innerJoin(videosFromPlaylist, eq(videos.id, videosFromPlaylist.videoId))
        .where(and(
          or(
            eq(videos.visibility, "public"),
            eq(videos.userId, userId),
          ),
          cursor
            ? or(
                lt(videos.updatedAt, cursor.updatedAt),
                  and(
                    eq(videos.updatedAt, cursor.updatedAt),
                    lt(videos.id, cursor.id)
                  )
                )
            : undefined,
        )).orderBy(desc(videos.updatedAt), desc(videos.id))
        // Add 1 to the limit to check if there is more data
        .limit(limit + 1)

      const hasMore = data.length > limit;
      // Remove the last item if there is more data
      const items = hasMore ? data.slice(0, -1) : data;
      // Set the next cursor to the last item if there is more data
      const lastItem = items[items.length - 1];
      const nextCursor = hasMore 
        ? {
          id: lastItem.id,
          updatedAt: lastItem.updatedAt,
        }
        : null;

      return {
        items,
        nextCursor,
      };
    }),
  removeVideo: protectedProcedure
    .input(z.object({ 
      playlistId: z.string().uuid(),
      videoId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { playlistId, videoId } = input;
      const { id: userId } = ctx.user;

      const [existingPlaylist] = await db
        .select()
        .from(playlists)
        .where(and(
          eq(playlists.id, playlistId),
          eq(playlists.userId, userId),
        ));

      if (!existingPlaylist) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const [existingVideo] = await db
        .select()
        .from(videos)
        .where(eq(videos.id, videoId));

      if (!existingVideo) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const [existingPlaylistVideo] = await db
        .select()
        .from(playlistVideos)
        .where(
          and(
            eq(playlistVideos.playlistId, playlistId),
            eq(playlistVideos.videoId, videoId),
          )
        );

      if (!existingPlaylistVideo) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const [deletedPlaylistVideo] = await db
        .delete(playlistVideos)
        .where(
          and(
            eq(playlistVideos.playlistId, playlistId),
            eq(playlistVideos.videoId, videoId),
          )
        )
        .returning();

      return deletedPlaylistVideo;
    }),
  addVideo: protectedProcedure
    .input(z.object({ 
      playlistId: z.string().uuid(),
      videoId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { playlistId, videoId } = input;
      const { id: userId } = ctx.user;

      const [existingPlaylist] = await db
        .select()
        .from(playlists)
        .where(and(
          eq(playlists.id, playlistId),
          eq(playlists.userId, userId),
        ));

      if (!existingPlaylist) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const [existingVideo] = await db
        .select()
        .from(videos)
        .where(eq(videos.id, videoId));

      if (!existingVideo) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const [existingPlaylistVideo] = await db
        .select()
        .from(playlistVideos)
        .where(
          and(
            eq(playlistVideos.playlistId, playlistId),
            eq(playlistVideos.videoId, videoId),
          )
        );

      if (existingPlaylistVideo) {
        throw new TRPCError({ code: "CONFLICT" });
      }

      const [createdPlaylistVideo] = await db
        .insert(playlistVideos)
        .values({ playlistId, videoId })
        .returning();

      return createdPlaylistVideo;
    }),
  getManyForVideo: protectedProcedure
    .input(
      z.object({
        videoId: z.string().uuid(),
        cursor: z.object({
          id: z.string().uuid(),
          updatedAt: z.date(),
        })
        .nullish(),
        limit: z.number().min(1).max(100),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { id: userId } = ctx.user;
      const { cursor, limit, videoId } = input;

      const data = await db
        .select({
          ...getTableColumns(playlists),
          videoCount: sql<number>`(
            (SELECT COUNT(*) FROM ${playlistVideos} pv WHERE pv.playlist_id = ${playlists.id}) +
            (SELECT COUNT(*) FROM ${feedPlaylistVideos} fpv WHERE fpv.playlist_id = ${playlists.id})
          )`.mapWith(Number),
          user: users,
          containsVideo: videoId
            ? sql<boolean>`(
              SELECT EXISTS (
                SELECT 1
                FROM ${playlistVideos} pv
                WHERE pv.playlist_id = ${playlists.id} AND pv.video_id = ${videoId}
              )
            )`
            : sql<boolean>`false`,
        })
        .from(playlists)
        .innerJoin(users, eq(playlists.userId, users.id))
        .where(and(
          eq(playlists.userId, userId),
          cursor
            ? or(
                lt(playlists.updatedAt, cursor.updatedAt),
                  and(
                    eq(playlists.updatedAt, cursor.updatedAt),
                    lt(playlists.id, cursor.id)
                  )
                )
            : undefined,
        )).orderBy(desc(playlists.updatedAt), desc(playlists.id))
        // Add 1 to the limit to check if there is more data
        .limit(limit + 1)

      const hasMore = data.length > limit;
      // Remove the last item if there is more data
      const items = hasMore ? data.slice(0, -1) : data;
      // Set the next cursor to the last item if there is more data
      const lastItem = items[items.length - 1];
      const nextCursor = hasMore 
        ? {
          id: lastItem.id,
          updatedAt: lastItem.updatedAt,
        }
        : null;

      return {
        items,
        nextCursor,
      };
    }),
  getMany: protectedProcedure
    .input(
      z.object({
        cursor: z.object({
          id: z.string().uuid(),
          updatedAt: z.date(),
        })
        .nullish(),
        limit: z.number().min(1).max(100),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { id: userId } = ctx.user;
      const { cursor, limit } = input;

      const data = await db
        .select({
          ...getTableColumns(playlists),
          videoCount: sql<number>`(
            (SELECT COUNT(*) FROM ${playlistVideos} pv WHERE pv.playlist_id = ${playlists.id}) +
            (SELECT COUNT(*) FROM ${feedPlaylistVideos} fpv WHERE fpv.playlist_id = ${playlists.id})
          )`.mapWith(Number),
          user: users,
          thumbnailUrl: sql<string | null>`(
            COALESCE(
              (SELECT v.thumbnail_url
               FROM ${playlistVideos} pv
               JOIN ${videos} v ON v.id = pv.video_id
               WHERE pv.playlist_id = ${playlists.id}
               ORDER BY pv.updated_at DESC LIMIT 1),
              (SELECT fpv.thumbnail
               FROM ${feedPlaylistVideos} fpv
               WHERE fpv.playlist_id = ${playlists.id}
               ORDER BY fpv.added_at DESC LIMIT 1)
            )
          )`
        })
        .from(playlists)
        .innerJoin(users, eq(playlists.userId, users.id))
        .where(and(
          eq(playlists.userId, userId),
          cursor
            ? or(
                lt(playlists.updatedAt, cursor.updatedAt),
                  and(
                    eq(playlists.updatedAt, cursor.updatedAt),
                    lt(playlists.id, cursor.id)
                  )
                )
            : undefined,
        )).orderBy(desc(playlists.updatedAt), desc(playlists.id))
        // Add 1 to the limit to check if there is more data
        .limit(limit + 1)

      const hasMore = data.length > limit;
      // Remove the last item if there is more data
      const items = hasMore ? data.slice(0, -1) : data;
      // Set the next cursor to the last item if there is more data
      const lastItem = items[items.length - 1];
      const nextCursor = hasMore 
        ? {
          id: lastItem.id,
          updatedAt: lastItem.updatedAt,
        }
        : null;

      return {
        items,
        nextCursor,
      };
    }),
  create: protectedProcedure
    .input(z.object({
      name: z.string().trim().min(1).max(100),
      description: z.string().trim().max(500).nullish(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { name } = input;
      const { id: userId } = ctx.user;

      const [createdPlaylist] = await db
        .insert(playlists)
        .values({
          userId,
          name,
          description: input.description || null,
        })
        .returning();

      if (!createdPlaylist) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }

      return createdPlaylist;
    }),
  getLiked: protectedProcedure
    .input(
      z.object({
        cursor: z.object({
          id: z.string().uuid(),
          likedAt: z.date(),
        })
        .nullish(),
        limit: z.number().min(1).max(100),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { id: userId } = ctx.user;
      const { cursor, limit } = input;

      const viewerVideoReactions = db.$with("viewer_video_reactions").as(
        db
          .select({
            videoId: videoReactions.videoId,
            likedAt: videoReactions.updatedAt,
          })
          .from(videoReactions)
          .where(and(
            eq(videoReactions.userId, userId),
            eq(videoReactions.type, "like"),
          ))
      );

      const data = await db
        .with(viewerVideoReactions)
        .select({
          ...getTableColumns(videos),
          user: users,
          likedAt: viewerVideoReactions.likedAt,
          viewCount: db.$count(videoViewEvents, eq(videoViewEvents.videoId, videos.id)),
          likeCount: db.$count(videoReactions, and(
            eq(videoReactions.videoId, videos.id),
            eq(videoReactions.type, "like"),
          )),
          dislikeCount: db.$count(videoReactions, and(
            eq(videoReactions.videoId, videos.id),
            eq(videoReactions.type, "dislike"),
          )),
        })
        .from(videos)
        .innerJoin(users, eq(videos.userId, users.id))
        .innerJoin(viewerVideoReactions, eq(videos.id, viewerVideoReactions.videoId))
        .where(and(
          or(
            eq(videos.visibility, "public"),
            eq(videos.userId, userId),
          ),
          cursor
            ? or(
                lt(viewerVideoReactions.likedAt, cursor.likedAt),
                  and(
                    eq(viewerVideoReactions.likedAt, cursor.likedAt),
                    lt(videos.id, cursor.id)
                  )
                )
            : undefined,
        )).orderBy(desc(viewerVideoReactions.likedAt), desc(videos.id))
        // Add 1 to the limit to check if there is more data
        .limit(limit + 1)

      const hasMore = data.length > limit;
      // Remove the last item if there is more data
      const items = hasMore ? data.slice(0, -1) : data;
      // Set the next cursor to the last item if there is more data
      const lastItem = items[items.length - 1];
      const nextCursor = hasMore 
        ? {
          id: lastItem.id,
          likedAt: lastItem.likedAt,
        }
        : null;

      return {
        items,
        nextCursor,
      };
    }),
  getHistory: protectedProcedure
    .input(
      z.object({
        cursor: z.object({
          id: z.string().uuid(),
          viewedAt: z.date(),
        })
        .nullish(),
        limit: z.number().min(1).max(100),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { id: userId } = ctx.user;
      const { cursor, limit } = input;

      const viewerVideoViews = db.$with("viewer_video_views").as(
        db
          .select({
            videoId: videoViews.videoId,
            viewedAt: videoViews.updatedAt,
          })
          .from(videoViews)
          .where(eq(videoViews.userId, userId))
      );

      const data = await db
        .with(viewerVideoViews)
        .select({
          ...getTableColumns(videos),
          user: users,
          viewedAt: viewerVideoViews.viewedAt,
          viewCount: db.$count(videoViewEvents, eq(videoViewEvents.videoId, videos.id)),
          likeCount: db.$count(videoReactions, and(
            eq(videoReactions.videoId, videos.id),
            eq(videoReactions.type, "like"),
          )),
          dislikeCount: db.$count(videoReactions, and(
            eq(videoReactions.videoId, videos.id),
            eq(videoReactions.type, "dislike"),
          )),
        })
        .from(videos)
        .innerJoin(users, eq(videos.userId, users.id))
        .innerJoin(viewerVideoViews, eq(videos.id, viewerVideoViews.videoId))
        .where(and(
          eq(videos.visibility, "public"),
          cursor
            ? or(
                lt(viewerVideoViews.viewedAt, cursor.viewedAt),
                  and(
                    eq(viewerVideoViews.viewedAt, cursor.viewedAt),
                    lt(videos.id, cursor.id)
                  )
                )
            : undefined,
        )).orderBy(desc(viewerVideoViews.viewedAt), desc(videos.id))
        // Add 1 to the limit to check if there is more data
        .limit(limit + 1)

      const hasMore = data.length > limit;
      // Remove the last item if there is more data
      const items = hasMore ? data.slice(0, -1) : data;
      // Set the next cursor to the last item if there is more data
      const lastItem = items[items.length - 1];
      const nextCursor = hasMore 
        ? {
          id: lastItem.id,
          viewedAt: lastItem.viewedAt,
        }
        : null;

      return {
        items,
        nextCursor,
      };
    }),
});
