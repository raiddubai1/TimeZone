import NextAuth, { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Extended user type to include database fields
   */
  interface User {
    id: string;
    email: string;
    name?: string | null;
    emailVerified?: Date | null;
    image?: string | null;
    role: string;
    createdAt: Date;
    updatedAt: Date;
  }

  /**
   * Extended session type to include user ID and other fields
   */
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  /**
   * Extended JWT type to include user information
   */
  interface JWT {
    id: string;
    email: string;
    name?: string | null;
    role: string;
  }
}

declare module "next-auth/providers/email" {
  /**
   * Extended EmailProvider options
   */
  interface EmailConfig {
    server?: {
      host: string;
      port: string;
      auth: {
        user: string;
        pass: string;
      };
    };
    from: string;
    sendVerificationRequest: (params: {
      identifier: string;
      url: string;
      provider: any;
    }) => Promise<void>;
  }
}