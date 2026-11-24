"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Pillar = {
  id: string;
  name: string;
  functions: { id: string; name: string }[];
};
export function SettingsForms({
  name,
  dateFormat,
  pillars,
}: {
  name: string;
  dateFormat: string;
  pillars: Pillar[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  async function save(
    event: React.FormEvent<HTMLFormElement>,
    url: string,
    method: string,
  ) {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (response.status === 401) {
        router.replace("/login?reason=expired");
        router.refresh();
        return;
      }
      setStatus(
        response.ok
          ? "Saved."
          : "Unable to save. Check the values and your access.",
      );
      if (response.ok) router.refresh();
    } catch {
      setStatus("Unable to save. Try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-5" aria-labelledby="configuration-heading">
      <h2 id="configuration-heading">Application configuration</h2>
      <form
        className="max-w-lg space-y-3"
        onSubmit={(event) => save(event, "/api/settings", "PATCH")}
      >
        <label className="block">
          Organization name
          <input
            className="form-input"
            name="name"
            defaultValue={name}
            maxLength={150}
            required
          />
        </label>
        <label className="block">
          Date display preference
          <select
            className="form-input"
            name="dateFormat"
            defaultValue={dateFormat}
          >
            <option>YYYY-MM-DD</option>
            <option>MM/DD/YYYY</option>
          </select>
        </label>
        <Button disabled={busy}>Save settings</Button>
      </form>
      <h2>Pillars and functions</h2>
      <div className="grid gap-4 xl:grid-cols-3">
        {pillars.map((pillar) => (
          <section key={pillar.id} className="space-y-3 rounded-md border p-4">
            <form
              onSubmit={(event) =>
                save(event, `/api/pillars/${pillar.id}`, "PATCH")
              }
              className="space-y-2"
            >
              <label className="block">
                Pillar name
                <input
                  className="form-input"
                  aria-label={`Name for ${pillar.name}`}
                  name="name"
                  defaultValue={pillar.name}
                  maxLength={100}
                  required
                />
              </label>
              <Button size="sm" variant="outline" disabled={busy}>
                Save pillar
              </Button>
            </form>
            <ul className="list-inside list-disc text-sm">
              {pillar.functions.map((fn) => (
                <li key={fn.id}>{fn.name}</li>
              ))}
            </ul>
            <form
              onSubmit={(event) => save(event, "/api/functions", "POST")}
              className="space-y-2"
            >
              <input name="pillarId" type="hidden" value={pillar.id} />
              <label className="block">
                New function
                <input
                  className="form-input"
                  name="name"
                  aria-label={`New function in ${pillar.name}`}
                  maxLength={100}
                  required
                />
              </label>
              <Button size="sm" variant="outline" disabled={busy}>
                Add function
              </Button>
            </form>
          </section>
        ))}
      </div>
      <p role="status" aria-live="polite">
        {status}
      </p>
    </section>
  );
}
