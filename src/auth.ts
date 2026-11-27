import { eq, ne } from "drizzle-orm";
import NextAuth, { type DefaultSession } from "next-auth";
import GitHub, { type GitHubProfile } from "next-auth/providers/github";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & { id: string };
  }
}

async function findUserId(githubId: string) {
  const [user] = await db.select({ id: users.id }).from(users)
    .where(eq(users.githubId, githubId)).limit(1);
  return user?.id;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "github") return false;
      const githubId = account.providerAccountId;
      // GitHub users with a hidden email get no user.email; fall back to the
      // noreply address GitHub itself assigns (login@users.noreply.github.com).
      const login = (profile as GitHubProfile | undefined)?.login;
      const email = user.email ?? (login ? `${login}@users.noreply.github.com` : null);

      if (email) {
        try {
          await db.insert(users).values({ githubId, email, plan: "solo" })
            .onConflictDoUpdate({
              target: users.githubId,
              set: { email },
              setWhere: ne(users.email, email),
            });
          return true;
        } catch (error) {
          console.error("Could not upsert GitHub user.", error);
        }
      }

      try {
        return Boolean(await findUserId(githubId));
      } catch (error) {
        console.error("Could not confirm existing GitHub user.", error);
        return false;
      }
    },
    async jwt({ token, account }) {
      if (!account) return token;
      if (account.provider !== "github") return null;

      try {
        const id = await findUserId(account.providerAccountId);
        return id ? { ...token, sub: id } : null;
      } catch (error) {
        console.error("Could not load GitHub user's database ID.", error);
        return null;
      }
    },
    session({ session, token }) {
      return { ...session, user: { ...session.user, id: token.sub! } };
    },
  },
});
