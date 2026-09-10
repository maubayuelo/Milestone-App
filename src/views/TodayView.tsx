import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Task, AtRiskItem, ExternalCommitment, Project } from '../types';
import { 
  Play, 
  Pause,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { computeCapacity, formatHoursAndMinutes, getWindowState } from '../utils/capacity';
import { WeeklyCapacityStrip } from '../components/WeeklyCapacityStrip';
import { getAreaStyle } from '../utils/areaColor';
import { AreaBadge } from '../components/AreaBadge';
import { NextUpCard } from '../components/NextUpCard';
import { ProjectsModule } from '../components/ProjectsModule';
import { ProjectSideSheet } from '../components/ProjectSideSheet';

interface TodayViewProps {
  primaryTask: Task | null;
  secondaryTasks: Task[];
  atRiskItems: AtRiskItem[];
  projects?: Project[];
  onSelectTask: (task: Task) => void;
  onRescheduleAtRisk: (item: AtRiskItem) => void;
  onShortenAtRisk: (item: AtRiskItem) => void;
  onDropAtRisk: (item: AtRiskItem) => void;
  onOpenMessage?: (task: Task) => void;
  onNavigateToCalendar?: (dayKey?: string, dayNumber?: number) => void;
  onNavigateToTimeline?: () => void;
  onOpenBoardForProject?: (projectId: string) => void;
  onNavigateToBoard?: () => void;
  onStartTask?: (task: Task) => void;
  onOpenCreate?: () => void;
  overageMinutes?: number;
  commitments?: ExternalCommitment[];
  tasks?: Task[];
  onUpdateProject?: (updated: Project) => void;
  onAddTask?: (newTask: Omit<Task, 'id'>) => void;
  onUpdateTask?: (updated: Task) => void;
  onDeleteTask?: (taskId: string) => void;
}

export const TodayView: React.FC<TodayViewProps> = ({
  primaryTask,
  secondaryTasks,
  atRiskItems,
  projects = [],
  onSelectTask,
  onRescheduleAtRisk: _onRescheduleAtRisk,
  onShortenAtRisk: _onShortenAtRisk,
  onDropAtRisk: _onDropAtRisk,
  onNavigateToCalendar = (_dayKey?: string, _dayNumber?: number) => {},
  onNavigateToTimeline = () => {},
  onOpenBoardForProject = (_projId: string) => {},
  onNavigateToBoard = () => {},
  onStartTask,
  overageMinutes = 30,
  commitments = [],
  tasks = [],
  onUpdateProject,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
}) => {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activePrimaryTask, setActivePrimaryTask] = useState<Task | null>(primaryTask);
  const [selectedProjectForSheet, setSelectedProjectForSheet] = useState<Project | null>(null);
  const [todayExpanded, setTodayExpanded] = useState<boolean>(false);

  // Undo toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [undoCallback, setUndoCallback] = useState<(() => void) | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerToast = (msg: string, onUndo?: () => void) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    setUndoCallback(onUndo ? () => onUndo : null);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
      setUndoCallback(null);
    }, 5000);
  };

  // Keep activePrimaryTask synced if primaryTask prop changes
  useEffect(() => {
    if (primaryTask) {
      setActivePrimaryTask(primaryTask);
    }
  }, [primaryTask]);

  // Capacity calculation (evaluating at 8:14 pm or current local time)
  // Check 4: time-aware states (before, active, closed)
  const capacity = computeCapacity(overageMinutes);
  const { windowState } = capacity;

  // Default primary task fallback if none passed
  const currentBlock = activePrimaryTask || {
    id: 'task-k-checkout',
    projectId: 'proj-komorebi',
    projectName: 'Komorebi Tea — Ecommerce & Landing',
    title: 'Refactor checkout drawer state & cart bundle calculation',
    description: 'Fix bundle discount calculation edge case when 3-pack matcha tin is mixed with loose leaf.',
    notes: 'Fix bundle discount calculation edge case when 3-pack matcha tin is mixed with loose leaf.',
    durationMinutes: 130,
    estimateMinutes: 130,
    durationDisplay: '2h 10m',
    column: 'in_progress',
    area: 'Career',
    priority: 'P1',
    energy: 'Deep',
    scheduledStart: '14:00',
    scheduledEnd: '16:10',
    subtasks: [],
  } as Task;

  const currentAreaStyle = getAreaStyle(currentBlock.area, currentBlock.projectName);

  // Handler for starting a task from Next Up: swaps current work block so action visibly resolves
  const handleStartQueuedTask = (task: Task) => {
    setActivePrimaryTask(task);
    setIsRunning(true);
    onStartTask?.(task);
  };

  // Deduplicated meta tags for current work block: never render "Empty Energy" or null
  const projectShortName = currentBlock.projectName ? currentBlock.projectName.split('—')[0].trim() : '';
  const energyLabel =
    currentBlock.energy &&
    currentBlock.energy !== 'Empty' &&
    currentBlock.energy.trim() !== ''
      ? `${currentBlock.energy} Energy`
      : null;

  const rawTags: { label: string; isArea: boolean }[] = [
    { label: currentBlock.area, isArea: true },
    ...(projectShortName ? [{ label: projectShortName, isArea: false }] : []),
    ...(energyLabel ? [{ label: energyLabel, isArea: false }] : []),
  ];

  const seenLabels = new Set<string>();
  const currentBlockTags = rawTags.filter((t) => {
    if (!t.label || seenLabels.has(t.label)) return false;
    seenLabels.add(t.label);
    return true;
  });

  // Formatted estimateMinutes display alongside chips
  const rawEstimateMinutes = currentBlock.estimateMinutes || currentBlock.durationMinutes;
  const formattedEstimate = rawEstimateMinutes
    ? rawEstimateMinutes >= 60
      ? `${Math.floor(rawEstimateMinutes / 60)}h${rawEstimateMinutes % 60 ? ` ${rawEstimateMinutes % 60}m` : ''}`
      : `${rawEstimateMinutes}m`
    : null;

  // Notes field for description: clamp to 2 lines, collapse if absent. Never generate placeholder prose.
  const taskNotes = (currentBlock.notes || '').trim();

  // Calculate Standing summary metrics: accurately use own tasks without artificial 18h fallback
  const { totalDoneHours, totalCommittedHours, atRiskProjectsCount, activeProjectsCount } = useMemo(() => {
    const activeProjects = projects.filter((p) => !p.isClosed && p.categoryId !== 'cat-templates');
    let totalCommittedMin = 0;
    let totalDoneMin = 0;
    let atRiskCount = 0;

    activeProjects.forEach((p) => {
      const pTasks = tasks.filter(
        (t) => t.projectId === p.id || (t.projectName && t.projectName.toLowerCase().includes(p.name.toLowerCase()))
      );
      const pDoneTasks = pTasks.filter((t) => t.column === 'done' || t.status === 'done');
      let pDoneMin = pDoneTasks.reduce((acc, t) => acc + (t.estimateMinutes ?? t.durationMinutes ?? 0), 0);
      let pCommittedMin = pTasks.reduce((acc, t) => acc + (t.estimateMinutes ?? t.durationMinutes ?? 0), 0);

      const riskItem = atRiskItems.find(
        (r) =>
          r.projectName.toLowerCase().includes(p.name.toLowerCase()) ||
          p.name.toLowerCase().includes(r.projectName.toLowerCase())
      );

      if (riskItem) {
        pCommittedMin = Math.max(pCommittedMin, Math.round(riskItem.hoursNeeded * 60));
      }

      if (pTasks.length > 0) {
        const remaining = pCommittedMin - pDoneMin;
        const avail = riskItem ? Math.round(riskItem.hoursAvailable * 60) : 360;
        if (avail < remaining) {
          atRiskCount++;
        }
      }

      totalCommittedMin += pCommittedMin;
      totalDoneMin += pDoneMin;
    });

    return {
      activeProjectsCount: activeProjects.length,
      totalDoneHours: Math.round(totalDoneMin / 60),
      totalCommittedHours: Math.round(totalCommittedMin / 60),
      atRiskProjectsCount: atRiskCount,
    };
  }, [projects, tasks, atRiskItems]);

  // Remaining free minutes in today's window for the capacity cut line:
  const remainingFreeMinutes = useMemo(() => {
    return capacity.surplusMinutes > 0 ? capacity.surplusMinutes : 75;
  }, [capacity.surplusMinutes]);

  // =========================================================================
  // CHANGE 6: TODAY Timeline Schedule with next-transition line & dimmed past
  // =========================================================================
  // Assume currentTime is 8:14 pm (20:14 = 1214 minutes) or live time
  const currentNowMinutes = useMemo(() => {
    const d = new Date();
    // If during evening/night after window closed (e.g. 20:14):
    return d.getHours() * 60 + d.getMinutes();
  }, []);

  const todayTimelineBlocks = useMemo(() => [
    {
      id: 'block-shift',
      time: '6:30 am — 1:15 pm',
      startMin: 6 * 60 + 30, // 390
      endMin: 13 * 60 + 15,  // 795
      duration: '6h 45m',
      title: 'Retail Shift — Westport Provisions',
      subtitle: 'Bay 3 Receive & Backstock',
      area: 'Career',
      type: 'shift',
    },
    {
      id: 'block-buffer',
      time: '1:15 pm — 2:00 pm',
      startMin: 13 * 60 + 15, // 795
      endMin: 14 * 60,        // 840
      duration: '45m',
      title: 'Transit & Lunch Buffer',
      subtitle: 'Transition window',
      area: 'Wellness',
      type: 'routine',
    },
    {
      id: 'block-checkout',
      time: '2:00 pm — 4:10 pm',
      startMin: 14 * 60,      // 840
      endMin: 16 * 60 + 10,   // 970
      duration: '2h 10m',
      title: 'Refactor checkout drawer state & cart bundle calculation',
      subtitle: 'Komorebi Tea',
      area: 'Career',
      type: 'task',
      taskRef: currentBlock,
    },
    {
      id: 'item-webgl',
      time: '4:15 pm — 5:02 pm',
      startMin: 16 * 60 + 15, // 975
      endMin: 17 * 60 + 2,    // 1022
      duration: '47m',
      title: 'Optimize WebGL reel scrub physics & pointer velocity',
      subtitle: 'Sonder Film Co.',
      area: 'Magneto',
      type: 'task',
      taskRef: secondaryTasks[0],
    },
    {
      id: 'item-audio',
      time: '5:15 pm — 6:40 pm',
      startMin: 17 * 60 + 15, // 1035
      endMin: 18 * 60 + 40,   // 1120
      duration: '1h 25m',
      title: 'Audio streaming chunk cache fallback for offline play',
      subtitle: 'Stillness App',
      area: 'Shamanicca',
      type: 'task',
      taskRef: secondaryTasks[1],
    },
    {
      id: 'item-walk',
      time: '6:40 pm — 7:15 pm',
      startMin: 18 * 60 + 40, // 1120
      endMin: 19 * 60 + 15,   // 1155
      duration: '35m',
      title: 'Evening transition walk & cool-down',
      subtitle: 'Daily routine',
      area: 'Wellness',
      type: 'routine',
    },
    {
      id: 'item-dinner',
      time: '7:15 pm — 8:30 pm',
      startMin: 19 * 60 + 15, // 1155
      endMin: 20 * 60 + 30,   // 1230
      duration: '1h 15m',
      title: 'Dinner & evening buffer',
      subtitle: 'Routine',
      area: 'Wellness',
      type: 'routine',
    },
    {
      id: 'item-sleep',
      time: '11:00 pm',
      startMin: 23 * 60,      // 1380
      endMin: 31 * 60,        // 1860
      duration: '8h 00m',
      title: 'Sleep Target (pre-shift rest)',
      subtitle: 'Recovery window',
      area: 'Wellness',
      type: 'sleep',
    },
  ], [currentBlock, secondaryTasks]);

  // Compute next transition for Today header
  const { nextTransitionText, isNextTransitionUrgent } = useMemo(() => {
    // Find block that ends in the future
    const activeBlockIndex = todayTimelineBlocks.findIndex(
      (b) => currentNowMinutes >= b.startMin && currentNowMinutes < b.endMin
    );

    if (activeBlockIndex !== -1) {
      const active = todayTimelineBlocks[activeBlockIndex];
      const next = todayTimelineBlocks[activeBlockIndex + 1];
      const minsRemaining = active.endMin - currentNowMinutes;

      if (next) {
        const timeLabel = next.time.split('—')[0].trim();
        return {
          nextTransitionText: `Next: ${next.title.split('—')[0].trim()} · ${timeLabel} · in ${minsRemaining} min`,
          isNextTransitionUrgent: minsRemaining <= 10,
        };
      }
      return {
        nextTransitionText: `Finishing ${active.title.split('—')[0].trim()} · in ${minsRemaining} min`,
        isNextTransitionUrgent: minsRemaining <= 10,
      };
    }

    // Between blocks: find upcoming block
    const upcoming = todayTimelineBlocks.find((b) => b.startMin > currentNowMinutes);
    if (upcoming) {
      const minsUntil = upcoming.startMin - currentNowMinutes;
      const timeLabel = upcoming.time.split('—')[0].trim();
      return {
        nextTransitionText: `Next: ${upcoming.title.split('—')[0].trim()} · ${timeLabel} · in ${minsUntil} min`,
        isNextTransitionUrgent: minsUntil <= 10,
      };
    }

    return {
      nextTransitionText: 'Day schedule completed',
      isNextTransitionUrgent: false,
    };
  }, [todayTimelineBlocks, currentNowMinutes]);

  // Expand-in-place for Today timeline (default 5 blocks)
  const visibleTimelineBlocks = todayExpanded ? todayTimelineBlocks : todayTimelineBlocks.slice(0, 5);

  // Auto-scroll on mount so now-marker sits about 1/3 down the page
  const nowMarkerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (nowMarkerRef.current) {
        const markerRect = nowMarkerRef.current.getBoundingClientRect();
        const mainContainer = document.getElementById('main-content-layout');
        if (mainContainer && mainContainer.scrollHeight > mainContainer.clientHeight) {
          const containerRect = mainContainer.getBoundingClientRect();
          const targetTop = mainContainer.scrollTop + (markerRect.top - containerRect.top) - (mainContainer.clientHeight / 3);
          mainContainer.scrollTo({
            top: Math.max(0, targetTop),
            behavior: typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
          });
        } else {
          const targetTop = window.scrollY + markerRect.top - (window.innerHeight / 3);
          window.scrollTo({
            top: Math.max(0, targetTop),
            behavior: typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
          });
        }
      }
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Format current live time for display
  const liveTimeDisplay = useMemo(() => {
    const h = Math.floor(currentNowMinutes / 60);
    const m = currentNowMinutes % 60;
    const period = h >= 12 ? 'pm' : 'am';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
  }, [currentNowMinutes]);

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto pb-16 px-4 sm:px-6">
      {/* ============================================================
          [APP HEADER] Clean Milestones Header (Change 2)
          ============================================================ */}
      <header id="dashboard-app-header" className="pt-2 flex items-center justify-between border-b border-black/[0.05] pb-4">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827]">
          Milestones
        </h1>
      </header>

      {/* ============================================================
          ROW 1: CAPACITY & WORKLOAD (Left) | CURRENT / LAST WORK BLOCK (Right)
          ============================================================ */}
      <section 
        id="dashboard-row-1"
        className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch"
      >
        {/* Left Column: Capacity & Workload headline */}
        <div
          id="dashboard-capacity-headline-card"
          className="bg-white rounded-2xl border border-black/[0.06] p-6 sm:p-7 shadow-sm flex flex-col justify-between transition-all duration-200"
        >
          <div className="space-y-3 max-w-xl">
            {/* Module header: Tag on left, Clock + status on right (Change 2) */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-semibold tracking-[0.04em] text-[#9CA3AF]">
                  Capacity & Workload · Window
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-tight uppercase ${
                    windowState === 'closed'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : capacity.isDeficit
                      ? 'bg-red-50 text-[#DC2626] border border-red-100'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  }`}
                >
                  {capacity.shortLabel}
                </span>
              </div>

              {/* Right-aligned live time + status (Change 2) */}
              <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-black/[0.04]">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{liveTimeDisplay}</span>
                <span className="text-slate-300">·</span>
                <span className={windowState === 'closed' ? 'text-amber-700 font-semibold' : 'text-emerald-700 font-semibold'}>
                  {windowState === 'closed' ? 'Window closed' : windowState === 'before' ? 'Pre-window' : 'Window active'}
                </span>
              </div>
            </div>

            {/* Time-Aware Headline Sentence */}
            <p className="text-[#1A1D23] font-medium leading-[1.35] tracking-tight text-lg sm:text-xl lg:text-[clamp(1.15rem,1.75vw,1.4rem)]">
              {capacity.sentencePrefix}
              <span
                className={
                  windowState === 'closed'
                    ? 'text-amber-700 font-semibold underline decoration-amber-300 underline-offset-2'
                    : capacity.isDeficit
                    ? 'text-[#DC2626] font-semibold underline decoration-red-300 underline-offset-2'
                    : 'text-emerald-700 font-semibold'
                }
              >
                {capacity.deficitHighlightText}
              </span>
              {capacity.sentenceSuffix}
            </p>

            <p className="text-xs text-[#6B7280]">
              {windowState === 'closed'
                ? 'Work window closed at 6:30 pm after 4h30 available. Free evening buffer in progress.'
                : 'Work window opens at 2:00 pm after transition buffer. 4h30 available.'}
            </p>
          </div>

          {/* Footer row inside the card, separated by 1px divider (Change 2) */}
          <div className="pt-3.5 mt-4 border-t border-black/[0.06] flex items-center justify-between">
            <button
              type="button"
              id="btn-capacity-projects-standing"
              onClick={() => {
                const el = document.getElementById('dashboard-projects-module');
                if (el) {
                  const prefersReduced =
                    typeof window !== 'undefined' &&
                    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                  el.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
                }
              }}
              className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-blue-600 font-medium cursor-pointer transition-colors group"
              title="Click to view Projects module"
            >
              <span className="font-semibold text-[#1A1D23] group-hover:text-blue-600">
                {activeProjectsCount} projects · {totalDoneHours}h of {totalCommittedHours}h
                {atRiskProjectsCount > 0 ? ` · ${atRiskProjectsCount} at risk` : ''}
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Right Column: CURRENT WORK BLOCK (Fix 2: Reference card with green tint, circular icon, chips row, medium-weight title, grey description, solid blue Start Task, outlined white Inspect) */}
        <div
          id="dashboard-current-work-block-card"
          className="bg-[#F0FDF4] border border-[#DCFCE7] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between transition-all duration-200"
        >
          <div className="space-y-3">
            {/* Header: Circular Icon + Current Work Block */}
            <div className="flex items-center justify-between gap-2 border-b border-emerald-100/80 pb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200/80 flex items-center justify-center text-emerald-700 shadow-2xs shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-semibold tracking-[0.04em] text-emerald-900/70">
                    {windowState === 'closed' ? 'Last Work Block' : 'Current Work Block'}
                  </span>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-mono font-semibold bg-emerald-100/90 text-emerald-800">
                    {windowState === 'closed' ? 'Ended 4:10 pm' : '2:00 pm — 4:10 pm'}
                  </span>
                </div>
              </div>

              <span className="text-[11px] font-mono text-emerald-900/70 font-medium">
                {currentBlock.durationDisplay || '2h 10m'}
              </span>
            </div>

            {/* Chips row */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                {currentBlockTags.map((tag) => (
                  <span
                    key={tag.label}
                    className={
                      tag.isArea
                        ? currentAreaStyle.tagClass
                        : "text-[11px] font-semibold text-slate-700 bg-white/90 rounded-full px-2.5 py-0.5 shadow-2xs border border-emerald-900/[0.06]"
                    }
                  >
                    {tag.label}
                  </span>
                ))}
                {formattedEstimate && (
                  <span className="text-[11px] font-mono font-medium text-slate-600 bg-white/90 rounded-full px-2.5 py-0.5 shadow-2xs border border-emerald-900/[0.06]">
                    {formattedEstimate}
                  </span>
                )}
              </div>

              {/* Medium-weight title */}
              <h2 
                onClick={() => onSelectTask(currentBlock)}
                className="text-base sm:text-[17px] font-medium text-[#1A1D23] leading-snug hover:text-blue-600 cursor-pointer transition-colors duration-200"
              >
                {currentBlock.title}
              </h2>

              {/* Grey description from Notes field: clamped to 2 lines, collapsed if empty */}
              {taskNotes ? (
                <p
                  title={taskNotes}
                  className="text-[13px] text-[#6B7280] line-clamp-2 leading-relaxed"
                >
                  {taskNotes}
                </p>
              ) : null}
            </div>
          </div>

          {/* Action buttons: Solid blue Start Task with play icon, outlined white Inspect */}
          <div className="flex items-center justify-end gap-2.5 shrink-0 pt-4 mt-2">
            <button
              id="btn-start-current-block"
              onClick={() => setIsRunning(!isRunning)}
              className={`flex items-center justify-center gap-2 px-4 py-2 min-h-[40px] rounded-xl font-semibold text-xs sm:text-sm transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                isRunning 
                  ? 'bg-blue-700 text-white shadow-[0_2px_8px_rgba(37,99,235,0.3)]' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-[0_2px_8px_rgba(37,99,235,0.25)]'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Task</span>
                </>
              )}
            </button>

            <button
              onClick={() => onSelectTask(currentBlock)}
              className="px-4 py-2 min-h-[40px] rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-[#1A1D23] transition-all duration-200 cursor-pointer shadow-2xs active:scale-[0.98]"
            >
              Inspect
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================
          ROW 2: TODAY (Scheduled Timeline, Left) | NEXT UP · QUEUED (Right)
          Change 5: Side-by-side pair
          ============================================================ */}
      <section 
        id="dashboard-row-2"
        className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start"
      >
        {/* Left Column: TODAY (Timeline with Next-Transition line & Dimmed past blocks) */}
        <div
          id="dashboard-today-timeline-module"
          className="bg-white rounded-2xl border border-black/[0.06] shadow-sm flex flex-col overflow-hidden"
        >
          {/* Header with Next Transition Line (Change 6) */}
          <div className="px-4 py-3 border-b border-black/[0.05] flex items-center justify-between bg-slate-50/50 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-semibold tracking-[0.04em] text-[#9CA3AF]">
                Today
              </span>
              <span className="text-xs font-mono text-slate-400">· Wed, Sep 9</span>
            </div>

            {/* Next Transition Line */}
            <div
              className={`text-xs font-medium px-2 py-0.5 rounded transition-colors ${
                isNextTransitionUrgent
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold animate-pulse'
                  : 'text-slate-600 bg-white border border-black/[0.04]'
              }`}
              title="When do I switch?"
            >
              {nextTransitionText}
            </div>
          </div>

          {/* Timeline List without internal scroll (Expand in place) */}
          <div
            role="list"
            aria-label="Today timeline schedule"
            className="w-full divide-y divide-black/[0.04]"
          >
            {visibleTimelineBlocks.map((item) => {
              const isPast = item.endMin <= currentNowMinutes;
              const isActive = currentNowMinutes >= item.startMin && currentNowMinutes < item.endMin;
              const isUpcoming = item.startMin > currentNowMinutes;

              return (
                <React.Fragment key={item.id}>
                  {/* Now Marker Indicator */}
                  {isActive && (
                    <div
                      ref={nowMarkerRef}
                      id="today-timeline-now-marker"
                      className="px-4 py-1 bg-blue-600/[0.08] border-y border-blue-600/20 flex items-center justify-between text-[11px] font-semibold text-blue-800"
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                        <span>Current Time: {liveTimeDisplay}</span>
                      </span>
                      <span className="font-mono text-[10px]">Now</span>
                    </div>
                  )}

                  {/* Schedule Item Row */}
                  <div
                    role="listitem"
                    tabIndex={0}
                    onClick={() => {
                      if (item.taskRef) onSelectTask(item.taskRef);
                    }}
                    className={`p-3 sm:px-4 sm:py-3 transition-all flex items-center justify-between gap-3 ${
                      isPast
                        ? 'opacity-40 filter grayscale-[30%] bg-slate-50/40'
                        : isActive
                        ? 'bg-blue-50/30'
                        : 'hover:bg-slate-50/60'
                    } ${item.taskRef ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Area pill chip */}
                      <AreaBadge area={item.area} size="sm" />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold truncate ${isPast ? 'text-slate-500' : 'text-[#1A1D23]'}`}>
                            {item.title}
                          </span>
                          {isActive && (
                            <span className="px-1.5 py-0.2 bg-blue-600 text-white rounded text-[9px] font-semibold uppercase">
                              Active
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#6B7280] truncate block">
                          {item.subtitle}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0 text-right">
                      <span className="text-xs font-mono text-slate-700 font-medium">
                        {item.time}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {item.duration}
                      </span>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          {/* Expand in place toggle (Change 1) */}
          {todayTimelineBlocks.length > 5 && (
            <div className="p-2.5 bg-slate-50/60 border-t border-black/[0.04] text-center shrink-0">
              <button
                type="button"
                id="btn-today-timeline-toggle"
                onClick={() => setTodayExpanded((prev) => !prev)}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 py-1 px-3 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
              >
                {todayExpanded
                  ? 'Show less'
                  : `Show all (${todayTimelineBlocks.length})`}
              </button>
            </div>
          )}
        </div>

        {/* Right Column: NEXT UP · QUEUED (Fix 2: Deduplicated, 1 divider, matching count) */}
        <NextUpCard
          tasks={tasks}
          currentBlockId={currentBlock.id}
          remainingFreeMinutes={remainingFreeMinutes}
          onSelectTask={onSelectTask}
          onStartTask={handleStartQueuedTask}
          onOpenBoard={onNavigateToBoard}
        />
      </section>

      {/* ============================================================
          ROW 3: PROJECTS (Standing / Timeline) — Full Width Row
          Change 5: Full width, dual view
          ============================================================ */}
      <section id="dashboard-row-3" className="w-full">
        <ProjectsModule
          projects={projects}
          tasks={tasks}
          atRiskItems={atRiskItems}
          onOpenBoardForProject={onOpenBoardForProject}
          onNavigateToTimeline={onNavigateToTimeline}
          onEditProject={(project) => setSelectedProjectForSheet(project)}
          onUpdateProject={(updated) => {
            onUpdateProject?.(updated);
            triggerToast(`Updated ${updated.name}`);
          }}
        />
      </section>

      {/* ============================================================
          ROW 4: WEEKLY CAPACITY — Full Width Row
          Change 5: Full width at the bottom
          ============================================================ */}
      <section id="dashboard-row-4" className="w-full">
        <div className="flex items-center justify-between mb-2 px-0.5 select-none">
          <span className="text-xs uppercase font-semibold tracking-[0.04em] text-[#9CA3AF]">
            Weekly Capacity
          </span>
          <span className="text-[13px] text-[#6B7280]">
            Sep 7 — 13
          </span>
        </div>

        <WeeklyCapacityStrip
          commitments={commitments}
          tasks={tasks}
          overageMinutes={overageMinutes}
          onSelectDay={(dayKey, dayNumber) => onNavigateToCalendar(dayKey, dayNumber)}
        />
      </section>

      {/* ============================================================
          FIX 3: Project Side Sheet (Slide-over editor)
          ============================================================ */}
      {selectedProjectForSheet && (
        <ProjectSideSheet
          project={selectedProjectForSheet}
          tasks={tasks}
          onClose={() => setSelectedProjectForSheet(null)}
          onUpdateProject={(updated) => {
            setSelectedProjectForSheet(updated);
            onUpdateProject?.(updated);
          }}
          onAddTask={(newTask) => onAddTask?.(newTask)}
          onUpdateTask={(updatedTask) => onUpdateTask?.(updatedTask)}
          onDeleteTask={(taskId) => onDeleteTask?.(taskId)}
          onTriggerToast={triggerToast}
        />
      )}

      {/* Undo Toast Container */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-150 select-none"
        >
          <span>{toastMessage}</span>
          {undoCallback && (
            <button
              type="button"
              onClick={() => {
                undoCallback();
                setToastMessage(null);
                setUndoCallback(null);
              }}
              className="font-semibold text-blue-400 hover:text-blue-300 underline underline-offset-2 cursor-pointer ml-1"
            >
              Undo
            </button>
          )}
        </div>
      )}
    </div>
  );
};
