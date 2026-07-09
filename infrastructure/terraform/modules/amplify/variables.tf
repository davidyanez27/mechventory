variable "name" {
  description = "Name of the Amplify app (already environment-prefixed by the caller)"
  type        = string
}

variable "repository" {
  description = "HTTPS URL of the GitHub repository Amplify builds from"
  type        = string
}

variable "access_token" {
  description = "GitHub personal access token (repo scope) so Amplify can clone the repo and register its webhook"
  type        = string
  sensitive   = true
}

variable "branch" {
  description = "Git branch Amplify builds and auto-deploys"
  type        = string
  default     = "main"
}

variable "stage" {
  description = "Amplify branch stage label (PRODUCTION, DEVELOPMENT, etc.)"
  type        = string
  default     = "PRODUCTION"
}

variable "environment_variables" {
  description = "Build-time environment variables baked into the Vite bundle (VITE_*)"
  type        = map(string)
  default     = {}
}
