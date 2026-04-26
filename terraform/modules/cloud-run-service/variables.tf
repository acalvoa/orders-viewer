variable "name" {
  description = "Cloud Run service name"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
}

variable "image" {
  description = "Container image (e.g. ghcr.io/owner/repo/service:tag)"
  type        = string
}

variable "port" {
  description = "Container port"
  type        = number
  default     = 8080
}

variable "env_vars" {
  description = "Environment variables"
  type        = map(string)
  default     = {}
}

variable "max_instances" {
  description = "Maximum number of container instances"
  type        = number
  default     = 1
}
