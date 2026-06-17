import type { License, Employee, Allocation } from '../shared/types';
import { mockLicenses, mockEmployees, mockAllocations } from './data/mockData';

class DataStore {
  private licenses: License[];
  private employees: Employee[];
  private allocations: Allocation[];

  constructor() {
    this.licenses = [...mockLicenses];
    this.employees = [...mockEmployees];
    this.allocations = [...mockAllocations];
  }

  getLicenses(): License[] {
    return [...this.licenses];
  }

  getLicenseById(id: string): License | undefined {
    return this.licenses.find(l => l.id === id);
  }

  addLicense(license: License): void {
    this.licenses.push(license);
  }

  updateLicense(id: string, updates: Partial<License>): License | undefined {
    const index = this.licenses.findIndex(l => l.id === id);
    if (index !== -1) {
      this.licenses[index] = { ...this.licenses[index], ...updates, updatedAt: new Date().toISOString() };
      return this.licenses[index];
    }
    return undefined;
  }

  deleteLicense(id: string): boolean {
    const index = this.licenses.findIndex(l => l.id === id);
    if (index !== -1) {
      this.licenses.splice(index, 1);
      this.allocations = this.allocations.filter(a => a.licenseId !== id);
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
  }

  updateAllocationStatus(id: string, status: Allocation['status'], rejectReason?: string): Allocation | undefined {
    const index = this.allocations.findIndex(a => a.id === id);
    if (index !== -1) {
      const allocation = this.allocations[index];
      this.allocations[index] = {
        ...allocation,
        status,
        approvalDate: status === 'approved' ? new Date().toISOString().split('T')[0] : allocation.approvalDate,
        rejectReason: status === 'rejected' ? rejectReason : allocation.rejectReason,
      };

      if (status === 'approved') {
        const license = this.licenses.find(l => l.id === allocation.licenseId);
        if (license && license.allocatedQuantity < license.totalQuantity) {
          license.allocatedQuantity++;
          license.updatedAt = new Date().toISOString();
        }
      }

      return this.allocations[index];
    }
    return undefined;
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
      return true;
    }
    return false;
  }
}

export const store = new DataStore();
