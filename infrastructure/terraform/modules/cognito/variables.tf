variable "user_pool_name" {
  description = "The name of the Cognito User Pool"
  type        = string
}

variable "user_pool_client_name" {
  description = "The name of the Cognito User Pool Client"
  type        = string
}

variable "callback_urls" {
  description = "List of allowed callback URLs for the Cognito User Pool"
  type        = list(string)
}

variable "logout_urls" {
  description = "List of allowed logout URLs for the Cognito User Pool"
  type        = list(string)
}

variable "post_confirmation_lambda_arn" {
  description = "ARN of the Lambda invoked after a signup is confirmed (provisions the user/workspace rows in the DB)"
  type        = string
}

variable "aws_region" {
  description = "AWS region — used to build the Hosted UI domain FQDN (<prefix>.auth.<region>.amazoncognito.com)"
  type        = string
}

variable "google_client_id" {
  description = "Google OAuth 2.0 client ID. Leave empty to skip Google sign-in entirely (no Hosted UI domain, no Google IdP)."
  type        = string
  default     = ""
}

variable "google_client_secret" {
  description = "Google OAuth 2.0 client secret. Pass via TF_VAR_google_client_secret; never commit. Only used when google_client_id is set."
  type        = string
  sensitive   = true
  default     = ""
}

variable "hosted_ui_domain_prefix" {
  description = "Globally-unique prefix for the Cognito Hosted UI domain (e.g. mechventory-dev). Required when google_client_id is set."
  type        = string
  default     = ""
}