import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/review";

let dummy: Promise<string> | undefined;
const dummyHash = () => (dummy ??= bcrypt.hash("not-a-real-password", 12));

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/admin/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const admin = await prisma.admin.findUnique({
          where: { email: parsed.data.email },
        });
        // Compare against a dummy hash when the admin is unknown, so timing
        // doesn't reveal which emails exist.
        const hash = admin?.passwordHash ?? (await dummyHash());
        const ok = await bcrypt.compare(parsed.data.password, hash);
        if (!admin || !ok) return null;
        return { id: admin.id, email: admin.email, role: "admin" };
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
