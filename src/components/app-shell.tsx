"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Menu } from "lucide-react";
import { useState } from "react";
import { navigation } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";

function Brand() {
  return (
    <Link
      href="/"
      aria-label="Program Compass home"
      className="flex items-center gap-3"
    >
      <span className="rounded-xl bg-teal-300/10 p-2 text-teal-200">
        <Compass className="size-7" aria-hidden="true" />
      </span>
      <span className="text-lg font-semibold tracking-tight">
        Program Compass
        <span className="mt-0.5 block text-[10px] font-normal uppercase tracking-[0.2em] text-slate-400">
          Strategy into direction
        </span>
      </span>
    </Link>
  );
}
function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main navigation" className="space-y-1">
      {navigation.map(({ title, href, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={onNavigate}
          aria-current={pathname === href ? "page" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors hover:bg-white/10 hover:text-white",
            pathname === href
              ? "bg-teal-300/10 text-teal-200"
              : "text-slate-300",
          )}
        >
          <Icon className="size-[18px] shrink-0" aria-hidden="true" />
          {title}
        </Link>
      ))}
    </nav>
  );
}
export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const title =
    navigation.find((item) => item.href === pathname)?.title ?? "Workspace";
  return (
    <div className="min-h-screen">
      <a
        href="#main-content"
        className="sr-only z-50 rounded bg-white p-3 text-black focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 hidden w-72 flex-col overflow-y-auto bg-sidebar px-5 py-7 text-sidebar-foreground lg:flex">
        <Brand />
        <p className="mb-4 mt-10 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
          Workspace
        </p>
        <Navigation />
        <div className="mt-auto border-t border-white/10 px-3 pt-6">
          <p className="text-xs text-slate-300">
            Cybersecurity strategy
            <br />
            and resource planning
          </p>
          <p className="mt-3 text-[10px] uppercase tracking-widest text-slate-400">
            Application foundation · v0.1
          </p>
        </div>
      </aside>
      <div className="lg:pl-72">
        <header className="flex min-h-20 items-center justify-between gap-4 border-b bg-card px-5 sm:px-10">
          <div className="flex items-center gap-3">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                    aria-label="Open navigation"
                  />
                }
              >
                <Menu />
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-72 overflow-y-auto border-0 bg-sidebar p-5 text-sidebar-foreground"
              >
                <SheetTitle className="sr-only">
                  Workspace navigation
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Choose a Program Compass module.
                </SheetDescription>
                <div className="mb-4 mt-8">
                  <Brand />
                </div>
                <Navigation onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
            <p className="text-sm">
              <span className="hidden text-muted-foreground sm:inline">
                Workspace <span className="px-3 text-slate-300">/</span>
              </span>
              <span className="font-medium">{title}</span>
            </p>
          </div>
          <span className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-teal-600" />
            Foundation
          </span>
        </header>
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto max-w-7xl px-5 py-9 outline-none sm:px-10 sm:py-12"
        >
          {children}
        </main>
        <footer className="px-5 pb-6 text-xs text-muted-foreground sm:px-10">
          Program Compass · Cybersecurity strategy and resource planning
        </footer>
      </div>
    </div>
  );
}
