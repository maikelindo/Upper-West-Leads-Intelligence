export interface WeekAdCostConfig {
  [weekId: string]: number;
}

const LEGACY_STORAGE_KEY = 'upperwest_weekly_ad_costs_v2';
const MONTHLY_WEEKLY_STORAGE_KEY = 'upperwest_weekly_ad_costs_by_month_v3';

// Default values for August 2026 (matches original August historical report: W2 Rp 6.637.705 + W3 Rp 10.560.569 = Rp 17.198.274)
export const DEFAULT_AUGUST_WEEKLY_AD_COSTS: WeekAdCostConfig = {
  'week-1': 0,
  'WEEK_1': 0,
  'week-2': 6637705,
  'WEEK_2': 6637705,
  'week-3': 10560569,
  'WEEK_3': 10560569,
  'week-4': 0,
  'WEEK_4': 0,
  'week-5': 0,
  'WEEK_5': 0,
};

// Default values for September 2026 (independent month)
export const DEFAULT_SEPTEMBER_WEEKLY_AD_COSTS: WeekAdCostConfig = {
  'week-1': 0,
  'WEEK_1': 0,
  'week-2': 0,
  'WEEK_2': 0,
  'week-3': 0,
  'WEEK_3': 0,
  'week-4': 0,
  'WEEK_4': 0,
  'week-5': 0,
  'WEEK_5': 0,
};

// Default values for July 2026
export const DEFAULT_JULY_WEEKLY_AD_COSTS: WeekAdCostConfig = {
  'week-1': 0,
  'WEEK_1': 0,
  'week-2': 0,
  'WEEK_2': 0,
  'week-3': 0,
  'WEEK_3': 0,
  'week-4': 0,
  'WEEK_4': 0,
  'week-5': 0,
  'WEEK_5': 0,
};

export const DEFAULT_WEEKLY_AD_COSTS: WeekAdCostConfig = DEFAULT_AUGUST_WEEKLY_AD_COSTS;

export function getDefaultWeeklyCostsForMonth(monthKey: string = '2026-09'): WeekAdCostConfig {
  if (monthKey === '2026-08') {
    return { ...DEFAULT_AUGUST_WEEKLY_AD_COSTS };
  }
  if (monthKey === '2026-07') {
    return { ...DEFAULT_JULY_WEEKLY_AD_COSTS };
  }
  return { ...DEFAULT_SEPTEMBER_WEEKLY_AD_COSTS };
}

export function normalizeWeekKey(key: string): string {
  const lower = key.toLowerCase().replace(/_/g, '-');
  if (lower.includes('1')) return 'WEEK_1';
  if (lower.includes('2')) return 'WEEK_2';
  if (lower.includes('3')) return 'WEEK_3';
  if (lower.includes('4')) return 'WEEK_4';
  if (lower.includes('5')) return 'WEEK_5';
  return key;
}

function getAllMonthlyWeeklyAdCosts(): Record<string, WeekAdCostConfig> {
  try {
    const saved = localStorage.getItem(MONTHLY_WEEKLY_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed;
    }

    // Auto-migrate from legacy v2 storage if available
    const initialStore: Record<string, WeekAdCostConfig> = {
      '2026-08': { ...DEFAULT_AUGUST_WEEKLY_AD_COSTS },
      '2026-09': { ...DEFAULT_SEPTEMBER_WEEKLY_AD_COSTS },
      '2026-07': { ...DEFAULT_JULY_WEEKLY_AD_COSTS },
    };

    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      const parsedLegacy = JSON.parse(legacy);
      // August 2026 preserves its original Week 2 & Week 3
      if (parsedLegacy['WEEK_2'] !== undefined) {
        initialStore['2026-08']['WEEK_2'] = parsedLegacy['WEEK_2'];
        initialStore['2026-08']['week-2'] = parsedLegacy['WEEK_2'];
      }
      if (parsedLegacy['WEEK_3'] !== undefined) {
        initialStore['2026-08']['WEEK_3'] = parsedLegacy['WEEK_3'];
        initialStore['2026-08']['week-3'] = parsedLegacy['WEEK_3'];
      }
      // If user had set a Week 1 value while testing September, preserve it on September 2026
      if (parsedLegacy['WEEK_1'] && parsedLegacy['WEEK_1'] > 0) {
        initialStore['2026-09']['WEEK_1'] = parsedLegacy['WEEK_1'];
        initialStore['2026-09']['week-1'] = parsedLegacy['WEEK_1'];
      }
    }

    localStorage.setItem(MONTHLY_WEEKLY_STORAGE_KEY, JSON.stringify(initialStore));
    return initialStore;
  } catch (e) {
    console.error('Failed to load monthly weekly ad costs', e);
    return {
      '2026-08': { ...DEFAULT_AUGUST_WEEKLY_AD_COSTS },
      '2026-09': { ...DEFAULT_SEPTEMBER_WEEKLY_AD_COSTS },
      '2026-07': { ...DEFAULT_JULY_WEEKLY_AD_COSTS },
    };
  }
}

export function getSavedWeeklyAdCosts(monthKey: string = '2026-09'): WeekAdCostConfig {
  const targetMonth = (monthKey === 'ALL' || !monthKey) ? '2026-09' : monthKey;
  const all = getAllMonthlyWeeklyAdCosts();
  const monthData = all[targetMonth] || getDefaultWeeklyCostsForMonth(targetMonth);
  const result = { ...getDefaultWeeklyCostsForMonth(targetMonth), ...monthData };

  // Ensure cross-mapping between week-N and WEEK_N
  ['1', '2', '3', '4', '5'].forEach((num) => {
    const hyphenKey = `week-${num}`;
    const underKey = `WEEK_${num}`;
    const val = result[underKey] ?? result[hyphenKey] ?? 0;
    result[hyphenKey] = val;
    result[underKey] = val;
  });

  return result;
}

export function saveWeeklyAdCost(weekId: string, cost: number, monthKey: string = '2026-09'): WeekAdCostConfig {
  const targetMonth = (monthKey === 'ALL' || !monthKey) ? '2026-09' : monthKey;
  const all = getAllMonthlyWeeklyAdCosts();
  const currentMonthCosts = getSavedWeeklyAdCosts(targetMonth);
  const cleanCost = Math.max(0, cost);
  const updatedMonth = { ...currentMonthCosts };

  // Set both variants
  if (weekId.includes('1')) { updatedMonth['week-1'] = cleanCost; updatedMonth['WEEK_1'] = cleanCost; }
  else if (weekId.includes('2')) { updatedMonth['week-2'] = cleanCost; updatedMonth['WEEK_2'] = cleanCost; }
  else if (weekId.includes('3')) { updatedMonth['week-3'] = cleanCost; updatedMonth['WEEK_3'] = cleanCost; }
  else if (weekId.includes('4')) { updatedMonth['week-4'] = cleanCost; updatedMonth['WEEK_4'] = cleanCost; }
  else if (weekId.includes('5')) { updatedMonth['week-5'] = cleanCost; updatedMonth['WEEK_5'] = cleanCost; }
  else {
    updatedMonth[weekId] = cleanCost;
  }

  all[targetMonth] = updatedMonth;

  try {
    localStorage.setItem(MONTHLY_WEEKLY_STORAGE_KEY, JSON.stringify(all));
    // Maintain legacy storage for August only
    if (targetMonth === '2026-08') {
      localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(updatedMonth));
    }
    // Dispatch events so all tabs and components update in real-time
    window.dispatchEvent(new CustomEvent('upperwest_ad_costs_updated', {
      detail: { monthKey: targetMonth, weekId, cost: cleanCost }
    }));
    window.dispatchEvent(new Event('upperwest_campaign_costs_updated'));
  } catch (e) {
    console.error('Failed to save ad cost', e);
  }
  return updatedMonth;
}

export function getTotalMonthAdCost(monthKey: string = '2026-09'): number {
  if (monthKey === 'ALL') {
    const all = getAllMonthlyWeeklyAdCosts();
    return Object.keys(all).reduce((total, m) => {
      const costs = getSavedWeeklyAdCosts(m);
      return total + (costs['WEEK_1'] || 0) + (costs['WEEK_2'] || 0) + (costs['WEEK_3'] || 0) + (costs['WEEK_4'] || 0) + (costs['WEEK_5'] || 0);
    }, 0);
  }
  const costs = getSavedWeeklyAdCosts(monthKey);
  return (costs['WEEK_1'] || 0) + (costs['WEEK_2'] || 0) + (costs['WEEK_3'] || 0) + (costs['WEEK_4'] || 0) + (costs['WEEK_5'] || 0);
}

// ==========================================
// CAMPAIGN / CONTENT SPECIFIC AD COSTS
// ==========================================

const CAMPAIGN_COSTS_STORAGE_KEY = 'upperwest_campaign_ad_costs_v2';

// Default values accurately totaling Rp 17.198.274 (matches monthly report total cost: Week 2 Rp 6.637.705 + Week 3 Rp 10.560.569)
export const DEFAULT_CAMPAIGN_AD_COSTS: Record<string, number> = {
  'Instagram - SOHO Signature': 5325500,
  'Instagram - Apart & WLB': 3567000,
  'Instagram - Apart Kampus': 2882500,
  'Google - Apartemen LP 2': 2052000,
  'Google - Website': 1417000,
  'Google - Apartemen LP 3': 830700,
  'Google - Apart & SOHO LP 1': 439800,
  'Instagram - DM Instagram': 195500,
  'Google - Website (2br APH)': 146600,
  'Google - Website (2br APA)': 146600,
  'Google - Apartemen LP 1': 97537,
  'Google - Apartemen': 97537,
  'TikTok - Video Promo / Show Unit': 0,
  'Not Detected': 0,
};

export function getSavedCampaignAdCosts(): Record<string, number> {
  try {
    const saved = localStorage.getItem(CAMPAIGN_COSTS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_CAMPAIGN_AD_COSTS, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load saved campaign ad costs', e);
  }
  return { ...DEFAULT_CAMPAIGN_AD_COSTS };
}

/**
 * Returns synchronized campaign ad costs where the sum of all campaign costs
 * strictly equals the Total Monthly Report Cost (getTotalMonthAdCost).
 */
export function getSynchronizedCampaignAdCosts(totalMonthlyTarget?: number): Record<string, number> {
  const targetTotal = totalMonthlyTarget !== undefined ? totalMonthlyTarget : getTotalMonthAdCost();
  const rawCampaignCosts = getSavedCampaignAdCosts();
  
  const campaignKeys = Object.keys(DEFAULT_CAMPAIGN_AD_COSTS);
  // Include any extra keys in rawCampaignCosts
  Object.keys(rawCampaignCosts).forEach((k) => {
    if (!campaignKeys.includes(k)) campaignKeys.push(k);
  });

  if (targetTotal <= 0) {
    const zeroed: Record<string, number> = {};
    campaignKeys.forEach(k => { zeroed[k] = 0; });
    return zeroed;
  }

  const rawSum = campaignKeys.reduce((sum, k) => sum + (rawCampaignCosts[k] || 0), 0);
  
  if (rawSum <= 0) {
    const defKeys = Object.keys(DEFAULT_CAMPAIGN_AD_COSTS).filter(k => DEFAULT_CAMPAIGN_AD_COSTS[k] > 0);
    const defSum = defKeys.reduce((sum, k) => sum + DEFAULT_CAMPAIGN_AD_COSTS[k], 0);
    const result: Record<string, number> = {};
    let allocated = 0;
    defKeys.forEach((k, idx) => {
      if (idx === defKeys.length - 1) {
        result[k] = Math.max(0, targetTotal - allocated);
      } else {
        const val = Math.round((DEFAULT_CAMPAIGN_AD_COSTS[k] / defSum) * targetTotal);
        result[k] = val;
        allocated += val;
      }
    });
    return result;
  }

  // Distribute targetTotal proportionally based on campaign weights
  const result: Record<string, number> = {};
  let allocated = 0;
  // Sort keys descending so the largest campaign absorbs minor rounding diffs
  const sortedKeys = [...campaignKeys].sort((a, b) => (rawCampaignCosts[b] || 0) - (rawCampaignCosts[a] || 0));

  sortedKeys.forEach((k, idx) => {
    if (idx === sortedKeys.length - 1) {
      result[k] = Math.max(0, targetTotal - allocated);
    } else {
      const val = Math.round(((rawCampaignCosts[k] || 0) / rawSum) * targetTotal);
      result[k] = val;
      allocated += val;
    }
  });

  return result;
}

export function saveCampaignAdCost(campaignKey: string, cost: number): Record<string, number> {
  const current = getSavedCampaignAdCosts();
  const cleanCost = Math.max(0, cost);
  const updated = {
    ...current,
    [campaignKey]: cleanCost,
  };

  try {
    localStorage.setItem(CAMPAIGN_COSTS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('upperwest_campaign_costs_updated'));
  } catch (e) {
    console.error('Failed to save campaign ad cost', e);
  }
  return updated;
}

export function saveBatchCampaignAdCosts(costs: Record<string, number>): Record<string, number> {
  const current = getSavedCampaignAdCosts();
  const updated = { ...current, ...costs };

  try {
    localStorage.setItem(CAMPAIGN_COSTS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('upperwest_campaign_costs_updated'));
    window.dispatchEvent(new Event('upperwest_ad_costs_updated'));
  } catch (e) {
    console.error('Failed to save batch campaign ad costs', e);
  }
  return updated;
}

export function resetCampaignAdCostsToDefault(): Record<string, number> {
  try {
    localStorage.setItem(CAMPAIGN_COSTS_STORAGE_KEY, JSON.stringify(DEFAULT_CAMPAIGN_AD_COSTS));
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(DEFAULT_WEEKLY_AD_COSTS));
    window.dispatchEvent(new Event('upperwest_campaign_costs_updated'));
    window.dispatchEvent(new Event('upperwest_ad_costs_updated'));
  } catch (e) {
    console.error('Failed to reset campaign ad costs', e);
  }
  return { ...DEFAULT_CAMPAIGN_AD_COSTS };
}

