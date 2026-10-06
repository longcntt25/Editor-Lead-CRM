import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, ExternalLink, ChevronRight, UserPlus, Eye, Instagram, Download } from 'lucide-react';
import { api } from '../../services/api';
import { Lead, PipelineStage, LEAD_CATEGORIES, WorkspaceMember } from '@editor-crm/shared';

interface LeadsPageProps {
  stages: PipelineStage[];
  members: WorkspaceMember[];
  onOpenAddLead: () => void;
  onSelectLead: (leadId: string) => void;
}

export const LeadsPage: React.FC<LeadsPageProps> = ({
  stages,
  members,
  onOpenAddLead,
  onSelectLead,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedScoreTier, setSelectedScoreTier] = useState('');
  const [selectedStageId, setSelectedStageId] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState('');

  const { data, isLoading } = useQuery<{ leads: Lead[] }>({
    queryKey: [
      'leads',
      searchTerm,
      selectedCategory,
      selectedScoreTier,
      selectedStageId,
      selectedAssignee,
    ],
    queryFn: () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('q', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedScoreTier) params.append('scoreTier', selectedScoreTier);
      if (selectedStageId) params.append('stageId', selectedStageId);
      if (selectedAssignee) params.append('assignedUserId', selectedAssignee);
      return api.get(`/api/v1/leads?${params.toString()}`);
    },
  });

  const leads = data?.leads || [];

  const handleExportCsv = () => {
    if (leads.length === 0) return;
    const headers = [
      'Username',
      'Tên hiển thị',
      'Category',
      'Followers',
      'Đánh giá chất lượng',
      'Điểm số',
      'Pipeline Stage',
      'Editor phụ trách',
      'Profile Link',
      'Website',
      'Ngày liên hệ cuối',
    ];

    const rows = leads.map((l) => [
      `"${l.username}"`,
      `"${(l.displayName || l.username).replace(/"/g, '""')}"`,
      `"${l.category}"`,
      l.followerCount,
      l.scoreTier,
      l.scorePoints,
      `"${l.stage?.name || ''}"`,
      `"${l.assignedUser?.fullName || ''}"`,
      `"${l.profileUrl || ''}"`,
      `"${l.website || ''}"`,
      l.lastContactedAt ? new Date(l.lastContactedAt * 1000).toLocaleDateString('vi-VN') : '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `leads-export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const scoreBadgeColors = {
    HIGH: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    MEDIUM: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    LOW: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo username, tên, bio..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 pl-9 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Filter Category */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">Tất cả Category</option>
          {LEAD_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Filter Score Tier */}
        <select
          value={selectedScoreTier}
          onChange={(e) => setSelectedScoreTier(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">Tất cả Điểm</option>
          <option value="HIGH">Cao (HIGH)</option>
          <option value="MEDIUM">Trung bình (MEDIUM)</option>
          <option value="LOW">Thấp (LOW)</option>
        </select>

        {/* Filter Stage */}
        <select
          value={selectedStageId}
          onChange={(e) => setSelectedStageId(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">Tất cả Stage</option>
          {stages.map((st) => (
            <option key={st.id} value={st.id}>
              {st.name}
            </option>
          ))}
        </select>

        {/* Filter Assignee */}
        <select
          value={selectedAssignee}
          onChange={(e) => setSelectedAssignee(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">Tất cả Editor</option>
          {members.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.user?.fullName || m.userId}
            </option>
          ))}
        </select>

        <button
          onClick={handleExportCsv}
          disabled={leads.length === 0}
          title="Xuất danh sách lead ra file CSV (Excel)"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition-colors ml-auto"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>Xuất CSV ({leads.length})</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/60 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Lead / Instagram</th>
                <th className="px-4 py-3">Phân Loại</th>
                <th className="px-4 py-3">Followers</th>
                <th className="px-4 py-3">Đánh Giá (Score)</th>
                <th className="px-4 py-3">Stage Hiện Tại</th>
                <th className="px-4 py-3">Editor Phụ Trách</th>
                <th className="px-4 py-3 text-right">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    Đang tải danh sách leads...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="space-y-3">
                      <p className="text-slate-400 text-xs">Chưa có lead nào trong bộ lọc này.</p>
                      <button
                        onClick={onOpenAddLead}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Thêm Lead Đầu Tiên</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => onSelectLead(lead.id)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center text-xs shrink-0">
                          {lead.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate">@{lead.username}</p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {lead.displayName || lead.username}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px] font-medium border border-slate-700">
                        {lead.category}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-slate-300 font-mono">
                      {lead.followerCount.toLocaleString()}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          scoreBadgeColors[lead.scoreTier]
                        }`}
                      >
                        {lead.scoreTier} ({lead.scorePoints}đ)
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded-md text-[11px] font-medium"
                        style={{
                          backgroundColor: `${lead.stage?.color || '#3b82f6'}20`,
                          color: lead.stage?.color || '#93c5fd',
                          border: `1px solid ${lead.stage?.color || '#3b82f6'}40`,
                        }}
                      >
                        {lead.stage?.name || 'Mới'}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-slate-300">
                      {lead.assignedUser ? (
                        <span className="text-slate-200 font-medium">
                          {lead.assignedUser.fullName}
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">Chưa phân công</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div
                        className="flex items-center justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <a
                          href={lead.profileUrl || `https://instagram.com/${lead.username}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Mở Instagram Profile"
                          className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                          <Instagram className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => onSelectLead(lead.id)}
                          title="Xem Chi Tiết"
                          className="p-1.5 rounded-md text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
