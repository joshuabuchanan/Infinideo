"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CheckIcon, EllipsisVerticalIcon, ImagePlusIcon, Loader2Icon, RotateCcwIcon, SaveIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { VideoGetOneOutput } from "@/modules/videos/types";
import { THUMBNAIL_FALLBACK } from "@/modules/videos/constants";

import { ThumbnailUploadModal } from "./thumbnail-upload-modal";

interface VideoFormProps {
  video: VideoGetOneOutput;
}

export const VideoFormSkeleton = () => {
  return (
    <div className="mt-8 rounded-xl border bg-card p-5 sm:p-6">
      <div className="mb-6 space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-6 w-40" />
      </div>
      <div className="grid gap-5">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-28 w-full" />
        <div className="grid gap-5 sm:grid-cols-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="flex justify-end border-t pt-5">
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
    </div>
  );
};

export const VideoForm = ({ video }: VideoFormProps) => {
  const { userId } = useAuth();
  const router = useRouter();
  const utils = trpc.useUtils();
  const [title, setTitle] = useState(video.title);
  const [description, setDescription] = useState(video.description || "");
  const [categoryId, setCategoryId] = useState(video.categoryId || "uncategorized");
  const [visibility, setVisibility] = useState(video.visibility);
  const previousVideo = useRef(video);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [thumbnailModalOpen, setThumbnailModalOpen] = useState(false);

  const [categories] = trpc.categories.getMany.useSuspenseQuery();
  const update = trpc.videos.update.useMutation({
    onSuccess: () => {
      toast.success("Video details saved");
      utils.videos.getOne.invalidate({ id: video.id });
      utils.studio.getMany.invalidate();
    },
    onError: () => {
      toast.error("Could not save video details");
    },
  });
  const remove = trpc.videos.remove.useMutation({
    onSuccess: () => {
      utils.studio.getMany.invalidate();
      toast.success("Video removed");
      router.push("/studio");
    },
    onError: () => {
      toast.error("Could not delete video");
    },
  });
  const restoreThumbnail = trpc.videos.restoreThumbnail.useMutation({
    onSuccess: () => {
      utils.studio.getMany.invalidate();
      utils.videos.getOne.invalidate({ id: video.id });
      toast.success("Thumbnail restored");
    },
    onError: () => toast.error("Could not restore thumbnail"),
  });
  useEffect(() => {
    const previous = previousVideo.current;
    setTitle((current) => current === previous.title ? video.title : current);
    setDescription((current) => current === (previous.description || "") ? video.description || "" : current);
    setCategoryId((current) => current === (previous.categoryId || "uncategorized") ? video.categoryId || "uncategorized" : current);
    setVisibility((current) => current === previous.visibility ? video.visibility : current);
    previousVideo.current = video;
  }, [video]);

  if (userId !== video.user.clerkId) {
    return null;
  }

  const isDirty =
    title !== video.title ||
    description !== (video.description || "") ||
    categoryId !== (video.categoryId || "uncategorized") ||
    visibility !== video.visibility;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    update.mutate({
      id: video.id,
      title: title.trim(),
      description: description.trim() || null,
      categoryId: categoryId === "uncategorized" ? null : categoryId,
      visibility,
    });
  };

  return (
    <>
      <ThumbnailUploadModal
        open={thumbnailModalOpen}
        onOpenChange={setThumbnailModalOpen}
        videoId={video.id}
        onUploaded={() => {
          utils.studio.getMany.invalidate();
          utils.videos.getOne.invalidate({ id: video.id });
        }}
      />
    <form onSubmit={handleSubmit} className="mt-8 rounded-2xl border border-border/80 bg-card/80 p-5 shadow-sm sm:p-7">
      <div className="mb-7 flex items-start justify-between gap-4 border-b border-border/70 pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">Video details</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">Edit your video</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden rounded-full border border-border bg-background px-3 py-1 text-[11px] font-medium text-muted-foreground sm:inline-flex">
            Draft settings
          </span>
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button type="button" variant="ghost" size="icon" aria-label="More video actions" />
                }
              >
                <EllipsisVerticalIcon />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2Icon className="size-4" />
                  Delete video
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this video?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes “{video.title}” and cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  type="button"
                  variant="destructive"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate({ id: video.id })}
                >
                  {remove.isPending && <Loader2Icon className="animate-spin" />}
                  {remove.isPending ? "Deleting" : "Delete video"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="grid gap-2.5">
          <Label htmlFor="video-title">Title</Label>
          <Input
            id="video-title"
            className="h-11 bg-background/60"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={120}
            required
          />
        </div>

        <div className="grid gap-2.5">
          <Label>Thumbnail</Label>
          <div className="group relative h-28 w-48 overflow-hidden rounded-lg border border-dashed border-border bg-muted/40 p-0.5">
            <Image
              src={video.thumbnailUrl || THUMBNAIL_FALLBACK}
              fill
              className="h-full w-full object-cover"
              alt="Video thumbnail"
            />
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    size="icon"
                    className="absolute right-2 top-2 size-7 bg-black/60 text-white hover:bg-black/75"
                    aria-label="Thumbnail actions"
                  />
                }
              >
                <EllipsisVerticalIcon />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="right">
                <DropdownMenuItem onClick={() => setThumbnailModalOpen(true)}>
                  <ImagePlusIcon />
                  Change
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={restoreThumbnail.isPending}
                  onClick={() => restoreThumbnail.mutate({ id: video.id })}
                >
                  <RotateCcwIcon />
                  {restoreThumbnail.isPending ? "Restoring" : "Restore"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid gap-2.5">
          <Label htmlFor="video-description">Description</Label>
          <Textarea
            id="video-description"
            className="min-h-36 resize-y bg-background/60"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Tell viewers what this video is about"
            rows={5}
            maxLength={5000}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="grid gap-2.5">
            <Label htmlFor="video-category">Category</Label>
            <Select value={categoryId} onValueChange={(value) => setCategoryId(String(value))}>
              <SelectTrigger id="video-category" className="h-11 w-full bg-background/60">
                <SelectValue placeholder="Choose a category">
                  {categoryId === "uncategorized"
                    ? "Uncategorized"
                    : categories.find((category) => category.id === categoryId)?.name ?? "All"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uncategorized">Uncategorized</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2.5">
            <Label htmlFor="video-visibility">Visibility</Label>
            <Select value={visibility} onValueChange={(value) => setVisibility(value as typeof visibility)}>
              <SelectTrigger id="video-visibility" className="h-11 w-full bg-background/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="public">Public</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-border/70 pt-5 sm:flex-row sm:items-center sm:justify-end">
          <p className="text-xs text-muted-foreground sm:mr-auto">Changes are saved to your video details.</p>
          <Button type="submit" className="sm:min-w-36" disabled={!isDirty || !title.trim() || update.isPending}>
            {update.isPending ? <Loader2Icon className="animate-spin" /> : update.isSuccess ? <CheckIcon /> : <SaveIcon />}
            {update.isPending ? "Saving" : "Save changes"}
          </Button>
        </div>
      </div>
    </form>
    </>
  );
};
