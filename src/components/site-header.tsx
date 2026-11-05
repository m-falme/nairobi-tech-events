import Link from "next/link";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { SITE_NAME } from "@/lib/site";
import { contentWidth, gutter } from "@/lib/ui";

const ring =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const link = `inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-muted-foreground hover:text-foreground ${ring}`;

/** Sticky public shell: app name, primary nav, theme toggle. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div
        className={`${contentWidth} ${gutter} flex min-h-14 flex-wrap items-center gap-x-4`}
      >
        <Link
          href="/"
          className={`inline-flex min-h-11 shrink-0 items-center font-semibold tracking-tight ${ring}`}
        >
          {SITE_NAME}
        </Link>
        <nav aria-label="Primary" className="flex flex-1 items-center">
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
