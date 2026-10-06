import { create } from 'zustand';
import { Role, User, Workspace } from '@editor-crm/shared';

interface AuthState {
  user: User | null;
  token: string | null;
  workspaces: (Workspace & { role: Role })[];
  currentWorkspace: (Workspace & { role: Role }) | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, token: string, workspaces?: (Workspace & { role: Role })[]) => void;
  setWorkspaces: (workspaces: (Workspace & { role: Role })[]) => void;
  setCurrentWorkspace: (workspace: Workspace & { role: Role }) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Read saved token from storage
  const savedToken = localStorage.getItem('crm_session_token');
  const savedWorkspaceJson = localStorage.getItem('crm_current_workspace');
  let initialWorkspace = null;
  try {
    if (savedWorkspaceJson) {
      initialWorkspace = JSON.parse(savedWorkspaceJson);
    }
  } catch (e) {
    // Ignore invalid JSON
  }

  return {
    user: null,
    token: savedToken,
    workspaces: [],
    currentWorkspace: initialWorkspace,
    isAuthenticated: !!savedToken,
    isLoading: !!savedToken,

    setAuth: (user, token, workspaces = []) => {
      localStorage.setItem('crm_session_token', token);
      const activeWorkspace = workspaces[0] || null;
      if (activeWorkspace) {
        localStorage.setItem('crm_current_workspace', JSON.stringify(activeWorkspace));
      }
      set({
        user,
        token,
        workspaces,
        currentWorkspace: activeWorkspace,
        isAuthenticated: true,
        isLoading: false,
      });
    },

    setWorkspaces: (workspaces) => {
      set((state) => {
        const currentStillExists = workspaces.find((w) => w.id === state.currentWorkspace?.id);
        const activeWorkspace = currentStillExists || workspaces[0] || null;
        if (activeWorkspace) {
          localStorage.setItem('crm_current_workspace', JSON.stringify(activeWorkspace));
        }
        return {
          workspaces,
          currentWorkspace: activeWorkspace,
        };
      });
    },

    setCurrentWorkspace: (workspace) => {
      localStorage.setItem('crm_current_workspace', JSON.stringify(workspace));
      set({ currentWorkspace: workspace });
    },

    logout: () => {
      localStorage.removeItem('crm_session_token');
      localStorage.removeItem('crm_current_workspace');
      set({
        user: null,
        token: null,
        workspaces: [],
        currentWorkspace: null,
        isAuthenticated: false,
        isLoading: false,
      });
    },

    setLoading: (loading) => set({ isLoading: loading }),
  };
});
