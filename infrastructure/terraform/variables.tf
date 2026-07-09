variable "aws_region" {
  description = "The AWS region to deploy resources in"
  type        = string
}

variable "environment" {
  description = "Deployment environment. Prefixes every resource name (e.g. dev-serveless-api) and MUST match the selected Terraform workspace (enforced by terraform_data.workspace_guard in main.tf)."
  type        = string

  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "environment must be \"dev\" or \"prod\"."
  }
}

variable "frontend_urls" {
  description = "Frontend origins allowed for CORS and Cognito callback/logout URLs"
  type        = list(string)
  default     = ["http://localhost:5173"]
}

variable "github_repository" {
  description = "HTTPS URL of the GitHub repo Amplify deploys the frontend from (e.g. https://github.com/user/serveless). Leave empty to skip Amplify entirely."
  type        = string
  default     = ""
}

variable "github_access_token" {
  description = "GitHub personal access token (repo scope) for Amplify to connect the repo. Pass via TF_VAR_github_access_token; never commit. Only used when github_repository is set."
  type        = string
  sensitive   = true
  default     = ""
}

variable "frontend_branch" {
  description = "Git branch Amplify builds and auto-deploys"
  type        = string
  default     = "main"
}

variable "api_lambda_zip_path" {
  description = "Override path to the built apps/api Lambda zip. When null, defaults to apps/api/lambda.zip resolved from the repo root (run `pnpm --filter api package` first)."
  type        = string
  default     = null
}

variable "database_url" {
  description = "Neon Postgres pooled connection string for the API Lambda (DATABASE_URL). Required — pass it via TF_VAR_database_url (loaded from the git-ignored apps/api/.env), never commit it. No default on purpose: an apply without it must fail loudly rather than ship a Lambda that crashes at init with 'DATABASE_URL is not set'."
  type        = string
  sensitive   = true

  validation {
    condition     = can(regex("^postgres(ql)?://", var.database_url))
    error_message = "database_url must start with postgres:// or postgresql:// (check for wrapping quotes — export it from apps/api/.env)."
  }
}