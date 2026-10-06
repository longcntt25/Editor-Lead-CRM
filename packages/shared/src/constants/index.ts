import { LeadCategory, Role, ScoreTier } from '../types';

export const ROLES: Record<Role, Role> = {
  OWNER: 'OWNER',
  EDITOR: 'EDITOR',
};

export const LEAD_CATEGORIES: LeadCategory[] = [
  'CREATOR',
  'BRAND',
  'AGENCY',
  'PODCAST',
  'YOUTUBER',
  'COACH',
  'PERSONAL_BRAND',
  'EDITOR',
  'OTHER',
];

export const DEFAULT_PIPELINE_STAGES = [
  { name: 'New', order: 0, color: '#3b82f6' },
  { name: 'Qualified', order: 1, color: '#6366f1' },
  { name: 'Contacted', order: 2, color: '#eab308' },
  { name: 'Follow-up', order: 3, color: '#f97316' },
  { name: 'Replied', order: 4, color: '#8b5cf6' },
  { name: 'Interested', order: 5, color: '#ec4899' },
  { name: 'Client', order: 6, color: '#22c55e' },
  { name: 'Lost', order: 7, color: '#64748b' },
];

export interface ScoringWeights {
  categoryMatch: number;
  followerRangeMatch: number;
  activeProfile: number;
  hasWebsite: number;
  languageMatch: number;
}

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  categoryMatch: 25,
  followerRangeMatch: 20,
  activeProfile: 20,
  hasWebsite: 15,
  languageMatch: 20,
};

export function calculateScoreTier(points: number): ScoreTier {
  if (points >= 70) return 'HIGH';
  if (points >= 40) return 'MEDIUM';
  return 'LOW';
}
