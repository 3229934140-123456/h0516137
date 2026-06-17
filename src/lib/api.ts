import type {
  License,
  Employee,
  Allocation,
  StatsOverview,
  UsageStats,
  RequestStatus,
  ApiResponse,
} from '../../shared/types';

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(API_BASE + url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = (await res.json()) as ApiResponse<T>;
  if (!data.success) {
    throw new Error(data.error || '请求失败');
  }
  return data.data as T;
}

export const api = {
  licenses: {
    getAll: () => request<License[]>('/licenses'),
    getById: (id: string) => request<License>(`/licenses/${id}`),
    create: (data: Omit<License, 'id' | 'createdAt' | 'updatedAt' | 'allocatedQuantity'>) =>
      request<License>('/licenses', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<License>) =>
      request<License>(`/licenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: string) => request<void>(`/licenses/${id}`, { method: 'DELETE' }),
    batchImport: (data: Omit<License, 'id' | 'createdAt' | 'updatedAt' | 'allocatedQuantity'>[]) =>
      request<{ success: number; failed: number }>('/licenses/batch-import', {
        method: 'POST',
        body: JSON.stringify({ data }),
      }),
  },

  allocations: {
    getAll: () => request<Allocation[]>('/allocations'),
    create: (data: { licenseId: string; employeeId: string }) =>
      request<Allocation>('/allocations', { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (id: string, status: RequestStatus, rejectReason?: string) =>
      request<Allocation>(`/allocations/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, rejectReason }),
      }),
    remove: (id: string) => request<void>(`/allocations/${id}`, { method: 'DELETE' }),
  },

  employees: {
    getAll: () => request<Employee[]>('/employees'),
  },

  stats: {
    getOverview: () => request<StatsOverview>('/stats/overview'),
    getExpiring: (days: number = 60) =>
      request<(License & { daysLeft: number; status: 'active' | 'expiring-soon' | 'expired' })[]>(
        `/stats/expiring?days=${days}`,
      ),
    getUsage: () => request<UsageStats[]>('/stats/usage'),
  },
};
