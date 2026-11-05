import Link from "next/link";
import { requireAdminPage } from "@/lib/admin-session";
import { focus, shell } from "@/lib/ui";
import { logout } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdminPage();
  return (
    <div className={shell}>
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <nav aria-label="Admin" className="flex flex-wrap gap-1">
          <Link
            href="/admin"
            className={`inline-flex min-h-11 items-center rounded-md px-3 font-semibold hover:bg-accent ${focus}`}
          >
            Review queue
          </Link>
          <Link
            href="/admin/sources"
            className={`inline-flex min-h-11 items-center rounded-md px-3 font-semibold hover:bg-accent ${focus}`}
          >
            Sources
          </Link>
        </nav>
        <form action={logout} className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">{session.user?.email}</span>
          <button
            type="submit"
            className={`inline-flex min-h-11 items-center px-2 underline ${focus}`}
          >
            Sign out
          </button>
        </form>
      </header>
      {children}
    </div>
  );
}
