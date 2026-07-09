output "api_id" {
  description = "The ID of the HTTP API"
  value       = aws_apigatewayv2_api.http.id
}

output "api_endpoint" {
  description = "Base invoke URL of the HTTP API"
  value       = aws_apigatewayv2_api.http.api_endpoint
}

output "lambda_function_name" {
  description = "Name of the API Lambda function"
  value       = aws_lambda_function.api.function_name
}
