import Link from "next/link";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { SITE_NAME } from "@/lib/site";
import { cn } from "@/lib/utils";

const link =
  "rounded-md px-2 py-1 text-sm font-medium text-foreground/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** Sticky public shell: app name, primary nav, theme toggle. */
export function SiteHeader() {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
      )}
    >
      <div className="mx-auto flex h-12 max-w-[1100px] items-center gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="shrink-0 text-sm font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {SITE_NAME}
        </Link>
        <nav aria-label="Primary" className="flex flex-1 items-center gap-1">
          <Link href="/" className={link}>
            Events
          </Link>
          <Link href="/submit" className={link}>
            Submit
          </Link>
          <Link href="/sources" className={link}>
            Sources
          </Link>
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
