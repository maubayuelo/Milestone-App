import React from 'react';
import { 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  Kanban, 
  Milestone,
  Command,
  PanelRightClose,
  PanelRightOpen,
  HardDrive,
  Layers
} from 'lucide-react';
import { ViewType } from '../types';

interface NavigationProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onOpenCapture: () => void;
  chatCollapsed: boolean;
  onToggleChat: () => void;
  onOpenFiles?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentView,
  onViewChange,
  onOpenCapture,
  chatCollapsed,
  onToggleChat,
  onOpenFiles = () => {},
}) => {
  const navItems: { id: ViewType; label: string; icon: React.ReactNode; disabled?: boolean }[] = [
    {
      id: 'today',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" strokeWidth={1.75} />,
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: <CalendarIcon className="w-4 h-4" strokeWidth={1.75} />,
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: <Layers className="w-4 h-4" strokeWidth={1.75} />,
    },
    {
      id: 'board',
      label: 'Tasks',
      icon: <Kanban className="w-4 h-4" strokeWidth={1.75} />,
    },
    {
      id: 'timeline',
      label: 'Timeline',
      icon: <Milestone className="w-4 h-4" strokeWidth={1.75} />,
    },
  ];

  return (
    <aside
      id="main-nav-rail"
      className="hidden md:flex w-[88px] sticky top-0 h-screen z-20 flex-col items-center justify-between py-4 border-r border-black/[0.04] bg-white select-none shrink-0"
    >
      {/* App Logo Mark */}
      <div className="flex flex-col items-center gap-6 w-full">
        <button 
          id="app-brand-mark"
          onClick={() => onViewChange('today')}
          className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xs cursor-pointer hover:bg-blue-700 transition-all duration-200 shadow-[0_2px_8px_rgba(37,99,235,0.25)] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
          title="Milestones Dashboard"
        >
          M
        </button>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1 w-full px-1" aria-label="Primary navigation">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            if (item.disabled) {
              return (
                <div
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  className="flex flex-col items-center justify-center gap-[6px] opacity-30 cursor-not-allowed w-full min-h-[56px] py-[10px] px-2 rounded-[12px]"
                >
                  {item.icon}
                  <span className="text-[11px] font-medium text-center leading-[1.2] whitespace-nowrap text-slate-400">Soon</span>
                </div>
              );
            }

            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => onViewChange(item.id)}
                className={`relative group flex flex-col items-center justify-center gap-[6px] w-full min-h-[56px] py-[10px] px-2 rounded-[12px] transition-all duration-150 ease-out cursor-pointer active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
                  isActive
                    ? 'text-blue-600 bg-blue-50 font-medium'
                    : 'text-[#6B7280] hover:text-[#1A1D23] hover:bg-[#F7F7F8]'
                }`}
                title={item.label}
              >
                {item.icon}
                <span className="text-[11px] font-medium text-center leading-[1.2] whitespace-nowrap">
                  {item.label}
                </span>

                {/* Tooltip on hover */}
                <div className="absolute left-full ml-2 px-2.5 py-1 text-xs bg-slate-900 text-white rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-md">
                  {item.label}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom utilities */}
      <div className="flex flex-col items-center gap-1 w-full px-1">
        {/* Project Files & Storage */}
        <button
          id="btn-files-storage-nav"
          onClick={onOpenFiles}
          className="relative group flex flex-col items-center justify-center w-full min-h-[56px] py-[10px] px-2 rounded-[12px] text-[#6B7280] hover:text-[#1A1D23] hover:bg-[#F7F7F8] transition-all duration-150 ease-out cursor-pointer active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
          title="Project Files & Storage"
        >
          <HardDrive className="w-4 h-4 stroke-[1.8]" />
          <div className="absolute left-full ml-2 px-2.5 py-1 text-xs bg-slate-900 text-white rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-md">
            Files & Storage
          </div>
        </button>

        {/* Quick Capture Cmd+K */}
        <button
          id="btn-quick-capture-nav"
          onClick={onOpenCapture}
          className="relative group flex flex-col items-center justify-center w-full min-h-[56px] py-[10px] px-2 rounded-[12px] text-[#6B7280] hover:text-[#1A1D23] hover:bg-[#F7F7F8] transition-all duration-150 ease-out cursor-pointer active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
          title="Quick Capture (Cmd+K)"
        >
          <Command className="w-4 h-4 stroke-[1.8]" />
          <div className="absolute left-full ml-2 px-2.5 py-1 text-xs bg-slate-900 text-white rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-md">
            Capture (⌘K)
          </div>
        </button>

        {/* Toggle Chat / Coach Panel */}
        <button
          id="btn-toggle-chat-nav"
          onClick={onToggleChat}
          className={`relative group flex flex-col items-center justify-center w-full min-h-[56px] py-[10px] px-2 rounded-[12px] transition-all duration-150 ease-out cursor-pointer active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
            !chatCollapsed
              ? 'text-blue-600 bg-blue-50'
              : 'text-[#6B7280] hover:text-[#1A1D23] hover:bg-[#F7F7F8]'
          }`}
          title={chatCollapsed ? 'Open Coach' : 'Collapse Coach'}
        >
          {chatCollapsed ? (
            <PanelRightOpen className="w-4 h-4 stroke-[1.8]" />
          ) : (
            <PanelRightClose className="w-4 h-4 stroke-[1.8]" />
          )}
          <div className="absolute left-full ml-2 px-2.5 py-1 text-xs bg-slate-900 text-white rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-md">
            {chatCollapsed ? 'Open Coach' : 'Collapse Coach'}
          </div>
        </button>
      </div>
    </aside>
  );
};
