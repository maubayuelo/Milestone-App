import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Task, ExternalCommitment, CalendarActivity } from '../types';
import { 
  ChevronLeft, 
  ChevronRight, 
  MessageSquare, 
  Clock, 
  LayoutList, 
  CalendarDays,
  Calendar,
  Coffee,
  Code,
  Laptop,
  Car,
  Utensils,
  Sparkles,
  Sun,
  Moon,
  BookOpen,
  Activity,
  Music,
  Dumbbell,
  ShoppingBag,
  Users,
  ClipboardList,
  Briefcase,
  X,
  Brain,
  Zap,
  Heart
} from 'lucide-react';
import { CALENDAR_DAYS, CALENDAR_ACTIVITIES } from '../data/calendarActivities';
import { getAreaStyle } from '../utils/areaColor';
import { AreaBadge } from '../components/AreaBadge';
import { CalendarMonthGrid } from '../components/CalendarMonthGrid';

interface CalendarViewProps {
  tasks: Task[];
  commitments: ExternalCommitment[];
  onSelectTask: (task: Task) => void;
  onMoveTaskTime?: (taskId: string, day: string, startHour: string) => void;
  onOpenMessage?: (task: Task) => void;
  onOpenCreate?: () => void;
  initialDayNumber?: number;
}

// Helper to determine project and area identity for calendar activities
function getActivityColorConfig(act: CalendarActivity) {
  const t = act.title.toLowerCase();
  const sub = (act.subtitle || '').toLowerCase();

  if (act.category === 'shift' || t.includes('starbucks')) {
    return {
      projName: 'Starbucks',
      hexColor: '#059669',
      rgbValues: '5, 150, 105',
      darkTextColor: '#047857',
      isDeepWork: false,
    };
  }
  if (t.includes('komorebi') || sub.includes('komorebi')) {
    return {
      projName: 'Komorebi Tea',
      hexColor: '#2563EB',
      rgbValues: '37, 99, 235',
      darkTextColor: '#1D4ED8',
      isDeepWork: false,
    };
  }
  if (t.includes('sonder') || sub.includes('sonder')) {
    return {
      projName: 'Sonder Film Co.',
      hexColor: '#2563EB',
      rgbValues: '37, 99, 235',
      darkTextColor: '#1D4ED8',
      isDeepWork: false,
    };
  }
  if (t.includes('stillness') || sub.includes('stillness')) {
    return {
      projName: 'Stillness App',
      hexColor: '#7C3AED',
      rgbValues: '124, 58, 237',
      darkTextColor: '#6D28D9',
      isDeepWork: false,
    };
  }
  if (act.category === 'deep_work' || t.includes('deep work')) {
    return {
      projName: 'Deep Work',
      hexColor: '#2563EB',
      rgbValues: '37, 99, 235',
      darkTextColor: '#1D4ED8',
      isDeepWork: true,
    };
  }
  if (act.category === 'dev' || t.includes('frontend') || t.includes('training')) {
    return {
      projName: 'Career Dev',
      hexColor: '#2563EB',
      rgbValues: '37, 99, 235',
      darkTextColor: '#1D4ED8',
      isDeepWork: false,
    };
  }
  if (act.category === 'wellness' || act.category === 'routine' || t.includes('meditation') || t.includes('yoga')) {
    return {
      projName: 'Wellness',
      hexColor: '#D97706',
      rgbValues: '217, 119, 6',
      darkTextColor: '#B45309',
      isDeepWork: false,
    };
  }
  if (act.category === 'meal' || t.includes('lunch') || t.includes('dinner')) {
    return {
      projName: 'Nutrition',
      hexColor: '#D97706',
      rgbValues: '217, 119, 6',
      darkTextColor: '#B45309',
      isDeepWork: false,
    };
  }
  if (act.category === 'sleep') {
    return {
      projName: 'Rest',
      hexColor: '#64748B',
      rgbValues: '100, 116, 139',
      darkTextColor: '#475569',
      isDeepWork: false,
    };
  }
  return {
    projName: 'Personal',
    hexColor: '#D97706',
    rgbValues: '217, 119, 6',
    darkTextColor: '#B45309',
    isDeepWork: false,
  };
}

// Circular area cue icon helper for calendar event blocks
function renderActivityAreaIcon(act: CalendarActivity, colorCfg: ReturnType<typeof getActivityColorConfig>) {
  const t = act.title.toLowerCase();
  if (act.category === 'shift' || t.includes('starbucks')) {
    return <Coffee className="w-2.5 h-2.5 stroke-[2.2]" />;
  }
  if (t.includes('magneto') || t.includes('stillness')) {
    return <Zap className="w-2.5 h-2.5 fill-current stroke-none" />;
  }
  if (t.includes('shamanicca') || act.category === 'routine') {
    return <Sparkles className="w-2.5 h-2.5 stroke-[2.2]" />;
  }
  if (act.category === 'wellness' || t.includes('yoga') || t.includes('meditation')) {
    return <Heart className="w-2.5 h-2.5 fill-current stroke-none" />;
  }
  if (act.category === 'meal' || t.includes('lunch') || t.includes('dinner')) {
    return <Utensils className="w-2.5 h-2.5 stroke-[2.2]" />;
  }
  if (act.category === 'sleep') {
    return <Moon className="w-2.5 h-2.5 stroke-[2.2]" />;
  }
  if (act.category === 'deep_work') {
    return <Brain className="w-2.5 h-2.5 stroke-[2.2]" />;
  }
  if (act.category === 'dev' || t.includes('frontend') || t.includes('training') || t.includes('komorebi') || t.includes('sonder')) {
    return <Briefcase className="w-2.5 h-2.5 stroke-[2.2]" />;
  }
  return <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colorCfg.hexColor }} />;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  commitments,
  onSelectTask,
  onMoveTaskTime,
  onOpenMessage,
  onOpenCreate,
  initialDayNumber = 7,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'month' | 'agenda'>('grid');
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date(2026, 8, 7)); // September 2026
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(initialDayNumber);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [selectedActivity, setSelectedActivity] = useState<CalendarActivity | null>(null);

  const gridScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialDayNumber) {
      setSelectedDayNumber(initialDayNumber);
    }
  }, [initialDayNumber]);

  const handleSelectDayFromMonth = (dayNumber: number, date: Date) => {
    if (date.getMonth() === 8 && dayNumber >= 7 && dayNumber <= 13) {
      setSelectedDayNumber(dayNumber);
    } else {
      setSelectedDayNumber(Math.min(13, Math.max(7, dayNumber)));
    }
    setViewMode('grid');
  };

  const HOUR_HEIGHT = 56; // px per hour (slightly more breathing room)
  
  // Hours 0-23: Time gutter displays hour labels in 11px sans, right aligned
  const HOURS_24 = Array.from({ length: 24 }, (_, i) => {
    const period = i < 12 ? 'AM' : 'PM';
    const displayHour = i === 0 ? 12 : i > 12 ? i - 12 : i;
    return {
      index: i,
      label: `${displayHour} ${period}`,
      military: `${i.toString().padStart(2, '0')}:00`,
    };
  });

  // Default vertical scroll to 05:00
  useEffect(() => {
    if (gridScrollRef.current) {
      gridScrollRef.current.scrollTop = 5 * HOUR_HEIGHT; // 05:00
    }
  }, [viewMode]);

  // Filter out standalone commute activities from grid rendering (attached inside shift block)
  const filteredActivities = useMemo(() => {
    return CALENDAR_ACTIVITIES.filter((act) => {
      if (act.category === 'commute') return false;
      if (activeCategoryFilter === 'all') return true;
      if (activeCategoryFilter === 'shift') return act.category === 'shift';
      if (activeCategoryFilter === 'dev') return act.category === 'dev' || act.category === 'deep_work';
      if (activeCategoryFilter === 'wellness') return act.category === 'wellness' || act.category === 'routine';
      if (activeCategoryFilter === 'personal') return act.category === 'personal' || act.category === 'meal';
      return true;
    });
  }, [activeCategoryFilter]);

  // Compute scheduled hours for each day header: e.g. "6.5h" in mono
  const dailyScheduledHours = useMemo(() => {
    const hoursMap: Record<string, string> = {};
    CALENDAR_DAYS.forEach((d) => {
      const acts = CALENDAR_ACTIVITIES.filter(
        (a) => a.day === d.key && a.category !== 'sleep' && a.category !== 'meal'
      );
      const totalMinutes = acts.reduce((acc, a) => acc + (a.endMinutes - a.startMinutes), 0);
      const hours = (totalMinutes / 60).toFixed(1);
      hoursMap[d.key] = `${hours.endsWith('.0') ? parseInt(hours) : hours}h`;
    });
    return hoursMap;
  }, []);

  const scrollToHour = (hour: number) => {
    if (gridScrollRef.current) {
      gridScrollRef.current.scrollTo({
        top: hour * HOUR_HEIGHT,
        behavior: 'smooth',
      });
    }
  };

  const renderActivityIcon = (iconType: string, className = 'w-3.5 h-3.5 shrink-0') => {
    switch (iconType) {
      case 'coffee':
        return <Coffee className={className} />;
      case 'code':
        return <Code className={className} />;
      case 'laptop':
        return <Laptop className={className} />;
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
      case 'activity':
        return <Activity className={className} />;
      case 'music':
        return <Music className={className} />;
      case 'dumbbell':
        return <Dumbbell className={className} />;
      case 'shopping':
        return <ShoppingBag className={className} />;
      case 'users':
        return <Users className={className} />;
      case 'clipboard':
        return <ClipboardList className={className} />;
      case 'briefcase':
        return <Briefcase className={className} />;
      default:
        return <Clock className={className} />;
    }
  };

  // Agenda items for alternative list view
  const agendaItems = [
    {
      id: 'task-ag-1',
      time: '5:30 am — 1:15 pm',
      duration: '8h shift · 9h door-to-door',
      status: 'RETAIL SHIFT',
      area: 'Magneto',
      title: 'Starbucks — Opening Barista Shift',
      subtitle: 'Westport Store (4:30a door-to-door transit included)',
      taskRef: tasks[0],
    },
    {
      id: 'task-ag-2',
      time: '2:00 pm — 4:10 pm',
      duration: '2h 10m',
      status: 'CAREER',
      area: 'Career',
      title: 'Refactor checkout drawer state & cart bundle calculation',
      subtitle: 'Komorebi Tea — Freelance client work',
      taskRef: tasks[0],
    },
    {
      id: 'task-ag-3',
      time: '4:15 pm — 5:02 pm',
      duration: '47m',
      status: 'CAREER',
      area: 'Career',
      title: 'Optimize WebGL reel scrub physics & pointer velocity',
      subtitle: 'Sonder Film Co. — Production portfolio',
      taskRef: tasks[1] || tasks[0],
    },
    {
      id: 'task-ag-4',
      time: '5:15 pm — 6:40 pm',
      duration: '1h 25m',
      status: 'SHAMANICCA',
      area: 'Shamanicca',
      title: 'Audio streaming chunk cache fallback for offline play',
      subtitle: 'Stillness App — Editorial & Audio CMS',
      taskRef: tasks[2] || tasks[0],
    },
    {
      id: 'task-ag-5',
      time: '8:00 pm — 9:00 pm',
      duration: '1h',
      status: 'ROUTINE',
      area: 'Wellness',
      title: 'Yoga & Evening Routine',
      subtitle: 'Recovery, mobility & unwinding',
      taskRef: tasks[3] || tasks[0],
    },
  ];

  return (
    <div id="view-calendar" className="flex-1 flex flex-col h-full bg-[#F7F7F8] overflow-hidden select-none text-[#1A1D23]">
      
      {/* 1. Header Toolbar */}
      <header className="bg-white border-b border-black/[0.04] px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0 z-20 shadow-2xs">
        {/* Left: Date Navigation */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                if (viewMode === 'month') {
                  setCurrentMonthDate(new Date(2026, 8, 7));
                  setSelectedDayNumber(7);
                } else {
                  setSelectedDayNumber(7);
                  scrollToHour(5);
                }
              }}
              className="px-4 py-2 min-h-[44px] rounded-xl bg-[#F7F7F8] hover:bg-slate-200/60 text-xs font-semibold text-[#1A1D23] transition-all duration-200 cursor-pointer active:scale-[0.98]"
            >
              Today
            </button>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => {
                  if (viewMode === 'month') {
                    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
                  } else {
                    setSelectedDayNumber((prev) => Math.max(7, prev - 1));
                  }
                }}
                className="w-11 h-11 flex items-center justify-center rounded-xl text-[#6B7280] hover:text-[#1A1D23] hover:bg-[#F7F7F8] transition-all duration-200 cursor-pointer active:scale-[0.98]"
                title={viewMode === 'month' ? 'Previous month' : 'Previous day'}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => {
                  if (viewMode === 'month') {
                    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
                  } else {
                    setSelectedDayNumber((prev) => Math.min(13, prev + 1));
                  }
                }}
                className="w-11 h-11 flex items-center justify-center rounded-xl text-[#6B7280] hover:text-[#1A1D23] hover:bg-[#F7F7F8] transition-all duration-200 cursor-pointer active:scale-[0.98]"
                title={viewMode === 'month' ? 'Next month' : 'Next day'}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <h2 className="text-base sm:text-lg font-bold text-[#1A1D23] tracking-tight">
              {viewMode === 'month'
                ? currentMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                : 'September 2026'}
            </h2>
            {viewMode !== 'month' && (
              <span className="text-[13px] font-sans text-[#6B7280] hidden sm:inline-block">
                Week 37 · Mon 7 – Sun 13
              </span>
            )}
          </div>
        </div>

        {/* Center: Quick Jump Anchor Chips */}
        {viewMode === 'grid' && (
          <div className="hidden md:flex items-center gap-1 text-[11px] bg-[#F7F7F8] p-1 rounded-xl border border-black/[0.04]">
            <span className="text-[#9CA3AF] px-2 font-sans font-semibold text-xs">Jump:</span>
            <button
              onClick={() => scrollToHour(5)}
              className="px-2.5 py-1 rounded-lg hover:bg-white text-[#6B7280] hover:text-[#1A1D23] font-mono tabular-nums transition-all duration-200 cursor-pointer active:scale-[0.98]"
            >
              05:00
            </button>
            <button
              onClick={() => scrollToHour(12)}
              className="px-2.5 py-1 rounded-lg hover:bg-white text-[#6B7280] hover:text-[#1A1D23] font-mono tabular-nums transition-all duration-200 cursor-pointer active:scale-[0.98]"
            >
              12:00
            </button>
            <button
              onClick={() => scrollToHour(17)}
              className="px-2.5 py-1 rounded-lg hover:bg-white text-[#6B7280] hover:text-[#1A1D23] font-mono tabular-nums transition-all duration-200 cursor-pointer active:scale-[0.98]"
            >
              17:00
            </button>
          </div>
        )}

        {/* Right: View Mode Toggle (iOS Segmented Control: Week Grid · Month · Agenda) */}
        <div className="flex items-center gap-2">
          <div className="segmented-control">
            <button
              onClick={() => setViewMode('grid')}
              className={`segmented-pill ${
                viewMode === 'grid' ? 'segmented-pill-active' : ''
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Week Grid</span>
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`segmented-pill ${
                viewMode === 'month' ? 'segmented-pill-active' : ''
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Month</span>
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`segmented-pill ${
                viewMode === 'agenda' ? 'segmented-pill-active' : ''
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>Agenda</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Expanded Week Grid Area (Horizontally scrollable with min 200px column width) */}
      {viewMode === 'grid' ? (
        <div 
          ref={gridScrollRef}
          className="flex-1 overflow-y-auto overflow-x-auto w-full p-4 sm:p-6 scrollbar-thin"
        >
          {/* Card Container: 20px radius, 7 days * 200px min width + 64px time gutter = min-w-[1464px] */}
          <div className="min-w-[1464px] bg-white rounded-[20px] border border-black/[0.04] flex flex-col overflow-hidden shadow-[0_2px_8px_rgba(30,35,50,0.06),0_1px_2px_rgba(30,35,50,0.04)]">
            
            {/* Calendar Days Sticky Header Row (Solid white, soft bottom border rgba(0,0,0,0.04)) */}
            <div className="grid grid-cols-[64px_repeat(7,minmax(200px,1fr))] border-b border-black/[0.04] bg-white sticky top-0 z-20 select-none">
              {/* Top-left corner time zone label */}
              <div className="p-3 text-[11px] font-sans font-medium text-[#9CA3AF] flex items-end justify-center border-r border-black/[0.04]">
                GMT-4
              </div>

              {/* 7 Day Column Headers */}
              {CALENDAR_DAYS.map((d) => {
                const isSelected = selectedDayNumber === d.dayNumber;
                const isToday = d.dayNumber === 7;
                const scheduledHours = dailyScheduledHours[d.key] || '0h';

                return (
                  <div
                    key={d.key}
                    onClick={() => setSelectedDayNumber(d.dayNumber)}
                    className={`py-3 px-4 text-center border-r border-black/[0.04] last:border-r-0 transition-colors duration-200 cursor-pointer flex flex-col items-center justify-between ${
                      isSelected ? 'bg-blue-50/30' : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Day Name: 12px sans font-normal, color #9CA3AF */}
                    <div className="text-[12px] font-sans font-normal text-[#9CA3AF]">
                      {d.label}
                    </div>

                    {/* Date Number: 18px sans font-semibold; Today circled in blue (#2563EB) with white text */}
                    <div className="my-1 flex items-center justify-center">
                      <span className={`text-[18px] font-sans font-semibold w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                        isToday
                          ? 'bg-[#2563EB] text-white shadow-2xs'
                          : isSelected
                          ? 'bg-slate-100 text-[#1A1D23]'
                          : 'text-[#1A1D23]'
                      }`}>
                        {d.dayNumber}
                      </span>
                    </div>

                    {/* Total Scheduled Hours: 11px mono, color #6B7280 */}
                    <div className="text-[11px] font-mono tabular-nums text-[#6B7280]">
                      {scheduledHours}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Calendar 24h Timeline Body */}
            <div 
              className="grid grid-cols-[64px_repeat(7,minmax(200px,1fr))] relative bg-white"
              style={{ height: `${24 * HOUR_HEIGHT}px` }}
            >
              {/* Time Gutter (Leftmost column): sans 11px, color #9CA3AF, right-aligned */}
              <div className="border-r border-black/[0.04] relative select-none">
                {HOURS_24.map((hour) => (
                  <div
                    key={hour.military}
                    style={{ 
                      top: `${hour.index * HOUR_HEIGHT}px`, 
                      height: `${HOUR_HEIGHT}px` 
                    }}
                    className="absolute inset-x-0 flex items-start justify-end pr-3.5 pt-1"
                  >
                    <span className="text-[11px] font-sans text-[#9CA3AF]">
                      {hour.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* 7 Day Columns with Positioned Activities */}
              {CALENDAR_DAYS.map((day) => {
                const dayActivities = filteredActivities.filter((act) => act.day === day.key);
                const isSelected = selectedDayNumber === day.dayNumber;
                const isToday = day.dayNumber === 7;

                return (
                  <div
                    key={day.key}
                    className={`border-r border-black/[0.04] last:border-r-0 relative transition-colors ${
                      isToday ? 'bg-blue-600/[0.02]' : isSelected ? 'bg-blue-50/[0.02]' : ''
                    }`}
                  >
                    {/* Horizontal Hour Grid Lines (Very subtle 1px rgba(0,0,0,0.04)) */}
                    {HOURS_24.map((hour) => (
                      <div
                        key={`gridline-${day.key}-${hour.military}`}
                        style={{ 
                          top: `${hour.index * HOUR_HEIGHT}px`, 
                          height: `${HOUR_HEIGHT}px` 
                        }}
                        className="absolute inset-x-0 border-b border-black/[0.04] pointer-events-none"
                      />
                    ))}

                    {/* NOW Indicator Line on Today (Sep 7, Monday at 10:15 AM) */}
                    {isToday && (
                      <div 
                        style={{ top: `${10.25 * HOUR_HEIGHT}px` }}
                        className="absolute inset-x-0 z-30 pointer-events-none flex items-center"
                        title="Current Time: 10:15 AM"
                      >
                        <div className="w-2 h-2 rounded-full bg-blue-600 -ml-1 shadow-xs" />
                        <div className="flex-1 h-[2px] bg-blue-600" />
                      </div>
                    )}

                    {/* Positioned Activities in this Day Column */}
                    {dayActivities.map((act) => {
                      const isShift = act.category === 'shift';
                      const colorCfg = getActivityColorConfig(act);
                      const topPx = (act.startMinutes / 60) * HOUR_HEIGHT;
                      const durationMinutes = act.endMinutes - act.startMinutes;
                      const heightPx = Math.max(34, (durationMinutes / 60) * HOUR_HEIGHT - 4);
                      const durationHours = (durationMinutes / 60).toFixed(1);
                      const displayDuration = durationHours.endsWith('.0') ? `${parseInt(durationHours)}h` : `${durationHours}h`;

                      // Special Shift Composite Block (Starbucks Work Shift with Attached Commute)
                      if (isShift) {
                        const doorToDoorStartMinutes = 270; // 4:30 am
                        const doorToDoorEndMinutes = 840;   // 2:00 pm
                        const shiftTopPx = (doorToDoorStartMinutes / 60) * HOUR_HEIGHT;
                        const shiftHeightPx = ((doorToDoorEndMinutes - doorToDoorStartMinutes) / 60) * HOUR_HEIGHT - 4;
                        const leadingCommuteHeightPx = (60 / 60) * HOUR_HEIGHT;
                        const trailingCommuteHeightPx = (45 / 60) * HOUR_HEIGHT;

                        return (
                          <div
                            key={act.id}
                            onClick={() => setSelectedActivity(act)}
                            style={{
                              top: `${shiftTopPx}px`,
                              height: `${shiftHeightPx}px`,
                              left: '4px',
                              right: '4px',
                              backgroundColor: `rgba(${colorCfg.rgbValues}, 0.12)`,
                            }}
                            className="absolute rounded-[12px] text-[#1A1D23] transition-all duration-150 ease-out cursor-pointer select-none group z-10 overflow-hidden flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-px active:scale-[0.99]"
                            title="Starbucks Work Shift — 8h shift · 9h door-to-door"
                          >
                            {/* Leading Commute Segment */}
                            <div 
                              style={{ height: `${leadingCommuteHeightPx}px` }}
                              className="bg-black/[0.04] px-2.5 py-1 flex items-center justify-between text-[11px] text-[#6B7280] shrink-0"
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <Car className="w-3.5 h-3.5 text-[#6B7280] shrink-0" />
                                <span className="font-sans font-medium text-[11px] truncate">Commute</span>
                              </div>
                              <span className="font-mono tabular-nums text-[10px] text-[#9CA3AF]">4:30 AM</span>
                            </div>

                            {/* Main Shift Body: Wrap text, pill badge, mono time */}
                            <div className="flex-1 p-2.5 flex flex-col justify-between min-h-0">
                              <div className="space-y-1">
                                {/* Line 1: Circular area badge + Activity title in sans 12px, font-medium, color #1A1D23. Wraps */}
                                <div className="flex items-start gap-1.5">
                                  <div 
                                    className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center mt-0.5"
                                    style={{ backgroundColor: `rgba(${colorCfg.rgbValues}, 0.20)`, color: colorCfg.hexColor }}
                                    title="Starbucks Retail Shift Area"
                                  >
                                    <Coffee className="w-2.5 h-2.5 stroke-[2.2]" />
                                  </div>
                                  <span className="font-sans text-[12px] font-medium text-[#1A1D23] leading-snug break-words">
                                    Starbucks — Work Shift
                                  </span>
                                </div>

                                {/* Line 2: Project name pill badge */}
                                <div className="pl-[22px]">
                                  <span 
                                    style={{
                                      backgroundColor: `rgba(${colorCfg.rgbValues}, 0.15)`,
                                      color: colorCfg.darkTextColor,
                                    }}
                                    className="font-sans text-[10px] font-medium rounded-full px-1.5 py-0.5 inline-block"
                                  >
                                    Starbucks
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-0.5 pt-1">
                                {/* Line 3: Time range in 11px monospace */}
                                <div className="font-mono tabular-nums text-[11px] text-[#6B7280]">
                                  5:30 AM – 1:15 PM
                                </div>
                                {/* Line 4: Duration in 11px mono */}
                                <div className="font-mono tabular-nums text-[10px] text-[#9CA3AF]">
                                  7.8h shift · 9h door-to-door
                                </div>
                              </div>
                            </div>

                            {/* Trailing Commute Segment */}
                            <div 
                              style={{ height: `${trailingCommuteHeightPx}px` }}
                              className="bg-black/[0.04] border-t border-black/[0.04] px-2.5 py-1 flex items-center justify-between text-[11px] text-[#6B7280] shrink-0"
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <Car className="w-3.5 h-3.5 text-[#6B7280] shrink-0" />
                                <span className="font-sans font-medium text-[11px] truncate">Commute home</span>
                              </div>
                              <span className="font-mono tabular-nums text-[10px] text-[#9CA3AF]">1:15 PM</span>
                            </div>
                          </div>
                        );
                      }

                      // Deep Work Blocks: 12% area tint, circular brain icon badge, DEEP WORK label
                      if (colorCfg.isDeepWork) {
                        return (
                          <div
                            key={act.id}
                            onClick={() => setSelectedActivity(act)}
                            style={{
                              top: `${topPx}px`,
                              height: `${heightPx}px`,
                              left: '4px',
                              right: '4px',
                              backgroundColor: `rgba(${colorCfg.rgbValues}, 0.12)`,
                            }}
                            className="absolute rounded-[12px] px-2.5 py-1.5 text-[#1A1D23] transition-all duration-150 ease-out cursor-pointer select-none group z-10 overflow-hidden flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-px active:scale-[0.99]"
                            title={`${act.title} (${act.startTime} – ${act.endTime})`}
                          >
                            <div className="space-y-1">
                              {/* Deep work indicator header with circular badge */}
                              <div className="flex items-center gap-1.5 text-[#2563EB]">
                                <div 
                                  className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center"
                                  style={{ backgroundColor: `rgba(${colorCfg.rgbValues}, 0.20)`, color: colorCfg.hexColor }}
                                  title="Deep Work Area"
                                >
                                  <Brain className="w-2.5 h-2.5 stroke-[2.2]" />
                                </div>
                                <span className="font-sans text-[10px] font-semibold tracking-wider uppercase">
                                  DEEP WORK
                                </span>
                              </div>

                              {/* Title in sans 12px, font-medium, wraps */}
                              <div className="font-sans text-[12px] font-medium text-[#1A1D23] leading-snug break-words line-clamp-2">
                                {act.title}
                              </div>
                            </div>

                            {heightPx >= 50 && (
                              <div className="flex items-center justify-between text-[11px] pt-1">
                                <span className="font-mono tabular-nums text-[#6B7280]">
                                  {act.startTime} – {act.endTime}
                                </span>
                                <span className="font-mono tabular-nums text-[#9CA3AF] text-[10px]">
                                  {displayDuration}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      }

                      // Standard Activity Cards (Dev, Client Work, Routine, Wellness):
                      // Background: 12% opacity tint (no border of any kind — fill is boundary)
                      // Radius: 12px
                      // Shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)
                      return (
                        <div
                          key={act.id}
                          onClick={() => setSelectedActivity(act)}
                          style={{
                            top: `${topPx}px`,
                            height: `${heightPx}px`,
                            left: '4px',
                            right: '4px',
                            backgroundColor: `rgba(${colorCfg.rgbValues}, 0.12)`,
                          }}
                          className="absolute rounded-[12px] px-2.5 py-1 text-[#1A1D23] transition-all duration-150 ease-out cursor-pointer select-none group z-10 overflow-hidden flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-px active:scale-[0.99]"
                          title={`${act.title} (${act.startTime} – ${act.endTime})`}
                        >
                          <div className="space-y-0.5">
                            {/* Line 1: Circular area badge + Activity title in sans 12px, font-medium, color #1A1D23. Wraps! */}
                            <div className="flex items-start gap-1.5">
                              <div 
                                className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center mt-0.5"
                                style={{ backgroundColor: `rgba(${colorCfg.rgbValues}, 0.20)`, color: colorCfg.hexColor }}
                                title={`${colorCfg.projName} Area`}
                              >
                                {renderActivityAreaIcon(act, colorCfg)}
                              </div>
                              <div className="font-sans text-[12px] font-medium text-[#1A1D23] leading-snug break-words line-clamp-2 flex-1">
                                {act.title}
                              </div>
                            </div>

                            {/* Line 2: Project name small pill badge (if space allows >= 50px) */}
                            {heightPx >= 50 && (
                              <div className="pl-[22px]">
                                <span 
                                  style={{
                                    backgroundColor: `rgba(${colorCfg.rgbValues}, 0.15)`,
                                    color: colorCfg.darkTextColor,
                                  }}
                                  className="font-sans text-[10px] font-medium rounded-full px-1.5 py-0.2 inline-block leading-tight"
                                >
                                  {colorCfg.projName}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Line 3 & Line 4: Time range & duration in 11px monospace */}
                          {heightPx >= 42 && (
                            <div className="flex items-center justify-between text-[11px] pt-0.5">
                              <span className="font-mono tabular-nums text-[#6B7280]">
                                {act.startTime} – {act.endTime}
                              </span>
                              {heightPx >= 60 && (
                                <span className="font-mono tabular-nums text-[10px] text-[#9CA3AF]">
                                  {displayDuration}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : viewMode === 'month' ? (
        <CalendarMonthGrid
          currentDate={currentMonthDate}
          tasks={tasks}
          commitments={commitments}
          onSelectTask={onSelectTask}
          onSelectDay={handleSelectDayFromMonth}
        />
      ) : (
        /* 3. Agenda View (Warm tactile cards with 12% opacity fills, no left borders, 12px radius, sans text, mono times) */
        <div className="flex-1 overflow-y-auto max-w-4xl mx-auto w-full px-4 sm:px-8 py-6 space-y-4">
          <div className="space-y-3.5">
            {agendaItems.map((item) => {
              const itemStyle = getAreaStyle(item.area || item.status);

              return (
                <div 
                  key={item.id}
                  onClick={() => onSelectTask(item.taskRef)}
                  style={{
                    backgroundColor: `rgba(${itemStyle.rgbValues}, 0.12)`,
                  }}
                  className="rounded-[12px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-px transition-all duration-150 ease-out cursor-pointer flex items-center justify-between gap-4 min-h-[56px] active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* 32px circular badge on the left */}
                    <AreaBadge area={item.area || item.status} />

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-mono tabular-nums text-[12px] text-[#6B7280]">{item.time}</span>
                        <span className="text-black/[0.1]">·</span>
                        <span className="font-mono tabular-nums text-[11px] font-medium text-[#1A1D23] bg-white/70 px-2 py-0.5 rounded-md shadow-2xs">
                          {item.duration}
                        </span>
                        <span className="text-black/[0.1]">·</span>
                        <span className="font-sans text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider" style={{
                          backgroundColor: `rgba(${itemStyle.rgbValues}, 0.15)`,
                          color: itemStyle.hexColor,
                        }}>
                          {item.status}
                        </span>
                      </div>

                      <h3 className="font-sans text-[15px] sm:text-base font-semibold text-[#1A1D23] leading-snug">
                        {item.title}
                      </h3>
                      <p className="font-sans text-[13px] text-[#6B7280]">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onOpenMessage) onOpenMessage(item.taskRef);
                    }}
                    className="w-11 h-11 flex items-center justify-center rounded-xl text-[#6B7280] hover:text-[#1A1D23] hover:bg-white/80 transition-all duration-200 cursor-pointer shrink-0 active:scale-[0.98]"
                    title="Send message / coach note"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Activity Details Sheet / Modal */}
      {selectedActivity && (
        <div 
          onClick={() => setSelectedActivity(null)}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 select-none"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[20px] p-6 max-w-md w-full shadow-2xl border border-black/[0.04] space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <AreaBadge area={selectedActivity.category === 'dev' ? 'Career' : 'Personal'} />
                <div>
                  <h3 className="text-lg font-bold text-[#1A1D23] font-sans">
                    {selectedActivity.title}
                  </h3>
                  <p className="text-xs font-sans text-[#6B7280]">
                    {selectedActivity.category.toUpperCase()} · {selectedActivity.day}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedActivity(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#6B7280] hover:text-[#1A1D23] hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-black/[0.04] space-y-2 text-xs font-sans">
              <div className="flex justify-between items-center">
                <span className="text-[#6B7280]">Time Range:</span>
                <span className="font-mono tabular-nums font-semibold text-[#1A1D23]">{selectedActivity.startTime} — {selectedActivity.endTime}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#6B7280]">Total Duration:</span>
                <span className="font-mono tabular-nums font-semibold text-[#1A1D23]">{selectedActivity.endMinutes - selectedActivity.startMinutes} minutes</span>
              </div>
              {selectedActivity.subtitle && (
                <div className="pt-2 border-t border-black/[0.04] text-[#6B7280]">
                  {selectedActivity.subtitle}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedActivity(null)}
                className="px-5 py-2.5 min-h-[44px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all duration-200 shadow-[0_2px_8px_rgba(37,99,235,0.25)] active:scale-[0.98] cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

