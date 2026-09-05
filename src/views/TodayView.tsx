import React, { useState } from 'react';
import { Task, AtRiskItem, ExternalCommitment } from '../types';
import { 
  Play, 
  Pause,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles
} from 'lucide-react';
import { computeCapacity } from '../utils/capacity';
import { WeeklyCapacityStrip } from '../components/WeeklyCapacityStrip';
import { CompactGantt } from '../components/CompactGantt';
import { getAreaStyle } from '../utils/areaColor';
import { AreaBadge } from '../components/AreaBadge';

interface TodayViewProps {
  primaryTask: Task | null;
  secondaryTasks: Task[];
  atRiskItems: AtRiskItem[];
  onSelectTask: (task: Task) => void;
  onRescheduleAtRisk: (item: AtRiskItem) => void;
  onShortenAtRisk: (item: AtRiskItem) => void;
  onDropAtRisk: (item: AtRiskItem) => void;
  onOpenMessage?: (task: Task) => void;
  onNavigateToCalendar?: (dayKey?: string, dayNumber?: number) => void;
  onNavigateToTimeline?: () => void;
  onOpenCreate?: () => void;
  overageMinutes?: number;
  commitments?: ExternalCommitment[];
  tasks?: Task[];
}

export const TodayView: React.FC<TodayViewProps> = ({
  primaryTask,
  secondaryTasks,
  atRiskItems,
  onSelectTask,
  onRescheduleAtRisk,
  onShortenAtRisk,
  onDropAtRisk,
  onNavigateToCalendar = (_dayKey?: string, _dayNumber?: number) => {},
  onNavigateToTimeline = () => {},
  overageMinutes = 30,
  commitments = [],
  tasks = [],
}) => {
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Single derived capacity from utility
  const capacity = computeCapacity(overageMinutes);

  // Default primary task fallback if none passed
  const currentBlock = primaryTask || {
    id: 'task-k-checkout',
    projectId: 'p-komorebi',
    projectName: 'Komorebi Tea — Ecommerce & Landing',
    title: 'Refactor checkout drawer state & cart bundle calculation',
    description: 'Fix bundle discount calculation edge case when 3-pack matcha tin is mixed with loose leaf.',
    durationMinutes: 130,
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

  // Deduplicated meta tags for current work block (fixing bug where "Magneto" tag shows twice)
  const projectShortName = currentBlock.projectName ? currentBlock.projectName.split('—')[0].trim() : '';
  const energyLabel = currentBlock.energy ? `${currentBlock.energy} Energy` : 'Deep Energy';

  const rawTags: { label: string; isArea: boolean }[] = [
    { label: currentBlock.area, isArea: true },
    ...(projectShortName ? [{ label: projectShortName, isArea: false }] : []),
    ...(energyLabel ? [{ label: energyLabel, isArea: false }] : []),
  ];

  const seenTags = new Set<string>();
  const currentBlockTags = rawTags.filter((tag) => {
    const key = tag.label.toLowerCase().trim();
    if (!key || seenTags.has(key)) return false;
    seenTags.add(key);
    return true;
  });

  // Next up tasks for bottom section (top 3 queued tasks)
  const nextUpTasks = tasks
    .filter((t) => t.id !== currentBlock.id && (t.column === 'next-up' || t.column === 'todo' || t.scheduledDay === 'Tomorrow'))
    .slice(0, 3);

  // Rest of day schedule items
  const restOfDayItems = [
    {
      id: 'rest-1',
      type: 'task',
      time: '4:15 pm — 5:02 pm',
      duration: '47m',
      title: secondaryTasks[0]?.title || 'Optimize WebGL reel scrub physics & pointer velocity',
      subtitle: secondaryTasks[0]?.projectName.split('—')[0].trim() || 'Sonder Film Co.',
      area: secondaryTasks[0]?.area || 'Career',
      taskRef: secondaryTasks[0],
    },
    {
      id: 'rest-2',
      type: 'task',
      time: '5:15 pm — 6:40 pm',
      duration: '1h 25m',
      title: secondaryTasks[1]?.title || 'Audio streaming chunk cache fallback for offline play',
      subtitle: secondaryTasks[1]?.projectName.split('—')[0].trim() || 'Stillness App',
      area: secondaryTasks[1]?.area || 'Shamanicca',
      taskRef: secondaryTasks[1],
    },
    {
      id: 'rest-3',
      type: 'routine',
      time: '6:45 pm — 7:30 pm',
      duration: '45m',
      title: 'Dinner & evening recovery routine',
      subtitle: 'Personal / Routine',
      area: 'Wellness',
    },
    {
      id: 'rest-4',
      type: 'sleep',
      time: '10:30 pm — 5:30 am',
      duration: '7h',
      title: 'Sleep & physical recovery',
      subtitle: 'Rest',
      area: 'Wellness',
    },
  ];

  return (
    <div 
      id="view-dashboard" 
      className="flex-1 bg-[#F7F7F8] overflow-y-auto w-full flex flex-col gap-6 select-none text-[#1A1D23]"
      style={{
        paddingLeft: 'clamp(1.5rem, 3vw, 2.5rem)',
        paddingRight: 'clamp(1.5rem, 3vw, 2.5rem)',
        paddingTop: '1.75rem',
        paddingBottom: '2.5rem',
      }}
    >
      {/* ============================================================
          SECTION 1: WEEKLY CALENDAR WIDGET (day columns, horizontal scroll)
          ============================================================ */}
      <section id="dashboard-weekly-strip" className="w-full">
        <div className="flex items-center justify-between mb-2 px-0.5">
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
          SECTION 2: CAPACITY + CURRENT BLOCK (TWO COLUMNS IN ONE ROW)
          ============================================================ */}
      <section 
        id="dashboard-capacity-and-current-block" 
        className="w-full grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch"
      >
        {/* LEFT COLUMN — Capacity headline */}
        <div id="dashboard-capacity-headline" className="flex flex-col h-full">
          <div className="flex items-center gap-2 mb-2 px-0.5 shrink-0">
            <span className="text-xs uppercase font-semibold tracking-[0.04em] text-[#9CA3AF]">
              Capacity & Workload
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="text-[13px] text-[#6B7280]">
              Window: {capacity.windowStart} — {capacity.windowEnd}
            </span>
          </div>

          <div className="flex-1 flex flex-col justify-center py-2">
            <h1 
              id="dashboard-capacity-sentence"
              className="text-[clamp(1.5rem,3vw,2rem)] lg:text-[clamp(1.25rem,2vw,1.5rem)] font-bold text-[#1A1D23] leading-[1.35] max-w-full tracking-tight"
            >
              {capacity.sentencePrefix}
              <span className={capacity.isDeficit ? 'text-red-600 font-bold' : 'text-[#1A1D23] font-bold'}>
                {capacity.deficitHighlightText}
              </span>
              {capacity.sentenceSuffix}
            </h1>
          </div>
        </div>

        {/* RIGHT COLUMN — Current work block */}
        <div id="dashboard-current-block" className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-2 px-0.5 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-semibold tracking-[0.04em] text-[#9CA3AF]">
                Current Work Block
              </span>
              <span className={`text-[11px] font-semibold ${currentAreaStyle.tagClass}`}>
                {currentBlock.area}
              </span>
            </div>
            <div className="text-[13px] text-[#6B7280]">
              <span>2:00 pm — 4:10 pm </span>
              <span className="font-mono tabular-nums text-slate-700 font-medium">(2h 10m)</span>
            </div>
          </div>

          <div 
            id="current-work-block-card"
            style={{
              backgroundColor: `${currentAreaStyle.hexColor}14`, // 8% opacity area tint fill
            }}
            className="flex-1 rounded-2xl p-5 sm:p-6 flex flex-col justify-between gap-4 transition-all duration-200 shadow-[0_2px_8px_rgba(30,35,50,0.06),0_1px_2px_rgba(30,35,50,0.04)] hover:shadow-[0_4px_12px_rgba(30,35,50,0.08),0_1px_3px_rgba(30,35,50,0.05)] w-full border-0 group"
          >
            {/* Left area badge + details */}
            <div className="flex items-start gap-4 min-w-0">
              {/* 32px circular badge filled with area color at 15% */}
              <AreaBadge 
                area={currentBlock.area} 
                projectName={currentBlock.projectName}
                className="mt-0.5 shrink-0" 
              />

              <div className="space-y-2.5 flex-1 min-w-0">
                {/* Meta tags with pastel 12% fill - deduplicated */}
                <div className="flex flex-wrap items-center gap-2">
                  {currentBlockTags.map((tag, idx) => (
                    <span
                      key={idx}
                      className={
                        tag.isArea 
                          ? currentAreaStyle.tagClass 
                          : "text-[11px] font-semibold text-[#475569] bg-white/70 rounded-full px-2.5 py-0.5"
                      }
                    >
                      {tag.label}
                    </span>
                  ))}
                </div>

                {/* Task Title in 15-16px semibold near-black */}
                <h2 
                  onClick={() => onSelectTask(currentBlock)}
                  className="text-base sm:text-[17px] font-semibold text-[#1A1D23] leading-snug hover:text-blue-600 cursor-pointer transition-colors duration-200"
                >
                  {currentBlock.title}
                </h2>

                {currentBlock.description && (
                  <p className="text-[13px] text-[#6B7280] line-clamp-2 leading-relaxed">
                    {currentBlock.description}
                  </p>
                )}
              </div>
            </div>

            {/* Action buttons with 12px radius, 44px min touch targets in bottom-right */}
            <div className="flex items-center justify-end gap-3 shrink-0 pt-1">
              <button
                id="btn-start-current-block"
                onClick={() => setIsRunning(!isRunning)}
                className={`flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
                  isRunning 
                    ? 'bg-white text-[#1A1D23] shadow-[0_2px_8px_rgba(30,35,50,0.06)] hover:bg-slate-50' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-[0_2px_8px_rgba(37,99,235,0.25)]'
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Start Task</span>
                  </>
                )}
              </button>

              <button
                onClick={() => onSelectTask(currentBlock)}
                className="px-5 py-2.5 min-h-[44px] rounded-xl bg-white/80 hover:bg-white text-sm font-semibold text-[#1A1D23] transition-all duration-200 cursor-pointer shadow-[0_2px_8px_rgba(30,35,50,0.04)] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
              >
                Inspect
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 3: REST OF THE DAY
          ============================================================ */}
      <section id="dashboard-rest-of-day" className="w-full">
        <div className="flex items-center justify-between mb-2 px-0.5">
          <span className="text-xs uppercase font-semibold tracking-[0.04em] text-[#9CA3AF]">
            Rest of the Day
          </span>
          <span className="text-[13px] text-[#6B7280]">
            3 scheduled · 1 routine · 1 rest
          </span>
        </div>

        <div className="bg-white rounded-[20px] border border-black/[0.04] divide-y divide-black/[0.04] overflow-hidden shadow-[0_2px_8px_rgba(30,35,50,0.06),0_1px_2px_rgba(30,35,50,0.04)] w-full">
          {restOfDayItems.map((item) => {
            const isRoutineOrSleep = item.type === 'routine' || item.type === 'sleep';
            const itemStyle = getAreaStyle(item.area);

            if (isRoutineOrSleep) {
              return (
                <div 
                  key={item.id}
                  className="px-5 py-3.5 min-h-[56px] flex items-center justify-between text-xs text-slate-500 bg-slate-50/50"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <AreaBadge area={item.area} />
                    <span className="text-[13px] text-[#6B7280] w-36 shrink-0">
                      {item.time}
                    </span>
                    <span className="truncate italic text-[14px] text-slate-600">{item.title}</span>
                  </div>
                  <span className="font-mono tabular-nums text-xs shrink-0 text-[#6B7280] bg-white px-2.5 py-1 rounded-lg border border-black/[0.03]">
                    {item.duration}
                  </span>
                </div>
              );
            }

            return (
              <div 
                key={item.id}
                onClick={() => {
                  if (item.taskRef) onSelectTask(item.taskRef);
                }}
                className="px-5 py-3.5 min-h-[56px] flex items-center justify-between text-xs text-[#1A1D23] hover:bg-slate-50/70 active:scale-[0.99] transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-4">
                  {/* 32px circular icon badge */}
                  <AreaBadge area={item.area} />

                  <span className="text-[13px] text-[#6B7280] w-36 shrink-0 font-normal">
                    {item.time}
                  </span>
                  <span className="text-[15px] font-semibold text-[#1A1D23] truncate group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </span>
                  <span className="text-[#6B7280] text-[13px] truncate hidden md:inline">
                    · {item.subtitle}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <span className={itemStyle.tagClass}>
                    {item.area}
                  </span>
                  <span className="font-mono tabular-nums text-xs text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-black/[0.04]">
                    {item.duration}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============================================================
          SECTION 4: RISK & CAPACITY ALERTS (full-width row)
          - Alert cards lay out horizontally: 3 across on desktop, 2 on tablet,
            1 on mobile. CSS Grid, 16px gap.
          - Each card, internal layout:
            · Row 1: client name (left) + due date (right)
            · Row 2: task title, 15px semibold, wraps to 2 lines max
            · Row 3: the "needs / available" line as ONE continuous sentence on a
              single line — never a narrow wrapping column
            · Row 4: Reschedule / Shorten / Drop buttons, in their own row BELOW the
              text, never beside it
          - Minimum card width 280px. Buttons never share a line with body text.
          - Card background: red tint at 5%, radius 16px, no border.
          ============================================================ */}
      <section id="dashboard-risk-alerts" className="w-full">
        <div className="flex items-center justify-between mb-2 px-0.5 select-none">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-semibold tracking-[0.04em] text-[#9CA3AF]">
              Risk & Capacity Alerts
            </span>
            {atRiskItems.length > 0 ? (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-500/[0.12] text-red-700 font-semibold">
                {atRiskItems.length} at risk
              </span>
            ) : (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/[0.12] text-emerald-700 font-semibold">
                Clear
              </span>
            )}
          </div>
          {atRiskItems.length > 0 && (
            <span className="text-[13px] text-[#6B7280]">
              Immediate action recommended
            </span>
          )}
        </div>

        {atRiskItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
            {atRiskItems.map((item) => (
              <div
                key={item.id}
                id={`card-risk-alert-${item.id}`}
                className="bg-red-500/[0.05] rounded-[16px] p-4 sm:p-5 flex flex-col justify-between border-0 min-w-[280px] shadow-[0_1px_3px_rgba(239,68,68,0.04)]"
              >
                {/* Content Rows 1 to 3 */}
                <div className="space-y-1.5">
                  {/* Row 1: client name (left) + due date (right) */}
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="font-semibold text-slate-800 truncate">
                      {item.projectName.split('—')[0].trim()}
                    </span>
                    <span className="text-red-600 font-medium text-[11px] shrink-0 whitespace-nowrap">
                      Due {item.dueDate}
                    </span>
                  </div>

                  {/* Row 2: task title, 15px semibold, wraps to 2 lines max */}
                  <h3 className="text-[15px] font-semibold text-[#1A1D23] leading-snug line-clamp-2">
                    {item.title}
                  </h3>

                  {/* Row 3: the "needs / available" line as ONE continuous sentence on a single line — never a narrow wrapping column */}
                  <p className="text-xs font-mono font-medium text-red-600 whitespace-nowrap overflow-hidden text-ellipsis pt-0.5">
                    {item.shortfall}
                  </p>
                </div>

                {/* Row 4: Reschedule / Shorten / Drop buttons, in their own row BELOW the text, never beside it */}
                <div className="mt-4 pt-3 border-t border-red-500/10 flex items-center gap-2">
                  <button
                    onClick={() => onRescheduleAtRisk(item)}
                    className="flex-1 px-3 py-2 min-h-[36px] text-xs font-semibold text-slate-700 hover:text-blue-600 bg-white hover:bg-slate-50 rounded-lg shadow-2xs border-0 cursor-pointer transition-colors active:scale-[0.98] text-center whitespace-nowrap"
                  >
                    Reschedule
                  </button>
                  <button
                    onClick={() => onShortenAtRisk(item)}
                    className="flex-1 px-3 py-2 min-h-[36px] text-xs font-semibold text-slate-700 hover:text-blue-600 bg-white hover:bg-slate-50 rounded-lg shadow-2xs border-0 cursor-pointer transition-colors active:scale-[0.98] text-center whitespace-nowrap"
                  >
                    Shorten
                  </button>
                  <button
                    onClick={() => onDropAtRisk(item)}
                    className="px-3 py-2 min-h-[36px] text-xs font-semibold text-red-600 hover:text-red-700 bg-white hover:bg-red-50 rounded-lg shadow-2xs border-0 cursor-pointer transition-colors active:scale-[0.98] text-center whitespace-nowrap"
                  >
                    Drop
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-emerald-500/[0.05] rounded-[16px] p-5 border-0 flex items-center gap-3 text-emerald-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-medium">
              All clear — capacity is balanced with no deadline collisions.
            </span>
          </div>
        )}
      </section>

      {/* ============================================================
          SECTION 5: PROJECT DEADLINES + NEXT UP (full-width row, last)
          - Two panels side by side: deadlines gantt ~2/3 width, Next Up ~1/3.
            Below 1024px they stack.
          - Fix truncation in the project-name column: widen it until real names fit
            ("Komorebi Tea", "Sonder Film Co."). Never ellipsis a project name.
          - Same for Next Up task titles — wrap to 2 lines instead of truncating.
          - Keep the current bar treatment (area colors, rounded caps).
          ============================================================ */}
      <section id="dashboard-deadlines-and-next-up" className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full">
          {/* Panel 1: Deadlines Gantt (~2/3 width on desktop) */}
          <div className="lg:col-span-2 flex flex-col w-full min-w-0">
            <CompactGantt onNavigateToTimeline={onNavigateToTimeline} />
          </div>

          {/* Panel 2: Next Up / Queued Tasks (~1/3 width on desktop) */}
          <div className="lg:col-span-1 flex flex-col w-full min-w-0">
            <div className="flex items-center justify-between mb-2 px-0.5 select-none">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-semibold tracking-[0.04em] text-[#9CA3AF]">
                  Next Up · Queued
                </span>
                <span className="text-[13px] text-[#6B7280]">
                  ({nextUpTasks.length} ready)
                </span>
              </div>
            </div>

            <div 
              id="card-next-up-bento"
              className="bg-white rounded-2xl border border-black/[0.04] p-4 flex flex-col justify-between shadow-[0_2px_8px_rgba(30,35,50,0.06),0_1px_2px_rgba(30,35,50,0.04)] flex-1 min-h-[220px]"
            >
              <div className="divide-y divide-black/[0.04]">
                {nextUpTasks.map((t) => {
                  const tStyle = getAreaStyle(t.area, t.projectName);
                  return (
                    <div
                      key={t.id}
                      onClick={() => onSelectTask(t)}
                      className="py-3 first:pt-0 last:pb-0 min-h-[56px] flex items-center justify-between gap-3 group cursor-pointer hover:bg-slate-50/70 rounded-xl px-2 transition-all duration-200 active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <AreaBadge area={t.area} projectName={t.projectName} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className={tStyle.tagClass}>
                              {t.area}
                            </span>
                          </div>
                          {/* Task title wraps to 2 lines instead of truncating */}
                          <h4 className="text-[15px] font-semibold text-[#1A1D23] group-hover:text-blue-600 line-clamp-2 leading-snug transition-colors">
                            {t.title}
                          </h4>
                        </div>
                      </div>
                      <span className="font-mono tabular-nums text-xs text-slate-700 bg-slate-50 px-2 py-0.5 rounded-lg border border-black/[0.04] shrink-0">
                        {t.durationDisplay || `${t.durationMinutes}m`}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 mt-3 border-t border-black/[0.04] flex items-center justify-between text-[13px] text-[#6B7280]">
                <span>Estimated ready work</span>
                <span className="font-mono tabular-nums font-semibold text-[#1A1D23]">
                  {nextUpTasks.reduce((acc, t) => acc + (t.durationMinutes || 0), 0)}m
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
