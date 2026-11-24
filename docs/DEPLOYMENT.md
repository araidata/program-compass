# GitHub, Vercel, and Neon deployment

## Import the foundation

1. In the intended Vercel account/team, choose **Add New → Project** and import the existing private repository https://github.com/araidata/program-compass. Grant the Vercel GitHub app access to that repository if needed; do not create another repository.
2. Use the Next.js framework preset, repository root (`.`), npm, Node.js 24.x, install command `npm ci`, build command `npm run build`, and the default output directory. Select `main` as the production branch.
3. Leave database variables unset for the initial deployment. The foundation neither connects to a database nor requires authentication configuration. Deploy and verify the Overview page plus all nine placeholder modules at desktop and mobile widths.
4. Future pushes to main use Vercel Git deployment; branches receive previews. Configure branch protection and deployment checks according to the team's release policy.

## Connect Neon after import (separate configuration step)

1. Open the imported project's **Storage / Marketplace** and select the native **Neon PostgreSQL** integration. Choose the intended account, plan, and a region near the application. Provisioning is intentionally not performed in Phase 0.
2. Connect the database to the intended Vercel environments. Keep preview/development data isolated from production. Inspect the integration's variable names in Vercel settings without copying credentials into documentation or chat.
3. Map the pooled connection to `DATABASE_URL` and the unpooled/direct connection to `DIRECT_URL`, preserving Neon's SSL settings. Some integration configurations supply a differently named direct variable; map it explicitly. Never prefix database credentials with `NEXT_PUBLIC_`.
4. For local work, copy `.env.example` to an ignored `.env` file and populate it securely, or use `vercel env pull .env.local`. Prisma CLI configuration loads `.env`; if using `.env.local`, invoke Prisma through `dotenv-cli` or load those variables into the shell rather than committing them.
5. Redeploy after Vercel environment changes. The shell still does not access a database. A later authorized phase must add approved models, a compatible PostgreSQL driver adapter and server-only client, reviewed migrations, native authentication, and server-side authorization before data-backed functionality is enabled.

Never run migrations in `npm run build`. With an approved schema, run `npm run db:migrate:dev` against development only, review and commit migration SQL, then run `npm run db:migrate:deploy` as a controlled release step using the direct connection. No migration exists in Phase 0.

## Verification

Run `npm ci`, `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm run db:validate`, `npm run build`, and `npm run test:e2e`. The browser tests start the production server on loopback port 3100. Install Chromium first with `npx playwright install chromium`. Confirm an unknown route returns 404 and that mobile navigation closes after selection.

## References

- [Vercel GitHub integration](https://vercel.com/docs/git/vercel-for-github)
- [Vercel PostgreSQL Marketplace integrations](https://vercel.com/docs/postgres)
- [Prisma configuration](https://www.prisma.io/docs/orm/reference/prisma-config-reference)
- [shadcn/ui with Next.js](https://ui.shadcn.com/docs/installation/next)
