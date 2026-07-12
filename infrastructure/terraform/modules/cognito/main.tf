resource "aws_cognito_user_pool" "this" {
  name = var.user_pool_name

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_uppercase = true
    require_numbers   = true
    require_symbols   = false
  }

  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = true
  }

  # Post-confirmation trigger: Cognito invokes this Lambda once per confirmed
  # signup, before the user can log in. It provisions the DB rows.
  lambda_config {
    post_confirmation = var.post_confirmation_lambda_arn
  }
}

locals {
  google_enabled = var.google_client_id != ""
  # Only advertise Google on the client once the IdP actually exists.
  identity_providers = local.google_enabled ? ["COGNITO", "Google"] : ["COGNITO"]
}

# Hosted UI domain — the OAuth redirect endpoint Google bounces through
# (https://<prefix>.auth.<region>.amazoncognito.com/oauth2/idpresponse).
# Only needed for federated sign-in, so it is gated on Google being configured.
resource "aws_cognito_user_pool_domain" "this" {
  count        = local.google_enabled ? 1 : 0
  domain       = var.hosted_ui_domain_prefix
  user_pool_id = aws_cognito_user_pool.this.id

  lifecycle {
    precondition {
      condition     = var.hosted_ui_domain_prefix != ""
      error_message = "hosted_ui_domain_prefix must be set when google_client_id is provided — it becomes the Hosted UI domain <prefix>.auth.<region>.amazoncognito.com."
    }
  }
}

# Google as a federated identity provider. Attribute mapping copies Google's
# email/name onto the Cognito user so the ID token carries them (the API's lazy
# provisioning reads name+email from those claims).
resource "aws_cognito_identity_provider" "google" {
  count         = local.google_enabled ? 1 : 0
  user_pool_id  = aws_cognito_user_pool.this.id
  provider_name = "Google"
  provider_type = "Google"

  provider_details = {
    client_id        = var.google_client_id
    client_secret    = var.google_client_secret
    authorize_scopes = "openid email profile"
  }

  attribute_mapping = {
    email    = "email"
    name     = "name"
    username = "sub"
  }
}

resource "aws_cognito_user_pool_client" "this" {
  name                                 = var.user_pool_client_name
  user_pool_id                         = aws_cognito_user_pool.this.id
  generate_secret                      = false
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["email", "openid", "profile"]

  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
  ]

  callback_urls = var.callback_urls
  logout_urls   = var.logout_urls

  # Google must exist before the client can list it as a supported provider.
  supported_identity_providers  = local.identity_providers
  refresh_token_validity        = 30
  prevent_user_existence_errors = "ENABLED"

  depends_on = [aws_cognito_identity_provider.google]
}
