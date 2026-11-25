"use client";
import { createContext, useContext } from "react";
import { defaultMethods, type Methods } from "@/lib/domain/methods";
const Context = createContext<Methods>(defaultMethods);
export function MethodProvider({
  methods,
  children,
}: {
  methods: Methods;
  children: React.ReactNode;
}) {
  return <Context.Provider value={methods}>{children}</Context.Provider>;
}
export function useMethods() {
  const methods = useContext(Context);
  return {
    ...methods,
    levels: methods.values.levels,
    levelName: (level: number | null | undefined) =>
      level == null
        ? "Not assessed"
        : (methods.values.levels.find((l) => l.level === level)?.name ?? "—"),
  };
}

export function ConfiguredLevelName({ level }: { level: number }) {
  return <>{useMethods().levelName(level)}</>;
}
