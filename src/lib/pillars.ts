export const pillars = [
  {
    id: "secops",
    name: "Security Operations",
    short: "SecOps",
  },
  {
    id: "sae",
    name: "Security Architecture & Engineering",
    short: "SA&E",
  },
  {
    id: "grc",
    name: "Governance, Risk & Compliance",
    short: "GRC",
  },
] as const;

export type PillarId = (typeof pillars)[number]["id"];
export type Pillar = (typeof pillars)[number];

/** URL search parameter that holds the global pillar scope. */
export const PILLAR_PARAM = "pillar";

export function parsePillar(value: string | null | undefined): Pillar | null {
  return pillars.find((pillar) => pillar.id === value) ?? null;
}

/** Appends the current pillar scope to an internal href. */
export function withScope(href: string, pillar: Pillar | null): string {
  const url = new URL(href, "https://program-compass.invalid");
  if (pillar) url.searchParams.set(PILLAR_PARAM, pillar.id);
  else url.searchParams.delete(PILLAR_PARAM);
  return `${url.pathname}${url.search}${url.hash}`;
}

/** Carry a selected immutable cycle across business routes; Settings always edits live configuration. */
export function withCycle(href: string, cycle: string | null) {
  if (
    !cycle ||
    href.startsWith("/settings") ||
    href.startsWith("/reports/data")
  )
    return href;
  const url = new URL(href, "http://local.invalid");
  url.searchParams.set("cycle", cycle);
  return `${url.pathname}${url.search}${url.hash}`;
}
