import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, CheckCircle2, MessageSquare, CalendarClock, Trophy, TrendingUp, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';
import { DashboardMetrics } from '@editor-crm/shared';
import { NavTab } from '../../components/layout/Sidebar';

interface DashboardPageProps {
  onNavigate: (tab: NavTab) => void;
  onOpenAddLead: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate, onOpenAddLead }) => {
  const { data, isLoading } = useQuery<{ metrics: DashboardMetrics }>({
    queryKey: ['dashboard-metrics'],
    queryFn: () => api.get('/api/v1/dashboard/metrics'),
    refetchInterval: 30000,
  });

  const metrics = data?.metrics || {
    totalLeads: 0,
    qualifiedLeads: 0,
    contactedLeads: 0,
    repliedLeads: 0,
    clientsWon: 0,
    followUpsDueToday: 0,
  };

  const statCards = [
    {
      label: 'Tổng Số Lead',
      value: metrics.totalLeads,
      icon: Users,
      color: 'from-blue-500/10 to-indigo-500/10 text-blue-400 border-blue-500/20',
      action: () => onNavigate('leads'),
    },
    {
      label: 'Lead Đạt Chuẩn (High/Med)',
      value: metrics.qualifiedLeads,
      icon: CheckCircle2,
      color: 'from-emerald-500/10 to-teal-500/10 text-emerald-400 border-emerald-500/20',
      action: () => onNavigate('leads'),
    },
    {
      label: 'Đã Tiếp Cận (Contacted)',
      value: metrics.contactedLeads,
      icon: MessageSquare,
      color: 'from-amber-500/10 to-yellow-500/10 text-amber-400 border-amber-500/20',
      action: () => onNavigate('pipeline'),
    },
    {
      label: 'Follow-up Hôm Nay',
      value: metrics.followUpsDueToday,
      icon: CalendarClock,
      color: 'from-rose-500/10 to-red-500/10 text-rose-400 border-rose-500/20',
      action: () => onNavigate('followups'),
    },
    {
      label: 'Khách Hàng Đã Chốt',
      value: metrics.clientsWon,
      icon: Trophy,
      color: 'from-purple-500/10 to-indigo-500/10 text-purple-400 border-purple-500/20',
      action: () => onNavigate('pipeline'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/20 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden flex items-center justify-between">
        <div className="space-y-1 z-10">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-medium border border-indigo-500/30">
            <TrendingUp className="w-3 h-3" />
            <span>Hệ Thống Sẵn Sàng</span>
          </span>
          <h3 className="text-xl font-bold text-white tracking-tight">Chào mừng bạn trở lại!</h3>
          <p className="text-xs text-slate-300 max-w-xl">
            Bắt đầu ngày mới bằng việc kiểm tra danh sách follow-up hôm nay và liên hệ với các lead tiềm năng nhất.
          </p>
        </div>
        <div className="flex items-center gap-3 z-10">
          <button
            onClick={() => onNavigate('followups')}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all flex items-center gap-2"
          >
            <span>Xem Follow-up ({metrics.followUpsDueToday})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onOpenAddLead}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md shadow-indigo-600/30 transition-all"
          >
            + Thêm Lead Mới
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              onClick={card.action}
              className={`bg-slate-900/80 border p-4 rounded-xl cursor-pointer hover:border-slate-600 transition-all ${card.color}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-400">{card.label}</span>
                <Icon className="w-4 h-4 opacity-80" />
              </div>
              <div className="text-2xl font-bold text-white tracking-tight">
                {isLoading ? '...' : card.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Funnel Progress Section */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
        <h4 className="text-sm font-semibold text-white">Quy Trình Chuyển Đổi Lead (Outreach Funnel)</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">1. Tìm Thấy</span>
            <p className="text-lg font-bold text-blue-400">{metrics.totalLeads} Lead</p>
            <p className="text-[11px] text-slate-500">Khách hàng lưu vào CRM</p>
          </div>

          <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">2. Đã Tiếp Cận</span>
            <p className="text-lg font-bold text-amber-400">{metrics.contactedLeads} Lead</p>
            <p className="text-[11px] text-slate-500">
              {metrics.totalLeads > 0
                ? `${Math.round((metrics.contactedLeads / metrics.totalLeads) * 100)}% tỷ lệ tiếp cận`
                : '0%'}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">3. Có Phản Hồi</span>
            <p className="text-lg font-bold text-indigo-400">{metrics.repliedLeads} Lead</p>
            <p className="text-[11px] text-slate-500">
              {metrics.contactedLeads > 0
                ? `${Math.round((metrics.repliedLeads / metrics.contactedLeads) * 100)}% tỷ lệ phản hồi`
                : '0%'}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">4. Khách Chốt Deal</span>
            <p className="text-lg font-bold text-emerald-400">{metrics.clientsWon} Khách hàng</p>
            <p className="text-[11px] text-slate-500">
              {metrics.totalLeads > 0
                ? `${Math.round((metrics.clientsWon / metrics.totalLeads) * 100)}% chuyển đổi tổng`
                : '0%'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
