import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { users } from "@/db/schema";
import { HomeLayout } from "@/modules/home/ui/layouts/home-layouts";

export default async function CurrentUserPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, user.id));

  if (existingUser) redirect(`/users/${existingUser.id}`);

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ||
    "Your profile";

  return (
    <HomeLayout>
      <main className="min-h-screen bg-background px-4 py-10 text-foreground md:px-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-purple-500">Profile</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">{displayName}</h1>
            </div>
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
            >
              Back home
            </Link>
          </div>

          <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">
              This is the current user profile route that was previously missing.
            </p>
            {user?.imageUrl ? (
              <img
                src={user.imageUrl}
                alt={displayName}
                className="mt-4 h-20 w-20 rounded-full object-cover"
              />
            ) : null}
          </section>
        </div>
      </main>
    </HomeLayout>
  );
}
