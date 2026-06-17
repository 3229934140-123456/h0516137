export type LicenseType = 'per-seat' | 'per-device' | 'enterprise';

export type LicenseStatus = 'active' | 'expiring-soon' | 'expired';

export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface License {
  id: string;
  productName: string;
  version: string;
  vendor: string;
  totalQuantity: number;
  allocatedQuantity: number;
  purchaseDate: string;
  expiryDate: string;
  licenseType: LicenseType;
  licenseKey?: string;
  purchaseOrder?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  jobTitle: string;
}

export interface Allocation {
  id: string;
  licenseId: string;
  employeeId: string;
  status: RequestStatus;
  requestDate: string;
  approvalDate?: string;
  rejectReason?: string;
  allocatedBy?: string;
}

export interface RenewalRecord {
  id: string;
  licenseId: string;
  oldExpiryDate: string;
  newExpiryDate: string;
  oldQuantity: number;
  newQuantity: number;
  purchaseOrder?: string;
  notes?: string;
  renewedAt: string;
  renewedBy?: string;
}

export interface StatsOverview {
  totalLicenses: number;
  expiringCount: number;
  idleCount: number;
  overallUsageRate: number;
}

export interface UsageStats {
  licenseId: string;
  productName: string;
  totalQuantity: number;
  allocatedQuantity: number;
  usageRate: number;
  suggestedQuantity: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export const LICENSE_TYPE_LABELS: Record<LicenseType, string> = {
  'per-seat': '按座位',
  'per-device': '按设备',
  'enterprise': '企业授权',
};

export const LICENSE_STATUS_LABELS: Record<LicenseStatus, string> = {
  active: '正常',
  'expiring-soon': '即将到期',
  expired: '已过期',
};

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  pending: '待审批',
  approved: '已批准',
  rejected: '已拒绝',
};
