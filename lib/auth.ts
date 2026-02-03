import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// List of approved email addresses that can access the app
const APPROVED_EMAILS = [
  // Add approved Gmail addresses here
  "telmen20050121@gmail.com",
  "telmengaming20050121@gmail.com",
  // You can add more emails as needed
];

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Check if the user's email is in the approved list
      const email = user.email?.toLowerCase();
      if (!email) return false;
      
      // Allow all emails if no approved emails are configured (for development)
      if (APPROVED_EMAILS.length === 1 && APPROVED_EMAILS[0] === "example@gmail.com") {
        return true;
      }
      
      return APPROVED_EMAILS.map(e => e.toLowerCase()).includes(email);
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
};
