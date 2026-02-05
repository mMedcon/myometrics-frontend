import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, account, user }) {
      if (account) {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
        token.refreshToken = account.refresh_token;
        token.sub = account.providerAccountId;
        
        // Store user info from first login
        if (user) {
          token.name = user.name;
          token.email = user.email;
          token.picture = user.image;
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Attach tokens and provider info to session
      (session as any).accessToken = (token as any).accessToken;
      (session as any).idToken = (token as any).idToken;
      (session as any).provider = (token as any).provider;
      (session as any).user.sub = (token as any).sub || session.user?.email;
      
      // Ensure user info is available
      if (session.user && token.name) {
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = token.picture as string;
      }
      
      return session;
    },
  },
  events: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        console.log('Google user signed in:', user?.email);
      } else if (account?.provider === 'auth0') {
        console.log('Auth0 user signed in:', user?.email);
      }
    },
  },
});
