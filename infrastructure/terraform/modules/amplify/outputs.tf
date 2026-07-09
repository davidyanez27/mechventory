output "app_id" {
  description = "The Amplify app ID"
  value       = aws_amplify_app.this.id
}

output "default_domain" {
  description = "The default *.amplifyapp.com domain for the app"
  value       = aws_amplify_app.this.default_domain
}

output "branch_url" {
  description = "Live HTTPS URL of the deployed branch"
  value       = "https://${aws_amplify_branch.this.branch_name}.${aws_amplify_app.this.default_domain}"
}
