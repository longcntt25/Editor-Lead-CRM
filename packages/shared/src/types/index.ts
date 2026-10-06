export type Role = 'OWNER' | 'EDITOR';

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: number;
  createdAt: number;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: number;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: Role;
  joinedAt: number;
  user?: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl?: string | null;
  };
}

export type LeadPlatform = 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'MANUAL';

export type LeadCategory =
  | 'CREATOR'
  | 'BRAND'
  | 'AGENCY'
  | 'PODCAST'
  | 'YOUTUBER'
  | 'COACH'
  | 'PERSONAL_BRAND'
  | 'EDITOR'
  | 'OTHER';

export type ScoreTier = 'HIGH' | 'MEDIUM' | 'LOW';

export interface PipelineStage {
  id: string;
  pipelineId: string;
  name: string;
  stageOrder: number;
  color: string;
}

export interface Pipeline {
  id: string;
  workspaceId: string;
  name: string;
  isDefault: boolean;
  stages: PipelineStage[];
}

export interface Lead {
  id: string;
  workspaceId: string;
  assignedUserId: string | null;
  pipelineStageId: string;
  platform: LeadPlatform;
  platformUserId?: string | null;
  username: string;
  displayName?: string | null;
  profileUrl?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  website?: string | null;
  followerCount: number;
  followingCount: number;
  category: LeadCategory;
  language: string;
  scoreTier: ScoreTier;
  scorePoints: number;
  lastContactedAt?: number | null;
  createdAt: number;
  updatedAt: number;
  assignedUser?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  stage?: PipelineStage | null;
}

export interface LeadNote {
  id: string;
  leadId: string;
  userId: string;
  content: string;
  createdAt: number;
  user?: {
    id: string;
    fullName: string;
  };
}

export type ActivityType =
  | 'LEAD_CREATED'
  | 'ASSIGNED'
  | 'STAGE_CHANGED'
  | 'CONTACTED'
  | 'FOLLOW_UP_SCHEDULED'
  | 'NOTE_ADDED'
  | 'CLIENT_WON'
  | 'CLIENT_LOST';

export interface LeadActivity {
  id: string;
  leadId: string;
  userId: string;
  activityType: ActivityType;
  details: Record<string, any>;
  createdAt: number;
  user?: {
    id: string;
    fullName: string;
  };
}

export interface MessageTemplate {
  id: string;
  workspaceId: string;
  name: string;
  category?: string | null;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export type FollowUpStatus = 'PENDING' | 'COMPLETED' | 'SKIPPED';

export interface FollowUp {
  id: string;
  workspaceId: string;
  leadId: string;
  assignedUserId: string;
  dueDate: number;
  status: FollowUpStatus;
  note?: string | null;
  createdAt: number;
  lead?: {
    id: string;
    username: string;
    displayName?: string | null;
    avatarUrl?: string | null;
    profileUrl?: string | null;
  };
}

export interface DashboardMetrics {
  totalLeads: number;
  qualifiedLeads: number;
  contactedLeads: number;
  repliedLeads: number;
  clientsWon: number;
  followUpsDueToday: number;
}
