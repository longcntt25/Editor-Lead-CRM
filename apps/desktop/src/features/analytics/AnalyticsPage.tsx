import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingUp, Users, Target, CheckCircle2, Trophy, Award } from 'lucide-react';
import { api } from '../../services/api';

interface AnalyticsData {
  overview: {
    totalLeads: number;
    contactedLeads: number;
    qualifiedLeads: number;
    clientsWon: number;
    conversionRate: number;
  };
  byEditor: {
    editorId: string;
    name: string;
    totalAssigned: number;
    contacted: number;
    clientsWon: number;
  }[];
  byCategory: {
    category: string;
    totalLeads: number;
    contacted: number;
    clientsWon: number;
  }[];
}

export const AnalyticsPage: React.FC = () => {
  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['analytics-overview'],
    queryFn: () => api.get('/api/v1/analytics/overview'),
  });

  const overview = data?.overview || {
    totalLeads: 0,
    contactedLeads: 0,
    qualifiedLeads: 0,
    clientsWon: 0,
    conversionRate: 0,
  };

  const byEditor = data?.byEditor || [];
  const byCategory = data?.byCategory || [];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Tổng Lead Lưu Trữ</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white">{overview.totalLeads}</p>
          <p className="text-[11px] text-slate-500">Khách hàng trong phễu</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Đã Tiếp Cận (Outreach)</span>
            <Target className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400">{overview.contactedLeads}</p>
          <p className="text-[11px] text-slate-500">
            {overview.totalLeads > 0
              ? `${Math.round((overview.contactedLeads / overview.totalLeads) * 100)}% tỷ lệ tiếp cận`
              : '0%'}
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Khách Hàng Đã Chốt (Won)</span>
            <Trophy className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">{overview.clientsWon}</p>
          <p className="text-[11px] text-slate-500">Hợp đồng thành công</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Tỷ Lệ Chuyển Đổi Tổng</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-indigo-400">{overview.conversionRate}%</p>
          <p className="text-[11px] text-slate-500">Từ Lead thành Khách Hàng</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance by Editor */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Hiệu Suất Theo Editor</span>
            </h4>
            <span className="text-[11px] text-slate-400">Đóng góp của từng thành viên</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/60 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-3 py-2.5">Editor</th>
                  <th className="px-3 py-2.5 text-center">Được Gán</th>
                  <th className="px-3 py-2.5 text-center">Đã Nhắn</th>
                  <th className="px-3 py-2.5 text-center">Chốt Deal</th>
                  <th className="px-3 py-2.5 text-right">Tỷ Lệ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {byEditor.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      Chưa có dữ liệu phân công editor.
                    </td>
                  </tr>
                ) : (
                  byEditor.map((editor) => {
                    const rate =
                      editor.totalAssigned > 0
                        ? Math.round((editor.clientsWon / editor.totalAssigned) * 100)
                        : 0;
                    return (
                      <tr key={editor.editorId} className="hover:bg-slate-800/30">
                        <td className="px-3 py-3 font-medium text-white">{editor.name}</td>
                        <td className="px-3 py-3 text-center text-slate-300 font-mono">
                          {editor.totalAssigned}
                        </td>
                        <td className="px-3 py-3 text-center text-amber-300 font-mono">
                          {editor.contacted}
                        </td>
                        <td className="px-3 py-3 text-center text-emerald-400 font-mono font-bold">
                          {editor.clientsWon}
                        </td>
                        <td className="px-3 py-3 text-right text-indigo-400 font-bold">{rate}%</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Performance by Category */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              <span>Hiệu Quả Theo Nhóm Khách Hàng (Niche)</span>
            </h4>
            <span className="text-[11px] text-slate-400">Niche nào mang lại nhiều deal nhất</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/60 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-3 py-2.5">Category</th>
                  <th className="px-3 py-2.5 text-center">Tổng Lead</th>
                  <th className="px-3 py-2.5 text-center">Đã Nhắn</th>
                  <th className="px-3 py-2.5 text-center">Chốt Deal</th>
                  <th className="px-3 py-2.5 text-right">Tỷ Lệ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {byCategory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      Chưa có dữ liệu category.
                    </td>
                  </tr>
                ) : (
                  byCategory.map((cat) => {
                    const rate =
                      cat.totalLeads > 0 ? Math.round((cat.clientsWon / cat.totalLeads) * 100) : 0;
                    return (
                      <tr key={cat.category} className="hover:bg-slate-800/30">
                        <td className="px-3 py-3 font-medium text-white">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[11px]">
                            {cat.category}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center text-slate-300 font-mono">
                          {cat.totalLeads}
                        </td>
                        <td className="px-3 py-3 text-center text-amber-300 font-mono">
                          {cat.contacted}
                        </td>
                        <td className="px-3 py-3 text-center text-emerald-400 font-mono font-bold">
                          {cat.clientsWon}
                        </td>
                        <td className="px-3 py-3 text-right text-indigo-400 font-bold">{rate}%</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
