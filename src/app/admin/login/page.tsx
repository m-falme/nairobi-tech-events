import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { auth, signIn } from "@/auth";
import { isAdmin } from "@/lib/authz";
import { focus, shell } from "@/lib/ui";
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
  const input = `mt-1 w-full rounded border px-2 py-1 ${focus}`;
  return (
    <main className={cn(shell, "max-w-sm")}>
      <h1 className="text-2xl font-bold tracking-tight">Admin sign in</h1>
      {error && (
        <p role="alert" className="mt-3 text-destructive">
          Sign-in failed. Check your details or try again later.
        </p>
      )}
      <form action={login} className="mt-4 grid gap-3">
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
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
          <label htmlFor="password" className="block text-sm font-medium">
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
        <button
          type="submit"
          className={`rounded bg-primary px-4 py-1 text-primary-foreground ${focus}`}
        >
          Sign in
        </button>
      </form>
    </main>
  );
}
