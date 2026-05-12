import {
  formatLimit,
  formatUsageMetric,
  getFlags,
  getFeatureUpgradeTarget,
  getLimits,
  getRequiredTierName,
  getUsageLimitForMetric,
  hasFeature,
  isWithinQuota,
  meetsMinimumTier,
  resolveTier,
} from '@hollowbits/core';

export type { FeatureFlags, FeatureGate, Tier, TierLimits } from '@hollowbits/core';

export {
  formatLimit,
  formatUsageMetric,
  getFlags,
  getFeatureUpgradeTarget,
  getLimits,
  getRequiredTierName,
  getUsageLimitForMetric,
  hasFeature,
  isWithinQuota,
  meetsMinimumTier,
  resolveTier,
};
