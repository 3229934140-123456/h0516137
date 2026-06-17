import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { License, Employee, Allocation } from '../shared/types';
import { mockLicenses, mockEmployees, mockAllocations } from './data/mockData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, '..', 'data');
const DATA_FILE = join(DATA_DIR, 'app-data.json');

interface PersistedData {
  licenses: License[];
  employees: Employee[];
  allocations: Allocation[];
}

function loadData(): PersistedData {
  try {
    if (existsSync(DATA_FILE)) {
      const raw = readFileSync(DATA_FILE, 'utf-8');
      const data = JSON.parse(raw) as PersistedData;
      if (data.licenses && data.employees && data.allocations) {
        return data;
      }
    }
  } catch (err) {
    console.warn('读取持久化数据失败，使用初始数据:', (err as Error).message);
  }
  return {
    licenses: JSON.parse(JSON.stringify(mockLicenses)),
    employees: JSON.parse(JSON.stringify(mockEmployees)),
    allocations: JSON.parse(JSON.stringify(mockAllocations)),
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

  constructor() {
    const data = loadData();
    this.licenses = data.licenses;
    this.employees = data.employees;
    this.allocations = data.allocations;
  }

  private persist(): void {
    saveData({
      licenses: this.licenses,
      employees: this.employees,
      allocations: this.allocations,
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
      this.persist();
      return true;
    }
    return false;
  }

  batchImportLicenses(licenses: License[]): { success: number; failed: number } {
    let success = 0;
    let failed = 0;
    for (const lic of licenses) {
      try {
        this.licenses.push(lic);
        success++;
      } catch {
        failed++;
      }
    }
    if (success > 0) this.persist();
    return { success, failed };
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

  resetToMock(): void {
    this.licenses = JSON.parse(JSON.stringify(mockLicenses));
    this.employees = JSON.parse(JSON.stringify(mockEmployees));
    this.allocations = JSON.parse(JSON.stringify(mockAllocations));
    this.persist();
  }
}

export const store = new DataStore();
