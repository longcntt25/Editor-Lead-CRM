import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, User, Instagram } from 'lucide-react';
import { api } from '../../services/api';
import { Lead, PipelineStage } from '@editor-crm/shared';

interface PipelinePageProps {
  stages: PipelineStage[];
  onSelectLead: (leadId: string) => void;
}

export const PipelinePage: React.FC<PipelinePageProps> = ({ stages, onSelectLead }) => {
  const queryClient = useQueryClient();

  const { data: leadsData } = useQuery<{ leads: Lead[] }>({
    queryKey: ['leads'],
    queryFn: () => api.get('/api/v1/leads'),
  });

  const leads = leadsData?.leads || [];

  const moveStageMutation = useMutation({
    mutationFn: ({ leadId, stageId }: { leadId: string; stageId: string }) =>
      api.post(`/api/v1/leads/${leadId}/stage`, { stageId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });

  const handleMove = (lead: Lead, direction: 'prev' | 'next') => {
    const currentIndex = stages.findIndex((s) => s.id === lead.pipelineStageId);
    if (currentIndex === -1) return;

    const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= 0 && nextIndex < stages.length) {
      const targetStage = stages[nextIndex];
      moveStageMutation.mutate({ leadId: lead.id, stageId: targetStage.id });
    }
  };

  const scoreBadgeColors = {
    HIGH: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    MEDIUM: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    LOW: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };

  return (
    <div className="h-[calc(100vh-120px)] flex gap-4 overflow-x-auto pb-4 select-none">
      {stages.map((stage, stageIndex) => {
        const stageLeads = leads.filter((l) => l.pipelineStageId === stage.id);

        return (
          <div
            key={stage.id}
            className="w-72 shrink-0 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col max-h-full"
          >
            {/* Stage Column Header */}
            <div className="p-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: stage.color || '#3b82f6' }}
                />
                <h4 className="text-xs font-bold text-white tracking-tight">{stage.name}</h4>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                {stageLeads.length}
              </span>
            </div>

            {/* Cards List */}
            <div className="flex-1 p-2 space-y-2.5 overflow-y-auto">
              {stageLeads.length === 0 ? (
                <div className="h-24 flex items-center justify-center border border-dashed border-slate-800 rounded-lg text-slate-500 text-[11px]">
                  Không có lead
                </div>
              ) : (
                stageLeads.map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => onSelectLead(lead.id)}
                    className="p-3 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 shadow-sm cursor-pointer transition-all hover:border-slate-600 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white text-xs truncate">
                        @{lead.username}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold border ${
                          scoreBadgeColors[lead.scoreTier]
                        }`}
                      >
                        {lead.scoreTier}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="text-slate-300">{lead.category}</span>
                      <span>{lead.followerCount.toLocaleString()} flw</span>
                    </div>

                    {lead.assignedUser && (
                      <div className="flex items-center gap-1.5 text-[10px] text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded">
                        <User className="w-3 h-3" />
                        <span className="truncate">{lead.assignedUser.fullName}</span>
                      </div>
                    )}

                    {/* Move stage buttons */}
                    <div
                      className="pt-1 flex items-center justify-between border-t border-slate-700/40"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        disabled={stageIndex === 0 || moveStageMutation.isPending}
                        onClick={() => handleMove(lead, 'prev')}
                        title="Chuyển về stage trước"
                        className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-20 hover:bg-slate-700 transition-colors"
                      >
                        <ArrowLeft className="w-3 h-3" />
                      </button>

                      <span className="text-[10px] text-slate-500">Kéo/Chuyển</span>

                      <button
                        disabled={stageIndex === stages.length - 1 || moveStageMutation.isPending}
                        onClick={() => handleMove(lead, 'next')}
                        title="Chuyển sang stage tiếp"
                        className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-20 hover:bg-slate-700 transition-colors"
                      >
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
