import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex min-h-dvh w-full items-center justify-center bg-white px-6 py-8">
      <SignIn
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
}
