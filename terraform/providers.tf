terraform {
  required_version = ">= 1.9"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
  }

  backend "gcs" {
    bucket = "orders-tf-state"
    prefix = "prod"
  }
}

provider "google" {
  project = var.gcp_project
  region  = var.gcp_region
}
