# Codex development instructions

Read docs/ARCHITECTURE.md (the authoritative shared requirements), docs/PROJECT_SCOPE.md, and docs/IMPLEMENTATION_PLAN.md before making changes. Preserve existing files and work. Stay within the authorized phase recorded in docs/PROJECT_STATUS.md. Phase 0 ended at the application foundation.

Use npm and the committed lockfile. Keep UI modular and accessible. Do not add data collection or business workflows to placeholders. Before delivery run npm run lint, npm run typecheck, npm run format:check, npm run db:validate, and npm run build without database credentials. Verify all navigation routes and responsive navigation. Review staged changes for secrets; never commit .env files except .env.example. Record changes to architectural decisions in docs/ARCHITECTURE.md rather than duplicating requirements here.

Before development, read docs/PROJECT_STATUS.md, docs/FUNCTIONAL_REQUIREMENTS.md and docs/DECISION_LOG.md. Scope, functional requirements and technical architecture have separate authorities. Update PROJECT_STATUS.md after substantive work with completed/partial work, affected files, checks, issues, decisions, configuration needs and next task. Record significant decisions in DECISION_LOG.md and architectural changes in ARCHITECTURE.md.
