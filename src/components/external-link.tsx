import type { ReactNode } from "react";
import { EXTERNAL_LINK_PROPS, NEW_TAB_TEXT } from "@/lib/external-link";

/** Outbound link: opens in a new tab and says so to screen readers. */
export function ExternalLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a href={href} {...EXTERNAL_LINK_PROPS} className={className}>
      {children}
      <span className="sr-only">{NEW_TAB_TEXT}</span>
    </a>
  );
}
