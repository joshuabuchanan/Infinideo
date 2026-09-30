import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { UploadThingError, UTApi } from "uploadthing/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";

import { db } from "@/db";
import { users, videos } from "@/db/schema";

const f = createUploadthing();

export const ourFileRouter = {
  bannerUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const { userId: clerkUserId } = await auth();

      if (!clerkUserId) throw new UploadThingError("Unauthorized");

      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.clerkId, clerkUserId));

      if (!existingUser) throw new UploadThingError("Unauthorized");

      return {
        userId: existingUser.id,
        previousBannerKey: existingUser.bannerKey,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        await db
          .update(users)
          .set({
            bannerUrl: file.url,
            bannerKey: file.key,
          })
          .where(eq(users.id, metadata.userId));

        if (metadata.previousBannerKey && metadata.previousBannerKey !== file.key) {
          await new UTApi().deleteFiles(metadata.previousBannerKey);
        }
      } catch (error) {
        await new UTApi().deleteFiles(file.key).catch((cleanupError) => {
          console.error("Failed to clean up replacement banner:", cleanupError);
        });
        throw error;
      }

      return { uploadedBy: metadata.userId};
    }),
  thumbnailUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .input(z.object({
      videoId: z.string().uuid(),
    }))
    .middleware(async ({ input }) => {
      const { userId: clerkUserId } = await auth();

      if (!clerkUserId) throw new UploadThingError("Unauthorized");

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.clerkId, clerkUserId));

      if (!user) throw new UploadThingError("Unauthorized");

      const [existingVideo] = await db
        .select({
          thumbnailKey: videos.thumbnailKey,
        })
        .from(videos)
        .where(and(
          eq(videos.id, input.videoId),
          eq(videos.userId, user.id)
        ))

      if (!existingVideo) throw new UploadThingError("Not found");

      return {
        user,
        ...input,
        previousThumbnailKey: existingVideo.thumbnailKey,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        await db
          .update(videos)
          .set({
            thumbnailUrl: file.url,
            thumbnailKey: file.key,
          })
          .where(and(
            eq(videos.id, metadata.videoId),
            eq(videos.userId, metadata.user.id)
          ));

        if (metadata.previousThumbnailKey && metadata.previousThumbnailKey !== file.key) {
          await new UTApi().deleteFiles(metadata.previousThumbnailKey);
        }
      } catch (error) {
        await new UTApi().deleteFiles(file.key).catch((cleanupError) => {
          console.error("Failed to clean up replacement thumbnail:", cleanupError);
        });
        throw error;
      }

      return { uploadedBy: metadata.user.id };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
