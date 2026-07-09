terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  # Stamped onto every taggable resource — makes everything findable and
  # attributable in the AWS console/billing.
  default_tags {
    tags = {
      Project     = "serveless"
      Environment = var.environment
    }
  }
}