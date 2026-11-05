import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { auth, signIn } from "@/auth";
import { isAdmin } from "@/lib/authz";
import { focus } from "@/lib/ui";

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
    <main className="mx-auto max-w-sm p-8">
      <h1 className="text-2xl font-bold">Admin sign in</h1>
      {error && (
        <p role="alert" className="mt-3 text-red-700">
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
          className={`rounded bg-blue-700 px-4 py-1 text-white ${focus}`}
        >
          Sign in
        </button>
      </form>
    </main>
  );
}
