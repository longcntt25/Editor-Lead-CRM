import React from 'react';
import {
  LayoutDashboard,
  Users,
  Kanban,
  CalendarClock,
  FileText,
  ShieldCheck,
  LogOut,
  Compass,
  BarChart3,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export type NavTab =
  | 'dashboard'
  | 'discover'
  | 'leads'
  | 'followups'
  | 'pipeline'
  | 'templates'
  | 'team'
  | 'analytics';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenAddLead: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, onOpenAddLead }) => {
  const { user, workspaces, currentWorkspace, setCurrentWorkspace, logout } = useAuthStore();

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'discover' as NavTab, label: 'Khám Phá (Discover)', icon: Compass },
    { id: 'leads' as NavTab, label: 'Danh Sách Lead', icon: Users },
    { id: 'followups' as NavTab, label: 'Lịch Follow-up', icon: CalendarClock },
    { id: 'pipeline' as NavTab, label: 'Pipeline Kanban', icon: Kanban },
    { id: 'templates' as NavTab, label: 'Mẫu Tin Nhắn', icon: FileText },
    { id: 'team' as NavTab, label: 'Team & Thành Viên', icon: ShieldCheck },
    { id: 'analytics' as NavTab, label: 'Thống Kê (Analytics)', icon: BarChart3 },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white">Editor Lead CRM</h1>
            <p className="text-[11px] text-slate-400">Instagram Outreach</p>
          </div>
        </div>
      </div>

      {/* Workspace Switcher */}
      <div className="px-3 py-3 border-b border-slate-800/60">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-2 block mb-1">
          Workspace
        </label>
        <div className="relative">
          <select
            value={currentWorkspace?.id || ''}
            onChange={(e) => {
              const selected = workspaces.find((w) => w.id === e.target.value);
              if (selected) setCurrentWorkspace(selected);
            }}
            className="w-full bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs font-medium rounded-lg px-3 py-2 border border-slate-700/80 appearance-none focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer pr-8"
          >
            {workspaces.map((ws) => (
              <option key={ws.id} value={ws.id} className="bg-slate-900 text-slate-200">
                {ws.name} ({ws.role})
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom User Profile & Logout */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/60">
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center text-xs font-bold uppercase shrink-0">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">{user?.fullName}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Đăng xuất"
            className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
