CREATE TABLE "feed_playlist_videos" (
	"playlist_id" uuid NOT NULL,
	"source_id" text NOT NULL,
	"video_id" text NOT NULL,
	"title" text NOT NULL,
	"channel_title" text NOT NULL,
	"thumbnail" text NOT NULL,
	"published_at" text NOT NULL,
	"view_count" text NOT NULL,
	"duration" text NOT NULL,
	"source_url" text,
	"video_url" text,
	"embed_url" text,
	"description" text,
	"added_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "feed_playlist_videos_pk" PRIMARY KEY("playlist_id","source_id","video_id")
);
--> statement-breakpoint
ALTER TABLE "feed_playlist_videos" ADD CONSTRAINT "feed_playlist_videos_playlist_id_playlists_id_fk" FOREIGN KEY ("playlist_id") REFERENCES "public"."playlists"("id") ON DELETE cascade ON UPDATE no action;