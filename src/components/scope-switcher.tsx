"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { cn } from "@/lib/utils";
import { pillars, withScope, type Pillar } from "@/lib/pillars";
import { useScope } from "@/components/use-scope";

const options: ReadonlyArray<{
  id: string;
  short: string;
  name: string;
  pillar: Pillar | null;
}> = [
  { id: "enterprise", short: "Enterprise", name: "Enterprise", pillar: null },
  ...pillars.map((pillar) => ({
    id: pillar.id,
    short: pillar.short,
    name: pillar.name,
    pillar,
  })),
];

function Switcher({ current }: { current: Pillar | null }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const href = params.size ? `${pathname}?${params}` : pathname;
  const router = useRouter();
  const currentId = current?.id ?? "enterprise";
  return (
    <>
      <nav
        aria-label="Scope"
        className="hidden h-8 items-center rounded-md border bg-muted p-0.5 md:flex"
      >
        {options.map((option) => {
          const active = option.id === currentId;
          return (
            <Link
              key={option.id}
              href={withScope(href, option.pillar)}
              title={option.name}
              aria-current={active ? "true" : undefined}
              className={cn(
                "flex h-full items-center rounded-[calc(var(--radius)-2px)] px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground",
                active &&
                  "bg-card text-foreground shadow-xs ring-1 ring-border",
              )}
            >
              {option.short}
            </Link>
          );
        })}
      </nav>
      <label className="md:hidden">
        <span className="sr-only">Scope</span>
        <select
          value={currentId}
          onChange={(event) => {
            const option = options.find((o) => o.id === event.target.value);
            router.push(withScope(href, option?.pillar ?? null));
          }}
          className="h-8 rounded-md border bg-card px-2 text-xs font-medium"
        >
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.short}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}

function ScopedSwitcher() {
  return <Switcher current={useScope()} />;
}

/** Global pillar scope control, held in the URL (?pillar=…). */
export function ScopeSwitcher() {
  return (
    <Suspense fallback={<Switcher current={null} />}>
      <ScopedSwitcher />
    </Suspense>
  );
}
