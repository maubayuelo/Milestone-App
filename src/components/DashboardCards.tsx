import React, { useState, useRef } from 'react';
import { 
  Calendar as CalendarIcon, 
  ArrowUpRight, 
  Plus, 
  CheckCircle2, 
  Check, 
  Clock, 
  Coffee, 
  Laptop, 
  Code, 
  ChevronRight, 
  ChevronLeft,
  ChevronDown, 
  Sparkles,
  SlidersHorizontal,
  ExternalLink,
  MessageSquare,
  Sun,
  Moon,
  Car,
  Utensils,
  Heart,
  Dumbbell,
  BookOpen,
  Users,
  Briefcase,
  Activity,
  Info,
  X
} from 'lucide-react';
import { GoogleMeetIcon, ZoomIcon, GitLabLogo, GitHubLogo, NineTLogo, HorizonLogo } from './BrandIcons';
import { CALENDAR_DAYS, CALENDAR_ACTIVITIES } from '../data/calendarActivities';
import { Task, CalendarActivity } from '../types';

// ==========================================
// 1. Projects Overview Card (from projects-overview.png)
// ==========================================
export const ProjectsOverviewCard: React.FC<{ onExplore?: () => void }> = ({ onExplore }) => {
  // Stats matching screenshot: In Progress: 14, Completed: 32, Not Started: 54
  const inProgress = 14;
  const completed = 32;
  const notStarted = 54;
  const total = inProgress + completed + notStarted; // 100

  // Donut SVG parameters
  const radius = 58;
  const circumference = 2 * Math.PI * radius; // ~364.4

  const notStartedOffset = 0;
  const notStartedLength = (notStarted / total) * circumference;

  const inProgressOffset = notStartedLength;
  const inProgressLength = (inProgress / total) * circumference;

  const completedOffset = notStartedLength + inProgressLength;
  const completedLength = (completed / total) * circumference;

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-[0_2px_14px_rgba(0,0,0,0.03)] flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          Projects Overview
        </h3>
        <button 
          onClick={onExplore}
          className="w-8 h-8 rounded-full border border-slate-200/80 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
          title="Open detailed project analytics"
        >
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      {/* Circular Donut Graphic */}
      <div className="relative flex items-center justify-center my-3 py-1">
        <svg className="w-36 h-36 -rotate-90 transform" viewBox="0 0 140 140">
          {/* Background circle track */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            stroke="#F1F5F9"
            strokeWidth="18"
            fill="transparent"
          />

          {/* Not Started segment (Light gray/slate) */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            stroke="#E2E8F0"
            strokeWidth="18"
            fill="transparent"
            strokeDasharray={`${notStartedLength} ${circumference - notStartedLength}`}
            strokeDashoffset={-notStartedOffset}
            strokeLinecap="butt"
          />

          {/* In Progress segment (Orange) */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            stroke="#F97316"
            strokeWidth="18"
            fill="transparent"
            strokeDasharray={`${inProgressLength} ${circumference - inProgressLength}`}
            strokeDashoffset={-inProgressOffset}
            strokeLinecap="butt"
          />

          {/* Completed segment (Blue) */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            stroke="#2563EB"
            strokeWidth="18"
            fill="transparent"
            strokeDasharray={`${completedLength} ${circumference - completedLength}`}
            strokeDashoffset={-completedOffset}
            strokeLinecap="butt"
          />
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
          <span className="text-xl font-extrabold text-slate-900">{total}</span>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Total
          </span>
        </div>
      </div>

      {/* Legend Dots matching screenshot */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F97316]" />
            <span>In Progress:</span>
            <span className="font-bold text-slate-900">{inProgress}</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
            <span>Completed:</span>
            <span className="font-bold text-slate-900">{completed}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-slate-500 pt-0.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#CBD5E1]" />
          <span>Not Started:</span>
          <span className="font-bold text-slate-700">{notStarted}</span>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. My Meetings & Deadlines Card (from meetings-deadlines.png)
// ==========================================
export const MeetingsDeadlinesCard: React.FC<{ onSeeAll?: () => void }> = ({ onSeeAll }) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-[0_2px_14px_rgba(0,0,0,0.03)] flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            My Meetings
          </h3>
          <button 
            onClick={onSeeAll}
            className="w-8 h-8 rounded-full border border-slate-200/80 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
            title="Calendar sync"
          >
            <CalendarIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Meeting Cards List */}
        <div className="space-y-3">
          {/* Meeting 1: Google Meet */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-150/80 hover:bg-white hover:shadow-xs transition group flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] text-slate-400 font-medium">My Meetings</span>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#2563EB] transition">
                App Project
              </h4>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-slate-700 font-mono">6:45 PM</span>
                <span className="flex items-center gap-1 text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200/60 shadow-2xs">
                  <GoogleMeetIcon className="w-3.5 h-3.5" />
                  <span className="font-medium text-[11px]">Meet</span>
                </span>
              </div>
            </div>

            <a 
              href="#join-meet"
              onClick={(e) => e.preventDefault()}
              className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition"
              title="Join Google Meet"
            >
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>

          {/* Meeting 2: Zoom */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-150/80 hover:bg-white hover:shadow-xs transition group flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] text-slate-400 font-medium">My Meetings</span>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#2563EB] transition">
                User Research
              </h4>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-slate-700 font-mono">6:45 PM</span>
                <span className="flex items-center gap-1 text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200/60 shadow-2xs">
                  <ZoomIcon className="w-3.5 h-3.5" />
                  <span className="font-medium text-[11px]">Zoom</span>
                </span>
              </div>
            </div>

            <a 
              href="#join-zoom"
              onClick={(e) => e.preventDefault()}
              className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition"
              title="Join Zoom Meeting"
            >
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* See All Meetings link */}
        <button
          onClick={onSeeAll}
          className="mt-3 text-xs font-semibold text-slate-600 hover:text-[#2563EB] flex items-center gap-1 transition cursor-pointer"
        >
          <span>See All Meetings</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom section: Open Tickets / Deadlines summary */}
      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-800">Open Tickets</span>
          <span className="text-[10px] font-bold bg-blue-50 text-[#2563EB] px-2 py-0.5 rounded-full border border-blue-100">
            4 Active
          </span>
        </div>
        <div className="w-7 h-7 rounded-full border border-slate-200/80 flex items-center justify-center text-slate-400">
          <SlidersHorizontal className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. My Tasks Listings Card (from tasks-listings.png)
// ==========================================
interface TaskItemData {
  id: string;
  client: string;
  title: string;
  description: string;
  completed: boolean;
  theme: 'peach' | 'blue' | 'pink' | 'mint' | 'amber';
  logoType: 'gitlab' | 'github' | '9t' | 'horizon' | 'komorebi';
}

export const TasksListingsCard: React.FC<{
  onOpenCreate?: () => void;
  onSelectTask?: (taskId: string) => void;
}> = ({ onOpenCreate, onSelectTask }) => {
  const [activeTab, setActiveTab] = useState<'today' | 'tomorrow'>('today');
  const [isAccordionOpen, setIsAccordionOpen] = useState(true);

  // Initial task items including the requested "Refactor checkout drawer state & cart bundle calculation"
  const [taskList, setTaskList] = useState<TaskItemData[]>([
    {
      id: 'task-checkout-komorebi',
      client: 'Studio Komorebi',
      title: 'Refactor checkout drawer state & cart bundle calculation',
      description: 'Fix bundle discount calculation edge case when 3-pack matcha tin is mixed with loose leaf.',
      completed: false,
      theme: 'amber',
      logoType: 'komorebi',
    },
    {
      id: 'task-brightbridge',
      client: 'BrightBridge',
      title: 'BrightBridge - Website Design',
      description: 'Design a framer website with modern templates and clean typography.',
      completed: false,
      theme: 'peach',
      logoType: 'gitlab',
    },
    {
      id: 'task-github-dev',
      client: 'GitHub',
      title: 'Github - Upload Dev Files & Images',
      description: 'Collaborate with Developers to handle the SaaS Project release assets.',
      completed: false,
      theme: 'blue',
      logoType: 'github',
    },
    {
      id: 'task-9t-prototype',
      client: '9TDesign',
      title: '9TDesign - Mobile App Prototype',
      description: 'Ready prototype for testing user in this week.',
      completed: false,
      theme: 'pink',
      logoType: '9t',
    },
    {
      id: 'task-horizon-vision',
      client: 'Horizon',
      title: 'Horizon - Dashboard Design',
      description: 'Design a dashboard comfortable with Vision Pro spatial depth.',
      completed: false,
      theme: 'mint',
      logoType: 'horizon',
    },
  ]);

  const toggleTask = (id: string) => {
    setTaskList((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const getThemeClasses = (theme: TaskItemData['theme']) => {
    switch (theme) {
      case 'peach':
        return 'bg-[#FFF7ED] border-[#FED7AA]/60 text-slate-800 hover:border-[#FDBA74]';
      case 'blue':
        return 'bg-[#F0F9FF] border-[#BAE6FD]/60 text-slate-800 hover:border-[#7DD3FC]';
      case 'pink':
        return 'bg-[#FDF4FF] border-[#F5D0FE]/60 text-slate-800 hover:border-[#E879F9]';
      case 'mint':
        return 'bg-[#F0FDF4] border-[#BBF7D0]/60 text-slate-800 hover:border-[#86EFAC]';
      case 'amber':
        return 'bg-[#FEFCE8] border-[#FEF08A]/70 text-slate-800 hover:border-[#FACC15]';
    }
  };

  const renderLogo = (type: TaskItemData['logoType']) => {
    switch (type) {
      case 'gitlab':
        return <GitLabLogo className="w-5 h-5" />;
      case 'github':
        return <GitHubLogo className="w-5 h-5 text-slate-800" />;
      case '9t':
        return <NineTLogo className="w-5 h-5" />;
      case 'horizon':
        return <HorizonLogo className="w-5 h-5" />;
      case 'komorebi':
        return (
          <div className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-[9px] shadow-2xs">
            KT
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-[0_2px_14px_rgba(0,0,0,0.03)] flex flex-col justify-between h-full">
      <div>
        {/* Header matching screenshot */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            My Tasks
          </h3>
          <button 
            onClick={onOpenCreate}
            className="w-8 h-8 rounded-full border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
            title="Create new task"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Switcher Pills: Today / Tomorrow */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
              activeTab === 'today'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setActiveTab('tomorrow')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
              activeTab === 'tomorrow'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tomorrow
          </button>
        </div>

        {/* Expandable Accordion Badge: "12 On Going Tasks ⌄" */}
        <div 
          onClick={() => setIsAccordionOpen(!isAccordionOpen)}
          className="flex items-center justify-between p-2 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 mb-3 transition cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">
              12
            </span>
            <span className="text-xs font-bold text-slate-800">
              On Going Tasks
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isAccordionOpen ? 'rotate-180' : ''}`} />
        </div>

        {/* Task Cards List with Soft Pastel Tints */}
        {isAccordionOpen && (
          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {taskList.map((task) => (
              <div
                key={task.id}
                onClick={() => onSelectTask && onSelectTask(task.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-2xs group flex items-start justify-between gap-3 ${getThemeClasses(task.theme)} ${
                  task.completed ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 shrink-0">
                    {renderLogo(task.logoType)}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <h4 className={`text-xs font-bold truncate leading-snug ${task.completed ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                      {task.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {task.description}
                    </p>
                  </div>
                </div>

                {/* Checkmark Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTask(task.id);
                  }}
                  className={`w-6 h-6 rounded-full border shrink-0 flex items-center justify-center transition cursor-pointer ${
                    task.completed 
                      ? 'bg-emerald-600 border-emerald-600 text-white' 
                      : 'border-slate-300 text-slate-400 hover:border-slate-500 hover:text-slate-700 bg-white/70'
                  }`}
                  title={task.completed ? 'Mark as incomplete' : 'Mark as completed'}
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 4. Fragmento del Calendario en la Semana ("Week Schedule Fragment")
// ==========================================
export const WeekCalendarFragmentCard: React.FC<{
  onOpenFullCalendar: () => void;
  selectedDayNumber: number;
  onSelectDay: (dayNumber: number) => void;
}> = ({ onOpenFullCalendar, selectedDayNumber, onSelectDay }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [selectedActivity, setSelectedActivity] = useState<CalendarActivity | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Helper to scroll horizontal columns track
  const scrollColumns = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 260;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Scroll to a specific day column
  const scrollToDay = (dayNumber: number) => {
    onSelectDay(dayNumber);
    const el = document.getElementById(`dashboard-day-col-${dayNumber}`);
    if (el && scrollContainerRef.current) {
      const containerRect = scrollContainerRef.current.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const offset = elRect.left - containerRect.left - (containerRect.width / 2) + (elRect.width / 2);
      scrollContainerRef.current.scrollBy({
        left: offset,
        behavior: 'smooth',
      });
    }
  };

  // Allow mouse wheel on columns track to scroll horizontally
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      const target = e.target as HTMLElement;
      const cardList = target.closest('.column-activities-list') as HTMLElement | null;
      if (cardList) {
        const canScrollDown = e.deltaY > 0 && cardList.scrollTop + cardList.clientHeight < cardList.scrollHeight - 2;
        const canScrollUp = e.deltaY < 0 && cardList.scrollTop > 2;
        if (canScrollDown || canScrollUp) {
          return;
        }
      }
      scrollContainerRef.current.scrollLeft += e.deltaY;
    }
  };

  // Render activity icon based on category/iconType
  const renderActivityIcon = (iconType: string, className = 'w-3.5 h-3.5 shrink-0') => {
    switch (iconType) {
      case 'coffee':
        return <Coffee className={className} />;
      case 'laptop':
        return <Laptop className={className} />;
      case 'code':
        return <Code className={className} />;
      case 'car':
        return <Car className={className} />;
      case 'utensils':
        return <Utensils className={className} />;
      case 'sparkles':
        return <Sparkles className={className} />;
      case 'sun':
        return <Sun className={className} />;
      case 'moon':
        return <Moon className={className} />;
      case 'book':
        return <BookOpen className={className} />;
      case 'dumbbell':
        return <Dumbbell className={className} />;
      case 'heart':
        return <Heart className={className} />;
      case 'users':
        return <Users className={className} />;
      case 'briefcase':
        return <Briefcase className={className} />;
      case 'activity':
        return <Activity className={className} />;
      default:
        return <Clock className={className} />;
    }
  };

  // Helper for category badge styling
  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'shift':
        return {
          pill: 'bg-emerald-600 text-white',
          border: 'border-emerald-200/90',
          bg: 'bg-emerald-50/70 hover:bg-emerald-50',
          label: 'Work Shift',
        };
      case 'dev':
      case 'deep_work':
        return {
          pill: 'bg-[#7C3AED] text-white',
          border: 'border-purple-200/90',
          bg: 'bg-purple-50/70 hover:bg-purple-50',
          label: 'Dev & Focus',
        };
      case 'wellness':
        return {
          pill: 'bg-fuchsia-600 text-white',
          border: 'border-fuchsia-200/90',
          bg: 'bg-fuchsia-50/70 hover:bg-fuchsia-50',
          label: 'Wellness',
        };
      case 'routine':
        return {
          pill: 'bg-amber-500 text-white',
          border: 'border-amber-200/90',
          bg: 'bg-amber-50/70 hover:bg-amber-50',
          label: 'Routine',
        };
      case 'commute':
        return {
          pill: 'bg-sky-600 text-white',
          border: 'border-sky-200/90',
          bg: 'bg-sky-50/70 hover:bg-sky-50',
          label: 'Commute',
        };
      case 'meal':
        return {
          pill: 'bg-orange-500 text-white',
          border: 'border-orange-200/90',
          bg: 'bg-orange-50/70 hover:bg-orange-50',
          label: 'Meal',
        };
      case 'sleep':
        return {
          pill: 'bg-slate-700 text-white',
          border: 'border-slate-200',
          bg: 'bg-slate-100/80 hover:bg-slate-100',
          label: 'Sleep',
        };
      default:
        return {
          pill: 'bg-slate-600 text-white',
          border: 'border-slate-200',
          bg: 'bg-slate-50 hover:bg-slate-100',
          label: 'Activity',
        };
    }
  };

  // Format activity duration
  const formatDuration = (startMinutes: number, endMinutes: number) => {
    let diff = endMinutes - startMinutes;
    if (diff < 0) diff += 24 * 60;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h`;
    return `${mins}m`;
  };

  return (
    <div 
      id="dashboard-calendar-card"
      className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_14px_rgba(0,0,0,0.03)] flex flex-col justify-between h-full overflow-hidden"
    >
      {/* 1. Header & Navigation Controls */}
      <div className="p-5 sm:p-6 pb-3 border-b border-slate-100/90 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3.5">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Week Schedule & Calendar
              </span>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 hidden sm:inline-flex items-center gap-1">
                <Coffee className="w-3 h-3" />
                <span>Shift Anchored</span>
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>September 7 — 13, 2026</span>
              <span className="text-xs font-semibold text-slate-400 font-normal">
                ({CALENDAR_ACTIVITIES.length} Scheduled Blocks)
              </span>
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Scroll Buttons */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200/70">
              <button
                onClick={() => scrollColumns('left')}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition cursor-pointer"
                title="Scroll Left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollColumns('right')}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition cursor-pointer"
                title="Scroll Right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Jump to Full Calendar */}
            <button
              onClick={onOpenFullCalendar}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#2563EB] font-semibold text-xs transition cursor-pointer shadow-2xs"
            >
              <span>View Full Week Grid</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Day Selector Quick Jump Tabs */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-none pt-1">
          <div className="flex items-center gap-1.5 shrink-0">
            {CALENDAR_DAYS.map((day) => {
              const isSelected = selectedDayNumber === day.dayNumber;
              const isWeekend = day.key === 'Sat' || day.key === 'Sun';
              const dayActivities = CALENDAR_ACTIVITIES.filter((a) => a.dayNumber === day.dayNumber);

              return (
                <button
                  key={day.key}
                  onClick={() => scrollToDay(day.dayNumber)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-[#2563EB] text-white shadow-xs font-bold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                  title={`Jump to ${day.fullLabel}`}
                >
                  <span>{day.label} {day.dayNumber}</span>
                  <span className={`text-[10px] px-1 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                  }`}>
                    {dayActivities.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Category Filter */}
          <div className="hidden xl:flex items-center gap-1 shrink-0 text-[11px] font-semibold text-slate-500">
            <span className="text-slate-400 mr-1">Filter:</span>
            {['all', 'shift', 'dev', 'wellness'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2 py-0.5 rounded-md transition capitalize cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-slate-900 text-white font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {cat === 'all' ? 'All' : cat === 'dev' ? 'Dev Focus' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Scrollable Calendar Columns (Strictly clipped inside card by overflow-hidden) */}
      <div 
        id="dashboard-calendar-columns-scroll"
        ref={scrollContainerRef}
        onWheel={handleWheel}
        className="flex-1 w-full overflow-x-auto overflow-y-hidden px-5 sm:px-6 py-4 select-none [scrollbar-width:thin] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-slate-100/80 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-400 transition"
      >
        <div className="flex gap-3.5 min-w-max pb-2 pr-6">
          {CALENDAR_DAYS.map((day) => {
            const isSelected = selectedDayNumber === day.dayNumber;
            const isWeekend = day.key === 'Sat' || day.key === 'Sun';

            // Filter activities for this day
            const dayActivities = CALENDAR_ACTIVITIES.filter((a) => {
              if (a.dayNumber !== day.dayNumber) return false;
              if (categoryFilter === 'all') return true;
              if (categoryFilter === 'dev') return a.category === 'dev' || a.category === 'deep_work';
              return a.category === categoryFilter;
            });

            return (
              <div
                key={day.key}
                id={`dashboard-day-col-${day.dayNumber}`}
                className={`w-[245px] min-w-[245px] rounded-2xl border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-50/40 border-blue-300 shadow-xs ring-1 ring-blue-300/80'
                    : 'bg-slate-50/70 border-slate-200/80 hover:border-slate-300'
                }`}
              >
                {/* Day Header */}
                <div 
                  onClick={() => onSelectDay(day.dayNumber)}
                  className="p-3 border-b border-slate-200/60 flex items-center justify-between cursor-pointer bg-white/70 rounded-t-2xl hover:bg-white transition"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                        {day.label}
                      </span>
                      {isWeekend && (
                        <span className="text-[9px] font-bold text-amber-700 bg-amber-100/70 px-1.5 py-0.2 rounded-full">
                          Weekend
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-slate-600 block">
                      {day.fullLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-black w-7 h-7 rounded-full flex items-center justify-center shadow-2xs ${
                      isSelected 
                        ? 'bg-[#2563EB] text-white ring-2 ring-blue-200' 
                        : 'bg-slate-200/80 text-slate-800'
                    }`}>
                      {day.dayNumber}
                    </span>
                  </div>
                </div>

                {/* Day Activities Scrollable List (Vertically scrollable content) */}
                <div className="column-activities-list flex-1 overflow-y-auto max-h-[330px] space-y-2.5 p-2.5 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                  {dayActivities.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No activities match current filter.
                    </div>
                  ) : (
                    dayActivities.map((act) => {
                      const styles = getCategoryStyles(act.category);
                      const durationStr = formatDuration(act.startMinutes, act.endMinutes);
                      const isActSelected = selectedActivity?.id === act.id;

                      return (
                        <div
                          key={act.id}
                          onClick={() => setSelectedActivity(act)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer text-left shadow-2xs group ${styles.bg} ${styles.border} ${
                            isActSelected ? 'ring-2 ring-[#2563EB] border-[#2563EB]' : ''
                          }`}
                        >
                          {/* Top Row: Category pill with icon & Time Badge */}
                          <div className="flex items-center justify-between gap-1.5 mb-1.5">
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-tight shadow-2xs ${styles.pill}`}>
                              {renderActivityIcon(act.iconType, 'w-2.5 h-2.5')}
                              <span>{styles.label}</span>
                            </span>
                            <span className="text-[10px] font-bold text-slate-600 font-mono bg-white/80 px-1.5 py-0.5 rounded border border-slate-200/60">
                              {act.startTime} — {act.endTime}
                            </span>
                          </div>

                          {/* Activity Name (Bold, Clear, Prominently Visible) */}
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition leading-snug break-words">
                            {act.title}
                          </h4>

                          {/* Subtitle or Notes */}
                          {(act.subtitle || act.notes) && (
                            <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                              {act.subtitle || act.notes}
                            </p>
                          )}

                          {/* Duration Tag */}
                          <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-black/5 text-[10px] text-slate-500">
                            <span className="flex items-center gap-1 font-medium">
                              <Clock className="w-2.5 h-2.5 text-slate-400" />
                              <span>{durationStr}</span>
                            </span>
                            <span className="text-[10px] font-semibold text-blue-600 group-hover:underline flex items-center gap-0.5">
                              <span>Details</span>
                              <ChevronRight className="w-2.5 h-2.5" />
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Day Column Footer */}
                <div className="p-2 border-t border-slate-200/60 bg-white/60 rounded-b-2xl flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>{dayActivities.length} events</span>
                  <button
                    onClick={() => {
                      onSelectDay(day.dayNumber);
                      onOpenFullCalendar();
                    }}
                    className="text-[#2563EB] font-bold hover:underline cursor-pointer"
                  >
                    View in 24h →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Footer Summary Bar */}
      <div className="p-4 sm:px-6 bg-slate-50/80 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 shrink-0">
        <div className="flex items-center gap-2 flex-wrap font-medium">
          <span className="flex items-center gap-1.5 text-slate-700 font-bold">
            <CalendarIcon className="w-4 h-4 text-[#2563EB]" />
            <span>Active Day: {CALENDAR_DAYS.find((d) => d.dayNumber === selectedDayNumber)?.fullLabel || `Day ${selectedDayNumber}`}</span>
          </span>
          <span className="text-slate-300 hidden sm:inline">|</span>
          <span className="text-slate-500 hidden sm:inline">
            Starbucks Barista Shift Anchor (5:30a — 1:15p) + Magneto & Shamanicca Dev Sprints
          </span>
        </div>

        <button
          onClick={onOpenFullCalendar}
          className="flex items-center gap-1.5 text-[#2563EB] font-bold hover:underline cursor-pointer ml-auto"
        >
          <span>Open Full Interactive 24h Timeline</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 4. Activity Detail Modal (When user clicks on any event card) */}
      {selectedActivity && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedActivity(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${getCategoryStyles(selectedActivity.category).pill}`}>
                  {renderActivityIcon(selectedActivity.iconType, 'w-3 h-3')}
                  <span className="capitalize">{selectedActivity.category}</span>
                </span>
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {selectedActivity.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedActivity(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/60">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">Time Window</span>
                <span className="font-bold text-slate-800 font-mono">{selectedActivity.startTime} — {selectedActivity.endTime}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">Duration</span>
                <span className="font-bold text-slate-800">{formatDuration(selectedActivity.startMinutes, selectedActivity.endMinutes)}</span>
              </div>
            </div>

            {selectedActivity.subtitle && (
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase block mb-0.5">Role / Focus</span>
                <p className="text-xs text-slate-700 font-medium">{selectedActivity.subtitle}</p>
              </div>
            )}

            {selectedActivity.notes && (
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase block mb-0.5">Details & Context</span>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/50">
                  {selectedActivity.notes}
                </p>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedActivity(null)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  onSelectDay(selectedActivity.dayNumber);
                  setSelectedActivity(null);
                  onOpenFullCalendar();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2563EB] text-white text-xs font-bold hover:bg-blue-700 transition cursor-pointer shadow-2xs"
              >
                <span>View on 24h Timeline</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
