import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Check, XCircle, ExternalLink, AlertCircle, Clock } from 'lucide-react';
import { api } from '../../services/api';
import { FollowUp, FollowUpStatus } from '@editor-crm/shared';

interface FollowupsPageProps {
  onSelectLead: (leadId: string) => void;
}

export const FollowupsPage: React.FC<FollowupsPageProps> = ({ onSelectLead }) => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<FollowUpStatus | 'ALL'>('PENDING');

  const { data, isLoading } = useQuery<{ followUps: FollowUp[] }>({
    queryKey: ['follow-ups', statusFilter],
    queryFn: () => api.get(`/api/v1/follow-ups?status=${statusFilter}`),
  });

  const followUps = data?.followUps || [];

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: FollowUpStatus }) =>
      api.patch(`/api/v1/follow-ups/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-ups'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });

  const now = Math.floor(Date.now() / 1000);

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex bg-slate-900/60 border border-slate-800 p-1 rounded-xl w-fit">
        <button
          onClick={() => setStatusFilter('PENDING')}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            statusFilter === 'PENDING'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Cần Follow-up (Đang Chờ)
        </button>
        <button
          onClick={() => setStatusFilter('COMPLETED')}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            statusFilter === 'COMPLETED'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Đã Hoàn Thành
        </button>
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            statusFilter === 'ALL'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Tất Cả
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800">
            Đang tải danh sách follow-up...
          </div>
        ) : followUps.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800 space-y-2">
            <Check className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="font-semibold text-white">Tuyệt vời! Không còn việc follow-up nào bị tồn đọng.</p>
            <p className="text-slate-500">
              Hãy tiếp tục tiếp cận các khách hàng mới để duy trì phễu bán hàng.
            </p>
          </div>
        ) : (
          followUps.map((item) => {
            const isOverdue = item.status === 'PENDING' && item.dueDate < now;
            const isToday =
              item.status === 'PENDING' &&
              !isOverdue &&
              item.dueDate <= now + 24 * 3600;

            return (
              <div
                key={item.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 p-4 rounded-xl flex items-center justify-between gap-4 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      isOverdue
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : isToday
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                    }`}
                  >
                    <CalendarClock className="w-5 h-5" />
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectLead(item.leadId)}
                        className="font-bold text-white text-xs hover:text-indigo-400 transition-colors truncate"
                      >
                        @{item.lead?.username || 'khách hàng'}
                      </button>

                      {isOverdue && (
                        <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold border border-red-500/30">
                          Quá Hạn
                        </span>
                      )}
                      {isToday && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/30">
                          Đến Hạn Hôm Nay
                        </span>
                      )}
                      {item.status === 'COMPLETED' && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                          Đã Hoàn Thành
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 truncate">
                      {item.note || 'Nhắc nhở follow-up tiếp theo'}
                    </p>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Ngày hẹn: {new Date(item.dueDate * 1000).toLocaleDateString('vi-VN')}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onSelectLead(item.leadId)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
                  >
                    Xem Lead & Nhắn Tin
                  </button>

                  {item.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() =>
                          updateStatusMutation.mutate({ id: item.id, status: 'COMPLETED' })
                        }
                        title="Đánh dấu đã follow-up"
                        className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 transition-all"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          updateStatusMutation.mutate({ id: item.id, status: 'SKIPPED' })
                        }
                        title="Bỏ qua follow-up này"
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
