import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, UserPlus, Trash2, Mail, User } from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { Role, WorkspaceMember } from '@editor-crm/shared';

export const TeamPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { currentWorkspace, user: currentUser } = useAuthStore();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('EDITOR');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isOwner = currentWorkspace?.role === 'OWNER';

  const { data, isLoading } = useQuery<{ members: WorkspaceMember[] }>({
    queryKey: ['workspace-members', currentWorkspace?.id],
    queryFn: () => api.get(`/api/v1/workspaces/${currentWorkspace?.id}/members`),
    enabled: !!currentWorkspace?.id,
  });

  const members = data?.members || [];

  const addMemberMutation = useMutation({
    mutationFn: () =>
      api.post(`/api/v1/workspaces/${currentWorkspace?.id}/members`, {
        email: inviteEmail,
        role: inviteRole,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', currentWorkspace?.id] });
      setSuccess('Thêm thành viên thành công!');
      setInviteEmail('');
      setError(null);
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err: any) => {
      setError(err.message || 'Lỗi khi thêm thành viên');
      setSuccess(null);
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) =>
      api.delete(`/api/v1/workspaces/${currentWorkspace?.id}/members/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', currentWorkspace?.id] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">Thành Viên Nhóm (Team)</h3>
          <p className="text-xs text-slate-400">
            Quản lý các video editor có quyền truy cập vào Workspace <strong>{currentWorkspace?.name}</strong>.
          </p>
        </div>
      </div>

      {/* Invite Member (Owner Only) */}
      {isOwner && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <h4 className="text-xs font-bold text-white flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-indigo-400" />
            <span>Thêm Editor Mới Vào Workspace</span>
          </h4>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
              {success}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Nhập email của editor đã đăng ký tài khoản..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 pl-9 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as Role)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="EDITOR">EDITOR (Xem & chăm sóc lead)</option>
              <option value="OWNER">OWNER (Quản trị toàn quyền)</option>
            </select>

            <button
              onClick={() => addMemberMutation.mutate()}
              disabled={!inviteEmail || addMemberMutation.isPending}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
            >
              {addMemberMutation.isPending ? 'Đang thêm...' : 'Thêm Thành Viên'}
            </button>
          </div>
        </div>
      )}

      {/* Members List */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-800/40 text-xs font-semibold text-slate-400">
          Danh Sách Thành Viên ({members.length})
        </div>

        <div className="divide-y divide-slate-800/80">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-500">Đang tải danh sách thành viên...</div>
          ) : (
            members.map((member) => (
              <div key={member.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center text-xs border border-indigo-500/30">
                    {member.user?.fullName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-white">{member.user?.fullName}</p>
                      {member.userId === currentUser?.id && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">
                          (Bạn)
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">{member.user?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      member.role === 'OWNER'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                    }`}
                  >
                    {member.role}
                  </span>

                  {isOwner && member.userId !== currentUser?.id && (
                    <button
                      onClick={() => removeMemberMutation.mutate(member.userId)}
                      title="Xóa khỏi workspace"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
