resource "aws_amplify_app" "this" {
  name       = var.name
  repository = var.repository

  access_token = var.access_token

  platform = "WEB"

  build_spec = <<-YAML
    version: 1
    applications:
      - appRoot: apps/frontend
        frontend:
          phases:
            preBuild:
              commands:
                - npm install -g pnpm@11
                - pnpm install --frozen-lockfile
            build:
              commands:
                - pnpm run build
          artifacts:
            baseDirectory: dist
            files:
              - '**/*'
          cache:
            paths:
              - node_modules/**/*
  YAML

  environment_variables = merge(var.environment_variables, {
    AMPLIFY_MONOREPO_APP_ROOT = "apps/frontend"
  })

  custom_rule {
    source = "</^[^.]+$|\\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json)$)([^.]+$)/>"
    target = "/index.html"
    status = "200"
  }
}

resource "aws_amplify_branch" "this" {
  app_id      = aws_amplify_app.this.id
  branch_name = var.branch

  enable_auto_build = true
  stage             = var.stage
}
