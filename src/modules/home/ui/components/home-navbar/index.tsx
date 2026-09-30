"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { AuthButton } from "@/modules/auth/ui/components/auth-button";
import { SearchInput } from "./search-input";
import { Bell, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeSlider } from "@/components/theme-slider";

export const HomeNavbar = () => {
  const { isSignedIn } = useAuth();

  return (
    <nav className="futuristic-nav pointer-events-auto fixed inset-x-0 top-0 z-50 h-35 border-b border-primary/20 bg-background/90 backdrop-blur-md sm:h-32 lg:h-20">
      <div className="grid h-full grid-cols-[minmax(0,1fr)_auto] grid-rows-[40px_36px_40px] items-center gap-x-2 gap-y-1 px-3 py-2 sm:grid-rows-[36px_32px_40px] sm:px-4 sm:py-1.5 lg:flex lg:gap-4 lg:px-6 lg:py-0">
        <div className="col-start-1 row-start-1 flex min-w-0 shrink-0 items-center gap-1 sm:gap-2 lg:col-auto lg:row-auto lg:gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center sm:w-9">
            <SidebarTrigger className="h-8 w-8 p-0 text-foreground hover:bg-muted" />
          </div>

          <Link
            href="/"
            className="pointer-events-auto flex min-w-0 items-center gap-1 rounded-lg border border-transparent px-1 py-0 transition-colors hover:border-primary/20 hover:bg-muted/60 sm:gap-2"
          >
            <div className="pointer-events-none relative h-9 w-12 shrink-0 overflow-hidden sm:h-10 sm:w-14 lg:h-12 lg:w-16">
              <Image
                src="/logo-navbar.png"
                alt="Infinideo Logo"
                width={120}
                height={80}
                unoptimized
                className="logo-neon-mark h-full w-full object-contain"
              />
            </div>

            <span className="logo-neon-text pointer-events-none inline-flex whitespace-nowrap text-xs font-black italic leading-none text-primary sm:text-xl sm:tracking-wider">
              <span className="text-primary">Infini</span>
              <span className="text-secondary">deo</span>
            </span>
          </Link>
        </div>

        <div className="col-span-2 row-start-3 w-full sm:mx-auto sm:max-w-2xl lg:order-2 lg:row-auto lg:flex-1 lg:max-w-2xl">
          <SearchInput />
        </div>

        <div className="col-span-2 row-start-2 flex items-center justify-center gap-2 sm:gap-3 lg:order-3 lg:row-auto lg:ml-auto">
          {isSignedIn && (
            <Button
              render={<Link href="/studio" aria-label="Upload video" title="Upload video" />}
              nativeButton={false}
              variant="ghost"
              size="sm"
              className="h-9 gap-2 px-2 text-primary hover:bg-primary/10 hover:text-primary sm:px-3"
            >
              <Upload className="size-4" />
              <span className="hidden sm:inline">Upload</span>
            </Button>
          )}

          <ThemeSlider />

          {isSignedIn && (
            <details className="group sm:relative">
              <summary
                aria-label="Notifications"
                title="Notifications"
                className="flex size-9 cursor-pointer list-none items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted hover:text-accent [&::-webkit-details-marker]:hidden"
              >
                <Bell className="size-5" />
                <span className="sr-only">Notifications</span>
              </summary>
              <div className="fixed right-2 top-24 z-50 w-64 rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-xl sm:absolute sm:right-0 sm:top-full sm:mt-2">
                <p className="text-sm font-semibold">Notifications</p>
                <p className="mt-2 text-sm text-muted-foreground">Notifications are not available yet.</p>
                <Link
                  href="/subscriptions"
                  className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
                >
                  Manage subscriptions
                </Link>
              </div>
            </details>
          )}
        </div>

        <div className="col-start-2 row-start-1 flex shrink-0 items-center justify-end lg:order-4 lg:row-auto">
          <AuthButton />
        </div>
      </div>
    </nav>
  );
};