# Deployment and operator setup

Existing private GitHub repository: https://github.com/araidata/program-compass. Vercel project: https://vercel.com/araidatas-projects/program-compass (prj_iPiolnA0tpGsLKIswoR4sqCKuz10). Native Git integration uses main for production and branch previews. Node 24.x, npm ci, npm run build. Local and CI builds never access the database. Under the owner-approved C-06/C-07 exception, Vercel Preview and Production builds apply committed migrations and idempotent seeds before compiling.

## Configured Neon resources

- Production: program-compass-db, icy-glade-34064187, store_w8fl7pQma4iXITE0.
- Preview and Development: program-compass-nonproduction-db, sweet-grass-59000904, store_mm7QjAOeohmYqx2r. Shared synthetic-only nonproduction data; production has a different endpoint/project.
- Native installation icfg_FF0QvneJ3xoXzt7QYyXtWSvU, Free plan, iad1. Neon managed Auth and Realtime disabled. Do not recreate these resources.

Use the authenticated Vercel CLI if the connector incorrectly returns no projects. Run npx vercel project inspect program-compass --scope araidatas-projects before mutations. The checkout is linked in ignored .vercel/project.json.

## Environment

DATABASE_URL is the pooled Neon URL; DATABASE_URL_UNPOOLED is the integration’s direct URL. DIRECT_URL is explicitly mapped from that direct URL in each environment (Production/Preview are Secrets). DATABASE_ENVIRONMENT is production, preview, or development. BETTER_AUTH_SECRET is a distinct random secret in each environment. BETTER_AUTH_URL is an exact trusted origin. No NEXT_PUBLIC database/auth secrets.

Production origin is https://program-compass.vercel.app. Preview origin is the stable delivery branch alias https://program-compass-git-codex-foundation-60b971-araidatas-projects.vercel.app. Other preview branches must set their own branch-scoped BETTER_AUTH_URL; when authentication is restored, arbitrary preview hosts are not trusted automatically. Development origin is http://localhost:3000; browser tests explicitly use http://127.0.0.1:3100.

Pull Development variables with npx vercel env pull .env.local --environment development --scope araidatas-projects. Prisma and scripts load .env.local then .env without overwriting process environment. Keep these files ignored. After changing a Neon resource/credentials, refresh DIRECT_URL and local variables. Never copy production credentials into Preview/Development.

## Controlled migrations

1. Review schema and generated SQL. Create migrations with npm run db:migrate:dev only on an isolated Development database; never accept a reset of a shared database.
2. Apply committed additive migrations using npm run db:migrate:deploy; inspect npm run db:status.
3. Run npm run db:seed. It seeds the three pillars, separate Architecture/Engineering functions and singleton configuration; reruns preserve configured values.
4. For production, securely supply the Production DIRECT_URL, set DATABASE_ENVIRONMENT=production and ALLOW_PRODUCTION_MIGRATION=true in the operator process. Apply the same reviewed migration and seed after nonproduction validation. Unset the acknowledgement afterward. Never run reset or db push against production.

## First administrator

With the chosen environment configured and migrations/seed applied, run npm run db:admin in a terminal. Enter the name, email and 15–128-character password; the password prompt is hidden. It refuses when users already exist and has no HTTP equivalent/default credentials. Production additionally needs the acknowledgement above. Automation may supply INITIAL_ADMIN_NAME, INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD securely through process environment, never command-line arguments, committed files or logs. Sign in at /login, then use Settings to create other accounts. Transfer initial passwords securely outside the application.

Password self-change is supported by authenticated POST /api/auth/change-password (currentPassword, newPassword, revokeOtherSessions=true); no email-based reset delivery is configured. Public registration and other unneeded auth endpoints return 404.

## Release

Push the delivery branch, review its PR, inspect the native Vercel preview and merge through the existing workflow. Environment changes apply on the next deployment. Production application rollout remains tied to merging main; do not promote unreviewed previews. Run the checks in TESTING.md before delivery.

## Current authentication and demo lifecycle

Authentication remains disabled by explicit owner instruction. `/login` redirects to the overview; all pages and APIs allow anonymous administrative access. Account/session infrastructure remains intact for restoration using `src/lib/auth-mode.ts`. JSON/content-type and strict field validation remain active; mutation Origin restrictions are suspended with authentication. Restore login only at the owner's request.

`scripts/build.mts` invokes installed tools through Node on Windows and Linux. On Vercel it runs migrate deploy, the catalogue seed and synthetic seed with `--if-empty` (production also passes `--allow-production`). A failed preparation/build leaves the previous application deployment serving, although database changes already applied persist. Only additive migrations belong in this sequence.

Automatic demo loading skips databases with recorded assessments, targets, KPI values, user change history or demo lifecycle events. Seeding is transactional and serialized with demo cleanup. To remove demo values, run `npm run db:demo:clear` with the selected database's operator environment; production requires `DATABASE_ENVIRONMENT=production ALLOW_PRODUCTION_MIGRATION=true`. Cleanup preserves edited topics and unmarked records, records `demo.cleared` so deployments do not repopulate the demo, and only deletes unused functions whose IDs were recorded as demo-created. Older demos lack those function IDs: their functions are retained. Never run the cleanup against a database selected only by a copied connection string or reset the database. Existing demo data is preserved by this release.

## Owner-requested unrestricted access - 2026-11-24

Application authentication, role checks and mutation Origin restrictions are disabled until the owner explicitly requests restoration. Vercel project `ssoProtection` is null, and password protection/trusted-IP restrictions are absent. This opens deployment URLs as well as the stable production site. Input validation, JSON requirements and transaction integrity remain; existing accounts are preserved. Changing `src/lib/auth-mode.ts` back to false restores the application login/role/canonical-Origin guards; re-enable Vercel project SSO protection separately only when requested.

Share https://program-compass.vercel.app for normal use. Deployment-specific addresses are pinned to immutable builds: an old deployment retains its old code even when main is updated. The reported all-fields-revert bug was a 403 from the old canonical-only Origin check when editing through a deployment-specific address. Updated builds skip this access restriction while open access is requested.
