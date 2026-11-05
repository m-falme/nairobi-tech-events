import Link from "next/link";
import { SITE_NAME } from "@/lib/site";
import { contentWidth, focus, gutter } from "@/lib/ui";

/** One-line credit plus a link to where listings come from. */
export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border">
      <p
        className={`${contentWidth} ${gutter} py-6 text-sm text-muted-foreground`}
      >
        {SITE_NAME} · a community board of tech events in Nairobi ·{" "}
        <Link
          href="/sources"
          className={`underline hover:text-foreground ${focus}`}
        >
          Where listings come from
        </Link>
      </p>
    </footer>
  );
}
