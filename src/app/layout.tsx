import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { Toaster } from "sonner";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";

import { ourFileRouter } from "@/app/api/uploadthing/core";
import { AnalyticsConsent } from "@/components/analytics-consent";
import { ThemeProvider } from "@/components/ThemeProvider";
import { UserSync } from "@/components/user-sync";
import { TRPCReactProvider } from "@/trpc/client";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

async function UploadThingSSR() {
  await connection();

  return <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />;
}

export const metadata: Metadata = {
  title: "Infinideo",
  description: "A video discovery and creator platform with short-form clips, streaming, and community tools.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider
      afterSignOutUrl="/"
      localization={{
        signIn: {
          start: {
            title: "Sign in to Infinideo",
          },
        },
      }}
    >
      <html lang="en" className="dark" suppressHydrationWarning>
        <body className="bg-background text-foreground transition-colors">
          <TRPCReactProvider>
            <ThemeProvider>
              <Suspense>
                <UploadThingSSR />
              </Suspense>
              <UserSync />
              <AnalyticsConsent />
              <Toaster position="bottom-right" richColors closeButton />
              {children}
            </ThemeProvider>
          </TRPCReactProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
