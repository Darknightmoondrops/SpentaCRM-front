export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiMessageResponse {
  message: string;
}

export interface ApiValidationIssue {
  path: string;
  message: string;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  code?: string;
  issues?: ApiValidationIssue[];
  requestId?: string;
}
