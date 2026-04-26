locals {
  required_apis = [
    "run.googleapis.com",
    "artifactregistry.googleapis.com",
    "storage.googleapis.com",
  ]
}

resource "google_project_service" "apis" {
  for_each = toset(local.required_apis)

  service            = each.value
  disable_on_destroy = false
}

resource "google_artifact_registry_repository" "registry" {
  location      = var.gcp_region
  repository_id = "orders-viewer"
  format        = "DOCKER"

  depends_on = [google_project_service.apis]
}

module "directus" {
  source = "./modules/cloud-run-service"

  name   = "directus"
  region = var.gcp_region
  image  = "${var.image_base}/directus:${var.image_tag}"
  port   = 8055

  env_vars = {
    SECRET             = var.directus_secret
    DB_CLIENT          = "sqlite3"
    DB_FILENAME        = "/directus/database/data.db"
    ADMIN_EMAIL        = var.directus_admin_email
    ADMIN_PASSWORD     = var.directus_admin_password
    ADMIN_STATIC_TOKEN = var.directus_static_token
    AUTO_SEED          = "true"
  }

  depends_on = [google_project_service.apis]
}

module "backend" {
  source = "./modules/cloud-run-service"

  name   = "backend"
  region = var.gcp_region
  image  = "${var.image_base}/backend:${var.image_tag}"
  port   = var.backend_port

  env_vars = {
    APP_PORT              = tostring(var.backend_port)
    DIRECTUS_URL          = module.directus.url
    DIRECTUS_STATIC_TOKEN = var.directus_static_token
  }

  depends_on = [google_project_service.apis]
}

module "frontend" {
  source = "./modules/cloud-run-service"

  name   = "frontend"
  region = var.gcp_region
  image  = "${var.image_base}/frontend:${var.image_tag}"
  port   = 3000

  depends_on = [google_project_service.apis]
}
