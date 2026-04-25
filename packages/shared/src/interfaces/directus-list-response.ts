export interface DirectusListResponse<T> {
  data: T[];
  meta?: { total_count?: number; filter_count?: number };
}
