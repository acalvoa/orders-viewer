variable "gcp_project" {
  description = "GCP project ID"
  type        = string
}

variable "gcp_region" {
  description = "GCP region for Cloud Run services"
  type        = string
  default     = "us-central1"
}

variable "image_base" {
  description = "Base path for container images, without service name (e.g. ghcr.io/myorg/myrepo or us-central1-docker.pkg.dev/myproject/myrepo)"
  type        = string
}

variable "directus_secret" {
  description = "Directus SECRET env var — random 64-char string for JWT signing"
  type        = string
  sensitive   = true
}

variable "directus_admin_email" {
  description = "Directus admin email"
  type        = string
  default     = "admin@example.com"
}

variable "directus_admin_password" {
  description = "Directus admin password"
  type        = string
  sensitive   = true
}

variable "directus_static_token" {
  description = "Static API token for the Directus admin user (used by the backend)"
  type        = string
  sensitive   = true
}

variable "image_tag" {
  description = "Docker image tag to deploy (git SHA from CI)"
  type        = string
  default     = "latest"
}

variable "backend_port" {
  description = "Port the backend NestJS server listens on"
  type        = number
  default     = 3000
}

