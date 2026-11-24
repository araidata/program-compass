# Testing

Use Node.js 24 and npm lockfile. Run npm ci; npm run lint; npm run typecheck; npm run format:check; npm run db:validate; npm run build; npx playwright install chromium; npm run test:e2e. Run checks with DATABASE_URL and DIRECT_URL absent. Build generates Prisma but never connects or migrates.

Browser tests start a production server on loopback port 3100. They verify dashboard, all nine navigation routes, headings, placeholder notices, drawer closing, overflow, console errors and 404 handling on desktop/mobile. Inspect screenshots after shell changes. Future calculation tests must independently validate documented formulas and edge cases.

Review git diff --cached and staged filenames for credentials, private keys, real organizational data and environment files other than .env.example. Record actual results/limitations in PROJECT_STATUS.md; never mark unrun checks as passed.
