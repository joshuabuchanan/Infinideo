import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex min-h-dvh w-full items-center justify-center bg-white px-3 py-4 sm:px-6 sm:py-8 md:px-8">
      <div className="w-full max-w-[28rem]">
        <SignIn
          appearance={{
            variables: {
              colorPrimary: "#111827",
              borderRadius: "0.75rem",
              fontFamily: "inherit",
            },
            elements: {
              rootBox: "mx-auto w-full max-w-[calc(100vw-1.5rem)] sm:max-w-[22rem] md:max-w-[24rem]",
              cardBox:
                "w-full overflow-hidden border border-slate-200 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.12)] sm:rounded-xl",
            },
          }}
        />
      </div>
    </main>
  );
}
