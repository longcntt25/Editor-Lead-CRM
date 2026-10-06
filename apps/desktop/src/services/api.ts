import { useAuthStore } from '../stores/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const { token, currentWorkspace } = useAuthStore.getState();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (currentWorkspace?.id) {
    headers['X-Workspace-Id'] = currentWorkspace.id;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      useAuthStore.getState().logout();
    }
    throw new Error(data.error || 'Có lỗi xảy ra, vui lòng thử lại');
  }

  return data;
}

export const api = {
  get: <T = any>(url: string) => apiRequest<T>(url, { method: 'GET' }),
  post: <T = any>(url: string, body?: any) =>
    apiRequest<T>(url, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: <T = any>(url: string, body?: any) =>
    apiRequest<T>(url, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T = any>(url: string) => apiRequest<T>(url, { method: 'DELETE' }),
};
