import axios, { AxiosInstance, AxiosResponse } from "axios";
import { secureGetItem } from "../shared/utils/secureStorage";
import { BASE_URL } from "./endpoints";

export type AuthHeaders = Record<string, string>;

export type RequestResult<T = any> = {
  data?: T;
  error?: unknown;
};

export const httpClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

httpClient.interceptors.request.use(async (config) => {
  try {
    const token = await secureGetItem("auth_token");
    if (token) {
      config.headers = config.headers || {};
      (config.headers as any)["Authorization"] = `Bearer ${token}`;
    }
    console.log("[http] request", {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data,
    });
  } catch {}
  return config;
});

httpClient.interceptors.response.use(
  (response) => {
    console.log("[http] response", {
      url: response.config?.url,
      status: response.status,
      data: response.data,
    });
    return response;
  },
  (error) => {
    const cfg = error?.config || {};
    console.error("[http] error", {
      url: cfg.url,
      method: cfg.method,
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    });
    return Promise.reject(error);
  }
);

export async function handleRequest<T = any>(
  request: Promise<AxiosResponse<T>>
): Promise<RequestResult<T>> {
  try {
    const res = await request;
    return { data: res.data };
  } catch (err: any) {
    console.error(err?.message ?? "request_error");
    return { error: err };
  }
}

