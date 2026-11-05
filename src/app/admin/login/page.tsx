import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { auth, signIn } from "@/auth";
import { isAdmin } from "@/lib/authz";
import {
  alertError,
  btnPrimary,
  input,
  label,
  pageTitle,
  shell,
} from "@/lib/ui";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function login(fd: FormData) {
  "use server";
  try {
    await signIn("credentials", {
      email: fd.get("email"),
      password: fd.get("password"),
      redirectTo: "/admin",
    });
  } catch (e) {
    if (e instanceof AuthError) redirect("/admin/login?error=1");
    throw e;
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (isAdmin(await auth())) redirect("/admin");
  const { error } = await searchParams;
  return (
    <main className={cn(shell, "max-w-sm")}>
      <h1 className={pageTitle}>Admin sign in</h1>
      {error && (
        <p role="alert" className={`mt-3 ${alertError}`}>
          Sign-in failed. Check your details or try again later.
        </p>
      )}
      <form
        action={login}
        className="mt-4 grid gap-4 rounded-lg border border-border bg-card p-4"
      >
        <div>
          <label htmlFor="email" className={label}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            className={input}
          />
        </div>
        <div>
          <label htmlFor="password" className={label}>
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className={input}
          />
        </div>
        <button type="submit" className={btnPrimary}>
          Sign in
        </button>
      </form>
    </main>
  );
}
