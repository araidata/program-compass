import {
  LayoutDashboard,
  Building2,
  ScanLine,
  ClipboardCheck,
  Users,
  Layers3,
  Compass,
  Flag,
  ChartNoAxesCombined,
  Settings,
} from "lucide-react";

export const navigation = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    description: "Your cybersecurity program at a glance.",
  },
  {
    title: "Business Context",
    href: "/business-context",
    icon: Building2,
    description:
      "Align cybersecurity priorities with organizational objectives and operating context.",
  },
  {
    title: "Current State",
    href: "/current-state",
    icon: ScanLine,
    description:
      "Assess capabilities and understand the program’s current maturity.",
  },
  {
    title: "Compliance",
    href: "/compliance",
    icon: ClipboardCheck,
    description:
      "Review framework alignment, requirement coverage, and assessment status.",
  },
  {
    title: "People & Resources",
    href: "/people-resources",
    icon: Users,
    description: "Plan the people, skills, and capacity behind the program.",
  },
  {
    title: "Technology Portfolio",
    href: "/technology-portfolio",
    icon: Layers3,
    description:
      "Understand security technologies and their contribution to program capabilities.",
  },
  {
    title: "Strategic Planning",
    href: "/strategic-planning",
    icon: Compass,
    description:
      "Translate program priorities into a sequenced strategic roadmap.",
  },
  {
    title: "Risks & Findings",
    href: "/risks-findings",
    icon: Flag,
    description: "Bring risks, gaps, and assessment findings into focus.",
  },
  {
    title: "Reporting",
    href: "/reporting",
    icon: ChartNoAxesCombined,
    description: "Communicate program direction and progress with clarity.",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    description:
      "Manage application and workspace configuration in a future phase.",
  },
] as const;
