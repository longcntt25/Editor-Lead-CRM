import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from './stores/authStore';
import { api } from './services/api';
import { AuthPage } from './features/auth/AuthPage';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { LeadsPage } from './features/leads/LeadsPage';
import { PipelinePage } from './features/pipeline/PipelinePage';
import { FollowupsPage } from './features/followups/FollowupsPage';
import { TemplatesPage } from './features/templates/TemplatesPage';
import { TeamPage } from './features/team/TeamPage';
import { AddLeadModal } from './features/leads/AddLeadModal';
import { LeadDetailDrawer } from './features/leads/LeadDetailDrawer';
import { Pipeline, WorkspaceMember } from '@editor-crm/shared';

export const App: React.FC = () => {
  const { isAuthenticated, token, currentWorkspace, setAuth, logout } = useAuthStore();
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  // Validate session and fetch workspaces on initial load
  useEffect(() => {
    if (token) {
      api
        .get('/api/v1/auth/me')
        .then((data) => {
          setAuth(data.user, token, data.workspaces);
        })
        .catch(() => {
          logout();
        });
    }
  }, [token]);

  // Fetch Pipeline for the current workspace
  const { data: pipelineData, refetch: refetchPipeline } = useQuery<{ pipeline: Pipeline }>({
    queryKey: ['pipeline', currentWorkspace?.id],
    queryFn: () => api.get('/api/v1/pipelines'),
    enabled: !!isAuthenticated && !!currentWorkspace?.id,
  });

  // Fetch Members for the current workspace
  const { data: membersData } = useQuery<{ members: WorkspaceMember[] }>({
    queryKey: ['workspace-members', currentWorkspace?.id],
    queryFn: () => api.get(`/api/v1/workspaces/${currentWorkspace?.id}/members`),
    enabled: !!isAuthenticated && !!currentWorkspace?.id,
  });

  const stages = pipelineData?.pipeline?.stages || [];
  const members = membersData?.members || [];

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenAddLead={() => setIsAddLeadOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <Header currentTab={currentTab} onOpenAddLead={() => setIsAddLeadOpen(true)} />

        <main className="flex-1 overflow-y-auto p-6">
          {currentTab === 'dashboard' && (
            <DashboardPage
              onNavigate={setCurrentTab}
              onOpenAddLead={() => setIsAddLeadOpen(true)}
            />
          )}

          {currentTab === 'leads' && (
            <LeadsPage
              stages={stages}
              members={members}
              onOpenAddLead={() => setIsAddLeadOpen(true)}
              onSelectLead={(id) => setSelectedLeadId(id)}
            />
          )}

          {currentTab === 'pipeline' && (
            <PipelinePage stages={stages} onSelectLead={(id) => setSelectedLeadId(id)} />
          )}

          {currentTab === 'followups' && (
            <FollowupsPage onSelectLead={(id) => setSelectedLeadId(id)} />
          )}

          {currentTab === 'templates' && <TemplatesPage />}

          {currentTab === 'team' && <TeamPage />}
        </main>
      </div>

      {/* Add Lead Modal */}
      <AddLeadModal
        isOpen={isAddLeadOpen}
        onClose={() => setIsAddLeadOpen(false)}
        onSuccess={() => refetchPipeline()}
        members={members}
      />

      {/* Lead Detail Drawer */}
      {selectedLeadId && (
        <LeadDetailDrawer
          leadId={selectedLeadId}
          onClose={() => setSelectedLeadId(null)}
          stages={stages}
          members={members}
        />
      )}
    </div>
  );
};
export default App;
