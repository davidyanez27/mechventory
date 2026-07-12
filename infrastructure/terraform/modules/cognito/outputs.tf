output "user_pool_id" {
  description = "The ID of the Cognito User Pool"
  value       = aws_cognito_user_pool.this.id
}

output "user_pool_arn" {
  description = "The ARN of the Cognito User Pool"
  value       = aws_cognito_user_pool.this.arn
}

output "client_id" {
  description = "The ID of the Cognito User Pool Client"
  value       = aws_cognito_user_pool_client.this.id
}

output "hosted_ui_domain" {
  description = "Cognito Hosted UI domain FQDN for OAuth (empty when Google sign-in is disabled)"
  value       = local.google_enabled ? "${aws_cognito_user_pool_domain.this[0].domain}.auth.${var.aws_region}.amazoncognito.com" : ""
}