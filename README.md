# Program Compass

Internal cybersecurity strategic planning application. The application includes recorded capability assessments, current and target maturity, operational KPIs, analytics, CSV exports, organizational configuration, accounts and change history. Other business modules remain placeholders. Authentication is temporarily disabled at the owner's request; all visitors can access and edit the site until restoration is requested.

Use Node 24 and npm ci. Follow [DEPLOYMENT.md](docs/DEPLOYMENT.md) for the existing Vercel/Neon configuration, environment variables, controlled migrations, seed and first administrator provisioning. Run npm run dev after configuring ignored .env.local. Local and CI builds succeed without credentials. Vercel deployments apply reviewed migrations and idempotent seeds as documented in DEPLOYMENT.md. The application uses the configured PostgreSQL database at runtime.

Read [PROJECT_STATUS.md](docs/PROJECT_STATUS.md), [ARCHITECTURE.md](docs/ARCHITECTURE.md), [PROJECT_SCOPE.md](docs/PROJECT_SCOPE.md), [FUNCTIONAL_REQUIREMENTS.md](docs/FUNCTIONAL_REQUIREMENTS.md), [IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) and [DECISION_LOG.md](docs/DECISION_LOG.md) before development. The capability slice is a partial R1 delivery. Additional business slices and navigation restructuring still require approval.

Validation and browser/database test procedures are in [TESTING.md](docs/TESTING.md). Backend conventions and role matrix are in ARCHITECTURE; implemented entities and future relationships are in [DATA_MODEL.md](docs/DATA_MODEL.md).
