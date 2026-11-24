import "server-only";
import { betterAuth, APIError } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "./db";
import { authConfig } from "./config";

function createAuth() {
  const { secret, origin } = authConfig();
  return betterAuth({
    appName: "Program Compass",
    secret,
    baseURL: origin,
    trustedOrigins: [origin],
    database: prismaAdapter(db(), {
      provider: "postgresql",
      transaction: true,
    }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: 15,
      maxPasswordLength: 128,
      revokeSessionsOnPasswordReset: true,
    },
    session: {
      expiresIn: 8 * 60 * 60,
      updateAge: 8 * 60 * 60,
      disableSessionRefresh: true,
      cookieCache: { enabled: false },
    },
    user: {
      additionalFields: {
        role: {
          type: ["admin", "editor", "viewer"],
          defaultValue: "viewer",
          input: false,
        },
        active: { type: "boolean", defaultValue: true, input: false },
      },
    },
    databaseHooks: {
      session: {
        create: {
          before: async (session) => {
            const user = await db().user.findUnique({
              where: { id: session.userId },
            });
            if (!user?.active)
              throw new APIError("UNAUTHORIZED", {
                message: "Invalid email or password",
              });
            return {
              data: {
                ...session,
                expiresAt: new Date(
                  Math.min(
                    session.expiresAt.getTime(),
                    Date.now() + 8 * 60 * 60 * 1000,
                  ),
                ),
              },
            };
          },
        },
      },
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 60,
      customRules: { "/sign-in/email": { window: 60, max: 5 } },
    },
    advanced: {
      useSecureCookies: origin.startsWith("https://"),
      defaultCookieAttributes: { httpOnly: true, sameSite: "lax", path: "/" },
      ipAddress: {
        ipAddressHeaders: process.env.VERCEL ? ["x-vercel-forwarded-for"] : [],
      },
    },
    logger: { disabled: true },
  });
}

let instance: ReturnType<typeof createAuth> | undefined;
export function auth() {
  return (instance ??= createAuth());
}
