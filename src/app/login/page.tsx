import { redirect } from "next/navigation";
import { authenticationDisabled } from "@/lib/auth-mode";
import { LoginForm } from "@/components/login-form";

export const metadata = { title: "Sign in" };
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  if (authenticationDisabled) redirect("/");
  const { reason } = await searchParams;
  return (
    <main className="mx-auto max-w-sm space-y-5 px-5 py-16">
      <p className="font-semibold">Program Compass</p>
      <h1>Sign in</h1>
      {reason === "expired" && (
        <p role="status">
          Your session has expired or you are signed out. Sign in to continue.
        </p>
      )}
      {reason === "unavailable" && (
        <p role="status">
          Sign-in is temporarily unavailable. Please try again later.
        </p>
      )}
      <LoginForm />
    </main>
  );
}
