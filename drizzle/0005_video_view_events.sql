CREATE TABLE "video_view_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"video_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "video_view_events" ADD CONSTRAINT "video_view_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_view_events" ADD CONSTRAINT "video_view_events_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
INSERT INTO "video_view_events" ("user_id", "video_id", "created_at")
SELECT "user_id", "video_id", "updated_at" FROM "video_views";