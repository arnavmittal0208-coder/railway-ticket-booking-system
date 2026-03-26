import axios from "axios";

const normalizeApiBaseUrl = (rawUrl) => {
  const fallback = "http://localhost:5000/api";
  const value = (rawUrl || fallback).trim().replace(/\/+$/, "");

  return value.endsWith("/api") ? value : `${value}/api`;
};

const api = axios.create({
  baseURL: normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
