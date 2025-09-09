import NextAuth from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import EmailProvider from "next-auth/providers/email";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
      // For development, we'll use a simple console-based transport
      sendVerificationRequest: async ({ identifier: email, url, provider }) => {
        console.log("=== EMAIL VERIFICATION REQUEST ===");
        console.log("Email:", email);
        console.log("Verification URL:", url);
        console.log("==================================");
        
        // In development, we'll just log to console
        if (process.env.NODE_ENV === "development") {
          console.log("📧 Development mode - Email verification link:");
          console.log(url);
          return;
        }

        // For production, you would implement actual email sending here
        // This is a placeholder for production email sending
        try {
          // Example: Use nodemailer, SendGrid, or another email service
          console.log(`Email would be sent to ${email} with verification link: ${url}`);
        } catch (error) {
          console.error("Error sending verification email:", error);
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    /**
     * JWT callback - called whenever a JWT is created or updated
     */
    async jwt({ token, user }) {
      // Persist the user ID and role from the database into the token
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
      }
      return token;
    },

    /**
     * Session callback - called whenever a session is checked
     */
    async session({ session, token }) {
      // Send properties to the client
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as string;
      }
      return session;
    },

    /**
     * Redirect callback - called after successful sign-in
     */
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      // Default to dashboard
      return baseUrl;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
    newUser: "/auth/new-user",
  },
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST, authOptions };