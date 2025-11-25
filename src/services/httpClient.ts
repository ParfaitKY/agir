import axios, { AxiosInstance, AxiosResponse } from "axios";
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

