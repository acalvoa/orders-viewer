output "directus_url" {
  description = "Directus admin URL"
  value       = module.directus.url
}

output "backend_url" {
  description = "Backend API URL — use as TF_VAR_next_public_nestjs_url and NEXT_PUBLIC_NESTJS_URL when building the frontend image"
  value       = module.backend.url
}

output "frontend_url" {
  description = "Frontend URL"
  value       = module.frontend.url
}
