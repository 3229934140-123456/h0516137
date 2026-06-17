import { store } from '../store';
import type { StatsOverview, UsageStats, License } from '../../shared/types';

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getLicenseStatus(license: License): 'active' | 'expiring-soon' | 'expired' {
  const days = daysUntil(license.expiryDate);
  if (days < 0) return 'expired';
  if (days <= 60) return 'expiring-soon';
  return 'active';
}

export const statsService = {
  getOverview(): StatsOverview {
    const licenses = store.getLicenses();
    const totalLicenses = licenses.length;

    let expiringCount = 0;
    let idleCount = 0;
    let totalAllocated = 0;
    let totalQuantity = 0;

    for (const lic of licenses) {
      const days = daysUntil(lic.expiryDate);
      if (days >= 0 && days <= 60) expiringCount++;

      const usageRate = lic.totalQuantity > 0 ? lic.allocatedQuantity / lic.totalQuantity : 0;
      if (usageRate < 0.5) idleCount++;

      totalAllocated += lic.allocatedQuantity;
      totalQuantity += lic.totalQuantity;
    }

    const overallUsageRate = totalQuantity > 0 ? Math.round((totalAllocated / totalQuantity) * 100) : 0;

    return {
      totalLicenses,
      expiringCount,
      idleCount,
      overallUsageRate,
    };
  },

  getExpiring(days: number = 60): (License & { daysLeft: number; status: 'active' | 'expiring-soon' | 'expired' })[] {
    const licenses = store.getLicenses();
    return licenses
      .map(lic => ({
        ...lic,
        daysLeft: daysUntil(lic.expiryDate),
        status: getLicenseStatus(lic),
      }))
      .filter(l => l.daysLeft >= -30 && l.daysLeft <= days)
      .sort((a, b) => a.daysLeft - b.daysLeft);
  },

  getUsageStats(): UsageStats[] {
    const licenses = store.getLicenses();
    return licenses
      .map(lic => {
        const usageRate = lic.totalQuantity > 0 ? Math.round((lic.allocatedQuantity / lic.totalQuantity) * 100) : 0;
        let suggestedQuantity = lic.totalQuantity;
        if (usageRate < 50) {
          suggestedQuantity = Math.max(1, Math.ceil(lic.allocatedQuantity * 1.2));
        } else if (usageRate > 90) {
          suggestedQuantity = Math.ceil(lic.totalQuantity * 1.2);
        }
        return {
          licenseId: lic.id,
          productName: lic.productName,
          totalQuantity: lic.totalQuantity,
          allocatedQuantity: lic.allocatedQuantity,
          usageRate,
          suggestedQuantity,
        };
      })
      .sort((a, b) => a.usageRate - b.usageRate);
  },
};
