import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAdmin } from "./authz";

/** For pages: redirect to the login page unless signed in as admin. */
export async function requireAdminPage() {
  const session = await auth();
  if (!isAdmin(session)) redirect("/admin/login");
  return session!;
}
