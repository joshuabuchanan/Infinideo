"use client";

import { SignUp, useAuth, useClerk, useSignUp } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function SignUpPage() {
    const { isLoaded, isSignedIn } = useAuth();
    const { signOut } = useClerk();
    const { signUp } = useSignUp();
    const [oauthError, setOauthError] = useState<string | null>(null);
    const [isStartingOauth, setIsStartingOauth] = useState(false);

    if (!isLoaded) {
        return <main className="min-h-dvh bg-white" />;
    }

    if (isSignedIn) {
        return (
            <main className="flex min-h-dvh w-full items-center justify-center bg-white px-6 py-8">
                <section className="w-full max-w-88 rounded-xl border border-slate-200 bg-white p-6 text-center shadow-[0_8px_28px_rgba(15,23,42,0.12)]">
                    <h1 className="text-xl font-semibold text-slate-900">Already signed in</h1>
                    <p className="mt-2 text-sm text-slate-600">
                        Sign out of the current account to create another one.
                    </p>
                    <Button
                        type="button"
                        className="mt-6 w-full bg-slate-900 text-white hover:bg-slate-800"
                        onClick={() => void signOut({ redirectUrl: "/sign-up" })}
                    >
                        Sign out and create another account
                    </Button>
                </section>
            </main>
        );
    }

    async function continueWithAnotherGmail() {
        setOauthError(null);
        setIsStartingOauth(true);

        try {
            const { error } = await signUp.sso({
                strategy: "oauth_google",
                redirectUrl: new URL("/", window.location.origin).toString(),
                redirectCallbackUrl: new URL(
                    "/sign-up/sso-callback",
                    window.location.origin,
                ).toString(),
                oidcPrompt: "select_account",
            });

            if (error) {
                setOauthError(error.message);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unable to start Google sign-up.";
            setOauthError(
                message.includes("Unexpected token '<'")
                    ? `Clerk returned an invalid response for ${window.location.origin}. Check this origin in Clerk and allow access to Clerk authentication services on this network.`
                    : message,
            );
        } finally {
            setIsStartingOauth(false);
        }
    }

    return (
        <main className="flex min-h-dvh w-full items-center justify-center bg-white px-6 py-8">
            <div className="relative mx-auto w-full max-w-100 [&_.cl-socialButtonsBlockButton]:hidden! [&_.cl-socialButtonsRoot]:hidden!">
                <Button
                    type="button"
                    disabled={isStartingOauth}
                    className="absolute left-1/2 top-22 z-10 h-10 w-[calc(100%-3rem)] -translate-x-1/2 justify-center bg-white text-center text-slate-900 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
                    onClick={() => void continueWithAnotherGmail()}
                >
                    {isStartingOauth ? "Opening Google..." : "Continue with another Gmail"}
                </Button>
                {oauthError && (
                    <p className="absolute left-6 right-6 top-34 z-10 text-center text-sm text-red-600">
                        {oauthError}
                    </p>
                )}
                <SignUp
                    appearance={{
                        elements: {
                            socialButtonsRoot: "hidden",
                            socialButtonsBlockButton: "hidden",
                        },
                    }}
                />
            </div>
        </main>
    );
}
