"use client";

import { SignIn, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { HomeLayout } from "@/modules/home/ui/layouts/home-layouts";

export const ProtectedPage = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const [localUser, setLocalUser] = useState<{
    name: string;
    imageUrl?: string;
    dbId?: string | null;
    clerkId?: string;
    isSynced?: boolean;
  } | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;

    fetch("/api/user/me")
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (data?.ok && data.user) {
          setLocalUser(data.user);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch synced user:", error);
      });
  }, [isLoaded, isSignedIn, user]);

  if (!isLoaded) {
    return <main className="min-h-dvh w-full bg-white" />;
  }

  if (isSignedIn) {
    const displayName = localUser?.name || user.firstName || "User";
    const userCreatedSuccessfully = localUser?.isSynced === true || !!localUser?.dbId;

    return (
      <HomeLayout>
        <main className="min-h-screen bg-background px-4 py-10 text-foreground md:px-8">
          <div className="mx-auto max-w-6xl space-y-8">
            <header>
              <p className="text-sm font-medium text-purple-500">Protected area</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">
                Welcome back{displayName ? `, ${displayName}` : ""}
              </h1>
              <p className="mt-2 text-muted-foreground">
                Your Infinideo experience is ready.
              </p>
            </header>

            <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <p className="text-sm font-semibold">
                  {userCreatedSuccessfully ? "User created successfully" : "User signed in successfully"}
                </p>
              </div>
              <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-200">
                {userCreatedSuccessfully
                  ? "Clerk auth and Drizzle user sync both succeeded."
                  : "Clerk is active; waiting for the local Drizzle record to finish syncing."}
              </p>
            </section>

            {localUser && (
              <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Synced user IDs
                </p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Clerk user ID</p>
                    <p className="mt-1 break-all font-mono text-sm">{localUser.clerkId ?? user.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Drizzle user ID</p>
                    <p className="mt-1 break-all font-mono text-sm">
                      {localUser.dbId ?? "Not synced yet"}
                    </p>
                  </div>
                </div>
              </section>
            )}

            <section className="grid gap-4 md:grid-cols-3">
              {[
                ["Continue watching", "Pick up where you left off"],
                ["Your library", "Videos saved for later"],
                ["Subscriptions", "Latest from your channels"],
              ].map(([title, description]) => (
                <div
                  key={title}
                  className="rounded-xl border border-border bg-card p-5 shadow-sm"
                >
                  <h2 className="font-semibold">{title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{description}</p>
                </div>
              ))}
            </section>
          </div>
        </main>
      </HomeLayout>
    );
  }

  return (
    <main className="flex min-h-dvh w-full items-center justify-center bg-white px-6 py-8">
      <SignIn
        routing="hash"
        appearance={{
          variables: {
            colorPrimary: "#111827",
            borderRadius: "0.75rem",
            fontFamily: "inherit",
          },
          elements: {
            rootBox: "w-full max-w-[22rem]",
            cardBox: "w-full border border-slate-200 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.12)]",
          },
        }}
      />
    </main>
  );
};