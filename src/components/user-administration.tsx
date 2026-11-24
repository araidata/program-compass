"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { roles, type Role } from "@/lib/permissions";

type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
};
function RoleOptions() {
  return roles.map((role) => (
    <option key={role} value={role}>
      {role === "admin"
        ? "Administrator"
        : role === "editor"
          ? "Editor"
          : "Viewer"}
    </option>
  ));
}
export function UserAdministration() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    fetch(`/api/users?page=${page}`, { signal: abort.signal })
      .then(async (response) => {
        if (response.status === 401) {
          router.replace("/login?reason=expired");
          router.refresh();
          return;
        }
        if (!response.ok) throw new Error();
        const result = await response.json();
        setUsers(result.data.items);
        setTotal(result.data.total);
      })
      .catch((error) => {
        if (error.name !== "AbortError") setStatus("Unable to load accounts.");
      });
    return () => abort.abort();
  }, [page, revision, router]);
  async function save(event: React.FormEvent<HTMLFormElement>, user?: User) {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    const form = event.currentTarget;
    const fields = Object.fromEntries(new FormData(form));
    const body = user
      ? { role: fields.role, active: fields.active === "on" }
      : fields;
    try {
      const response = await fetch(
        user ? `/api/users/${user.id}` : "/api/users",
        {
          method: user ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (response.status === 401) {
        router.replace("/login?reason=expired");
        router.refresh();
        return;
      }
      const result = await response.json();
      if (!response.ok) {
        setStatus(result.error?.message ?? "Unable to save account.");
        return;
      }
      if (!user) form.reset();
      setStatus(
        "Account saved. Role and activation changes revoke existing sessions.",
      );
      setRevision((value) => value + 1);
    } catch {
      setStatus("Unable to save account.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section aria-labelledby="users-heading" className="space-y-4">
      <h2 id="users-heading">Users and roles</h2>
      <form
        onSubmit={(event) => save(event)}
        className="grid max-w-3xl gap-3 sm:grid-cols-2"
      >
        <label>
          Name
          <input className="form-input" name="name" maxLength={100} required />
        </label>
        <label>
          Email
          <input
            className="form-input"
            type="email"
            name="email"
            maxLength={254}
            required
          />
        </label>
        <label>
          Initial password
          <input
            className="form-input"
            type="password"
            name="password"
            minLength={15}
            maxLength={128}
            autoComplete="new-password"
            required
          />
          <span className="text-xs text-muted-foreground">
            15–128 characters. Share securely outside the application.
          </span>
        </label>
        <label>
          Role
          <select className="form-input" name="role" defaultValue="viewer">
            <RoleOptions />
          </select>
        </label>
        <Button disabled={busy} type="submit" className="justify-self-start">
          Create account
        </Button>
      </form>
      <p role="status" aria-live="polite">
        {status}
      </p>
      <ul className="divide-y rounded-md border">
        {users.map((user) => (
          <li key={`${user.id}-${revision}`} className="p-3">
            <form
              onSubmit={(event) => save(event, user)}
              className="flex flex-wrap items-center gap-3"
            >
              <div className="min-w-0 flex-1 basis-48">
                <p className="break-words font-medium">{user.name}</p>
                <p className="break-all text-xs text-muted-foreground">
                  {user.email}
                </p>
              </div>
              <label className="text-xs">
                Role
                <select
                  className="form-input"
                  aria-label={`Role for ${user.email}`}
                  name="role"
                  defaultValue={user.role}
                >
                  <RoleOptions />
                </select>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="active"
                  aria-label={`Active account for ${user.email}`}
                  defaultChecked={user.active}
                />
                Active
              </label>
              <Button size="sm" variant="outline" disabled={busy}>
                Save account
              </Button>
            </form>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          variant="outline"
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </Button>
        <span className="text-xs">
          Page {page} · {total} accounts
        </span>
        <Button
          size="sm"
          variant="outline"
          disabled={page * 25 >= total}
          onClick={() => setPage(page + 1)}
        >
          Next
        </Button>
      </div>
    </section>
  );
}
