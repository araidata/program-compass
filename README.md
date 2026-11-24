# Program Compass

Internal cybersecurity strategic planning application. The approved shell is preserved; native login, server authorization, administrator-managed accounts, organizational configuration and change history now form the secure persistence foundation. Business modules remain placeholders.

Use Node 24 and npm ci. Follow [DEPLOYMENT.md](docs/DEPLOYMENT.md) for the existing Vercel/Neon configuration, environment variables, controlled migrations, seed and first administrator provisioning. Run npm run dev after configuring ignored .env.local. Builds succeed without credentials; runtime login requires the configured database and auth secret.

Read [PROJECT_STATUS.md](docs/PROJECT_STATUS.md), [ARCHITECTURE.md](docs/ARCHITECTURE.md), [PROJECT_SCOPE.md](docs/PROJECT_SCOPE.md), [FUNCTIONAL_REQUIREMENTS.md](docs/FUNCTIONAL_REQUIREMENTS.md), [IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) and [DECISION_LOG.md](docs/DECISION_LOG.md) before development. The request’s Phase 4 label maps to repository Phase 1 secure persistence. Stop before implementing future business functionality.

Validation and browser/database test procedures are in [TESTING.md](docs/TESTING.md). Backend conventions and role matrix are in ARCHITECTURE; implemented entities and future relationships are in [DATA_MODEL.md](docs/DATA_MODEL.md).
