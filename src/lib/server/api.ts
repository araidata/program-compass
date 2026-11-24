import "server-only";
import { z } from "zod";
import { HttpError, requireUser } from "./access";
import { authConfig } from "./config";
import type { Permission } from "@/lib/permissions";

export function json(data: unknown, status = 200) {
  return Response.json(
    { data },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export function failure(error: unknown) {
  const status =
    error instanceof HttpError
      ? error.status
      : error instanceof z.ZodError || error instanceof SyntaxError
        ? 400
        : 503;
  const message =
    error instanceof HttpError
      ? error.message
      : status === 400
        ? "Invalid request"
        : "Service unavailable";
  return Response.json(
    { error: { message } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export function sameOrigin(request: Request) {
  if (request.headers.get("origin") !== authConfig().origin)
    throw new HttpError(403, "Access denied");
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new HttpError(415, "JSON required");
}

export async function input<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<T> {
  const body = await request.text();
  if (body.length > 16_384) throw new HttpError(413, "Request too large");
  return schema.parse(JSON.parse(body));
}

export async function api(
  request: Request,
  permission: Permission,
  action: (user: Awaited<ReturnType<typeof requireUser>>) => Promise<Response>,
) {
  try {
    const user = await requireUser(request.headers, permission);
    if (!["GET", "HEAD"].includes(request.method)) sameOrigin(request);
    return await action(user);
  } catch (error) {
    return failure(error);
  }
}
