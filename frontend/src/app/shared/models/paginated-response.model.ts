export interface FilterOption {
  id: string;
  label: string;
  value: string;
  count: number;
}

export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
  filters?: Record<string, FilterOption[]>; // Reusable filters for table filtering
}

