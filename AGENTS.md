# Codex development instructions

Read docs/ARCHITECTURE.md (the authoritative shared requirements), docs/PROJECT_SCOPE.md, and docs/IMPLEMENTATION_PLAN.md before making changes. Preserve existing files and work. Stay within the authorized phase; Phase 0 ends at the application foundation.

Use npm and the committed lockfile. Keep UI modular and accessible. Do not add data collection or business workflows to placeholders. Before delivery run npm run lint, npm run typecheck, npm run format:check, npm run db:validate, and npm run build without database credentials. Verify all navigation routes and responsive navigation. Review staged changes for secrets; never commit .env files except .env.example. Record changes to architectural decisions in docs/ARCHITECTURE.md rather than duplicating requirements here.
