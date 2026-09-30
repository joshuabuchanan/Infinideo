import { SearchIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const SearchInput = () => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuery = query.trim();

    router.push(trimmedQuery ? `/search?query=${encodeURIComponent(trimmedQuery)}` : "/search");
  }

  return (
    <form className="mx-auto flex w-full max-w-150 items-center justify-center md:justify-start" onSubmit={handleSubmit}>
      <input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search videos, channels..."
        className={`${mobileSearchOpen ? "flex" : "hidden"} h-10 min-w-0 flex-1 rounded-l-full border border-border bg-card px-4 text-sm text-card-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 md:flex`}
        aria-label="Search videos and channels"
      />

      <button
        type="submit"
        aria-label="Search"
        className={`${mobileSearchOpen ? "flex" : "hidden"} h-10 w-12 shrink-0 items-center justify-center rounded-r-full border border-l-0 border-border bg-muted text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary md:flex`}
      >
        <SearchIcon className="size-5" />
      </button>

      {mobileSearchOpen ? (
        <button
          type="button"
          aria-label="Close search"
          onClick={() => setMobileSearchOpen(false)}
          className="ml-2 flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-muted md:hidden"
        >
          <XIcon className="size-5" />
        </button>
      ) : (
        <button
          type="button"
          aria-label="Open search"
          onClick={() => setMobileSearchOpen(true)}
          className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-muted md:hidden"
        >
          <SearchIcon className="size-5" />
        </button>
      )}
    </form>
  );
};