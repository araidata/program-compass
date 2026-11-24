// Markers shared by the synthetic (demo) seed and the demo clear script.
export const DEMO_RATIONALE = "Synthetic development rating.";
export const DEMO_ACTION = "demo.seeded";
// Functions the demo seed creates when they are missing, by pillar key.
export const DEMO_FUNCTIONS: Record<string, string[]> = {
  secops: ["Security Monitoring", "Incident Response", "Threat Management"],
  grc: ["Governance", "Risk & Compliance"],
};
// Change events that do not mean a person edited a topic.
export const SYSTEM_ACTIONS = ["catalogue.seeded", DEMO_ACTION];
