import { authenticationDisabled } from "@/lib/auth-mode";
import { auth } from "@/lib/server/auth";
import { failure } from "@/lib/server/api";

export const runtime = "nodejs";
const allowed: Record<string, string> = {
  "sign-in/email": "POST",
  "sign-out": "POST",
  "get-session": "GET",
  "change-password": "POST",
};

async function handler(
  request: Request,
  context: { params: Promise<{ all: string[] }> },
) {
  if (authenticationDisabled)
    return Response.json(
      { error: { message: "Authentication is disabled" } },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  const path = (await context.params).all.join("/");
  if (allowed[path] !== request.method)
    return Response.json({ error: { message: "Not found" } }, { status: 404 });
  try {
    const response = await auth().handler(request);
    response.headers.set("Cache-Control", "no-store");
    // Uniform credentials errors, including deactivated accounts.
    if (path === "sign-in/email" && [400, 401, 403].includes(response.status)) {
      return Response.json(
        { message: "Invalid email or password" },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }
    return response;
  } catch (error) {
    return failure(error);
  }
}
export { handler as GET, handler as POST };
