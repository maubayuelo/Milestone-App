import React, { useState, useMemo, useRef } from 'react';
import { Task, Project } from '../types';
import { 
  TIMELINE_PROJECTS, 
  TIMELINE_DAYS_28, 
  TimelineProject, 
  TimelineDeliverable 
} from '../data/timelineData';
import { 
  ChevronRight, 
  ChevronDown, 
  AlertTriangle, 
  Plus, 
  Info,
  Calendar as CalendarIcon
} from 'lucide-react';
import { getAreaStyle } from '../utils/areaColor';

interface GanttTimelineProps {
  projects?: Project[];
  selectedProjectId?: string;
  onSelectProject?: (id: string) => void;
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onOpenCapture: () => void;
}

export const GanttTimeline: React.FC<GanttTimelineProps> = ({
  projects = [],
  selectedProjectId,
  onSelectProject,
  tasks,
  onSelectTask,
  onOpenCapture,
}) => {
  const [filterAtRiskOnly, setFilterAtRiskOnly] = useState<boolean>(false);
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({
    'proj-komorebi': false,
    'proj-sonder': false,
    'proj-stillness': false,
  });
  const [selectedItemDetail, setSelectedItemDetail] = useState<TimelineProject | null>(null);

  const timelineContainerRef = useRef<HTMLDivElement>(null);

  const totalDays = 28; // 4-week horizon (Sep 7 — Oct 4, 2026)

  const toggleExpand = (projId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedProjects((prev) => ({ ...prev, [projId]: !prev[projId] }));
  };

  const toggleExpandAll = () => {
    const allExpanded = Object.values(expandedProjects).every(Boolean);
    const nextState: Record<string, boolean> = {};
    TIMELINE_PROJECTS.forEach((p) => {
      nextState[p.id] = !allExpanded;
    });
    setExpandedProjects(nextState);
  };

  const displayedProjects = useMemo(() => {
    if (filterAtRiskOnly) {
      return TIMELINE_PROJECTS.filter((p) => p.atRisk);
    }
    return TIMELINE_PROJECTS;
  }, [filterAtRiskOnly]);

  const atRiskCount = TIMELINE_PROJECTS.filter((p) => p.atRisk).length;

  return (
    <div id="view-timeline" className="flex-1 flex flex-col h-full min-h-0 min-w-0 bg-[#F7F7F8] overflow-hidden select-none text-[#1A1D23]">
      
      {/* 1. Header Toolbar */}
      <div 
        id="timeline-header-bar"
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-3.5 bg-white border-b border-black/[0.04] shrink-0 shadow-2xs z-20"
      >
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-[#1A1D23] tracking-tight">
              Project Timeline & Deadline Collision
            </h1>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full border border-black/[0.04] text-[#6B7280] bg-[#F7F7F8] font-semibold">
              4-Week Horizon · Sep 7 — Oct 4
            </span>
          </div>
          <p className="text-xs text-[#6B7280] font-normal">
            Detecting deliverable deadline overlap and concurrent client presentation collisions.
          </p>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {/* At-risk filter toggle */}
          <button
            onClick={() => setFilterAtRiskOnly(!filterAtRiskOnly)}
            className={`flex items-center gap-1.5 px-3.5 py-2 min-h-[44px] text-xs font-semibold rounded-xl border transition-all duration-200 cursor-pointer active:scale-[0.98] ${
              filterAtRiskOnly
                ? 'bg-red-50 border-red-200 text-red-600 shadow-2xs'
                : 'bg-white border-black/[0.04] text-[#1A1D23] hover:bg-slate-50 shadow-2xs'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>At-Risk Only ({atRiskCount})</span>
          </button>

          {/* Expand/collapse deliverables */}
          <button
            onClick={toggleExpandAll}
            className="px-3.5 py-2 min-h-[44px] text-xs font-semibold rounded-xl border border-black/[0.04] bg-white text-[#6B7280] hover:text-[#1A1D23] hover:bg-slate-50 transition-all duration-200 cursor-pointer shadow-2xs active:scale-[0.98]"
          >
            Toggle Deliverables
          </button>

          {/* Add deliverable (Primary Button: solid blue fill, 12px radius, soft shadow) */}
          <button
            onClick={onOpenCapture}
            className="flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all duration-200 cursor-pointer shadow-[0_2px_8px_rgba(37,99,235,0.25)] active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Deliverable</span>
          </button>
        </div>
      </div>

      {/* 2. Collision Warning Banner */}
      <div 
        id="timeline-collision-banner"
        className="px-6 py-2.5 bg-white border-b border-black/[0.04] flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 z-10"
      >
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0" />
          <span className="font-semibold text-[#1A1D23]">
            Critical Collision Zone Detected:
          </span>
          <span className="text-[#6B7280]">
            Komorebi Tea demo (Mon Sep 14) conflicts within 48h of Sonder Film Co. 4K sign-off (Wed Sep 16).
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-[#6B7280]">
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-2 rounded-full bg-blue-600" />
            <span>Career</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-2 rounded-full bg-[#059669]" />
            <span>Magneto</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-2 rounded-full bg-[#7C3AED]" />
            <span>Shamanicca</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-2 rounded-full bg-[#D97706]" />
            <span>Wellness</span>
          </div>
          <div className="flex items-center gap-1.5 pl-2 border-l border-black/[0.06]">
            <div className="w-[3px] h-3.5 bg-red-600 rounded-full" />
            <span className="text-red-600 font-medium">Collision Tick</span>
          </div>
        </div>
      </div>

      {/* 3. Main Timeline Grid Canvas (Enclosed in a 20px radius card with 24px padding) */}
      <div className="flex-1 p-4 sm:p-6 overflow-hidden flex flex-col min-h-0">
        <div 
          ref={timelineContainerRef}
          id="timeline-grid-container"
          className="flex-1 overflow-x-auto overflow-y-auto bg-white rounded-[20px] shadow-[0_2px_8px_rgba(30,35,50,0.06),0_1px_2px_rgba(30,35,50,0.04)] border border-black/[0.04] flex flex-col relative snap-x snap-mandatory scrollbar-thin"
        >
          <div className="min-w-[1100px] flex-1 flex flex-col">
            
            {/* --- TOP HEADER ROW 1: 4-WEEK BLOCKS --- */}
            <div className="flex items-center h-8 bg-slate-50/80 border-b border-black/[0.05] sticky top-0 z-30 shrink-0 select-none">
              {/* Pinned left column header */}
              <div className="sticky left-0 z-40 w-64 sm:w-72 px-4 h-full flex items-center justify-between bg-slate-50 border-r border-black/[0.05] text-[11px] font-sans font-semibold text-[#6B7280] shrink-0">
                <span>Active Projects ({displayedProjects.length})</span>
                <span className="font-mono tabular-nums text-[11px]">Hours</span>
              </div>

              {/* 4 Week Group Headers */}
              <div className="flex-1 grid grid-cols-4 h-full divide-x divide-black/[0.05]">
                <div className="px-3 flex items-center justify-between text-[11px] font-sans text-[#6B7280]">
                  <span className="font-medium text-[#1A1D23]">Week 1 · Sep 7–13</span>
                  <span className="text-[#9CA3AF] text-[10px]">W37</span>
                </div>
                <div className="px-3 flex items-center justify-between text-[11px] font-sans text-[#6B7280] bg-red-500/[0.04]">
                  <span className="font-medium text-red-600 flex items-center gap-1.5">
                    <span>Week 2 · Sep 14–20</span>
                    <span className="text-[10px] font-sans font-semibold rounded-full px-2 py-0.2 bg-red-100 text-red-700">Collision</span>
                  </span>
                  <span className="text-red-400 text-[10px]">W38</span>
                </div>
                <div className="px-3 flex items-center justify-between text-[11px] font-sans text-[#6B7280]">
                  <span className="font-medium text-[#1A1D23]">Week 3 · Sep 21–27</span>
                  <span className="text-[#9CA3AF] text-[10px]">W39</span>
                </div>
                <div className="px-3 flex items-center justify-between text-[11px] font-sans text-[#6B7280]">
                  <span className="font-medium text-[#1A1D23]">Week 4 · Sep 28–Oct 4</span>
                  <span className="text-[#9CA3AF] text-[10px]">W40</span>
                </div>
              </div>
            </div>

            {/* --- TOP HEADER ROW 2: 28 DAY COLUMNS (Dates in sans, no per-day vertical borders) --- */}
            <div className="flex items-center h-9 bg-white border-b border-black/[0.05] sticky top-8 z-20 shrink-0 select-none">
              {/* Pinned left column subheader */}
              <div className="sticky left-0 z-30 w-64 sm:w-72 px-4 h-full flex items-center justify-between bg-white border-r border-black/[0.05] text-[11px] text-[#6B7280] shrink-0 font-sans">
                <span>Project & Client</span>
                <span className="font-sans text-[11px]">Timeline</span>
              </div>

              {/* 28 Day Columns: Header dates in sans, 12px; day letters in 11px muted */}
              <div className="flex-1 grid grid-cols-28 h-full">
                {TIMELINE_DAYS_28.map((day) => {
                  const isWeekBoundary = day.dayIndex % 7 === 0;
                  return (
                    <div
                      key={day.dayIndex}
                      className={`h-full flex flex-col items-center justify-center transition-colors relative ${
                        isWeekBoundary ? 'border-r border-black/[0.05]' : ''
                      } ${
                        day.isToday
                          ? 'bg-blue-600/[0.06] text-blue-700'
                          : day.isWeekend
                          ? 'text-[#9CA3AF]'
                          : 'text-[#6B7280]'
                      }`}
                      title={`${day.dayName}, ${day.month} ${day.dayOfMonth}`}
                    >
                      <span className="leading-none text-[11px] font-sans font-normal text-[#9CA3AF]">
                        {day.shortDayName}
                      </span>
                      <span className={`leading-tight font-sans text-[12px] ${day.isToday ? 'font-bold text-blue-700' : 'font-medium text-[#1A1D23]'}`}>
                        {day.dayOfMonth}
                      </span>

                      {/* Today soft marker pill on Day 1 */}
                      {day.isToday && (
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-600" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* --- MAIN ROWS (ONE ROW PER ACTIVE PROJECT, 56px ROW HEIGHT) --- */}
            <div className="flex-1 relative">
              
              {/* Background Grid: NO per-day lines! Only 4 week separators (1px rgba(0,0,0,0.05)) + Today soft band */}
              <div className="absolute inset-0 flex pointer-events-none z-0">
                <div className="w-64 sm:w-72 shrink-0 border-r border-black/[0.05]" />
                <div className="flex-1 grid grid-cols-4 h-full relative divide-x divide-black/[0.05]">
                  {/* Week 1 */}
                  <div className="h-full relative">
                    {/* Today soft vertical band: blue at 6% */}
                    <div 
                      style={{ 
                        left: '0%', 
                        width: `${(1 / 7) * 100}%` 
                      }}
                      className="absolute top-0 bottom-0 bg-blue-600/[0.06] z-5 pointer-events-none"
                    />
                  </div>

                  {/* Week 2: Collision Zone soft tint */}
                  <div className="h-full relative bg-red-500/[0.02]">
                    <div 
                      style={{
                        left: `${(0 / 7) * 100}%`,
                        width: `${(3 / 7) * 100}%`,
                      }}
                      className="absolute top-0 bottom-0 bg-red-500/[0.03] border-l border-red-500/15 z-5 pointer-events-none"
                    />
                  </div>

                  {/* Week 3 */}
                  <div className="h-full relative" />

                  {/* Week 4 */}
                  <div className="h-full relative" />
                </div>
              </div>

              {/* Render Each Active Project Row (Row Height: 56px, Alternating Backgrounds) */}
              <div className="relative z-10 flex flex-col">
                {displayedProjects.map((p, idx) => {
                  const isExpanded = expandedProjects[p.id];
                  const clampedStart = Math.max(1, p.startDay);
                  const clampedEnd = Math.min(totalDays, p.endDay);
                  const leftPct = ((clampedStart - 1) / totalDays) * 100;
                  const widthPct = Math.max(((clampedEnd - clampedStart + 1) / totalDays) * 100, 4);

                  // Project's area color configuration
                  const areaStyle = getAreaStyle(undefined, p.name || p.fullName);

                  // Alternating row backgrounds: even rows transparent, odd rows rgba(0,0,0,0.015)
                  const isOddRow = idx % 2 === 1;
                  const rowBgClass = p.atRisk 
                    ? 'bg-red-500/[0.04]' 
                    : isOddRow 
                    ? 'bg-black/[0.015]' 
                    : 'bg-transparent';

                  return (
                    <div key={p.id} className={`flex flex-col border-b border-black/[0.04] ${rowBgClass}`}>
                      {/* PROJECT ROW (56px row height) */}
                      <div 
                        onClick={() => {
                          if (onSelectProject) onSelectProject(p.id);
                          setSelectedItemDetail(p);
                        }}
                        className="flex items-center h-[56px] transition-colors duration-200 cursor-pointer group"
                      >
                        {/* Pinned Left Column (Sans project name 14px, client 12px) */}
                        <div className="sticky left-0 z-20 w-64 sm:w-72 px-4 h-full flex items-center justify-between bg-white group-hover:bg-slate-50/80 border-r border-black/[0.05] shrink-0 transition-colors duration-200 shadow-[1px_0_0_0_rgba(0,0,0,0.04)]">
                          <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                            <button
                              onClick={(e) => toggleExpand(p.id, e)}
                              className="text-[#6B7280] hover:text-[#1A1D23] transition p-1 rounded-lg hover:bg-slate-100 shrink-0 cursor-pointer"
                              title="Toggle deliverables"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                            
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-sans text-[14px] font-semibold text-[#1A1D23] truncate group-hover:text-blue-600 transition-colors">
                                  {p.name}
                                </span>
                                {p.atRisk && (
                                  <span className="rounded-full px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-sans font-semibold tracking-wide uppercase border border-red-200/50 shrink-0">
                                    Collision
                                  </span>
                                )}
                              </div>
                              <span className="font-sans text-[12px] text-[#6B7280] truncate">
                                {p.client}
                              </span>
                            </div>
                          </div>

                          {/* Right side of pinned cell: Duration (hours in mono) */}
                          <div className="flex flex-col items-end shrink-0 pl-1">
                            <span className="font-mono tabular-nums text-[13px] font-semibold text-[#1A1D23]">
                              {p.durationHours}h
                            </span>
                            <span className="font-sans text-[11px] text-[#6B7280]">
                              {p.deadlineDateStr}
                            </span>
                          </div>
                        </div>

                        {/* Timeline Canvas Span Bar for Project (Row Height: 56px, Bar Height: 28px) */}
                        <div className="flex-1 h-full relative flex items-center">
                          {/* Collision Tick (3px wide, full row height, rounded-full) */}
                          {p.atRisk && (
                            <div 
                              style={{
                                left: `${leftPct + widthPct}%`,
                              }}
                              className="absolute top-0 bottom-0 w-[3px] bg-red-600 rounded-full z-20 -translate-x-1/2 pointer-events-none"
                              title={`Collision Deadline: ${p.deadlineDateStr}`}
                            />
                          )}

                          {/* The Bar Pill: 28px height, rounded-full, area color at full saturation */}
                          <div
                            style={{
                              left: `${leftPct}%`,
                              width: `${widthPct}%`,
                            }}
                            className="absolute h-[28px] flex items-center z-10"
                          >
                            <div
                              style={{
                                backgroundColor: areaStyle.hexColor,
                                boxShadow: `0 1px 3px rgba(${areaStyle.rgbValues}, 0.25)`,
                              }}
                              className="h-[28px] w-full rounded-full flex items-center justify-between px-3.5 relative transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer select-none"
                              title={`${p.fullName} — ${p.startDateStr} to ${p.deadlineDateStr} (${p.durationHours}h)`}
                            >
                              {/* Inside the bar: project name in white sans 12px semibold */}
                              <span className="font-sans text-[12px] font-semibold text-white truncate leading-none">
                                {p.name}
                              </span>
                            </div>

                            {/* Outside the bar: Date range and hour estimates in 12px sans, muted gray */}
                            <div className="absolute left-full ml-3 flex items-center gap-1.5 whitespace-nowrap text-[12px] font-sans text-[#6B7280] pointer-events-none">
                              <span>{p.startDateStr} – {p.deadlineDateStr}</span>
                              <span className="text-[#9CA3AF]">·</span>
                              <span className="font-mono tabular-nums font-medium text-[#1A1D23]">
                                {p.durationHours}h
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* SUB-ROWS: Key Deliverables (when project is expanded) */}
                      {isExpanded && (
                        <div className="bg-slate-50/50 divide-y divide-black/[0.03]">
                          {p.deliverables.map((del) => {
                            const dStart = Math.max(1, del.startDay);
                            const dEnd = Math.min(totalDays, del.endDay);
                            const dLeft = ((dStart - 1) / totalDays) * 100;
                            const dWidth = Math.max(((dEnd - dStart + 1) / totalDays) * 100, 2.5);

                            return (
                              <div
                                key={del.id}
                                onClick={() => {
                                  const matchTask = tasks.find(t => 
                                    t.title.toLowerCase().includes(del.title.toLowerCase().slice(0, 15))
                                  );
                                  if (matchTask) onSelectTask(matchTask);
                                }}
                                className="flex items-center h-10 hover:bg-slate-100/70 transition-colors duration-200 cursor-pointer group"
                              >
                                {/* Pinned Left deliverable sub-label */}
                                <div className="sticky left-0 z-20 w-64 sm:w-72 pl-10 pr-4 h-full flex items-center justify-between bg-slate-50/90 group-hover:bg-slate-100/90 border-r border-black/[0.05] shrink-0 transition-colors duration-200 shadow-[1px_0_0_0_rgba(0,0,0,0.04)]">
                                  <span className="font-sans text-[12px] text-[#4B5563] truncate pr-2 group-hover:text-[#1A1D23]">
                                    {del.title}
                                  </span>
                                  <span className="font-mono tabular-nums text-[11px] text-[#9CA3AF] shrink-0">
                                    {del.progress}%
                                  </span>
                                </div>

                                {/* Sub-bar on timeline grid: pill shape, height 18px */}
                                <div className="flex-1 h-full relative flex items-center">
                                  {del.atRisk && (
                                    <div 
                                      style={{ left: `${dLeft + dWidth}%` }}
                                      className="absolute top-0 bottom-0 w-[2px] bg-red-600 rounded-full z-20 -translate-x-1/2"
                                    />
                                  )}

                                  <div
                                    style={{
                                      left: `${dLeft}%`,
                                      width: `${dWidth}%`,
                                    }}
                                    className="absolute h-[18px] flex items-center z-10"
                                  >
                                    <div
                                      style={{
                                        backgroundColor: `${areaStyle.hexColor}25`,
                                        borderColor: areaStyle.hexColor,
                                      }}
                                      className="h-[18px] w-full rounded-full border px-2 flex items-center justify-between relative transition-transform duration-200 hover:-translate-y-0.5"
                                    >
                                      <span className="font-sans text-[11px] font-medium text-[#1A1D23] truncate leading-none">
                                        {del.title}
                                      </span>
                                    </div>

                                    {/* Sub-bar external label */}
                                    <span className="absolute left-full ml-2 text-[11px] font-sans text-[#9CA3AF] whitespace-nowrap">
                                      {del.progress}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Legend & Status Bar (Pills, Not Squares) */}
      <div 
        id="timeline-footer-legend"
        className="h-10 px-6 bg-white border-t border-black/[0.04] flex items-center justify-between text-xs text-[#6B7280] shrink-0 select-none overflow-x-auto z-10"
      >
        <div className="flex items-center gap-3 text-[12px] font-sans">
          <span className="font-medium text-[#1A1D23]">7 Active Projects</span>
          <span className="text-black/[0.1]">·</span>
          <span className="font-mono tabular-nums font-medium text-[#1A1D23]">172h Total Est.</span>
          <span className="text-black/[0.1]">·</span>
          <span className="text-red-600 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-600" />
            <span>2 Deadline Collisions (Sep 14–16)</span>
          </span>
        </div>

        <div className="text-[12px] font-sans text-[#6B7280] hidden sm:block">
          Gantt displays deadline proximity and concurrent client sign-off risk.
        </div>
      </div>

    </div>
  );
};

