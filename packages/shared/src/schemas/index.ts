import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải từ 6 ký tự trở lên'),
  fullName: z.string().min(2, 'Họ và tên ít nhất 2 ký tự'),
  workspaceName: z.string().min(2, 'Tên workspace ít nhất 2 ký tự').optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

export const createWorkspaceSchema = z.object({
  name: z.string().min(2, 'Tên workspace ít nhất 2 ký tự'),
});

export const addMemberSchema = z.object({
  email: z.string().email('Email thành viên không hợp lệ'),
  role: z.enum(['OWNER', 'EDITOR']).default('EDITOR'),
});

export const createLeadSchema = z.object({
  username: z.string().min(1, 'Username không được để trống'),
  displayName: z.string().optional().nullable(),
  profileUrl: z.string().url('URL không hợp lệ').optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
  bio: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  followerCount: z.number().int().nonnegative().default(0),
  followingCount: z.number().int().nonnegative().default(0),
  category: z.enum([
    'CREATOR',
    'BRAND',
    'AGENCY',
    'PODCAST',
    'YOUTUBER',
    'COACH',
    'PERSONAL_BRAND',
    'EDITOR',
    'OTHER',
  ]).default('CREATOR'),
  language: z.string().default('vi'),
  assignedUserId: z.string().optional().nullable(),
  pipelineStageId: z.string().optional(),
});

export const updateLeadSchema = createLeadSchema.partial().extend({
  scoreTier: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
  scorePoints: z.number().optional(),
});

export const createNoteSchema = z.object({
  content: z.string().min(1, 'Nội dung ghi chú không được để trống'),
});

export const createTemplateSchema = z.object({
  name: z.string().min(1, 'Tên mẫu không được để trống'),
  category: z.string().optional().nullable(),
  content: z.string().min(1, 'Nội dung tin nhắn không được để trống'),
});

export const createFollowUpSchema = z.object({
  leadId: z.string().min(1),
  assignedUserId: z.string().min(1),
  dueDate: z.number().int().positive('Ngày hẹn không hợp lệ'),
  note: z.string().optional().nullable(),
});

export const updateFollowUpStatusSchema = z.object({
  status: z.enum(['PENDING', 'COMPLETED', 'SKIPPED']),
});
