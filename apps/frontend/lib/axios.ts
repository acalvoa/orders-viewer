import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_NESTJS_URL ?? 'http://localhost:3001',
  headers: { 'Content-Type': 'application/json' },
});

export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  data?: unknown;
}

export async function request<T>(path: string, config?: RequestConfig): Promise<T> {
  try {
    const res = await apiClient.request<T>({
      url: path,
      method: config?.method ?? 'GET',
      data: config?.data,
    });
    return res.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const msg = err.response?.data?.message ?? err.message;
      throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
    throw err;
  }
}
