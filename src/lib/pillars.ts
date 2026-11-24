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
  return pillar ? `${href}?${PILLAR_PARAM}=${pillar.id}` : href;
}
