"use client";
import { useOptimistic, useTransition, useSyncExternalStore } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
const subscribe = () => () => {};
/** Disable SSR controls until React can handle input; show URL edits immediately. */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
export function useUrlFilters() {
  const actual = useSearchParams();
  const path = usePathname();
  const router = useRouter();
  const [query, setQuery] = useOptimistic(actual.toString());
  const [pending, startTransition] = useTransition();
  const params = new URLSearchParams(query);
  function setFilters(patch: Record<string, string>) {
    const next = new URLSearchParams(query);
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const value = next.toString();
    startTransition(() => {
      setQuery(value);
      router.replace(value ? `${path}?${value}` : path, { scroll: false });
    });
  }
  return { params, setFilters, pending };
}
