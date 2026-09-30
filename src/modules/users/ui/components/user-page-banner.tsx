"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { PencilIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BannerUploadModal } from "./banner-upload-modal";
import { UserGetOneOutput } from "../types";

interface UserPageBannerProps {
  user: UserGetOneOutput;
}

export const UserPageBanner = ({ user }: UserPageBannerProps) => {
  const { userId } = useAuth();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const isOwner = user.clerkId === userId;

  return (
    <div className="relative h-40 overflow-hidden rounded-xl bg-muted sm:h-56">
      {user.bannerUrl ? (
        <img src={user.bannerUrl} alt={`${user.name} banner`} className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full bg-linear-to-r from-slate-800 via-slate-600 to-slate-400" />
      )}
      {isOwner && (
        <Button
          type="button"
          variant="secondary"
          size="icon-sm"
          aria-label="Edit banner"
          title="Edit banner"
          onClick={() => setIsUploadModalOpen(true)}
          className="absolute right-3 top-3 z-10 rounded-full bg-background/80 shadow-sm backdrop-blur-sm hover:bg-background"
        >
          <PencilIcon />
        </Button>
      )}
      <BannerUploadModal
        userId={user.id}
        open={isUploadModalOpen}
        onOpenChange={setIsUploadModalOpen}
      />
    </div>
  );
};

export const UserPageBannerSkeleton = () => {
  return <Skeleton className="h-40 w-full rounded-xl sm:h-56" />;
};
