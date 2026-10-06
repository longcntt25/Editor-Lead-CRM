import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Plus, Trash2, Edit2, Copy, Check, Sparkles } from 'lucide-react';
import { api } from '../../services/api';
import { MessageTemplate } from '@editor-crm/shared';

export const TemplatesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('CREATOR');
  const [content, setContent] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ templates: MessageTemplate[] }>({
    queryKey: ['templates'],
    queryFn: () => api.get('/api/v1/templates'),
  });

  const templates = data?.templates || [];

  const createMutation = useMutation({
    mutationFn: (body: { name: string; category?: string; content: string }) =>
      api.post('/api/v1/templates', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setIsCreating(false);
      setName('');
      setContent('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });

  const handleCopy = (t: MessageTemplate) => {
    navigator.clipboard.writeText(t.content);
    setCopiedId(t.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const insertVariable = (variable: string) => {
    setContent((prev) => `${prev}${variable}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">Thư Viện Mẫu Tin Nhắn</h3>
          <p className="text-xs text-slate-400">
            Tạo các mẫu tin nhắn chuẩn, tự động thay đổi tên và kênh của khách để gửi nhanh.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Mẫu Tin Nhắn Mới</span>
        </button>
      </div>

      {/* Create Modal / Form */}
      {isCreating && (
        <div className="bg-slate-900 border border-indigo-500/30 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Soạn Mẫu Tin Nhắn Mới</span>
            </h4>
            <button
              onClick={() => setIsCreating(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Đóng
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Tên Mẫu</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Outreach chào hàng Creator (Reels/Shorts)"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Nhóm Khách Áp Dụng</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="CREATOR / AGENCY / BRAND"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300">Nội Dung Tin Nhắn</label>
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="text-slate-400">Chèn biến:</span>
                <button
                  type="button"
                  onClick={() => insertVariable('{{name}}')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 font-mono"
                >
                  {'{{name}}'}
                </button>
                <button
                  type="button"
                  onClick={() => insertVariable('{{username}}')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 font-mono"
                >
                  {'{{username}}'}
                </button>
              </div>
            </div>

            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Chào {{name}}, mình có xem qua các video gần đây trên kênh {{username}} và thấy concept rất hay..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs text-white font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsCreating(false)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
            >
              Hủy
            </button>
            <button
              onClick={() => createMutation.mutate({ name, category, content })}
              disabled={!name || !content || createMutation.isPending}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-all"
            >
              Lưu Mẫu
            </button>
          </div>
        </div>
      )}

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="col-span-2 p-8 text-center text-xs text-slate-500">
            Đang tải mẫu tin nhắn...
          </div>
        ) : templates.length === 0 ? (
          <div className="col-span-2 p-12 text-center text-xs text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800 space-y-3">
            <FileText className="w-8 h-8 text-indigo-400 mx-auto" />
            <p className="font-semibold text-white">Chưa có mẫu tin nhắn nào.</p>
            <p className="text-slate-500">
              Hãy tạo mẫu tin nhắn đầu tiên để các editor có thể copy và outreach ngay tức thì.
            </p>
          </div>
        ) : (
          templates.map((tpl) => (
            <div
              key={tpl.id}
              className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3 flex flex-col justify-between hover:border-slate-700 transition-all shadow-sm"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <h4 className="text-xs font-bold text-white tracking-tight">{tpl.name}</h4>
                  </div>
                  {tpl.category && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                      {tpl.category}
                    </span>
                  )}
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
                  {tpl.content}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <button
                  onClick={() => handleCopy(tpl)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors"
                >
                  {copiedId === tpl.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Đã copy!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy nội dung</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => deleteMutation.mutate(tpl.id)}
                  title="Xóa mẫu này"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
