# Information architecture and UI/UX review

Status: **approved by Aaron on 2026-11-24** (DECISION_LOG P-01 to P-13). The accepted conventions are in [ARCHITECTURE.md](ARCHITECTURE.md), which remains the single authoritative source; this document keeps the findings and rationale. Specifics listed as still open in DECISION_LOG.md, and the questions in section 8, still need decisions.

Review date: 2026-11-24. Inputs: CLAUDE.md, AGENTS.md, every file in `docs/`, the Phase 0 shell (`src/components/app-shell.tsx`, `src/lib/navigation.ts`, `src/app/`), and the reference application at spm.threat-modeling.com, used as a functional reference only.

## 1. Summary of recommendations

1. **Group the navigation by job, not by consulting sequence.** Replace the flat list of ten items with four labelled groups: Overview, Assess, Plan, Resources, plus Reporting and Settings. Rename vague modules ("Current State" becomes "Capabilities").
2. **Make the pillar a global scope, not a page.** One control in the header switches every module between the enterprise view and one of the three pillars, held in the URL so that views can be shared and bookmarked.
3. **Use one page template for every module.** Header with title, scope, and primary action; a strip of summary figures; view tabs; a filter bar; a dense table; and a side panel for detail and editing. Learning one module teaches all of them.
4. **Design data entry for speed.** Keyboard-driven rating grids, autosave with a visible saved state, bulk edit, CSV import for people and technology, and pickers for owners instead of free text.
5. **Connect analysis to action.** Every chart drills down to a filtered table, every gap shows whether an initiative covers it, and every initiative shows whether the workforce can deliver it.
6. **Replace the visual direction.** Drop the dark teal slab sidebar, hero banner, taglines, eyebrow labels, and decorative icons. Adopt a light, neutral, high-density enterprise look with one accent colour, a proper UI typeface with tabular numbers, and a reserved colour for each pillar.

## 2. Findings on the Phase 0 foundation

Aaron asked that the existing UI not be treated as a baseline, so these findings explain what to avoid rather than what to keep.

### 2.1 Navigation and structure

- **Flat list of ten items in process order.** Business Context → Current State → … → Settings reads as a consulting engagement sequence. Day-to-day users jump between assessment, planning, and resourcing, so the order does not match how the app will be used, and ten ungrouped items are slow to scan.
- **Pillars are invisible outside the dashboard.** The three pillars are a core organizational requirement (ARCHITECTURE.md), yet only the dashboard mentions them. No module has a pillar context.
- **Vague module names.** "Current State" does not say what is assessed. "People & Resources" mixes workforce with budget. "Strategic Planning" and "Business Context" overlap: objectives belong to both.
- **Active state uses exact path match.** Nested routes such as `/capabilities/detect` will lose the highlight once modules have sub-pages.
- **Breadcrumb adds nothing.** "Workspace / Dashboard" repeats the page title, and every page sits under the same "Workspace".
- **Settings is a catch-all.** Reference data (pillars, capability catalogue, frameworks, maturity scale) will need a clear home that is separate from personal preferences.

### 2.2 Visual design and density

- **Promotional content in an internal tool.** The sidebar carries a logo tile and the tagline "Strategy into direction". The footer and the sidebar footer repeat "Cybersecurity strategy and resource planning". The dashboard opens with a hero banner ("A clear direction starts here.") and a 288 px watermark compass. These conflict with the brief.
- **Two different taglines.** PROJECT_SCOPE.md and README.md say "Cybersecurity strategy and resource planning"; the shell says "Strategy into direction".
- **Low density.** 288 px sidebar, 80 px header, 12 px vertical padding per nav item, `py-12` page padding, and a `max-w-7xl` content cap. On a 1440 px screen roughly 40% of the width goes to chrome and margins before any table appears.
- **Placeholder pages are mostly empty space.** A 320 px tall card with "The foundation is in place." and a decorative icon.
- **Status pill looks like system health.** The "Foundation" pill with a green dot in the header reads as an uptime indicator.
- **Icon mismatch.** The dashboard uses the "Users" icon for Governance, Risk & Compliance.
- **Incoherent colour tokens.** `globals.css` defines the shadcn neutral palette, then a second `:root` block overrides only some tokens, while components use hard-coded `teal-*` and `slate-*` utilities that bypass the tokens. `primary` stays near-black while the accent is teal. Dark mode tokens exist but the sidebar colour is hard-coded.
- **Typography.** Arial, no tabular numerals for figures, and 10 px uppercase letter-spaced labels that are hard to read.

### 2.3 Lessons from the reference application

Worth adopting, in Program Compass's own form:

- A **targets table** per capability with current, target, gap, target date, accountable owner, last reviewed, and covering initiatives, with ready-made filters: below target, gap not covered by an initiative, review due or overdue, no owner, no target.
- A **review cadence** that flags stale assessments.
- **Threats × objectives** linkage to show which business objectives depend on which capabilities.
- **Inherent versus residual** risk views with a heat map that filters the register when a cell is clicked.
- **Initiatives with expected uplift** on linked capabilities, viewable as a roadmap or a list.
- **Selecting a person shows everything they own.**

To avoid:

- Free-text owners matched by name or role, which break when people or roles change.
- Long forms in modals; data that lives only in the browser; a one-click reset.
- A matrix that needs horizontal scrolling to see all functions.
- Unexplained zeros and dashes in empty states; abbreviations ("weakest · avg") with no legend; unlabelled scales.
- Overlap between "Current state" and "Direction & roadmap", which both show maturity.
- **No workforce or capacity planning** at all. This is Program Compass's clearest differentiator and should be designed as a first-class workflow.

## 3. Proposed information architecture

### 3.1 Navigation

| Group     | Item (route)                   | Replaces             | Purpose                                                                                            |
| --------- | ------------------------------ | -------------------- | -------------------------------------------------------------------------------------------------- |
| —         | Overview (`/`)                 | Dashboard            | Program position for the current scope: gaps, coverage, capacity, top risks, what needs attention. |
| Assess    | Capabilities (`/capabilities`) | Current State        | Capability catalogue by pillar, current and target maturity, assessment cycles.                    |
| Assess    | Compliance (`/compliance`)     | Compliance           | Framework requirements, their mapping to capabilities, and coverage status.                        |
| Assess    | Risks & Findings (`/risks`)    | Risks & Findings     | Risk and finding registers, heat map, ageing.                                                      |
| Plan      | Business Context (`/context`)  | Business Context     | Business objectives, threat landscape, and which capabilities they depend on.                      |
| Plan      | Roadmap (`/roadmap`)           | Strategic Planning   | Initiatives, their timing, expected uplift, and the gaps and risks they address.                   |
| Resources | Workforce (`/workforce`)       | People & Resources   | People, positions, allocation, skills, and supply versus demand by pillar.                         |
| Resources | Technology (`/technology`)     | Technology Portfolio | Security tools, cost, lifecycle, and the capabilities they support.                                |
| —         | Reports (`/reports`)           | Reporting            | Composed board and management packs. Single-module exports live inside each module.                |
| —         | Settings (`/settings`)         | Settings             | Reference data (pillars, catalogue, frameworks, scales), users and roles, preferences.             |

Ten destinations remain, so scope does not change, but they sit under three short group labels and Settings is pinned to the bottom of the sidebar. Route renames are proposed and need approval (DECISION_LOG P-01).

Business Context sits in **Plan** because objectives and threats are the input to prioritization, not an assessment result. An alternative is to fold it into Roadmap as a tab; that is a scope question for Aaron (P-11).

### 3.2 Enterprise and pillar views

- A **scope switcher** in the header: _Enterprise_ · _Security Operations_ · _Security Architecture & Engineering_ · _Governance, Risk & Compliance_. Short labels in the control: Enterprise, SecOps, SA&E, GRC, with full names in tooltips and page headings.
- The scope is held in the URL (`?pillar=secops`) and kept when moving between modules, so a pillar lead can stay in their pillar all day and a link always opens the same view.
- In Enterprise scope, every summary and table can **group or compare by pillar** (for example, a gap chart with three bars per function). In pillar scope, the same page shows that pillar only, with the enterprise figure for comparison.
- Every record that belongs to a pillar shows a small pillar tag in its colour. Records shared across pillars show "Shared".
- Pillar views are therefore filters on one page, not separate pages. This avoids building and maintaining four copies of each module.

### 3.3 Planning cycle context (needs decision)

Assessments, targets, workforce plans, and roadmaps are all compared over time. A **planning cycle selector** next to the scope switcher (for example "FY2027") would let users view a past cycle read-only and compare against it. This implies cycle or snapshot entities in the Phase 1 schema, so it is recorded as a proposal for the schema discussion, not a decision (P-03).

### 3.4 Cross-module links

Each entity's side panel lists its related records with links: a capability shows its risks, findings, compliance requirements, initiatives, owners, assigned people, and supporting technology. This is what makes the modules feel like one program rather than ten spreadsheets.

## 4. Standard module layout

Every module uses the same structure, top to bottom:

1. **Page header (one line):** title, scope tag, last updated, and at most one primary action (for example "New initiative"), with secondary actions (Export CSV, Import) in a menu.
2. **Summary strip:** four to six figures relevant to the module and scope, each clickable to apply the matching filter. No decorative cards.
3. **View tabs:** for example Capabilities: _Matrix · Targets · Assessment history_. Roadmap: _Timeline · List · Coverage_.
4. **Filter bar:** search, saved filters (the "below target", "no owner" set), and group-by. Filters live in the URL.
5. **Data table:** compact rows (32–36 px), sticky header, sortable columns, column chooser, row selection for bulk edit, right-aligned tabular numbers, pagination or virtualization for long lists.
6. **Side panel:** opens on row click without leaving the table. Shows detail, edit form, related records, and history. Long forms never go in modals; modals are reserved for confirmations.

Empty states say what the module will show and offer the one action that fills it ("Import people from CSV", "Add the first initiative"). Zeros only appear when the true value is zero.

## 5. Workflow recommendations

### 5.1 Capability assessment

1. Choose scope (pillar) and cycle.
2. **Rating grid:** capabilities as rows, columns for current, target, confidence, owner, and last reviewed. Arrow keys move between cells, number keys set the level, Enter opens the side panel for rationale and evidence links. Changes autosave with a visible "Saved" state.
3. Each level shows its definition on hover and in a legend; no unlabelled numbers.
4. **Review state:** draft, submitted, reviewed. Stale ratings are flagged according to a review cadence (the reference app uses 6 and 12 months; the cadence itself is a business rule for Aaron to set).
5. **Results:** gap by pillar and function, distribution, and change since the last cycle.

### 5.2 Strategic planning

The intended chain is **objective → capability gap → initiative → resourcing → roadmap**:

1. Business Context links objectives and threats to the capabilities they depend on.
2. Capabilities shows targets and gaps; the _Coverage_ filter lists gaps with no initiative.
3. Roadmap creates initiatives from a gap (pre-linked), records expected uplift, owner, dates, cost, and effort by pillar.
4. The timeline shows initiatives by quarter, grouped by pillar, with a **capacity overlay** from Workforce so overcommitted quarters are visible before approval.
5. Risks & Findings shows which initiative treats each open item.

### 5.3 Workforce planning

The reference application has nothing here, so this is the area with the most design freedom. Proposed, pending scope confirmation (P-09):

- **Roster:** people and open positions (vacant, planned hire), role, pillar, grade or level, and FTE, with CSV import.
- **Allocation:** each person's FTE split across run work (capabilities they operate) and change work (initiatives), entered as percentages in a grid with a row total that warns above 100%.
- **Supply versus demand:** by pillar and quarter, comparing available FTE with the demand implied by initiatives and capability operations. This is the main analytical view and the bridge to Roadmap.
- **Skills:** a person × skill matrix with proficiency, used to show single points of failure and gaps for target capabilities.
- **Ownership:** selecting a person lists everything they own across modules.

How demand is calculated is a business rule and is **not** decided here.

### 5.4 Compliance and risks

- Compliance requirements map to capabilities. How "met" is derived (for example, the reference app's weakest-mapped-capability rule against a threshold) is a calculation method and must be approved separately (P-10). The UI should always show which rule is in effect.
- Risks keep inherent and residual views. Heat-map cells filter the register; ageing shows overdue findings by owner and pillar.

### 5.5 Reporting

- Each module offers CSV export of the current filtered view and a print-friendly layout.
- Reports composes multi-module packs (board, management, pillar review) for a chosen scope and cycle, with a consistent print and PDF layout.

## 6. Proposed visual direction

Goal: looks fast, precise, and expensive through restraint and alignment, not decoration.

- **Shell:** light sidebar (neutral 50 background, 1 px border), 232 px wide and collapsible to a 56 px icon rail, with group labels in sentence case. Product name as plain text, no tagline, no logo tile. Header 48 px with scope switcher, cycle selector, search, and user menu. Content uses the full width; only long prose is width-limited.
- **Typography:** Inter (or IBM Plex Sans) loaded with `next/font`, 14 px base, 13 px in dense tables, tabular numerals for all figures, three heading sizes only. No uppercase letter-spaced eyebrow labels.
- **Colour:** neutral slate greys for surfaces and text; one accent (a deep blue) for links, focus, selection, and primary buttons. **Status colours** (red, amber, green, plus grey for not assessed) are used only for status and always paired with a label or icon. **Pillar colours** are a separate reserved set (proposed: Security Operations blue-indigo, Security Architecture & Engineering teal, Governance, Risk & Compliance violet), used only for pillar tags and pillar series in charts. Exact values to be checked for contrast (WCAG AA) during implementation. All colours defined as tokens once; no hard-coded utility colours in components.
- **Surfaces:** borders rather than shadows, 6 px radius, 4 px spacing grid, consistent 16 or 24 px page gutters.
- **Charts:** Recharts with the same tokens, direct labels where possible, every chart paired with an accessible table and a drill-down.
- **Motion:** none beyond 150 ms state transitions; side panel slides in.
- **Dark mode:** supported by tokens from the start, shipped later if wanted.
- **Responsive:** full functionality from 1280 px; tablet keeps tables with fewer default columns; phone is optimized for reading (overview, registers as lists, detail panels full-screen) rather than bulk entry.

## 7. Usability risks to watch during implementation

- Wide tables on laptops: use column choosers and sensible defaults rather than horizontal scrolling.
- Pillar and status colours must never be confused; keep them in separate hue families.
- Autosave needs clear conflict handling once several people edit at once.
- Scope and cycle selectors must always be visible, or users will misread figures as enterprise-wide.
- Abbreviations (SA&E, GRC, FTE, CSF) need tooltips and a glossary in Settings.
- Accessibility: keyboard paths for grids, visible focus, 4.5:1 text contrast, no colour-only meaning.

## 8. Open questions for Aaron

1. Which capability catalogue applies: NIST CSF 2.0 functions and categories, a custom catalogue per pillar, or both mapped together?
2. Which maturity scale (for example 0–5 CMMI-style), and is there a confidence or evidence field?
3. Workforce granularity: named people, positions only, or both? Are contractors and managed services included?
4. Will multiple people edit at once (affects review states and conflict handling)?
5. Is Business Context a module of its own or a tab of Roadmap?
