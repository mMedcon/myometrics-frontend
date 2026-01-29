import NextAuth from "next-auth";
import Auth0Provider from "next-auth/providers/auth0";

export default NextAuth({
  providers: [
    Auth0Provider({
      clientId: process.env.AUTH0_CLIENT_ID,
      clientSecret: process.env.AUTH0_CLIENT_SECRET,
      issuer: process.env.AUTH0_ISSUER_BASE_URL,
      authorization: {
        params: {
          scope: "openid email profile offline_access",
          audience: process.env.AUTH0_API_AUDIENCE || process.env.AUTH0_CLIENT_ID,
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
        token.refreshToken = account.refresh_token;
        token.sub = account.providerAccountId;
      }
      return token;
    },
    async session({ session, token }) {
      // Attach tokens to session for client usage
      (session as any).accessToken = (token as any).accessToken;
      (session as any).idToken = (token as any).idToken;
      (session as any).user.sub = (token as any).sub || session.user?.email;
      return session;
    },
  },
  events: {
    async signIn({ user, account }) {
      if (account?.provider === 'auth0') {
        console.log('User signed in:', user?.email);
      }
    },
  },
});
