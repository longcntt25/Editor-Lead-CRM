import React, { useState } from 'react';
import { X, Sparkles, User, Link as LinkIcon, Instagram } from 'lucide-react';
import { api } from '../../services/api';
import { LEAD_CATEGORIES, LeadCategory, WorkspaceMember } from '@editor-crm/shared';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  members: WorkspaceMember[];
}

export const AddLeadModal: React.FC<AddLeadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  members,
}) => {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [category, setCategory] = useState<LeadCategory>('CREATOR');
  const [followerCount, setFollowerCount] = useState<number>(5000);
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [assignedUserId, setAssignedUserId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const parseInstagramUsername = (input: string): string => {
    let clean = input.trim();
    clean = clean.replace(/^(?:https?:\/\/)?(?:www\.)?instagram\.com\//i, '');
    clean = clean.split(/[/?#]/)[0];
    clean = clean.replace(/^@+/, '');
    return clean.trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const cleanUsername = parseInstagramUsername(username);
      if (!cleanUsername) {
        throw new Error('Vui lòng nhập Instagram username hoặc đường link profile hợp lệ');
      }
      await api.post('/api/v1/leads', {
        username: cleanUsername,
        displayName: displayName || cleanUsername,
        profileUrl: `https://instagram.com/${cleanUsername}`,
        category,
        followerCount: Number(followerCount),
        bio: bio || undefined,
        website: website || undefined,
        assignedUserId: assignedUserId || null,
        language: 'vi',
      });

      // Reset and close
      setUsername('');
      setDisplayName('');
      setBio('');
      setWebsite('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tạo lead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in duration-200">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Instagram className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">Thêm Khách Hàng Tiềm Năng (Lead)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Instagram Username <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. johndoe_film"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 pl-7 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <span className="text-slate-500 text-xs absolute left-2.5 top-1/2 -translate-y-1/2">@</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Tên Hiển Thị</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Phân Loại (Category)</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as LeadCategory)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {LEAD_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Lượng Followers</label>
              <input
                type="number"
                min="0"
                value={followerCount}
                onChange={(e) => setFollowerCount(Number(e.target.value))}
                placeholder="5000"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Website / Bio Link</label>
            <div className="relative">
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://beacons.ai/johndoe"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 pl-8 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <LinkIcon className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Bio / Giới Thiệu Ngắn</label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="VD: Travel creator & podcaster. DM for collaborations."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Phân Công Editor Phụ Trách</label>
            <select
              value={assignedUserId}
              onChange={(e) => setAssignedUserId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">-- Chưa gán (Để trống) --</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.user?.fullName || m.userId}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
            >
              {loading ? 'Đang lưu & Chấm điểm...' : 'Lưu Lead Vào CRM'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
