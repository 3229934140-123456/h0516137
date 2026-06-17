import { store } from '../store';
import type { License } from '../../shared/types';

function generateId(): string {
  return 'lic-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

export const licenseService = {
  getAll(): License[] {
    return store.getLicenses();
  },

  getById(id: string): License | undefined {
    return store.getLicenseById(id);
  },

  create(data: Omit<License, 'id' | 'createdAt' | 'updatedAt' | 'allocatedQuantity'>): License {
    const now = new Date().toISOString();
    const license: License = {
      ...data,
      id: generateId(),
      allocatedQuantity: 0,
      createdAt: now,
      updatedAt: now,
    };
    store.addLicense(license);
    return license;
  },

  update(id: string, updates: Partial<License>): License | undefined {
    const { id: _, createdAt: __, ...safeUpdates } = updates as License & { id?: string; createdAt?: string };
    return store.updateLicense(id, safeUpdates);
  },

  remove(id: string): boolean {
    return store.deleteLicense(id);
  },

  batchImport(data: Omit<License, 'id' | 'createdAt' | 'updatedAt' | 'allocatedQuantity'>[]): {
    added: number;
    updated: number;
    failed: number;
  } {
    return store.batchImportLicenses(data);
  },

  getRenewalRecords(licenseId?: string) {
    return store.getRenewalRecords(licenseId);
  },

  renewLicense(
    licenseId: string,
    data: {
      newExpiryDate: string;
      newQuantity: number;
      purchaseOrder?: string;
      notes?: string;
    },
  ): License | { error: string } | undefined {
    return store.renewLicense(licenseId, data);
  },
};
