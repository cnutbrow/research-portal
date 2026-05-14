import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";

const DEV_ACCOUNTS = [
  { email: "faculty@cmu.edu" },
  { email: "student@andrew.cmu.edu" },
];

export const authOptions: NextAuthOptions = {
  providers: [
    // CMU SSO (Shibboleth/SAML) — to be configured with CMU IT

    // Dev-only bypass — compiled out in production
    ...(process.env.NODE_ENV !== "production"
      ? [
          CredentialsProvider({
            id: "dev-bypass",
            name: "Dev Bypass",
            credentials: { email: { label: "Email", type: "email" } },
            async authorize(credentials) {
              if (!credentials?.email) return null;
              const allowed = DEV_ACCOUNTS.find(a => a.email === credentials.email);
              if (!allowed) return null;
              const user = await prisma.user.findUnique({ where: { email: credentials.email } });
              if (!user) return null;
              return { id: user.id, email: user.email, name: user.name, role: user.role };
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: string }).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role: string; id: string }).role = token.role as string;
        (session.user as { id: string }).id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};
