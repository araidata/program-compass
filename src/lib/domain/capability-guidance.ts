/** Locally authored topic guide; never represented as verbatim reference material. */
export const capabilityGuidance: Record<
  string,
  { description: string; subjects: string[] }
> = Object.fromEntries(
  [
    [
      "GV.01",
      "Set direction, accountability and decision rights for the security program.",
      "Strategy;Governance forums;Policy ownership;Decision rights;Performance review",
    ],
    [
      "GV.02",
      "Assign responsibility for organizational data and decisions about its handling.",
      "Data ownership;Classification;Retention;Quality;Sharing responsibilities",
    ],
    [
      "GV.03",
      "Maintain security and privacy expectations that guide organizational planning and implementation.",
      "Policy standards;Privacy requirements;Applicability;Implementation guidance;Review cadence",
    ],
    [
      "GV.04",
      "Connect security priorities to financial capacity and the consequences of funding choices.",
      "Baseline costs;Investment justification;Budget limits;Scenarios;Funding dependencies",
    ],
    [
      "ID.01",
      "Understand the assets and services that security activities must support.",
      "Asset ownership;Inventory scope;Service dependencies;Lifecycle;Criticality",
    ],
    [
      "ID.02",
      "Identify weaknesses and improvement needs through assessments, design review and authorized exercises.",
      "Threat modelling;Design review;Assessments;Penetration testing;Improvement planning",
    ],
    [
      "ID.03",
      "Use relevant threat information to inform capability and investment priorities.",
      "Information sources;Relevance;Analysis;Communication;Planning implications",
    ],
    [
      "ID.04",
      "Understand dependencies on third parties and the security expectations associated with their services.",
      "Supplier inventory;Service criticality;Contract expectations;Dependency review;Continuity",
    ],
    [
      "PR.01",
      "Plan protection and management of organizational endpoints and managed devices.",
      "Device coverage;Configuration;Endpoint protection;Management coverage;Operational ownership",
    ],
    [
      "PR.02",
      "Plan how networks support secure communication and separation of services.",
      "Network boundaries;Segmentation;Connectivity;Administration;Coverage gaps",
    ],
    [
      "PR.03",
      "Identify and prioritize remediation of weaknesses in supported systems.",
      "Discovery;Prioritization;Remediation ownership;Workload;Remediation progress",
    ],
    [
      "PR.04",
      "Maintain deliberate security configurations for supported technologies.",
      "Configuration baselines;Hardening;Change ownership;Deployment coverage;Exceptions in planning",
    ],
    [
      "PR.05",
      "Plan protection of information through appropriate cryptographic capabilities and ownership.",
      "Data protection;Key management responsibilities;Encryption coverage;Lifecycle;Recovery dependencies",
    ],
    [
      "PR.06",
      "Address security needs associated with mobile devices and mobile access used by the organization.",
      "Organizational mobile assets;Access;Data handling;Device lifecycle;Ownership",
    ],
    [
      "PR.07",
      "Plan physical protection of facilities, equipment and supporting services.",
      "Facilities;Physical access;Environmental dependencies;Equipment protection;Continuity",
    ],
    [
      "PR.08",
      "Manage identity and access responsibilities across people, systems and services.",
      "Identity lifecycle;Access ownership;Privileged access;Authentication capabilities;Access review workload",
    ],
    [
      "PR.09",
      "Understand and reduce unwanted loss or disclosure of organizational information.",
      "Data movement;Coverage;Handling processes;Response responsibilities;Technology utilization",
    ],
    [
      "PR.10",
      "Develop and sustain security knowledge appropriate to organizational responsibilities.",
      "Awareness;Role-specific learning;Skills;Training workload;Participation measurement",
    ],
    [
      "PR.11",
      "Address threats to organizational identity, reputation and public-facing presence.",
      "Public presence;Impersonation;External dependencies;Response ownership;Monitoring scope",
    ],
    [
      "PR.12",
      "Integrate security responsibilities into development and delivery of software and services.",
      "Development lifecycle;Design;Delivery pipelines;Application dependencies;Remediation ownership",
    ],
    [
      "PR.13",
      "Plan security capabilities for organizational use of cloud services.",
      "Shared responsibilities;Cloud inventory;Configuration;Access;Service dependencies",
    ],
    [
      "PR.14",
      "Address security and lifecycle needs of connected organizational devices.",
      "Device inventory;Ownership;Connectivity;Lifecycle;Support constraints",
    ],
    [
      "PR.15",
      "Plan security responsibilities and coverage for software-as-a-service dependencies.",
      "Service ownership;Access;Data handling;Supplier dependencies;Utilization",
    ],
    [
      "PR.16",
      "Address security needs of operational and industrial technologies within service constraints.",
      "Operational assets;Safety dependencies;Connectivity;Lifecycle;Specialist expertise",
    ],
    [
      "PR.17",
      "Understand security needs associated with organizational use or operation of AI systems.",
      "System inventory;Data dependencies;Ownership;Technology exposure;Planning requirements",
    ],
    [
      "DE.01",
      "Plan collection and availability of security-relevant logs needed by the program.",
      "Log sources;Coverage;Retention;Operational ownership;Platform costs",
    ],
    [
      "DE.02",
      "Use security observations to identify activity that requires assessment or response.",
      "Detection coverage;Triage;Monitoring workload;Technology utilization;Escalation responsibilities",
    ],
    [
      "RR.01",
      "Organize the people, processes and technology needed for security operations.",
      "Operating model;Coverage;Workload;Skills;Technology dependencies",
    ],
    [
      "RR.02",
      "Prepare and coordinate responsibilities for responding to security incidents.",
      "Preparation;Coordination;Response roles;Service dependencies;Learning and improvement",
    ],
    [
      "RR.03",
      "Plan continuity and recovery of critical organizational services.",
      "Critical services;Recovery dependencies;Continuity responsibilities;Resource requirements;Recovery readiness",
    ],
  ].map(([code, description, subjects]) => [
    code,
    { description, subjects: subjects.split(";") },
  ]),
) as Record<string, { description: string; subjects: string[] }>;
