# Testing

Use Node 24 and npm ci. Run npm run lint, npm run typecheck, npm run format:check, npm run db:validate, npm test and npm run build. Verify the first five required checks with DATABASE_URL, DIRECT_URL and local env files absent; builds generate Prisma without connecting or migrating.

For browser/database tests install Chromium with npx playwright install chromium. Configure the dedicated nonproduction Development URLs and BETTER_AUTH_SECRET in ignored .env.local, set RUN_DATABASE_TESTS=true and run npm run test:e2e after building. The suite refuses any DATABASE_ENVIRONMENT other than development and uses the production server on loopback port 3100. It creates random synthetic accounts and removes only its own users/history afterward. Rate-limit state in this isolated test database is cleared between tests. Never point this suite at production or real organizational data.

Unit tests cover permission matrix/unknown-role denial, strict validation and salted password verification. Browser/API integration tests cover all navigation routes at desktop/mobile widths, retained pillar scope, responsive drawer/overflow, login/logout, failed login and database rate limiting, expired sessions, deactivation/reactivation, administrator-only page/API access, registration rejection, CSRF origin rejection, account persistence/hash/history and invalid/privilege-smuggling inputs. Database migration/seed are exercised against actual Neon PostgreSQL. Inspect test-results screenshots after shell changes.

Review git diff --cached and staged filenames for database URLs, passwords, tokens, private keys, real data and env files (only .env.example may be committed). Record actual results and any unexecuted checks in PROJECT_STATUS.md.
