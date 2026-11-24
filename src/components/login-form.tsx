"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(form.get("email")).trim().toLowerCase(),
          password: form.get("password"),
          rememberMe: false,
        }),
      });
      if (!response.ok) {
        setMessage(
          response.status === 429
            ? "Too many attempts. Wait a minute and try again."
            : response.status === 503
              ? "Sign-in is temporarily unavailable."
              : "Invalid email or password.",
        );
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setMessage("Sign-in is temporarily unavailable.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block space-y-1">
        Email
        <input
          className="form-input"
          name="email"
          type="email"
          autoComplete="username"
          maxLength={254}
          required
        />
      </label>
      <label className="block space-y-1">
        Password
        <input
          className="form-input"
          name="password"
          type="password"
          autoComplete="current-password"
          maxLength={128}
          required
        />
      </label>
      {message && <p role="alert">{message}</p>}
      <Button type="submit" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Accounts are created by your administrator.
      </p>
    </form>
  );
}
