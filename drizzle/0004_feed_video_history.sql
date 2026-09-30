CREATE TABLE "feed_video_history" (
	"user_id" uuid NOT NULL,
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
	"watched_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "feed_video_history_pk" PRIMARY KEY("user_id","source_id","video_id")
);
--> statement-breakpoint
ALTER TABLE "feed_video_history" ADD CONSTRAINT "feed_video_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;