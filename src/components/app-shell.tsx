"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Suspense, useState, useSyncExternalStore } from "react";
import {
  findNavGroupLabel,
  findNavItem,
  navigationGroups,
  settingsItem,
  type NavItem,
} from "@/lib/navigation";
import { withScope, type Pillar } from "@/lib/pillars";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScopeSwitcher } from "@/components/scope-switcher";
import { useScope } from "@/components/use-scope";
import { authenticationDisabled } from "@/lib/auth-mode";
import { LogoutButton } from "@/components/auth-controls";

// Per-viewer layout preference only; never application data.
const COLLAPSE_KEY = "pc.sidebar.collapsed";
const collapseListeners = new Set<() => void>();

function readCollapsed() {
  try {
    return window.localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeCollapsed(value: boolean) {
  try {
    window.localStorage.setItem(COLLAPSE_KEY, value ? "1" : "0");
  } catch {
    /* storage unavailable: preference lasts for this page only */
  }
  collapseListeners.forEach((listener) => listener());
}

function subscribeCollapsed(listener: () => void) {
  collapseListeners.add(listener);
  return () => collapseListeners.delete(listener);
}

function NavLink({
  item,
  pillar,
  active,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  pillar: Pillar | null;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={withScope(item.href, pillar)}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      title={collapsed ? item.title : undefined}
      className={cn(
        "flex h-8 items-center gap-2.5 rounded-md px-2 text-[13px] font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/60",
        active && "bg-sidebar-accent text-sidebar-accent-foreground",
        collapsed && "justify-center px-0",
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span className={cn(collapsed && "sr-only")}>{item.title}</span>
    </Link>
  );
}

function Navigation({
  pillar,
  collapsed = false,
  onNavigate,
}: {
  pillar: Pillar | null;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = findNavItem(pathname);
  return (
    <nav
      aria-label="Main navigation"
      className="flex min-h-0 flex-1 flex-col gap-4"
    >
      {navigationGroups.map((group, index) => (
        <div key={group.label ?? `group-${index}`} className="space-y-0.5">
          {group.label ? (
            <p
              className={cn(
                "px-2 pb-1 text-xs font-medium text-muted-foreground",
                collapsed && "sr-only",
              )}
            >
              {group.label}
            </p>
          ) : null}
          {group.items.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              pillar={pillar}
              active={active === item}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ))}
      <div className="mt-auto border-t pt-3">
        <NavLink
          item={settingsItem}
          pillar={pillar}
          active={active === settingsItem}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
      </div>
    </nav>
  );
}

function ScopedNavigation(props: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  return <Navigation pillar={useScope()} {...props} />;
}

function MainNavigation(props: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Suspense fallback={<Navigation pillar={null} {...props} />}>
      <ScopedNavigation {...props} />
    </Suspense>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const collapsed = useSyncExternalStore(
    subscribeCollapsed,
    readCollapsed,
    () => false,
  );

  const item = findNavItem(pathname);
  const group = item ? findNavGroupLabel(item) : null;

  return (
    <div className="min-h-screen">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-card p-2 text-sm focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to content
      </a>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden flex-col border-r bg-sidebar transition-[width] duration-150 lg:flex",
          collapsed ? "w-14 px-2" : "w-58 px-3",
        )}
      >
        <div
          className={cn(
            "flex h-12 shrink-0 items-center",
            collapsed ? "justify-center" : "justify-between pl-2",
          )}
        >
          {collapsed ? null : (
            <Link
              href="/"
              className="text-sm font-semibold tracking-tight text-foreground"
            >
              Program Compass
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => writeCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            className="text-muted-foreground"
          >
            {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </Button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-3 pt-2">
          <MainNavigation collapsed={collapsed} />
        </div>
      </aside>
      <div
        className={cn(
          "transition-[padding] duration-150",
          collapsed ? "lg:pl-14" : "lg:pl-58",
        )}
      >
        <header className="sticky top-0 z-20 flex h-12 items-center justify-between gap-3 border-b bg-card/95 px-4 backdrop-blur supports-backdrop-filter:bg-card/80 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="-ml-1 lg:hidden"
                    aria-label="Open navigation"
                  />
                }
              >
                <Menu />
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-64 gap-0 bg-sidebar px-3 pb-3"
              >
                <SheetTitle className="flex h-12 items-center pl-2 text-sm font-semibold">
                  Program Compass
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Choose a Program Compass module.
                </SheetDescription>
                <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pt-2">
                  <MainNavigation onNavigate={() => setOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
            <p className="truncate text-[13px]">
              {group ? (
                <span className="hidden text-muted-foreground sm:inline">
                  {group}
                  <span aria-hidden="true" className="px-1.5">
                    /
                  </span>
                </span>
              ) : null}
              <span className="font-medium">{item?.title ?? "Not found"}</span>
            </p>
          </div>
          <div className="flex min-w-0 items-center gap-1">
            <ScopeSwitcher />
            {!authenticationDisabled && <LogoutButton />}
          </div>
        </header>
        <main
          id="main-content"
          tabIndex={-1}
          className="px-4 py-5 outline-none sm:px-6"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
