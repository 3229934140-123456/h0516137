import { create } from 'zustand';
import { api } from '../lib/api';
import type {
  License,
  Employee,
  Allocation,
  StatsOverview,
  UsageStats,
  RequestStatus,
  RenewalRecord,
} from '../../shared/types';

interface AppState {
  licenses: License[];
  allocations: Allocation[];
  employees: Employee[];
  overview: StatsOverview | null;
  expiringList: (License & { daysLeft: number; status: string })[];
  usageStats: UsageStats[];
  loading: boolean;
  error: string | null;

  fetchAll: () => Promise<void>;
  fetchLicenses: () => Promise<void>;
  fetchAllocations: () => Promise<void>;
  fetchEmployees: () => Promise<void>;
  fetchOverview: () => Promise<void>;
  fetchExpiring: (days?: number) => Promise<void>;
  fetchUsageStats: () => Promise<void>;
  fetchRenewalRecords: (licenseId: string) => Promise<RenewalRecord[]>;

  createLicense: (
    data: Omit<License, 'id' | 'createdAt' | 'updatedAt' | 'allocatedQuantity'>,
  ) => Promise<License>;
  updateLicense: (id: string, data: Partial<License>) => Promise<void>;
  deleteLicense: (id: string) => Promise<void>;
  batchImportLicenses: (
    data: Omit<License, 'id' | 'createdAt' | 'updatedAt' | 'allocatedQuantity'>[],
  ) => Promise<{ added: number; updated: number; failed: number }>;
  renewLicense: (
    id: string,
    data: { newExpiryDate: string; newQuantity: number; purchaseOrder?: string; notes?: string },
  ) => Promise<License>;

  createAllocation: (data: { licenseId: string; employeeId: string }) => Promise<Allocation>;
  updateAllocationStatus: (id: string, status: RequestStatus, rejectReason?: string) => Promise<void>;
  deleteAllocation: (id: string) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  licenses: [],
  allocations: [],
  employees: [],
  overview: null,
  expiringList: [],
  usageStats: [],
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const [licenses, allocations, employees, overview, expiring, usage] = await Promise.all([
        api.licenses.getAll(),
        api.allocations.getAll(),
        api.employees.getAll(),
        api.stats.getOverview(),
        api.stats.getExpiring(60),
        api.stats.getUsage(),
      ]);
      set({ licenses, allocations, employees, overview, expiringList: expiring, usageStats: usage });
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  fetchLicenses: async () => {
    try {
      const data = await api.licenses.getAll();
      set({ licenses: data });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  fetchAllocations: async () => {
    try {
      const data = await api.allocations.getAll();
      set({ allocations: data });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  fetchEmployees: async () => {
    try {
      const data = await api.employees.getAll();
      set({ employees: data });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  fetchOverview: async () => {
    try {
      const data = await api.stats.getOverview();
      set({ overview: data });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  fetchExpiring: async (days: number = 60) => {
    try {
      const data = await api.stats.getExpiring(days);
      set({ expiringList: data });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  fetchUsageStats: async () => {
    try {
      const data = await api.stats.getUsage();
      set({ usageStats: data });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  fetchRenewalRecords: async (licenseId: string) => {
    return await api.licenses.getRenewals(licenseId);
  },

  createLicense: async (data) => {
    const license = await api.licenses.create(data);
    await get().fetchAll();
    return license;
  },

  updateLicense: async (id, data) => {
    await api.licenses.update(id, data);
    await get().fetchAll();
  },

  deleteLicense: async (id) => {
    await api.licenses.remove(id);
    await get().fetchAll();
  },

  batchImportLicenses: async (data) => {
    const result = await api.licenses.batchImport(data);
    await get().fetchAll();
    return result;
  },

  renewLicense: async (id, data) => {
    const license = await api.licenses.renew(id, data);
    await get().fetchAll();
    return license;
  },

  createAllocation: async (data) => {
    const allocation = await api.allocations.create(data);
    await get().fetchAll();
    return allocation;
  },

  updateAllocationStatus: async (id, status, rejectReason) => {
    await api.allocations.updateStatus(id, status, rejectReason);
    await get().fetchAll();
  },

  deleteAllocation: async (id) => {
    await api.allocations.remove(id);
    await get().fetchAll();
  },
}));
