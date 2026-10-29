import { ApiResponse } from '../types/api';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

class ApiClient {
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    const token = localStorage.getItem('shd_access_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
    const defaultHeaders = this.getHeaders() as Record<string, string>;
    if (options.body instanceof FormData) {
      delete defaultHeaders['Content-Type'];
    }
    const headers = { ...defaultHeaders, ...options.headers };

    try {
      const response = await fetch(url, { ...options, headers });

      if (response.status === 401) {
        localStorage.removeItem('shd_access_token');
        localStorage.removeItem('shd_refresh_token');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }

      const json: ApiResponse<T> = await response.json();

      if (!response.ok || !json.success) {
        const error = new Error(json.error?.message || response.statusText || 'Lỗi kết nối máy chủ');
        (error as any).status = response.status;
        (error as any).code = json.error?.code;
        (error as any).details = json.error?.details;
        (error as any).traceId = json.traceId;
        throw error;
      }

      return json.data as T;
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        const networkError = new Error('Không thể kết nối đến máy chủ Backend API. Vui lòng kiểm tra lại dịch vụ.');
        (networkError as any).code = 'NETWORK_ERROR';
        throw networkError;
      }
      throw err;
    }
  }

  get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, String(val));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }
    return this.request<T>(url, { method: 'GET' });
  }

  post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  upload<T>(endpoint: string, formData: FormData): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
    });
  }

  put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
