import React from 'react';
import { Plus, UserPlus } from 'lucide-react';
import { NavTab } from './Sidebar';

interface HeaderProps {
  currentTab: NavTab;
  onOpenAddLead: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onOpenAddLead }) => {
  const titles: Record<NavTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Dashboard Tổng Quan',
      subtitle: 'Chỉ số hiệu quả outreach và tiến độ chuyển đổi leads',
    },
    leads: {
      title: 'Quản Lý Khách Hàng Tiềm Năng (Leads)',
      subtitle: 'Tìm kiếm, đánh giá chất lượng và phân công editor phụ trách',
    },
    pipeline: {
      title: 'Pipeline Bán Hàng (Kanban)',
      subtitle: 'Theo dõi tiến trình từ lúc tiếp cận đến khi chốt hợp đồng',
    },
    followups: {
      title: 'Lịch Nhắc Follow-up',
      subtitle: 'Chăm sóc đúng hẹn để tăng 300% tỷ lệ phản hồi',
    },
    templates: {
      title: 'Mẫu Tin Nhắn Tiếp Cận (Templates)',
      subtitle: 'Thư viện tin nhắn outreach cá nhân hóa cho từng nhóm khách',
    },
    team: {
      title: 'Thành Viên & Phân Quyền',
      subtitle: 'Quản lý danh sách video editor trong workspace',
    },
  };

  const current = titles[currentTab] || { title: 'Editor Lead CRM', subtitle: '' };

  return (
    <header className="h-16 px-6 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between shrink-0">
      <div>
        <h2 className="text-base font-semibold text-white tracking-tight">{current.title}</h2>
        <p className="text-xs text-slate-400">{current.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onOpenAddLead}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-sm shadow-indigo-600/30 transition-all active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>Thêm Lead Mới</span>
        </button>
      </div>
    </header>
  );
};
