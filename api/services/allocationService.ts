import { store } from '../store';
import type { Allocation, RequestStatus } from '../../shared/types';

function generateId(): string {
  return 'alloc-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

export const allocationService = {
  getAll(): Allocation[] {
    return store.getAllocations();
  },

  create(data: { licenseId: string; employeeId: string }): Allocation | { error: string } {
    const license = store.getLicenseById(data.licenseId);
    if (!license) {
      return { error: '许可证不存在' };
    }

    const remaining = license.totalQuantity - license.allocatedQuantity;
    if (remaining <= 0) {
      return { error: '剩余授权不足，请发起采购申请' };
    }

    const existing = store.getAllocations().find(
      a => a.licenseId === data.licenseId && a.employeeId === data.employeeId && a.status !== 'rejected'
    );
    if (existing) {
      return { error: '该员工已申请过此许可证' };
    }

    const allocation: Allocation = {
      id: generateId(),
      licenseId: data.licenseId,
      employeeId: data.employeeId,
      status: 'pending',
      requestDate: new Date().toISOString().split('T')[0],
    };
    store.addAllocation(allocation);
    return allocation;
  },

  updateStatus(id: string, status: RequestStatus, rejectReason?: string): Allocation | { error: string } | undefined {
    return store.updateAllocationStatus(id, status, rejectReason);
  },

  remove(id: string): boolean {
    return store.deleteAllocation(id);
  },
};
