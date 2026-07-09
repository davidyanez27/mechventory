resource "terraform_data" "workspace_guard" {
  lifecycle {
    precondition {
      condition     = !contains(["dev", "prod"], terraform.workspace) || terraform.workspace == var.environment
      error_message = "Workspace '${terraform.workspace}' does not match environment '${var.environment}'. Run: terraform workspace select ${var.environment}"
    }
  }
}

data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    effect = "Allow"
  }
}

resource "aws_iam_role" "lambda_role" {
  name = "${var.environment}-serveless-lambda-role"

  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}


data "aws_iam_policy_document" "lambda_cognito" {
  statement {
    effect    = "Allow"
    actions   = ["cognito-idp:AdminCreateUser", "cognito-idp:AdminDeleteUser"]
    resources = [module.cognito.user_pool_arn]
  }
}

resource "aws_iam_role_policy" "lambda_cognito" {
  name   = "lambda-cognito-admin-create-user"
  role   = aws_iam_role.lambda_role.id
  policy = data.aws_iam_policy_document.lambda_cognito.json
}


resource "aws_s3_bucket" "invoices" {
  bucket_prefix = "${var.environment}-serveless-invoices-"
}

resource "aws_s3_bucket_public_access_block" "invoices" {
  bucket                  = aws_s3_bucket.invoices.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# API Lambda uploads rendered invoice PDFs, presigns download links, and
# removes the stored PDF when its invoice is deleted.
data "aws_iam_policy_document" "lambda_s3_invoices" {
  statement {
    effect    = "Allow"
    actions   = ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"]
    resources = ["${aws_s3_bucket.invoices.arn}/*"]
  }
}

resource "aws_iam_role_policy" "lambda_s3_invoices" {
  name   = "lambda-s3-invoice-pdfs"
  role   = aws_iam_role.lambda_role.id
  policy = data.aws_iam_policy_document.lambda_s3_invoices.json
}

module "cognito" {
  source                       = "./modules/cognito"
  user_pool_name               = "${var.environment}-serveless-user-pool"
  user_pool_client_name        = "${var.environment}-serveless-web-client"
  callback_urls                = var.frontend_urls
  logout_urls                  = var.frontend_urls
  post_confirmation_lambda_arn = aws_lambda_function.post_confirmation.arn
}

locals {

  api_lambda_zip_path = coalesce(
    var.api_lambda_zip_path,
    abspath("${path.root}/../../apps/api/lambda.zip"),
  )
}


resource "aws_lambda_function" "post_confirmation" {
  function_name    = "${var.environment}-serveless-post-confirmation"
  role             = aws_iam_role.lambda_role.arn
  handler          = "post-confirmation.handler"
  runtime          = "nodejs22.x"
  filename         = local.api_lambda_zip_path
  source_code_hash = filebase64sha256(local.api_lambda_zip_path)

  timeout     = 10
  memory_size = 256

  environment {
    variables = { DATABASE_URL = var.database_url }
  }
}

resource "aws_lambda_permission" "cognito_post_confirmation" {
  statement_id  = "AllowInvokeFromCognito"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.post_confirmation.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = module.cognito.user_pool_arn
}

module "api_gateway" {
  source = "./modules/api_gateway"

  name                 = "${var.environment}-serveless"
  aws_region           = var.aws_region
  lambda_role_arn      = aws_iam_role.lambda_role.arn
  cognito_user_pool_id = module.cognito.user_pool_id
  cognito_client_id    = module.cognito.client_id
  allowed_origins      = var.frontend_urls
  lambda_zip_path      = local.api_lambda_zip_path
  database_url         = var.database_url
  invoices_bucket      = aws_s3_bucket.invoices.bucket
}

module "amplify" {
  source = "./modules/amplify"
  count  = var.github_repository != "" ? 1 : 0

  name         = "${var.environment}-serveless-frontend"
  repository   = var.github_repository
  access_token = var.github_access_token
  branch       = var.frontend_branch
  stage        = var.environment == "prod" ? "PRODUCTION" : "DEVELOPMENT"

  environment_variables = {
    VITE_API_URL              = module.api_gateway.api_endpoint
    VITE_COGNITO_USER_POOL_ID = module.cognito.user_pool_id
    VITE_COGNITO_CLIENT_ID    = module.cognito.client_id
  }
}