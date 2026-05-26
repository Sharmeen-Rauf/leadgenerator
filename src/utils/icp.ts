import { Lead } from '../hooks/useLeads';

export interface ICPConfig {
  niche: string;
  location: string;
  minRating: number;
  minReviews: number;
  requireEmail: boolean;
  requirePhone: boolean;
  requireWebsite: boolean;
}

export const DEFAULT_ICP_CONFIG: ICPConfig = {
  niche: 'any',
  location: 'any',
  minRating: 0,
  minReviews: 0,
  requireEmail: true,
  requirePhone: false,
  requireWebsite: true,
};

export function getICPConfig(): ICPConfig {
  if (typeof window === 'undefined') return DEFAULT_ICP_CONFIG;
  try {
    const stored = localStorage.getItem('pitchradar_icp_config');
    if (stored) {
      return { ...DEFAULT_ICP_CONFIG, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Error loading ICP config:', e);
  }
  return DEFAULT_ICP_CONFIG;
}

export function saveICPConfig(config: ICPConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('pitchradar_icp_config', JSON.stringify(config));
  } catch (e) {
    console.error('Error saving ICP config:', e);
  }
}

export function calculateICPScore(lead: Lead, config: ICPConfig): number {
  let score = 0;
  const maxCriteria = 5;

  // 1. Niche Match (20%)
  if (
    config.niche.toLowerCase() === 'any' ||
    lead.niche.toLowerCase().includes(config.niche.toLowerCase()) ||
    config.niche.toLowerCase().includes(lead.niche.toLowerCase())
  ) {
    score += 20;
  }

  // 2. Location Match (20%)
  if (
    config.location.toLowerCase() === 'any' ||
    lead.location.toLowerCase().includes(config.location.toLowerCase()) ||
    config.location.toLowerCase().includes(lead.location.toLowerCase())
  ) {
    score += 20;
  }

  // 3. Email Match (20%)
  const hasEmail = lead.email && lead.email !== 'N/A' && lead.email !== 'null';
  if (config.requireEmail) {
    if (hasEmail) score += 20;
  } else {
    // If not required, give 20% by default or +20% if they have it anyway
    score += 20;
  }

  // 4. Phone Match (20%)
  const hasPhone = lead.phone && lead.phone !== 'N/A' && lead.phone !== 'null';
  if (config.requirePhone) {
    if (hasPhone) score += 20;
  } else {
    score += 20;
  }

  // 5. Website Match (20%)
  const hasWebsite = lead.website && lead.website !== 'N/A' && lead.website !== 'null';
  if (config.requireWebsite) {
    if (hasWebsite) score += 20;
  } else {
    score += 20;
  }

  // Filter based on numeric gates (if set, and criteria is failed, penalize score by half)
  let penalty = 0;
  if (config.minRating > 0 && lead.rating < config.minRating) {
    penalty += 15;
  }
  if (config.minReviews > 0 && lead.review_count < config.minReviews) {
    penalty += 15;
  }

  return Math.max(0, score - penalty);
}
