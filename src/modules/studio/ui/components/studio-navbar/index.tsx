"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { AuthButton } from "@/modules/auth/ui/components/auth-button";
import { SearchInput } from "./search-input";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeSlider } from "@/components/theme-slider";

export const StudioNavbar = () => {
  const { isSignedIn } = useAuth();

  return (
    <nav className="futuristic-nav fixed top-0 left-0 right-0 z-50 h-20 border-b border-primary/20 bg-background/90 backdrop-blur-md pointer-events-auto">
      <div className="flex h-full items-center gap-3 pl-0 pr-2 sm:gap-4 md:pr-6">
        {/* Left side - Menu + Logo */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center sm:w-9">
            <SidebarTrigger className="h-8 w-8 p-0 text-foreground hover:bg-muted" />
          </div>

          <Link
            href="/"
            className="flex min-w-0 items-center gap-1 rounded-lg border border-transparent px-1 py-0 transition-colors pointer-events-auto hover:border-primary/20 hover:bg-muted/60 sm:gap-2"
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

        {/* Center - Search */}
        <div className="flex min-w-10 flex-1 justify-center md:mx-auto md:block md:max-w-2xl">
          <SearchInput />
        </div>

        {/* Right side - Upload, Notifications, Profile */}
        <div className="flex items-center gap-2 md:gap-4 ml-auto">
          {isSignedIn && (
            <Button
              variant="ghost"
              size="sm"
              className="hidden gap-2 text-primary hover:bg-primary/10 hover:text-primary sm:flex"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>Upload</span>
            </Button>
          )}

          <ThemeSlider />

          {isSignedIn && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Notifications"
              className="relative text-foreground hover:bg-muted hover:text-accent"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500"></span>
            </Button>
          )}

        </div>

        <div className="shrink-0 items-center flex gap-4">
          <AuthButton />
        </div>
      </div>
    </nav>
  );
};