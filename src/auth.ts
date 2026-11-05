import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import { limitedLogin, type LoginLimitDb } from "@/lib/login-rate-limit";
import { loginSchema } from "@/lib/review";
import { clientIp, hashIp, ipSalt } from "@/lib/submissions";

let dummy: Promise<string> | undefined;
const dummyHash = () => (dummy ??= bcrypt.hash("not-a-real-password", 12));

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/admin/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw, request) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const ipHash = hashIp(clientIp(request.headers), ipSalt());
        let admin: { id: string; email: string } | null = null;
        // Max 5 failed sign-ins per IP hash per 15 minutes. Blocked attempts
        // get the same generic error as a wrong password.
        const ok = await limitedLogin({
          db: prisma as unknown as LoginLimitDb,
          ipHash,
          now: new Date(),
          verify: async () => {
            const found = await prisma.admin.findUnique({
              where: { email: parsed.data.email },
            });
            // Compare against a dummy hash when the admin is unknown, so
            // timing doesn't reveal which emails exist.
            const hash = found?.passwordHash ?? (await dummyHash());
            const match = await bcrypt.compare(parsed.data.password, hash);
            if (!found || !match) return false;
            admin = found;
            return true;
          },
        });
        if (!ok || !admin) return null;
        const a = admin as { id: string; email: string };
        return { id: a.id, email: a.email, role: "admin" };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.role = "admin";
      return token;
    },
    session({ session, token }) {
      if (session.user) session.user.role = token.role as string | undefined;
      return session;
    },
  },
});
