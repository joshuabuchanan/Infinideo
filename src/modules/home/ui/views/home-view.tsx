import { CategoriesSection } from "../section/catergories-section";
import Feed from "@/components/Feed/Feed";
import Link from "next/link";

interface HomeViewProps {
    categoryId?: string;
    category?: string;
}

export const HomeView = ({ categoryId, category }: HomeViewProps) => {
    return (
        <div className="mx-auto mb-10 flex max-w-[2400px] flex-col gap-y-6 px-4 pt-2.5">
                <CategoriesSection categoryId={categoryId} />
            <Feed category={category} />
            <footer className="mt-10 border-t border-border/70 px-2 py-6 text-sm text-muted-foreground">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <span>© 2026 Infinideo</span>
                    <nav aria-label="Legal and project links" className="flex flex-wrap items-center gap-x-5 gap-y-2">
                        <Link className="hover:text-foreground" href="/privacy">Privacy</Link>
                        <Link className="hover:text-foreground" href="/terms">Terms</Link>
                        <Link className="hover:text-foreground" href="/legal">Legal</Link>
                        <a className="hover:text-foreground" href="https://github.com/joshuabuchanan" target="_blank" rel="noreferrer">GitHub</a>
                    </nav>
                </div>
            </footer>
        </div>
    );
};
