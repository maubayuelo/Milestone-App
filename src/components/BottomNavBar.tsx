import React from 'react';
import { 
  Calendar as CalendarIcon, 
  Kanban, 
  Sun, 
  CalendarRange,
  Layers
} from 'lucide-react';
import { ViewType } from '../types';

interface BottomNavBarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onOpenCreate: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentView,
  onViewChange,
}) => {
  return (
    <nav 
      id="bottom-navigation-bar"
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-black/[0.06] px-2 py-1.5 shrink-0 z-30 select-none shadow-lg flex items-center justify-around"
    >
      <div className="flex items-center justify-around w-full max-w-lg mx-auto">
        {/* 1. Today / Dashboard */}
        <button
          id="nav-btn-today"
          onClick={() => onViewChange('today')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 transition-colors duration-200 cursor-pointer min-w-[44px] min-h-[44px] rounded-lg focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
            currentView === 'today'
              ? 'text-blue-600 font-semibold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          title="Dashboard"
        >
          <div className="w-6 h-6 flex items-center justify-center">
            <Sun className="w-5 h-5" strokeWidth={currentView === 'today' ? 2 : 1.75} />
          </div>
          <span className={`text-[10px] font-medium mt-0.5 tracking-tight ${
            currentView === 'today' ? 'text-blue-600' : 'text-slate-500'
          }`}>
            Today
          </span>
        </button>

        {/* 2. Calendar button */}
        <button
          id="nav-btn-calendar"
          onClick={() => onViewChange('calendar')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 transition-colors duration-200 cursor-pointer min-w-[44px] min-h-[44px] rounded-lg focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
            currentView === 'calendar'
              ? 'text-blue-600 font-semibold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          title="Calendar Schedule"
        >
          <div className="w-6 h-6 flex items-center justify-center">
            <CalendarIcon className="w-5 h-5" strokeWidth={currentView === 'calendar' ? 2 : 1.75} />
          </div>
          <span className={`text-[10px] font-medium mt-0.5 tracking-tight ${
            currentView === 'calendar' ? 'text-blue-600' : 'text-slate-500'
          }`}>
            Calendar
          </span>
        </button>

        {/* 3. Projects button */}
        <button
          id="nav-btn-projects"
          onClick={() => onViewChange('projects')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 transition-colors duration-200 cursor-pointer min-w-[44px] min-h-[44px] rounded-lg focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
            currentView === 'projects'
              ? 'text-blue-600 font-semibold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          title="Projects"
        >
          <div className="w-6 h-6 flex items-center justify-center">
            <Layers className="w-5 h-5" strokeWidth={currentView === 'projects' ? 2 : 1.75} />
          </div>
          <span className={`text-[10px] font-medium mt-0.5 tracking-tight ${
            currentView === 'projects' ? 'text-blue-600' : 'text-slate-500'
          }`}>
            Projects
          </span>
        </button>

        {/* 4. Tasks */}
        <button
          id="nav-btn-board"
          onClick={() => onViewChange('board')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 transition-colors duration-200 cursor-pointer min-w-[44px] min-h-[44px] rounded-lg focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
            currentView === 'board'
              ? 'text-blue-600 font-semibold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          title="Tasks"
        >
          <div className="w-6 h-6 flex items-center justify-center">
            <Kanban className="w-5 h-5" strokeWidth={currentView === 'board' ? 2 : 1.75} />
          </div>
          <span className={`text-[10px] font-medium mt-0.5 tracking-tight ${
            currentView === 'board' ? 'text-blue-600' : 'text-slate-500'
          }`}>
            Tasks
          </span>
        </button>

        {/* 5. Timeline */}
        <button
          id="nav-btn-timeline"
          onClick={() => onViewChange('timeline')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 transition-colors duration-200 cursor-pointer min-w-[44px] min-h-[44px] rounded-lg focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
            currentView === 'timeline'
              ? 'text-blue-600 font-semibold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          title="14-Day Timeline"
        >
          <div className="w-6 h-6 flex items-center justify-center">
            <CalendarRange className="w-5 h-5" strokeWidth={currentView === 'timeline' ? 2 : 1.75} />
          </div>
          <span className={`text-[10px] font-medium mt-0.5 tracking-tight ${
            currentView === 'timeline' ? 'text-blue-600' : 'text-slate-500'
          }`}>
            Timeline
          </span>
        </button>
      </div>
    </nav>
  );
};
