import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { LikedView } from "@/modules/playlists/ui/views/liked-view";
import { HydrateClient } from "@/trpc/server";

export const dynamic = "force-dynamic";

export default async function LikedVideosPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=%2Fliked-videos");

  return (
    <HydrateClient>
      <LikedView />
    </HydrateClient>
  );
}