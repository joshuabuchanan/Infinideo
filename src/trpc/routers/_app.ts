import { categoriesRouter } from "../../modules/catergories/server/procedure";
import { commentsRouter } from "../../modules/comments/server/procedures";
import { commentReactionsRouter } from "../../modules/comment-reactions/server/procedures";
import { feedVideoLikesRouter } from "../../modules/feed-video-likes/server/procedures";
import { feedVideoHistoryRouter } from "../../modules/feed-video-history/server/procedures";
import { feedVideoSavesRouter } from "../../modules/feed-video-saves/server/procedures";
import { playlistsRouter } from "../../modules/playlists/server/procedures";
import { searchRouter } from "../../modules/search/server/procedures";
import { studioRouter } from "../../modules/studio/server/procedure";
import { subscriptionsRouter } from "../../modules/subscriptions/server/procedure";
import { suggestionsRouter } from "../../modules/suggestions/server/procedures";
import { usersRouter } from "../../modules/users/server/procedures";
import { videosRouter } from "../../modules/videos/server/procedures";
import { videoReactionsRouter } from "../../modules/videos/server/reactions-procedure";
import { videoViewsRouter } from "../../modules/videos/server/views-procedure";

import { createTRPCRouter } from "../init";

export const appRouter = createTRPCRouter({
  categories: categoriesRouter,
  comments: commentsRouter,
  commentReactions: commentReactionsRouter,
  feedVideoLikes: feedVideoLikesRouter,
  feedVideoHistory: feedVideoHistoryRouter,
  feedVideoSaves: feedVideoSavesRouter,
  playlists: playlistsRouter,
  search: searchRouter,
  studio: studioRouter,
  subscriptions: subscriptionsRouter,
  suggestions: suggestionsRouter,
  users: usersRouter,
  videos: videosRouter,
  videoReactions: videoReactionsRouter,
  videoViews: videoViewsRouter,
});

export type AppRouter = typeof appRouter;
