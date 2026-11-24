import "server-only";

export function databaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Database configuration required");
  // Fail closed until an operator confirms an isolated preview/development branch.
  if (
    process.env.VERCEL_ENV === "preview" &&
    process.env.DATABASE_ENVIRONMENT !== "preview"
  ) {
    throw new Error("Isolated preview database configuration required");
  }
  if (
    process.env.VERCEL_ENV === "production" &&
    process.env.DATABASE_ENVIRONMENT !== "production"
  ) {
    throw new Error("Production database configuration required");
  }
  return url;
}

export function authConfig() {
  const secret = process.env.BETTER_AUTH_SECRET;
  const origin = process.env.BETTER_AUTH_URL;
  if (!secret || secret.length < 32 || !origin)
    throw new Error("Authentication configuration required");
  const parsed = new URL(origin);
  if (process.env.VERCEL && parsed.protocol !== "https:")
    throw new Error("HTTPS is required");
  return { secret, origin: parsed.origin };
}
