import {
  LayoutGrid,
  Gauge,
  ListChecks,
  TriangleAlert,
  Target,
  GanttChart,
  Users,
  Server,
  FileText,
  Settings,
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
    ],
  },
  {
    label: "Assess",
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
        title: "Compliance",
        href: "/compliance",
        icon: ListChecks,
        description:
          "Framework requirements, their mapping to capabilities, and coverage status.",
        phase: 2,
        views: ["Coverage", "Requirements", "Mappings"],
      },
      {
        title: "Risks & Findings",
        href: "/risks",
        icon: TriangleAlert,
        description:
          "Risk and finding registers with inherent and residual views and ageing.",
        phase: 4,
        views: ["Heat map", "Register", "Ageing"],
      },
    ],
  },
  {
    label: "Plan",
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
        title: "Roadmap",
        href: "/roadmap",
        icon: GanttChart,
        description:
          "Initiatives, timing, expected uplift, and the gaps and risks they address.",
        phase: 4,
        views: ["Timeline", "List", "Coverage"],
      },
    ],
  },
  {
    label: "Resources",
    items: [
      {
        title: "Workforce",
        href: "/workforce",
        icon: Users,
        description:
          "People and positions, FTE allocation, supply versus demand by pillar, and skills.",
        phase: 3,
        views: ["Roster", "Allocation", "Supply and demand", "Skills"],
      },
      {
        title: "Technology",
        href: "/technology",
        icon: Server,
        description:
          "Security tools, cost, lifecycle, and the capabilities they support.",
        phase: 3,
        views: ["Portfolio", "Coverage", "Lifecycle"],
      },
    ],
  },
  {
    label: null,
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
  return navigation.find(
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
