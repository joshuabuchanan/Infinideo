import { and, eq, isNull, ne, or } from "drizzle-orm";
import { headers } from "next/headers";
import { UTApi } from "uploadthing/server";
import type { BaseWebhookEvent } from "@mux/mux-node/resources/webhooks/webhooks";

import { db } from "@/db";
import { mux } from "@/lib/mux";
import { videos } from "@/db/schema";

const SIGNING_SECRET = process.env.MUX_WEBHOOK_SECRET!;

type MuxWebhookData = {
  id?: string;
  upload_id?: string | null;
  status?: string;
  asset_id?: string;
  duration?: number;
  playback_ids?: Array<{ id?: string }>;
};

type WebhookEvent =
  Omit<BaseWebhookEvent, "data" | "type"> & {
    type:
      | "video.asset.created"
      | "video.asset.ready"
      | "video.asset.errored"
      | "video.asset.track.ready"
      | "video.asset.deleted";
    data: MuxWebhookData;
  };

export const POST = async (request: Request) => {
  if (!SIGNING_SECRET) {
    throw new Error("MUX_WEBHOOK_SECRET is not set");
  }

  const headersPayload = await headers();
  const muxSignature = headersPayload.get("mux-signature");

  if (!muxSignature) {
    return new Response("No signature found", { status: 401 });
  }

  const payload = await request.json();
  const body = JSON.stringify(payload);

  mux.webhooks.verifySignature(
    body,
    {
      "mux-signature": muxSignature,
    },
    SIGNING_SECRET,
  );

  switch (payload.type as WebhookEvent["type"]) {
    case "video.asset.created": {
      const data = payload.data as MuxWebhookData;

      if (!data.upload_id || !data.id) {
        return new Response("No upload or asset ID found", { status: 400 });
      }

      console.log("Creating video: ", { uploadId: data.upload_id });

      await db
        .update(videos)
        .set({
          muxAssetId: data.id,
          muxStatus: data.status,
        })
        .where(and(
          eq(videos.muxUploadId, data.upload_id),
          or(isNull(videos.muxAssetId), eq(videos.muxAssetId, data.id)),
          or(isNull(videos.muxStatus), ne(videos.muxStatus, "ready")),
        ));
      break;
    }

    case "video.asset.ready": {
      const data = payload.data as MuxWebhookData;
      const playbackId = data.playback_ids?.[0]?.id;

      if (!data.upload_id || !data.id) {
        return new Response("Missing upload or asset ID", { status: 400 });
      }

      if (!playbackId) {
        return new Response("Missing playback ID", { status: 400 });
      }

      const tempThumbnailUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg`;
      const tempPreviewUrl = `https://image.mux.com/${playbackId}/animated.gif`;
      const duration = data.duration ? Math.round(data.duration * 1000) : 0;

      const utapi = new UTApi();
      const [
        uploadedThumbnail,
        uploadedPreview,
      ] = await utapi.uploadFilesFromUrl([
        tempThumbnailUrl,
        tempPreviewUrl,
      ]);

      if (!uploadedThumbnail.data || !uploadedPreview.data) {
        console.error("Failed to upload Mux thumbnail or preview", {
          uploadId: data.upload_id,
          thumbnailError: uploadedThumbnail.error,
          previewError: uploadedPreview.error,
        });
        return new Response("Failed to upload thumbnail or preview", { status: 500 });
      }

      const { key: thumbnailKey, url: thumbnailUrl } = uploadedThumbnail.data;
      const { key: previewKey, url: previewUrl } = uploadedPreview.data;

      await db
        .update(videos)
        .set({
          muxStatus: data.status,
          muxPlaybackId: playbackId,
          muxAssetId: data.id,
          thumbnailUrl,
          thumbnailKey,
          previewUrl,
          previewKey,
          duration,
        })
        .where(and(
          eq(videos.muxUploadId, data.upload_id),
          or(isNull(videos.muxAssetId), eq(videos.muxAssetId, data.id)),
        ));
      break;
    }

    case "video.asset.errored": {
      const data = payload.data as MuxWebhookData;

      if (!data.upload_id || !data.id) {
        return new Response("Missing upload or asset ID", { status: 400 });
      }

      await db
        .update(videos)
        .set({
          muxStatus: data.status,
        })
        .where(and(
          eq(videos.muxUploadId, data.upload_id),
          or(isNull(videos.muxAssetId), eq(videos.muxAssetId, data.id)),
          or(isNull(videos.muxStatus), ne(videos.muxStatus, "ready")),
        ));
      break;
    }

    case "video.asset.deleted": {
      const data = payload.data as MuxWebhookData;

      if (!data.upload_id || !data.id) {
        return new Response("Missing upload or asset ID", { status: 400 });
      }

      console.log("Deleting video: ", { uploadId: data.upload_id });

      await db
        .delete(videos)
        .where(and(
          eq(videos.muxUploadId, data.upload_id),
          eq(videos.muxAssetId, data.id),
        ));
      break;
    }

    case "video.asset.track.ready": {
      const data = payload.data as MuxWebhookData & {
        asset_id: string;
      }

      console.log("Track ready");

      // Typescript incorrenctly says that asset_id does not exist
      const assetId = data.asset_id;
      const trackId = data.id;
      const status = data.status;

      if (!assetId || !trackId) {
        return new Response("Missing asset or track ID", { status: 400 });
      }

      await db
        .update(videos)
        .set({
          muxTrackId: trackId,
          muxTrackStatus: status,
        })
        .where(eq(videos.muxAssetId, assetId));
      break;
    }
  }

  return new Response("Webhook received", { status: 200 });
};
