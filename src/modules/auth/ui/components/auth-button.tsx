"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UserButton, useAuth, useClerk } from "@clerk/nextjs";
import {
  ArrowLeftRight,
  ClapperboardIcon,
  UserCircleIcon,
  UserIcon,
} from "lucide-react";

export function AuthButton() {
  const { signOut } = useClerk();
  const { isSignedIn } = useAuth();

  function useAnotherAccount() {
    void signOut({ redirectUrl: "/sign-in" });
  }

  return (
    <>
      {isSignedIn ? (
        <UserButton>
          <UserButton.MenuItems>
            <UserButton.Link
              label="My profile"
              href="/users/current"
              labelIcon={<UserIcon className="size-4" />}
            />
            <UserButton.Link
              label="Studio"
              href="/studio"
              labelIcon={<ClapperboardIcon className="size-4" />}
            />
            <UserButton.Action
              label="Manage account"
              labelIcon={<UserCircleIcon className="size-4" />}
              open="manage-account"
            />
            <UserButton.Action
              label="Use another Gmail account"
              labelIcon={<ArrowLeftRight className="h-4 w-4" />}
              onClick={useAnotherAccount}
            />
          </UserButton.MenuItems>
        </UserButton>
      ) : null}

      {!isSignedIn ? (
          <Button
            render={<Link href="/sign-in" aria-label="Sign in" />}
            nativeButton={false}
            variant="outline"
            size="default"
            className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-white px-4 py-2 text-sm font-medium text-blue-600 shadow-none transition hover:text-blue-500"
          >
            <UserCircleIcon className="h-4 w-4" />
            <span>Sign in</span>
          </Button>
      ) : null}
    </>
  );
}