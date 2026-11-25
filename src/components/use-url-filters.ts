"use client";
import { useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
const subscribe = () => () => {};
const subscribeQuery = (listener: () => void) => {
  window.addEventListener("compass:filters", listener);
  window.addEventListener("popstate", listener);
  return () => {
    window.removeEventListener("compass:filters", listener);
    window.removeEventListener("popstate", listener);
  };
};
const clientQuery = () => window.location.search;
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
  const query = useSyncExternalStore(subscribeQuery, clientQuery, () =>
    actual.toString(),
  );
  const params = new URLSearchParams(query);
  function setFilters(patch: Record<string, string>) {
    const next = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const value = next.toString();
    // These workspaces already hold all filter data. Next's native History API
    // integration updates useSearchParams without an unnecessary server fetch.
    // Commit the URL synchronously so a save/refresh cannot cancel a pending tab.
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${value ? `?${value}` : ""}${window.location.hash}`,
    );
    // Controlled inputs need an urgent local notification; Next's router update
    // may otherwise land after the browser has verified checkbox activation.
    window.dispatchEvent(new Event("compass:filters"));
  }
  return { params, setFilters, pending: false };
}
