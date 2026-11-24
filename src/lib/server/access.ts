import "server-only";
import { authenticationDisabled } from "@/lib/auth-mode";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { db } from "./db";
import { permits, type Permission } from "@/lib/permissions";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function currentUser(requestHeaders: Headers) {
  if (authenticationDisabled)
    return {
      id: null,
      name: "Unauthenticated visitor",
      email: "",
      role: "admin" as const,
      active: true,
    };
  const session = await auth().api.getSession({
    headers: requestHeaders,
    query: { disableCookieCache: true },
  });
  if (!session || new Date(session.session.expiresAt) <= new Date())
    return null;
  // Always read the account: no stale role/activation claims from cookie caches.
  const user = await db().user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
    },
  });
  return user?.active ? user : null;
}

export async function requireUser(
  requestHeaders: Headers,
  permission: Permission = "read",
) {
  const user = await currentUser(requestHeaders);
  if (!user) throw new HttpError(401, "Authentication required");
  if (!permits(user.role, permission))
    throw new HttpError(403, "Access denied");
  return user;
}

export async function requirePage(permission: Permission = "read") {
  let user;
  try {
    user = await currentUser(await headers());
  } catch {
    redirect("/login?reason=unavailable");
  }
  if (!user) redirect("/login?reason=expired");
  if (!permits(user.role, permission)) redirect("/access-denied");
  return user;
}
