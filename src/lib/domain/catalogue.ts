import type { PillarId } from "@/lib/pillars";

/**
 * Reference baseline catalogue: the original 30 security topics and 60
 * operational KPIs inventoried in docs/REFERENCE_APPLICATION_REVIEW.md.
 * Topic codes are preserved as stable identifiers. Topic prose is not copied
 * (provenance review pending). Display groups follow the reference, which
 * combines Respond and Recover; they are NOT the official NIST CSF 2.0
 * functions. Official framework hierarchies are linked later through
 * Framework, FrameworkRequirement and CapabilityRequirementMapping.
 *
 * Default pillar involvement is a PROVISIONAL starting point that editors
 * change per topic. It is not an exclusive ownership rule.
 */
export const CATALOGUE_VERSION = "reference-baseline-1";

export const displayGroups = [
  { code: "GV", name: "Govern" },
  { code: "ID", name: "Identify" },
  { code: "PR", name: "Protect" },
  { code: "DE", name: "Detect" },
  { code: "RR", name: "Respond & Recover" },
] as const;

export type GroupCode = (typeof displayGroups)[number]["code"];

/** KPI boundaries in percent. higher: pass ≥ pass, fail < fail. lower: pass ≤ pass, fail > fail. */
type Kpi = readonly [
  name: string,
  pass: number,
  fail: number,
  direction?: "lower",
];

export type CatalogueTopic = {
  code: string;
  name: string;
  pillars: readonly PillarId[];
  kpis: readonly [Kpi, Kpi];
};

export const catalogueTopics: readonly CatalogueTopic[] = [
  {
    code: "GV.01",
    name: "(Cyber) Security Governance",
    pillars: ["grc"],
    kpis: [
      ["Policy review coverage", 95, 80],
      ["Roadmap delivery", 85, 70],
    ],
  },
  {
    code: "GV.02",
    name: "Data Governance",
    pillars: ["grc"],
    kpis: [
      ["Data ownership coverage", 95, 80],
      ["Masked non-production data", 95, 85],
    ],
  },
  {
    code: "GV.03",
    name: "Security and Privacy Standards",
    pillars: ["grc"],
    kpis: [
      ["Control implementation", 90, 75],
      ["Audit findings closed on time", 90, 70],
    ],
  },
  {
    code: "GV.04",
    name: "Security Budget & Finance",
    pillars: ["grc"],
    kpis: [
      ["Budget variance", 5, 15, "lower"],
      ["Projects within budget", 85, 70],
    ],
  },
  {
    code: "ID.01",
    name: "Asset Management",
    pillars: ["sae"],
    kpis: [
      ["Asset record completeness", 95, 85],
      ["Discovery reconciliation", 98, 90],
    ],
  },
  {
    code: "ID.02",
    name: "Risk Assessments, Threat Modeling & Security by Design, Pentesting & Red Teaming",
    pillars: ["secops", "sae"],
    kpis: [
      ["Threat model coverage", 90, 70],
      ["Pentest findings fixed in SLA", 90, 75],
    ],
  },
  {
    code: "ID.03",
    name: "Cyber Security Threat Intelligence",
    pillars: ["secops"],
    kpis: [
      ["Advisory triage speed", 95, 80],
      ["Actionable intelligence", 60, 30],
    ],
  },
  {
    code: "ID.04",
    name: "Third Party Risk Management (TPRM)",
    pillars: ["grc"],
    kpis: [
      ["Supplier assessment coverage", 95, 80],
      ["Supplier offboarding", 98, 90],
    ],
  },
  {
    code: "PR.01",
    name: "Endpoint Protection & Mobile Device Management",
    pillars: ["sae"],
    kpis: [
      ["Endpoint protection coverage", 98, 95],
      ["MDM compliance", 98, 90],
    ],
  },
  {
    code: "PR.02",
    name: "Network Security",
    pillars: ["sae"],
    kpis: [
      ["Firewall rule review", 95, 80],
      ["Overly permissive rules", 1, 5, "lower"],
    ],
  },
  {
    code: "PR.03",
    name: "Vulnerability Management",
    pillars: ["secops", "sae"],
    kpis: [
      ["Critical vulns fixed in SLA", 95, 80],
      ["Authenticated scan coverage", 95, 80],
    ],
  },
  {
    code: "PR.04",
    name: "Hardening & Secure Configuration",
    pillars: ["sae"],
    kpis: [
      ["Baseline compliance", 95, 85],
      ["Deviations with approved exception", 98, 90],
    ],
  },
  {
    code: "PR.05",
    name: "Encryption and Cryptography",
    pillars: ["sae"],
    kpis: [
      ["Encryption at rest", 99, 95],
      ["Certificate renewal hygiene", 98, 90],
    ],
  },
  {
    code: "PR.06",
    name: "Mobile Security",
    pillars: ["sae"],
    kpis: [
      ["Release security testing", 95, 85],
      ["App hardening coverage", 95, 80],
    ],
  },
  {
    code: "PR.07",
    name: "Physical Security",
    pillars: ["grc"],
    kpis: [
      ["Physical access recertification", 98, 90],
      ["Leaver badge deactivation", 99, 95],
    ],
  },
  {
    code: "PR.08",
    name: "Identity & Access Management (IAM)",
    pillars: ["sae"],
    kpis: [
      ["Leaver account removal", 99, 95],
      ["MFA coverage", 99, 95],
    ],
  },
  {
    code: "PR.09",
    name: "Data Loss Protection",
    pillars: ["sae", "grc"],
    kpis: [
      ["Classification coverage", 90, 70],
      ["DLP alert handling", 95, 80],
    ],
  },
  {
    code: "PR.10",
    name: "Security Awareness & Training",
    pillars: ["grc"],
    kpis: [
      ["Training completion", 95, 85],
      ["Phishing click rate", 5, 15, "lower"],
    ],
  },
  {
    code: "PR.11",
    name: "Brand Protection",
    pillars: ["secops"],
    kpis: [
      ["Brand abuse takedown", 90, 70],
      ["DMARC enforcement", 95, 80],
    ],
  },
  {
    code: "PR.12",
    name: "Secure Development & Deployment",
    pillars: ["sae"],
    kpis: [
      ["Pipeline security gates", 95, 80],
      ["Findings fixed before release", 95, 85],
    ],
  },
  {
    code: "PR.13",
    name: "Cloud Security",
    pillars: ["sae"],
    kpis: [
      ["Cloud posture score", 95, 85],
      ["Critical misconfigs fixed in SLA", 95, 80],
    ],
  },
  {
    code: "PR.14",
    name: "Internet of Things (IoT) Security",
    pillars: ["sae"],
    kpis: [
      ["IoT inventory coverage", 95, 80],
      ["IoT segmentation", 95, 80],
    ],
  },
  {
    code: "PR.15",
    name: "SaaS Security",
    pillars: ["sae", "grc"],
    kpis: [
      ["SaaS SSO coverage", 90, 75],
      ["SaaS vendor assurance", 95, 80],
    ],
  },
  {
    code: "PR.16",
    name: "OT / ICS / SCADA Security",
    pillars: ["sae"],
    kpis: [
      ["OT/IT separation", 95, 85],
      ["Controlled remote OT access", 99, 95],
    ],
  },
  {
    code: "PR.17",
    name: "AI Security",
    pillars: ["sae", "grc"],
    kpis: [
      ["AI-assisted change review", 80, 50],
      ["AI answer accuracy", 90, 75],
    ],
  },
  {
    code: "DE.01",
    name: "Security Logging",
    pillars: ["secops", "sae"],
    kpis: [
      ["Log source coverage", 95, 85],
      ["Log ingestion health", 98, 90],
    ],
  },
  {
    code: "DE.02",
    name: "Security Monitoring",
    pillars: ["secops"],
    kpis: [
      ["ATT&CK detection coverage", 70, 40],
      ["False positive rate", 20, 50, "lower"],
    ],
  },
  {
    code: "RR.01",
    name: "Security Operations Center (SOC)",
    pillars: ["secops"],
    kpis: [
      ["Critical alert triage time", 95, 80],
      ["Containment within target", 90, 75],
    ],
  },
  {
    code: "RR.02",
    name: "(Security) Incident Management",
    pillars: ["secops"],
    kpis: [
      ["Incident escalation in SLA", 95, 80],
      ["Playbooks exercised", 90, 60],
    ],
  },
  {
    code: "RR.03",
    name: "Business Continuity Management (BCM) and Disaster Recovery (DR)",
    pillars: ["sae", "grc"],
    kpis: [
      ["DR tests meeting RTO", 95, 80],
      ["Backup restore success", 98, 90],
    ],
  },
];

export function groupName(code: string): string {
  return displayGroups.find((entry) => entry.code === code)?.name ?? code;
}
