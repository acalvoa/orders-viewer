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
}

module "backend" {
  source = "./modules/cloud-run-service"

  name   = "backend"
  region = var.gcp_region
  image  = "${var.image_base}/backend:${var.image_tag}"
  port   = 3001

  env_vars = {
    PORT                  = "3001"
    DIRECTUS_URL          = module.directus.url
    DIRECTUS_STATIC_TOKEN = var.directus_static_token
  }
}

module "frontend" {
  source = "./modules/cloud-run-service"

  name   = "frontend"
  region = var.gcp_region
  image  = "${var.image_base}/frontend:${var.image_tag}"
  port   = 3000
}
