import axios, { AxiosInstance, AxiosResponse } from "axios";
import { emit } from "../shared/utils/eventBus";

export const OTP_BASE_URL = "https://zenithmobilereact-serveur-peyrie-test.app.mgdigitalplus.com/api";

export const httpClientOtp: AxiosInstance = axios.create({
  baseURL: OTP_BASE_URL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

httpClientOtp.interceptors.request.use(async (config) => {
  try {
    console.log("[otp] request", {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data,
    });
  } catch {}
  return config;
});

httpClientOtp.interceptors.response.use(
  (response) => {
    try {
      console.log("[otp] response", {
        url: response.config?.url,
        status: response.status,
        data: response.data,
      });
    } catch {}
    return response;
  },
  (error) => {
    const cfg = error?.config || {};
    console.error("[otp] error", {
      url: cfg.url,
      method: cfg.method,
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    });
    try {
      const status = error?.response?.status;
      const msg = String(
        error?.response?.data?.message || error?.message || ""
      ).toLowerCase();
      const tokenIssue = /token/.test(msg) && /(expir|invalid|expire)/.test(msg);
      if (status === 401 || status === 403 || tokenIssue) {
        emit("auth:expired", { status, msg });
      }
    } catch {}
    return Promise.reject(error);
  }
);

