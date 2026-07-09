output "lambda_role_arn" {
  value = aws_iam_role.lambda_role.arn
}

output "cognito_user_pool_id" {
  description = "VITE_COGNITO_USER_POOL_ID"
  value       = module.cognito.user_pool_id
}

output "cognito_client_id" {
  description = "VITE_COGNITO_CLIENT_ID"
  value       = module.cognito.client_id
}

output "api_endpoint" {
  description = "VITE_API_URL"
  value       = module.api_gateway.api_endpoint
}