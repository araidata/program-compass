"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ImportChange } from "@/lib/server/exchange-core";
type Preview = {
  id: string;
  expiresAt: string;
  changes: ImportChange[];
  counts: { create: number; update: number; relationships: number };
};
const partBytes = 256 * 1024;
function base64(bytes: Uint8Array) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 8192)
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(binary);
}
async function request(url: string, method: string, body: unknown) {
  const r = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await r.json();
  if (!r.ok) throw new Error(result.error?.message ?? "Data exchange failed");
  return result.data;
}
export function DataExchangeWorkspace({ canAdmin }: { canAdmin: boolean }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [limit, setLimit] = useState(100);
  async function prepare() {
    if (!file) return;
    setBusy(true);
    setPreview(null);
    setError("");
    try {
      if (file.size > 128 * 1024 * 1024)
        throw new Error("File exceeds 128 MiB. No changes were applied.");
      setStatus("Reading file and calculating checksum…");
      const bytes = new Uint8Array(await file.arrayBuffer());
      const digest = await crypto.subtle.digest("SHA-256", bytes);
      const hash = Array.from(new Uint8Array(digest), (b) =>
        b.toString(16).padStart(2, "0"),
      ).join("");
      const upload = await request("/api/data-exchange", "POST", {
        byteLength: bytes.length,
        partCount: Math.ceil(bytes.length / partBytes),
        sha256: hash,
      });
      for (
        let offset = 0, part = 0;
        offset < bytes.length;
        offset += partBytes, part++
      ) {
        setStatus(
          `Uploading validated file chunks: ${Math.round((offset / bytes.length) * 100)}%`,
        );
        await request(`/api/data-exchange/${upload.id}/part`, "PUT", {
          part,
          base64: base64(bytes.subarray(offset, offset + partBytes)),
        });
      }
      setStatus(
        "Validating identities, references, versions and business rules in a rollback transaction…",
      );
      const result = await request(
        `/api/data-exchange/${upload.id}/preview`,
        "POST",
        {},
      );
      setPreview(result);
      setLimit(100);
      setStatus(
        "Preview ready. Validation was rolled back; no business records changed.",
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Preview failed; no changes applied",
      );
      setStatus("");
    } finally {
      setBusy(false);
    }
  }
  async function apply() {
    if (!preview) return;
    setBusy(true);
    setError("");
    try {
      const result = await request(
        `/api/data-exchange/preview/${preview.id}/apply`,
        "POST",
        {},
      );
      setStatus(
        `Applied atomically: ${result.changes} reviewed changes. Existing accounts and unrelated records were preserved.`,
      );
      setPreview(null);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Apply failed; no changes applied",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-4">
      <section className="rounded border bg-card p-4">
        <h2>Relational JSON export</h2>
        <p className="mt-2 text-sm">
          Export the current Enterprise workspace, including captured cycles,
          reference versions, relationships and history. Credentials, sessions
          and login-account records are excluded. Assessor/actor display
          provenance is retained. Decimal amounts remain exact strings.
        </p>
        {canAdmin ? (
          <a
            className="mt-3 inline-block text-link underline"
            href="/api/data-exchange"
            download
          >
            Download relational JSON
          </a>
        ) : (
          <p>Administrator access is required for data exchange.</p>
        )}
      </section>
      <section className="space-y-3 rounded border bg-card p-4">
        <h2>Preview and restore / merge</h2>
        <p className="text-sm">
          Choose an exported JSON file (maximum 128 MiB). Preview validates its
          schema, identities, pinned official content, relationships and
          business rules without persisting changes. Applying merges the
          reviewed records atomically; absent business records are preserved,
          mutable relationships for imported records are replaced, and immutable
          history/reference identities cannot be rewritten. Older revisions and
          workspace changes after preview are rejected.
        </p>
        <label className="block">
          Relational JSON file
          <input
            className="form-input mt-1"
            type="file"
            accept=".json,application/json"
            disabled={!canAdmin || busy}
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setPreview(null);
              setError("");
              setStatus("");
            }}
          />
        </label>
        <Button
          disabled={!canAdmin || !file || busy}
          onClick={() => void prepare()}
        >
          Upload and preview changes
        </Button>
        <p role="status" aria-live="polite" className="text-sm">
          {status}
        </p>
        {error && (
          <p role="alert" className="text-sm">
            {error} Your file selection is retained for retry.
          </p>
        )}
        {preview && (
          <div className="space-y-3 border-t pt-3">
            <h3>Reviewable change preview</h3>
            <p>
              {preview.counts.create} create · {preview.counts.update} update ·{" "}
              {preview.counts.relationships} relationship changes. Expires{" "}
              {preview.expiresAt} UTC.
            </p>
            <Button disabled={busy || !canAdmin} onClick={() => void apply()}>
              Apply reviewed import atomically
            </Button>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr>
                    <th className="p-2">Action / table</th>
                    <th>Identity</th>
                    <th>Changed fields / values</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.changes.slice(0, limit).map((c, i) => (
                    <tr className="border-t align-top" key={i}>
                      <td className="p-2">
                        {c.action} · {c.table}
                      </td>
                      <td className="max-w-sm break-all p-2">{c.identity}</td>
                      <td className="p-2">
                        <details>
                          <summary>{c.fields.join(", ")}</summary>
                          <pre className="max-w-xl whitespace-pre-wrap break-all text-xs">
                            {JSON.stringify(
                              { before: c.before, after: c.after },
                              null,
                              2,
                            )}
                          </pre>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {preview.changes.length === 0 && (
              <p>
                No differences found. All included identities and relationships
                passed validation.
              </p>
            )}
            {preview.changes.length > limit && (
              <Button
                variant="outline"
                onClick={() => setLimit((n) => n + 100)}
              >
                Show 100 more changes
              </Button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
