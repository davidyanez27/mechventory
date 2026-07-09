variable "name" {
  description = "Base name for the API Gateway and Lambda resources"
  type        = string
}

variable "aws_region" {
  description = "AWS region (used to build the Cognito issuer URL)"
  type        = string
}

variable "lambda_role_arn" {
  description = "IAM role ARN the API Lambda assumes"
  type        = string
}

variable "cognito_user_pool_id" {
  description = "Cognito User Pool ID backing the JWT authorizer"
  type        = string
}

variable "cognito_client_id" {
  description = "Cognito App Client ID — used as the JWT audience"
  type        = string
}

variable "allowed_origins" {
  description = "Origins allowed by API Gateway CORS (the frontend URLs)"
  type        = list(string)
  default     = ["http://localhost:5173"]
}

variable "lambda_zip_path" {
  description = "Path to the prebuilt apps/api Lambda zip (run `pnpm --filter api package` first)."
  type        = string
}

variable "lambda_handler" {
  description = "Lambda handler entrypoint"
  type        = string
  default     = "index.handler"
}

variable "lambda_runtime" {
  description = "Lambda runtime"
  type        = string
  default     = "nodejs22.x"
}

variable "database_url" {
  description = "Neon Postgres pooled connection string, injected as the DATABASE_URL env var. Required — the API Lambda crashes at init without it."
  type        = string
  sensitive   = true
}

variable "invoices_bucket" {
  description = "S3 bucket name where the API stores generated invoice PDFs, injected as the INVOICES_BUCKET env var."
  type        = string
}
