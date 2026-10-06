import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Compass,
  Search,
  Plus,
  ExternalLink,
  Check,
  Sparkles,
  Instagram,
  Filter,
  FileSpreadsheet,
} from 'lucide-react';
import { api } from '../../services/api';
import { LEAD_CATEGORIES, LeadCategory, PipelineStage } from '@editor-crm/shared';

interface DiscoverCandidate {
  username: string;
  displayName: string;
  category: LeadCategory;
  followerCount: number;
  bio: string;
  website: string;
  scoreTier: 'HIGH' | 'MEDIUM' | 'LOW';
  scorePoints: number;
}

const SAMPLE_CANDIDATES: DiscoverCandidate[] = [
  {
    username: 'danmace_films',
    displayName: 'Dan Mace',
    category: 'CREATOR',
    followerCount: 145000,
    bio: 'Filmmaker & Storyteller. Making weekly YouTube cinematic breakdowns. DM for work.',
    website: 'https://danmace.com',
    scoreTier: 'HIGH',
    scorePoints: 95,
  },
  {
    username: 'thevideopreneur',
    displayName: 'Alex Rivers',
    category: 'PODCAST',
    followerCount: 42000,
    bio: 'Weekly founder interviews & business breakdowns. Looking for short-form editors.',
    website: 'https://spotify.com/videopreneur',
    scoreTier: 'HIGH',
    scorePoints: 90,
  },
  {
    username: 'fitness_with_kai',
    displayName: 'Kai Chen Fitness',
    category: 'COACH',
    followerCount: 68000,
    bio: 'Online transformation coach. Daily workout tips & meal guides. DM "FIT" to start.',
    website: 'https://kaichen.fit',
    scoreTier: 'HIGH',
    scorePoints: 85,
  },
  {
    username: 'apex_media_agency',
    displayName: 'Apex Creative Media',
    category: 'AGENCY',
    followerCount: 28000,
    bio: 'Scaling DTC e-commerce brands with high ROAS video ads. Always hiring video editors.',
    website: 'https://apexmedia.io',
    scoreTier: 'MEDIUM',
    scorePoints: 65,
  },
  {
    username: 'travelwithsarah',
    displayName: 'Sarah Jenkins',
    category: 'PERSONAL_BRAND',
    followerCount: 89000,
    bio: 'Solo female travel vlogger. 45 countries & counting. Inquiries: contact@sarahj.com',
    website: 'https://sarahjenkins.blog',
    scoreTier: 'HIGH',
    scorePoints: 85,
  },
  {
    username: 'tech_simplified_daily',
    displayName: 'Marcus Tech Reviews',
    category: 'YOUTUBER',
    followerCount: 195000,
    bio: 'Daily gadgets & AI software reviews. 1M+ subs on YouTube. DM for sponsorship.',
    website: 'https://youtube.com/@marcustech',
    scoreTier: 'HIGH',
    scorePoints: 95,
  },
];

interface DiscoverPageProps {
  stages: PipelineStage[];
  onOpenAddLead: () => void;
}

export const DiscoverPage: React.FC<DiscoverPageProps> = ({ stages, onOpenAddLead }) => {
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [candidates, setCandidates] = useState<DiscoverCandidate[]>(SAMPLE_CANDIDATES);
  const [addedUsernames, setAddedUsernames] = useState<Set<string>>(new Set());
  const [bulkInput, setBulkInput] = useState('');
  const [isBulkOpen, setIsBulkOpen] = useState(false);

  const addLeadMutation = useMutation({
    mutationFn: (candidate: DiscoverCandidate) =>
      api.post('/api/v1/leads', {
        username: candidate.username,
        displayName: candidate.displayName,
        profileUrl: `https://instagram.com/${candidate.username}`,
        category: candidate.category,
        followerCount: candidate.followerCount,
        bio: candidate.bio,
        website: candidate.website,
        language: 'vi',
      }),
    onSuccess: (_, candidate) => {
      setAddedUsernames((prev) => new Set(prev).add(candidate.username));
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });

  const handleSkip = (username: string) => {
    setCandidates((prev) => prev.filter((c) => c.username !== username));
  };

  const handleBulkImport = () => {
    if (!bulkInput.trim()) return;
    const rawUsernames = bulkInput
      .split(/[\n, ]+/)
      .map((u) => u.replace(/^@/, '').trim())
      .filter((u) => u.length > 0);

    const newCandidates: DiscoverCandidate[] = rawUsernames.map((user) => ({
      username: user,
      displayName: user,
      category: 'CREATOR',
      followerCount: 15000,
      bio: 'Imported via Quick Discover batch.',
      website: `https://instagram.com/${user}`,
      scoreTier: 'MEDIUM',
      scorePoints: 60,
    }));

    setCandidates((prev) => [...newCandidates, ...prev]);
    setBulkInput('');
    setIsBulkOpen(false);
  };

  const filteredCandidates = candidates.filter((c) => {
    const matchKeyword =
      !keyword ||
      c.username.toLowerCase().includes(keyword.toLowerCase()) ||
      c.displayName.toLowerCase().includes(keyword.toLowerCase()) ||
      c.bio.toLowerCase().includes(keyword.toLowerCase());

    const matchCategory = !selectedCategory || c.category === selectedCategory;
    return matchKeyword && matchCategory;
  });

  const scoreBadgeColors = {
    HIGH: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    MEDIUM: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    LOW: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-violet-900/30 via-indigo-900/20 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Khám Phá Khách Hàng Tiềm Năng (Discover)
            </h3>
          </div>
          <p className="text-xs text-slate-300 max-w-xl">
            Tìm kiếm các Creator, Podcaster, Brand trên Instagram phù hợp tiêu chí của nhóm. Đánh giá chất lượng và lưu vào CRM chỉ với 1 chạm.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsBulkOpen(!isBulkOpen)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Nhập Nhanh Nhiều Handle</span>
          </button>
        </div>
      </div>

      {/* Bulk Input Box */}
      {isBulkOpen && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white">Dán Danh Sách Instagram Handles</h4>
            <span className="text-[11px] text-slate-400">Cách nhau bằng dấu phẩy hoặc xuống dòng</span>
          </div>
          <textarea
            rows={3}
            value={bulkInput}
            onChange={(e) => setBulkInput(e.target.value)}
            placeholder="@creator1, @danmace, @fitness_coach, @agency_media..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsBulkOpen(false)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
            >
              Hủy
            </button>
            <button
              onClick={handleBulkImport}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
            >
              Tải Vào Danh Sách Khám Phá
            </button>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo từ khóa (VD: filmmaker, podcast, coach, vlog...)"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 pl-9 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

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
      </div>

      {/* Candidates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCandidates.length === 0 ? (
          <div className="col-span-3 p-12 text-center text-xs text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800">
            Không tìm thấy ứng viên phù hợp với từ khóa này.
          </div>
        ) : (
          filteredCandidates.map((candidate) => {
            const isAdded = addedUsernames.has(candidate.username);

            return (
              <div
                key={candidate.username}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-5 space-y-3 flex flex-col justify-between transition-all shadow-sm"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 text-indigo-300 font-bold flex items-center justify-center text-sm border border-indigo-500/30">
                        {candidate.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                          <span>@{candidate.username}</span>
                        </h4>
                        <p className="text-[11px] text-slate-400">{candidate.displayName}</p>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${
                        scoreBadgeColors[candidate.scoreTier]
                      }`}
                    >
                      {candidate.scoreTier} ({candidate.scorePoints}đ)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium border border-slate-700">
                      {candidate.category}
                    </span>
                    <span className="text-slate-400 font-mono">
                      {candidate.followerCount.toLocaleString()} followers
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 bg-slate-800/40 p-2.5 rounded-lg border border-slate-800/80 line-clamp-2 leading-relaxed">
                    {candidate.bio}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <a
                    href={`https://instagram.com/${candidate.username}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="Mở Instagram Profile"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <button
                      onClick={() => handleSkip(candidate.username)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs transition-colors"
                    >
                      Bỏ qua
                    </button>

                    <button
                      onClick={() => addLeadMutation.mutate(candidate)}
                      disabled={isAdded || addLeadMutation.isPending}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        isAdded
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Đã Lưu Vào CRM</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Lưu Lead</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
