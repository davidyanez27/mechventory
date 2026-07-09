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