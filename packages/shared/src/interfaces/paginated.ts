export interface Paginated<T> {
  data: T[];
  page: number;
  size: number;
  pages: number;
  total: number;
}
