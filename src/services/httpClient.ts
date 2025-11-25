export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type HttpClientConfig = {
  baseURL: string;
  timeout?: number;
};

export type AuthHeaders = {
  Authorization?: string;
};

export type ServiceDescriptor<P = unknown> = {
  method: HttpMethod;
  endpoint: string;
  requiresAuth: boolean;
  params?: P;
};

