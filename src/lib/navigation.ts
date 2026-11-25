import {
  LayoutGrid,
  Gauge,
  ListChecks,
  Target,
  GanttChart,
  Users,
  Server,
  FileText,
  Settings,
  BookOpen,
  ClipboardList,
  Calculator,
  CalendarRange,
  DatabaseBackup,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  description: string;
  /** Implementation phase in which the module's first workflows arrive. */
  phase: number;
  /** Planned views, shown as the module's tabs once implemented. */
  views: readonly string[];
  /** Indent a directly accessible workspace beneath its related module. */
  nested?: boolean;
};

export type NavGroup = {
  label: string | null;
  items: readonly NavItem[];
};

export const navigationGroups: readonly NavGroup[] = [
  {
    label: null,
    items: [
      {
        title: "Overview",
        href: "/",
        icon: LayoutGrid,
        description:
          "Program position for the selected scope: gaps, coverage, capacity, and items needing attention.",
        phase: 2,
        views: ["Summary", "Attention"],
      },
      {
        title: "How to use",
        href: "/guide",
        icon: BookOpen,
        description:
          "Where to start, how the workflow connects, and what the planning numbers mean.",
        phase: 5,
        views: ["Workflow", "Worked example", "Definitions"],
      },
    ],
  },
  {
    label: "1. Assess",
    items: [
      {
        title: "Capabilities",
        href: "/capabilities",
        icon: Gauge,
        description:
          "Capability catalogue by pillar with current and target maturity and assessment cycles.",
        phase: 2,
        views: ["Matrix", "Targets", "Assessment history"],
      },
      {
        title: "Framework Alignment",
        href: "/compliance",
        icon: ListChecks,
        description:
          "Framework requirements, their mapping to capabilities, and coverage status.",
        phase: 2,
        views: ["Coverage", "Requirements", "Mappings"],
      },
    ],
  },
  {
    label: "2. Prioritize",
    items: [
      {
        title: "Business Context",
        href: "/context",
        icon: Target,
        description:
          "Business objectives, the threat landscape, and the capabilities they depend on.",
        phase: 2,
        views: ["Objectives", "Threats", "Dependencies"],
      },
      {
        title: "Responsibilities & issues",
        href: "/capabilities/planning",
        icon: ClipboardList,
        description:
          "Assign ongoing responsibilities and track capability planning deficiencies.",
        phase: 4,
        views: ["Responsibilities", "Planning issues"],
      },
    ],
  },
  {
    label: "3. Resources",
    items: [
      {
        title: "Workforce",
        href: "/workforce",
        icon: Users,
        description:
          "People, positions, reporting relationships, and ownership.",
        phase: 3,
        views: ["People", "Positions"],
      },
      {
        title: "Workload & capacity",
        href: "/workforce/planning",
        icon: Calculator,
        description:
          "Work demand, productive capacity, skills, and position justifications.",
        phase: 3,
        views: ["Workload", "Assignments", "Justifications"],
        nested: true,
      },
      {
        title: "Technology",
        href: "/technology",
        icon: Server,
        description:
          "Security tools, costs, lifecycle, and coverage alternatives.",
        phase: 3,
        views: ["Portfolio", "Coverage", "Lifecycle"],
      },
    ],
  },
  {
    label: "4. Plan & fund",
    items: [
      {
        title: "Roadmap",
        href: "/roadmap",
        icon: GanttChart,
        description:
          "Initiatives, timing, expected uplift, and the gaps and risks they address.",
        phase: 4,
        views: ["Timeline", "List", "Coverage"],
      },
      {
        title: "Five-year plan & funding",
        href: "/roadmap/plan",
        icon: CalendarRange,
        description:
          "Compare scenarios, annual targets, budgets, costs, and funding constraints.",
        phase: 5,
        views: ["Plan", "Resources", "Costs", "Constraints"],
        nested: true,
      },
    ],
  },
  {
    label: "5. Report & review",
    items: [
      {
        title: "Reports",
        href: "/reports",
        icon: FileText,
        description:
          "Board, management, and pillar review packs for a chosen scope.",
        phase: 5,
        views: ["Packs", "Exports"],
      },
      {
        title: "Data export & restore",
        href: "/reports/data",
        icon: DatabaseBackup,
        description: "Export business data and preview a validated restore.",
        phase: 5,
        views: ["Export", "Import"],
        nested: true,
      },
    ],
  },
];

/** Pinned to the bottom of the sidebar. */
export const settingsItem: NavItem = {
  title: "Settings",
  href: "/settings",
  icon: Settings,
  description:
    "Reference data (pillars, capability catalogue, frameworks, scales), users and roles.",
  phase: 1,
  views: ["Reference data", "Users and roles", "Glossary"],
};

export const navigation: readonly NavItem[] = [
  ...navigationGroups.flatMap((group) => group.items),
  settingsItem,
];

export function findNavItem(pathname: string): NavItem | undefined {
  if (pathname === "/") return navigation[0];
  return [...navigation]
    .sort((a, b) => b.href.length - a.href.length)
    .find(
      (item) =>
        item.href !== "/" &&
        (pathname === item.href || pathname.startsWith(`${item.href}/`)),
    );
}

export function findNavGroupLabel(item: NavItem): string | null {
  return (
    navigationGroups.find((group) => group.items.includes(item))?.label ?? null
  );
}
