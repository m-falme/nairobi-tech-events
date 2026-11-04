import Link from "next/link";
import { requireAdminPage } from "@/lib/admin-session";
import { focus } from "@/lib/ui";
import { logout } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdminPage();
  return (
    <div className="mx-auto max-w-4xl p-8">
      <header className="flex items-center justify-between border-b pb-3">
        <nav aria-label="Admin" className="flex gap-4">
          <Link href="/admin" className={`font-semibold ${focus}`}>
            Review queue
          </Link>
          <Link href="/admin/sources" className={`font-semibold ${focus}`}>
            Sources
          </Link>
        </nav>
        <form action={logout} className="flex items-center gap-3 text-sm">
          <span>{session.user?.email}</span>
          <button type="submit" className={`underline ${focus}`}>
            Sign out
          </button>
        </form>
      </header>
      {children}
    </div>
  );
}
