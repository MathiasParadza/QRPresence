export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}