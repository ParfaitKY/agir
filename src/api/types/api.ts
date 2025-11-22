export interface ApiResponse<T> {
  data?: T;
  status?: number;
}

export interface ApiError {
  code?: string;
  message?: string;
  status?: number;
}

export interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  token?: string;
}

