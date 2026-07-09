# Serveless

Serverless monorepo using pnpm workspaces, deploying to AWS Lambda.

## Project Structure

- `apps/frontend` — React 19 SPA (Vite, TanStack Router file-based routes, TanStack Query, Tailwind CSS v4, i18next, aws-amplify for Cognito auth)
- `apps/api` — Express 5 API wrapped with `@codegenie/serverless-express` for Lambda; Drizzle ORM + Neon Postgres; invoice PDFs rendered with pdfmake and served via S3 presigned URLs
- `packages/shared` — `@serveless/shared`: shared types and zod schemas used by both apps
- `infrastructure/terraform/` — AWS infrastructure (Lambda, API Gateway HTTP API + Cognito JWT authorizer, Cognito user pool with post-confirmation trigger, S3 invoices bucket). The `enviroments/` spelling is intentional.

## Commands

- `pnpm dev` — Start all apps in dev mode
- `pnpm --filter frontend dev` / `build` / `lint` — Frontend dev server (port 5173) / build / lint
- `pnpm --filter api typecheck` — Typecheck the API
- `pnpm --filter api package` — Build the API and zip `lambda.zip` for deployment
- `pnpm --filter api db:generate` / `db:migrate` — Drizzle migrations
- Deploy: from `infrastructure/terraform/`, `terraform apply -var-file=enviroments/dev.tfvars` with `TF_VAR_database_url` exported from the git-ignored `apps/api/.env` (never commit or print the connection string)

## Tech Stack

- **Package manager:** pnpm 11+ (workspaces)
- **Frontend:** React 19, Vite 7, TanStack Router + Query, Tailwind CSS 4, zustand, lucide-react
- **API:** Express 5, Drizzle ORM, `@neondatabase/serverless`, tsup, TypeScript 6
- **Infrastructure:** Terraform (AWS Lambda, API Gateway, Cognito, S3)
- **Linting:** ESLint 10

## Conventions

- ESM throughout (`"type": "module"` in all packages)
- Shared types and zod schemas live in `packages/shared`; **zod must never be a direct dependency of `apps/api`**
- Every environment (including local dev) authenticates through API Gateway's Cognito JWT authorizer — there is no local auth bypass
- API repositories select explicit column lists; internal `id` and `cognitoSub` must never appear in a response
- Icons are individual named imports from lucide-react via the `@/UI/helpers` barrel — never a bundled `Icons` const object; brand marks (e.g. GoogleMark) stay as local inline SVGs
