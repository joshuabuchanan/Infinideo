import { Button } from "@/components/ui/button";

export default function Navbar() {
  return (
    <nav className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <h1 className="font-bold text-xl">
          Infinideo
        </h1>

        <Button>Sign In</Button>
      </div>
    </nav>
  );
}