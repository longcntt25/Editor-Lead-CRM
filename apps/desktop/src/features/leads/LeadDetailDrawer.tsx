import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
  ExternalLink,
  Copy,
  Check,
  Send,
  Calendar,
  MessageSquare,
  Clock,
  User,
  Tag,
  Sparkles,
} from 'lucide-react';
import { api } from '../../services/api';
import { Lead, LeadActivity, LeadNote, MessageTemplate, PipelineStage, WorkspaceMember } from '@editor-crm/shared';

interface LeadDetailDrawerProps {
  leadId: string | null;
  onClose: () => void;
  stages: PipelineStage[];
  members: WorkspaceMember[];
}

export const LeadDetailDrawer: React.FC<LeadDetailDrawerProps> = ({
  leadId,
  onClose,
  stages,
  members,
}) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'outreach' | 'notes' | 'timeline'>('outreach');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [noteContent, setNoteContent] = useState('');

  // Fetch lead detail
  const { data: leadData } = useQuery<{ lead: Lead }>({
    queryKey: ['lead-detail', leadId],
    queryFn: () => api.get(`/api/v1/leads/${leadId}`),
    enabled: !!leadId,
  });

  // Fetch templates for outreach
  const { data: templatesData } = useQuery<{ templates: MessageTemplate[] }>({
    queryKey: ['templates'],
    queryFn: () => api.get('/api/v1/templates'),
  });

  // Fetch notes
  const { data: notesData } = useQuery<{ notes: LeadNote[] }>({
    queryKey: ['lead-notes', leadId],
    queryFn: () => api.get(`/api/v1/notes/${leadId}/notes`),
    enabled: !!leadId && activeTab === 'notes',
  });

  // Fetch timeline activities
  const { data: activitiesData } = useQuery<{ activities: LeadActivity[] }>({
    queryKey: ['lead-activities', leadId],
    queryFn: () => api.get(`/api/v1/notes/${leadId}/activities`),
    enabled: !!leadId && activeTab === 'timeline',
  });

  const lead = leadData?.lead;
  const templates = templatesData?.templates || [];

  // Mutations
  const updateStageMutation = useMutation({
    mutationFn: (stageId: string) => api.post(`/api/v1/leads/${leadId}/stage`, { stageId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead-detail', leadId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });

  const updateAssigneeMutation = useMutation({
    mutationFn: (assignedUserId: string | null) =>
      api.post(`/api/v1/leads/${leadId}/assign`, { assignedUserId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead-detail', leadId] });
    },
  });

  const markContactedMutation = useMutation({
    mutationFn: () => api.post(`/api/v1/leads/${leadId}/contacted`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead-detail', leadId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['follow-ups'] });
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: (content: string) => api.post(`/api/v1/notes/${leadId}/notes`, { content }),
    onSuccess: () => {
      setNoteContent('');
      queryClient.invalidateQueries({ queryKey: ['lead-notes', leadId] });
    },
  });

  if (!leadId || !lead) return null;

  // Personalized message computation
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];
  const personalizedMessage = selectedTemplate
    ? selectedTemplate.content
        .replace(/{{name}}/g, lead.displayName || lead.username)
        .replace(/{{username}}/g, `@${lead.username}`)
        .replace(/{{website}}/g, lead.website || '')
    : 'Chọn mẫu tin nhắn bên dưới để tự động điền nội dung cá nhân hóa...';

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(personalizedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scoreBadgeColors = {
    HIGH: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    MEDIUM: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    LOW: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center text-sm border border-indigo-500/30">
            {lead.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">@{lead.username}</h3>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                  scoreBadgeColors[lead.scoreTier]
                }`}
              >
                {lead.scoreTier} ({lead.scorePoints}đ)
              </span>
            </div>
            <p className="text-xs text-slate-400">{lead.displayName || lead.username}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={lead.profileUrl || `https://instagram.com/${lead.username}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            <span>Mở Instagram</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Meta Assignment & Stage Controls */}
      <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/40 grid grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-semibold uppercase text-slate-400 block mb-1">
            Pipeline Stage
          </label>
          <select
            value={lead.pipelineStageId}
            onChange={(e) => updateStageMutation.mutate(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {stages.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-semibold uppercase text-slate-400 block mb-1">
            Editor Phụ Trách
          </label>
          <select
            value={lead.assignedUserId || ''}
            onChange={(e) => updateAssigneeMutation.mutate(e.target.value || null)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">-- Chưa gán --</option>
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.user?.fullName || m.userId}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Profile Info Summary */}
      <div className="p-5 border-b border-slate-800/80 space-y-2 text-xs">
        <div className="flex items-center gap-4 text-slate-300">
          <span className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-medium text-indigo-400">{lead.category}</span>
          </span>
          <span>•</span>
          <span>
            Followers: <strong className="text-white">{lead.followerCount.toLocaleString()}</strong>
          </span>
          {lead.website && (
            <>
              <span>•</span>
              <a
                href={lead.website}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:underline truncate max-w-[200px]"
              >
                {lead.website}
              </a>
            </>
          )}
        </div>
        {lead.bio && (
          <p className="text-slate-400 bg-slate-800/40 p-2.5 rounded-lg border border-slate-800 text-[11px] leading-relaxed">
            {lead.bio}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 px-5 gap-6">
        <button
          onClick={() => setActiveTab('outreach')}
          className={`py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'outreach'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Tiếp Cận (Outreach)</span>
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'notes'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Ghi Chú (Notes)</span>
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'timeline'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Timeline Hoạt Động</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-5 overflow-y-auto">
        {activeTab === 'outreach' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Chọn Mẫu Tin Nhắn (Template)
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {templates.length === 0 ? (
                  <option value="">Chưa có mẫu tin nhắn (Tạo trong tab Mẫu Tin Nhắn)</option>
                ) : (
                  templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.category || 'Chung'})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Nội Dung Tin Nhắn Đã Cá Nhân Hóa:
              </label>
              <div className="relative">
                <textarea
                  readOnly
                  rows={6}
                  value={personalizedMessage}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none resize-none"
                />
                <button
                  onClick={handleCopyMessage}
                  className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium shadow-sm transition-all active:scale-95"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-300" />
                      <span>Đã Copy!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Tin Nhắn</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-3">
              <h4 className="text-xs font-semibold text-white">Quy Trình Tiếp Cận Thủ Công An Toàn:</h4>
              <ol className="text-xs text-slate-300 space-y-1.5 list-decimal pl-4">
                <li>Bấm nút <strong>Copy Tin Nhắn</strong> ở trên.</li>
                <li>Bấm <strong>Mở Instagram</strong> góc trên để vào trang cá nhân của họ.</li>
                <li>Dán nội dung vào Instagram Direct Message và gửi.</li>
                <li>Bấm nút xanh bên dưới để ghi nhận và <strong>tự động lên lịch Follow-up sau 3 ngày</strong>.</li>
              </ol>

              <button
                onClick={() => markContactedMutation.mutate()}
                disabled={markContactedMutation.isPending}
                className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <Check className="w-4 h-4" />
                <span>
                  {markContactedMutation.isPending
                    ? 'Đang xử lý...'
                    : 'Đã Nhắn Tin $\\to$ Đánh Dấu Đã Liên Hệ (Contacted)'}
                </span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <textarea
                rows={3}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Ghi chú về khách này (VD: Muốn dựng video dạng Alex Hormozi style, ngân sách 500k/video...)"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
              />
              <div className="flex justify-end">
                <button
                  onClick={() => addNoteMutation.mutate(noteContent)}
                  disabled={!noteContent.trim() || addNoteMutation.isPending}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium transition-all"
                >
                  Thêm Ghi Chú
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              {(notesData?.notes || []).length === 0 ? (
                <p className="text-center text-xs text-slate-500 py-6">Chưa có ghi chú nào cho lead này.</p>
              ) : (
                (notesData?.notes || []).map((n) => (
                  <div key={n.id} className="p-3 rounded-lg bg-slate-800/60 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-medium text-slate-300">{n.user?.fullName}</span>
                      <span>{new Date(n.createdAt * 1000).toLocaleString('vi-VN')}</span>
                    </div>
                    <p className="text-xs text-slate-200 whitespace-pre-wrap">{n.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-3">
            {(activitiesData?.activities || []).length === 0 ? (
              <p className="text-center text-xs text-slate-500 py-6">Chưa có lịch sử hoạt động.</p>
            ) : (
              (activitiesData?.activities || []).map((act) => (
                <div key={act.id} className="flex gap-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <div className="flex-1 space-y-0.5">
                    <p className="text-slate-200">
                      <strong className="text-indigo-400">{act.activityType}</strong> bởi{' '}
                      {act.user?.fullName || 'Hệ thống'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {new Date(act.createdAt * 1000).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
