import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { License, Employee, Allocation, RenewalRecord } from '../shared/types';
import { mockLicenses, mockEmployees, mockAllocations } from './data/mockData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, '..', 'data');
const DATA_FILE = join(DATA_DIR, 'app-data.json');

interface PersistedData {
  licenses: License[];
  employees: Employee[];
  allocations: Allocation[];
  renewalRecords: RenewalRecord[];
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function loadData(): PersistedData {
  try {
    if (existsSync(DATA_FILE)) {
      const raw = readFileSync(DATA_FILE, 'utf-8');
      const data = JSON.parse(raw) as PersistedData;
      if (data.licenses && data.employees && data.allocations) {
        return {
          licenses: data.licenses,
          employees: data.employees,
          allocations: data.allocations,
          renewalRecords: data.renewalRecords || [],
        };
      }
    }
  } catch (err) {
    console.warn('读取持久化数据失败，使用初始数据:', (err as Error).message);
  }
  return {
    licenses: JSON.parse(JSON.stringify(mockLicenses)),
    employees: JSON.parse(JSON.stringify(mockEmployees)),
    allocations: JSON.parse(JSON.stringify(mockAllocations)),
    renewalRecords: [],
  };
}

function saveData(data: PersistedData): void {
  try {
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }
    writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('保存数据失败:', (err as Error).message);
  }
}

class DataStore {
  private licenses: License[];
  private employees: Employee[];
  private allocations: Allocation[];
  private renewalRecords: RenewalRecord[];

  constructor() {
    const data = loadData();
    this.licenses = data.licenses;
    this.employees = data.employees;
    this.allocations = data.allocations;
    this.renewalRecords = data.renewalRecords;
  }

  private persist(): void {
    saveData({
      licenses: this.licenses,
      employees: this.employees,
      allocations: this.allocations,
      renewalRecords: this.renewalRecords,
    });
  }

  getLicenses(): License[] {
    return [...this.licenses];
  }

  getLicenseById(id: string): License | undefined {
    return this.licenses.find(l => l.id === id);
  }

  addLicense(license: License): void {
    this.licenses.push(license);
    this.persist();
  }

  updateLicense(id: string, updates: Partial<License>): License | undefined {
    const index = this.licenses.findIndex(l => l.id === id);
    if (index !== -1) {
      this.licenses[index] = { ...this.licenses[index], ...updates, updatedAt: new Date().toISOString() };
      this.persist();
      return this.licenses[index];
    }
    return undefined;
  }

  deleteLicense(id: string): boolean {
    const index = this.licenses.findIndex(l => l.id === id);
    if (index !== -1) {
      this.licenses.splice(index, 1);
      this.allocations = this.allocations.filter(a => a.licenseId !== id);
      this.renewalRecords = this.renewalRecords.filter(r => r.licenseId !== id);
      this.persist();
      return true;
    }
    return false;
  }

  batchImportLicenses(
    licenses: Omit<License, 'id' | 'createdAt' | 'updatedAt' | 'allocatedQuantity'>[],
  ): { added: number; updated: number; failed: number } {
    let added = 0;
    let updated = 0;
    let failed = 0;
    const now = new Date().toISOString();

    for (const item of licenses) {
      try {
        const existingIndex = this.licenses.findIndex(
          l =>
            l.productName.trim() === item.productName.trim() &&
            l.version.trim() === item.version.trim() &&
            l.vendor.trim() === item.vendor.trim(),
        );

        if (existingIndex !== -1) {
          const existing = this.licenses[existingIndex];
          this.licenses[existingIndex] = {
            ...existing,
            totalQuantity: item.totalQuantity,
            expiryDate: item.expiryDate,
            purchaseDate: item.purchaseDate || existing.purchaseDate,
            licenseType: item.licenseType || existing.licenseType,
            licenseKey: item.licenseKey || existing.licenseKey,
            purchaseOrder: item.purchaseOrder || existing.purchaseOrder,
            notes: item.notes || existing.notes,
            updatedAt: now,
          };
          updated++;
        } else {
          const newLicense: License = {
            ...item,
            id: generateId('lic'),
            allocatedQuantity: 0,
            createdAt: now,
            updatedAt: now,
          };
          this.licenses.push(newLicense);
          added++;
        }
      } catch {
        failed++;
      }
    }

    if (added > 0 || updated > 0) this.persist();
    return { added, updated, failed };
  }

  getEmployees(): Employee[] {
    return [...this.employees];
  }

  getEmployeeById(id: string): Employee | undefined {
    return this.employees.find(e => e.id === id);
  }

  getAllocations(): Allocation[] {
    return [...this.allocations];
  }

  getAllocationById(id: string): Allocation | undefined {
    return this.allocations.find(a => a.id === id);
  }

  addAllocation(allocation: Allocation): void {
    this.allocations.push(allocation);
    this.persist();
  }

  updateAllocationStatus(
    id: string,
    status: Allocation['status'],
    rejectReason?: string,
  ): Allocation | { error: string } | undefined {
    const index = this.allocations.findIndex(a => a.id === id);
    if (index === -1) return undefined;

    const allocation = this.allocations[index];

    if (status === 'approved') {
      const license = this.licenses.find(l => l.id === allocation.licenseId);
      if (!license) {
        return { error: '许可证不存在' };
      }
      if (license.allocatedQuantity >= license.totalQuantity) {
        return { error: '剩余授权不足，请先发起采购申请' };
      }
    }

    const wasApproved = allocation.status === 'approved';

    this.allocations[index] = {
      ...allocation,
      status,
      approvalDate: status === 'approved' ? new Date().toISOString().split('T')[0] : allocation.approvalDate,
      rejectReason: status === 'rejected' ? rejectReason : allocation.rejectReason,
    };

    if (status === 'approved' && !wasApproved) {
      const license = this.licenses.find(l => l.id === allocation.licenseId);
      if (license) {
        license.allocatedQuantity++;
        license.updatedAt = new Date().toISOString();
      }
    }

    if (status !== 'approved' && wasApproved) {
      const license = this.licenses.find(l => l.id === allocation.licenseId);
      if (license && license.allocatedQuantity > 0) {
        license.allocatedQuantity--;
        license.updatedAt = new Date().toISOString();
      }
    }

    this.persist();
    return this.allocations[index];
  }

  deleteAllocation(id: string): boolean {
    const index = this.allocations.findIndex(a => a.id === id);
    if (index !== -1) {
      const allocation = this.allocations[index];
      if (allocation.status === 'approved') {
        const license = this.licenses.find(l => l.id === allocation.licenseId);
        if (license && license.allocatedQuantity > 0) {
          license.allocatedQuantity--;
          license.updatedAt = new Date().toISOString();
        }
      }
      this.allocations.splice(index, 1);
      this.persist();
      return true;
    }
    return false;
  }

  getRenewalRecords(licenseId?: string): RenewalRecord[] {
    if (licenseId) {
      return this.renewalRecords
        .filter(r => r.licenseId === licenseId)
        .sort((a, b) => new Date(b.renewedAt).getTime() - new Date(a.renewedAt).getTime());
    }
    return [...this.renewalRecords];
  }

  renewLicense(
    licenseId: string,
    data: {
      newExpiryDate: string;
      newQuantity: number;
      purchaseOrder?: string;
      notes?: string;
    },
  ): License | { error: string } | undefined {
    const license = this.licenses.find(l => l.id === licenseId);
    if (!license) return undefined;

    if (data.newQuantity < license.allocatedQuantity) {
      return { error: `新的购买数量不能低于已分配数量（${license.allocatedQuantity}）` };
    }

    const record: RenewalRecord = {
      id: generateId('ren'),
      licenseId,
      oldExpiryDate: license.expiryDate,
      newExpiryDate: data.newExpiryDate,
      oldQuantity: license.totalQuantity,
      newQuantity: data.newQuantity,
      purchaseOrder: data.purchaseOrder,
      notes: data.notes,
      renewedAt: new Date().toISOString(),
    };
    this.renewalRecords.push(record);

    license.expiryDate = data.newExpiryDate;
    license.totalQuantity = data.newQuantity;
    if (data.purchaseOrder) license.purchaseOrder = data.purchaseOrder;
    if (data.notes) license.notes = data.notes;
    license.updatedAt = new Date().toISOString();

    this.persist();
    return license;
  }

  resetToMock(): void {
    this.licenses = JSON.parse(JSON.stringify(mockLicenses));
    this.employees = JSON.parse(JSON.stringify(mockEmployees));
    this.allocations = JSON.parse(JSON.stringify(mockAllocations));
    this.renewalRecords = [];
    this.persist();
  }
}

export const store = new DataStore();
