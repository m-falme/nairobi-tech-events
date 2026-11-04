import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { assertAdmin, isAdmin } from "./authz";

/** For pages: redirect to the login page unless signed in as admin. */
export async function requireAdminPage() {
  const session = await auth();
  if (!isAdmin(session)) redirect("/admin/login");
  return session!;
}

/** For server actions: re-check the session and throw if not admin. */
export async function requireAdminAction() {
  const session = await auth();
  assertAdmin(session);
  return session!;
}
