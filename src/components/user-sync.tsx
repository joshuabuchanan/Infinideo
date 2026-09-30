"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

export function UserSync() {
  const { isLoaded, isSignedIn, user } = useUser();
  const syncedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) {
      return;
    }

    if (syncedUserIdRef.current === user.id) {
      return;
    }

    fetch("/api/user/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })
      .then((response) => {
        if (response.status === 401 || response.status === 404) {
          return;
        }

        if (!response.ok) {
          throw new Error(`User sync failed with status ${response.status}`);
        }

        syncedUserIdRef.current = user.id;
      })
      .catch((error) => {
        console.error("Failed to sync user:", error);
      });
  }, [isLoaded, isSignedIn, user]);

  return null;
}
