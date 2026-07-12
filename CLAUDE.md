# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Serveless

Serverless monorepo using pnpm workspaces, deploying to AWS Lambda.

## Project Structure

- `apps/frontend` — React 19 SPA (Vite, TanStack Router file-based routes, TanStack Query, Tailwind CSS v4, i18next, aws-amplify for Cognito auth)
- `apps/api` — Express 5 API wrapped with `@codegenie/serverless-express` for Lambda; Drizzle ORM + Neon Postgres; invoice PDFs rendered with pdfmake and served via S3 presigned URLs
- `packages/shared` — `@serveless/shared`: shared types and zod schemas used by both apps, split into module subpaths (`@serveless/shared/user`, `/common`, `/invoice`, …)
- `infrastructure/terraform/` — AWS infrastructure (Lambda, API Gateway HTTP API + Cognito JWT authorizer, Cognito user pool with post-confirmation trigger, S3 invoices bucket, Amplify). The `enviroments/` spelling is intentional.

## Commands

- `pnpm dev` — Start all apps in dev mode
- `pnpm --filter frontend dev` / `build` / `lint` — Frontend dev server (port 5173) / build / lint
- `pnpm --filter frontend format` / `check` — Prettier `--check` / auto-fix (`prettier --write` + `eslint --fix`); the frontend has no standalone `typecheck` script — `build` is the type-check path
- `pnpm --filter api typecheck` — Typecheck the API
- `pnpm --filter api package` — Build the API and zip `lambda.zip` for deployment
- `pnpm --filter api db:generate` / `db:migrate` / `db:push` / `db:studio` — Drizzle migrations (point `DATABASE_URL` at the **direct**, non-pooled Neon endpoint)
- Deploy: from `infrastructure/terraform/`, `terraform apply -var-file=enviroments/dev.tfvars` with `TF_VAR_database_url` exported from the git-ignored `apps/api/.env` (never commit or print the connection string)

### Tests

- `pnpm --filter api test` / `pnpm --filter frontend test` — Run the suite (both use Vitest; `vitest run`)
- Single file: `pnpm --filter api test tests/middleware/identity.test.ts`
- Single test by name: `pnpm --filter api test -t 'maps a CustomError'`
- Suites live in `apps/<app>/tests/` mirroring `src/` structure — never co-located. API tests run in a `node` env and load `.env.test`; frontend tests run in `jsdom` and pin i18next to English.

## Tech Stack

- **Package manager:** pnpm 11+ (workspaces; config in `pnpm-workspace.yaml`, not `package.json`)
- **Frontend:** React 19, Vite 7, TanStack Router + Query, Tailwind CSS 4, zustand, react-hook-form, lucide-react
- **API:** Express 5, Drizzle ORM, `@neondatabase/serverless`, tsup, TypeScript 6
- **Infrastructure:** Terraform (AWS Lambda, API Gateway, Cognito, S3, Amplify)
- **Linting:** ESLint 10

## API Architecture

- **One zip, two Lambda handlers.** tsup bundles `src/index.ts` → `index.handler` (the Express API via serverless-express) and `src/triggers/post-confirmation.ts` → `post-confirmation.handler` (the Cognito trigger). `@aws-sdk/*` is left external (the runtime ships it); everything else is inlined.
- **Module pattern.** Each feature under `src/modules/<name>/` is exactly three files: `routes.ts` (wires the Router + `requireCompanyRole(...)` guards), `controller.ts` (parses the request body/query with a shared zod schema, reads `req.identity`, calls the repository, shapes the response), and `repository.ts` (all Drizzle queries). Register the router in `src/app.ts` behind `identityMiddleware`.
- **Auth is entirely at the edge.** API Gateway's Cognito JWT authorizer validates every token; there is **no local auth bypass** in any environment. `identityMiddleware` reads the pre-verified claims off the Lambda event, resolves the Cognito `sub` to a DB identity (`{ userId, companyId, companyRole, … }`, cached ~60s), and attaches it as `req.identity`. A federated (Google) first request has no DB rows, so it provisions the workspace on demand (`lib/provisioning.ts`) — native signups get provisioned by the post-confirmation trigger instead.
- **Every query is company-scoped and soft-deleted.** Repositories filter by the `companyId` from `req.identity`; "delete" means setting `isActive = false` (see `deactivate`). Public-facing IDs are the `uuid` column — internal `id`/`cognitoSub` must never appear in a response, so repositories select explicit column lists.
- **Numeric columns are strings.** Drizzle returns Postgres `numeric` (money/quantities) as strings; the API contract is numbers, so convert at the repository edge (`Number(row.total)` in, string out). The invoice flow uses `Pool` (WebSocket) rather than `neon()` (HTTP) because it needs real interactive transactions.
- **Errors** are thrown as `CustomError` (see `lib/errors.ts`) and translated to RFC-7807 problem responses by the ordered middleware chain at the bottom of `app.ts` (zod → custom → pg → cognito → generic 500).

## Frontend Architecture

- **Clean-architecture layering.** `application/` holds framework-free use-cases and abstract repository interfaces; `infrastructure/` holds the concrete `*.datasource.impl.ts` (axios calls) and wires them into `use-cases` exported as a `*UseCases` object; `UI/` holds pages/components/layouts; thin route files in `routes/` mostly render a page. Data fetching goes through TanStack Query hooks in `hooks/`.
- **File-based routes with two guards.** `routes/_auth.tsx` is a *guest* guard (redirects signed-in users to `/dashboard`); `routes/_app.tsx` is an *auth* guard (redirects signed-out users to `/login`). Both call Amplify's `getCurrentUser()` in `beforeLoad`. `routeTree.gen.ts` is generated — don't hand-edit it.
- **The axios client** (`infrastructure/api/api-client.ts`) attaches the Cognito **ID** token per request via `fetchAuthSession()` and redirects to `/login` on a 401. No cookies.
- **Path alias:** `@/*` → `src/*`.

## Conventions

- ESM throughout (`"type": "module"` in all packages)
- Shared types and zod schemas live in `packages/shared`; **zod must never be a direct dependency of `apps/api`** (the API imports the derived *types* only). New shared schemas compose existing ones (`pick`/`omit`/`extend`) rather than redeclaring fields.
- Icons are individual named imports from lucide-react via the `@/UI/helpers` barrel — never a bundled `Icons` const object; brand marks (e.g. GoogleMark) stay as local inline SVGs
