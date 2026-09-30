"use client";

import { z } from "zod";
import Link from "next/link";
import { toast } from "sonner";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { ErrorBoundary } from "react-error-boundary";
import { zodResolver } from "@hookform/resolvers/zod";
import { CopyCheckIcon, CopyIcon, Globe2Icon, ImagePlusIcon, Loader2Icon, LockIcon, MoreVerticalIcon, RotateCcwIcon, TrashIcon } from "lucide-react";

import { trpc } from "@/trpc/client";
import { copyTextToClipboard } from "@/lib/copy-text-to-clipboard";
import { Input } from "@/components/ui/input";
import { snakeCaseToTitle } from "@/lib/utils";
import { videoUpdateSchema } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormLabel,
  FormMessage,
  FormItem,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useAppOrigin } from "@/hooks/use-app-origin";
import { THUMBNAIL_FALLBACK } from "@/modules/videos/constants";
import { VideoPlayer } from "@/modules/videos/ui/components/video-player";

import { ThumbnailUploadModal } from "../components/thumbnail-upload-modal";

interface FormSectionProps {
  videoId: string;
}

export const FormSection = ({ videoId }: FormSectionProps) => {
  return (
    <Suspense fallback={<FormSectionSkeleton />}>
      <ErrorBoundary fallback={<p>Error</p>}>
        <FormSectionSuspense videoId={videoId} />
      </ErrorBoundary>
    </Suspense>
  );
};

export const FormSectionSkeleton = () => {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex items-center justify-between border-b border-border/70 pb-5">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.58fr)]">
        <div className="space-y-7">
          <div className="space-y-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-55 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-21 w-38.25" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4 overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
            <Skeleton className="aspect-video" />
            <div className="px-4 py-4 space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-32" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-32" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
};

const FormSectionSuspense = ({ videoId }: FormSectionProps) => {
  const router = useRouter();
  const appOrigin = useAppOrigin();
  const utils = trpc.useUtils();

  const [thumbnailModalOpen, setThumbnailModalOpen] = useState(false);

  const [video] = trpc.videos.getOne.useSuspenseQuery({ id: videoId });
  const [categories] = trpc.categories.getMany.useSuspenseQuery();

  const update = trpc.videos.update.useMutation({
    onSuccess: () => {
      utils.studio.getMany.invalidate();
      utils.videos.getOne.invalidate({ id: videoId });
      toast.success("Video updated");
    },
    onError: () => {
      toast.error("Something went wrong");
    },
  });

  const remove = trpc.videos.remove.useMutation({
    onSuccess: () => {
      utils.studio.getMany.invalidate();
      toast.success("Video removed");
      router.push("/studio");
    },
    onError: () => {
      toast.error("Something went wrong");
    },
  });

  const revalidate = trpc.videos.revalidate.useMutation({
    onSuccess: () => {
      utils.studio.getMany.invalidate();
      utils.videos.getOne.invalidate({ id: videoId });
      toast.success("Video revalidated");
    },
    onError: () => {
      toast.error("Something went wrong");
    },
  });

  const restoreThumbnail = trpc.videos.restoreThumbnail.useMutation({
    onSuccess: () => {
      utils.studio.getMany.invalidate();
      utils.videos.getOne.invalidate({ id: videoId });
      toast.success("Thumbnail restored");
    },
    onError: () => {
      toast.error("Something went wrong");
    },
  });

  const form = useForm<z.infer<typeof videoUpdateSchema>>({
    resolver: zodResolver(videoUpdateSchema),
    defaultValues: video,
  });

  const onSubmit = (data: z.infer<typeof videoUpdateSchema>) => {
    update.mutate(data);
  };

  const fullUrl = `${appOrigin}/videos/${videoId}`;
  const [isCopied, setIsCopied] = useState(false);

  const onCopy = async () => {
    await copyTextToClipboard(`${window.location.origin}/videos/${videoId}`);
    setIsCopied(true);

    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  return (
    <>
      <ThumbnailUploadModal
        open={thumbnailModalOpen}
        onOpenChange={setThumbnailModalOpen}
        videoId={videoId}
        onUploaded={() => {
          utils.studio.getMany.invalidate();
          utils.videos.getOne.invalidate({ id: videoId });
        }}
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-center justify-between border-b border-border/70 pb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">Studio workspace</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Video details</h1>
              <p className="mt-1 text-sm text-muted-foreground">Manage how your video appears on Infinideo.</p>
            </div>
            <div className="flex items-center gap-x-2">
              <Button type="submit" className="min-w-20" disabled={update.isPending || !form.formState.isDirty}>
                Save
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<Button variant="ghost" size="icon" />}
                >
                  <MoreVerticalIcon />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => revalidate.mutate({ id: videoId })}>
                    <RotateCcwIcon className="size-4 mr-2" />
                    Revalidate
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => remove.mutate({ id: videoId })}>
                    <TrashIcon className="size-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.58fr)]">
            <div className="space-y-7">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>
                      <div className="flex items-center gap-x-2">
                        <span>Title</span>
                      </div>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Add a title to your video"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>
                    <div className="flex items-center gap-x-2">
                        <span>Description</span>
                      </div>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value ?? ""}
                        rows={9}
                        className="min-h-52 resize-none pr-10"
                        placeholder="Add a description to your video"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="thumbnailUrl"
                control={form.control}
                render={() => (
                  <FormItem className="space-y-2">
                    <FormLabel>Thumbnail</FormLabel>
                    <FormControl>
                      <div className="group relative h-25 w-44.5 overflow-hidden rounded-lg border border-dashed border-border bg-muted/40 p-0.5">
                        <Image
                          src={video.thumbnailUrl || THUMBNAIL_FALLBACK}
                          className="object-cover"
                          fill
                          alt="Thumbnail"
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                type="button"
                                size="icon"
                                className="bg-black/50 hover:bg-black/50 absolute top-1 right-1 rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 duration-300 size-7"
                              />
                            }
                          >
                            <MoreVerticalIcon className="text-white" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" side="right">
                            <DropdownMenuItem onClick={() => setThumbnailModalOpen(true)}>
                              <ImagePlusIcon className="size-4 mr-1" />
                              Change
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => restoreThumbnail.mutate({ id: videoId })}
                            >
                              <RotateCcwIcon className="size-4 mr-1" />
                              Restore
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>
                      Category
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value ?? undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category">
                            {categories.find((category) => category.id === field.value)?.name ?? "All"}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex flex-col gap-8">
              <div className="flex h-fit flex-col gap-4 overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
                <div className="aspect-video overflow-hidden relative">
                  <VideoPlayer
                    playbackId={video.muxPlaybackId}
                    thumbnailUrl={video.thumbnailUrl}
                    status={video.muxStatus}
                  />
                </div>
                <div className="flex flex-col gap-y-6 p-4 sm:p-5">
                  <div className="flex justify-between items-center gap-x-2">
                    <div className="flex flex-col gap-y-1">
                      <p className="text-muted-foreground text-xs">
                        Video link
                      </p>
                      <div className="flex items-center gap-x-2">
                        <Link prefetch href={`/videos/${video.id}`}>
                          <p className="line-clamp-1 text-sm text-secondary hover:underline">
                            {fullUrl}
                          </p>
                        </Link>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="shrink-0"
                          onClick={onCopy}
                          disabled={isCopied}
                        >
                          {isCopied ? <CopyCheckIcon /> : <CopyIcon />}
                        </Button>
                      </div>
                    </div>
                  </div>

                <div className="flex justify-between items-center">
                  <div className="flex flex-col gap-y-1">
                    <p className="text-muted-foreground text-xs">
                      Video status
                    </p>
                    <p className="text-sm font-medium">
                      {snakeCaseToTitle(video.muxStatus || "preparing")}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex flex-col gap-y-1">
                    <p className="text-muted-foreground text-xs">
                      Subtitles status
                    </p>
                    <p className="text-sm font-medium">
                      {snakeCaseToTitle(video.muxTrackStatus || "no_subtitles")}
                    </p>
                  </div>
                </div>

                </div>
              </div>

              <FormField
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>
                      Visibility
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value ?? undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select visibility" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="public">
                          <div className="flex items-center">
                            <Globe2Icon className="size-4 mr-2" />
                            Public
                          </div>
                        </SelectItem>
                        <SelectItem value="private">
                          <div className="flex items-center">
                            <LockIcon className="size-4 mr-2" />
                            Private
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </div>
          </div>
        </form>
      </Form>
    </>
  );
};
