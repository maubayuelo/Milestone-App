import React from 'react';
import { TIMELINE_PROJECTS, TIMELINE_DAYS_14, TimelineProject } from '../data/timelineData';
import { ArrowRight, AlertTriangle } from 'lucide-react';
import { getAreaStyle } from '../utils/areaColor';

interface CompactGanttProps {
  onNavigateToTimeline: () => void;
  projects?: TimelineProject[];
}

export const CompactGantt: React.FC<CompactGanttProps> = ({
  onNavigateToTimeline,
  projects = TIMELINE_PROJECTS,
}) => {
  // Sort projects by nearest deadline
  const sortedProjects = [...projects].sort((a, b) => a.endDay - b.endDay);
  
  // Requirement: max 5 projects
  const topProjects = sortedProjects.slice(0, 5);
  const remainingCount = sortedProjects.length - topProjects.length;

  const totalDays = 14;

  return (
    <section id="dashboard-compact-gantt" className="w-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 px-0.5 select-none">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.04em] text-[#9CA3AF]">
            Project Deadlines
          </span>
          <span className="text-[13px] text-[#6B7280]">
            (14-Day Horizon · Sep 7–20)
          </span>
        </div>

        {remainingCount > 0 && (
          <button
            id="btn-compact-gantt-more"
            onClick={onNavigateToTimeline}
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer transition-colors"
          >
            <span>+{remainingCount} more in Timeline</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Main Compact Card: Warm iOS surface */}
      <div 
        id="compact-gantt-card"
        className="bg-white rounded-2xl border border-black/[0.04] overflow-hidden flex flex-col shadow-[0_2px_8px_rgba(30,35,50,0.06),0_1px_2px_rgba(30,35,50,0.04)] select-none w-full"
      >
        <div className="overflow-x-auto scrollbar-none snap-x snap-mandatory flex-1 flex flex-col">
          {/* Calendar Header Row */}
          <div className="flex items-center h-7 bg-slate-50/80 border-b border-black/[0.05] shrink-0 min-w-[640px]">
            {/* Pinned left column header - widened to comfortably fit real project names */}
            <div className="sticky left-0 z-20 w-56 sm:w-64 px-3.5 h-full flex items-center justify-between bg-slate-50 border-r border-black/[0.05] text-[11px] font-sans font-semibold text-[#6B7280] shrink-0">
              <span>Project</span>
              <span className="font-sans text-[11px]">Due</span>
            </div>

            {/* 14 Day Columns Header (Sans-serif, week separator at day 7) */}
            <div className="flex-1 grid grid-cols-14 h-full">
              {TIMELINE_DAYS_14.map((day) => {
                const isWeekSeparator = day.dayIndex === 7;
                return (
                  <div
                    key={day.dayIndex}
                    className={`h-full flex flex-col items-center justify-center text-[10px] ${
                      isWeekSeparator ? 'border-r border-black/[0.06]' : ''
                    } ${
                      day.isToday
                        ? 'bg-blue-600/[0.06] text-blue-700 font-bold'
                        : day.isWeekend
                        ? 'text-[#9CA3AF]'
                        : 'text-[#6B7280]'
                    }`}
                    title={`${day.dayName} ${day.month} ${day.dayOfMonth}`}
                  >
                    <span className="leading-none text-[9px] font-sans text-[#9CA3AF]">
                      {day.shortDayName}
                    </span>
                    <span className="leading-none font-sans text-[11px] font-medium mt-0.5">
                      {day.dayOfMonth}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5 Project Rows (Row Height: 40px, Bar Height: 20px, Pill Shape) */}
          <div className="divide-y divide-black/[0.04] shrink-0 min-w-[640px] relative">
            {topProjects.map((p, idx) => {
              // Calculate horizontal span inside 14-day window
              const clampedStart = Math.max(1, p.startDay);
              const clampedEnd = Math.min(totalDays, p.endDay);
              const leftPct = ((clampedStart - 1) / totalDays) * 100;
              const widthPct = Math.max(((clampedEnd - clampedStart + 1) / totalDays) * 100, 4.5);
              const hasDeadlineInView = p.endDay <= totalDays;
              const areaStyle = getAreaStyle(undefined, p.name || p.fullName);

              const isOddRow = idx % 2 === 1;
              const rowBgClass = p.atRisk 
                ? 'bg-red-500/[0.04]' 
                : isOddRow 
                ? 'bg-black/[0.012]' 
                : 'bg-transparent';

              return (
                <div
                  key={p.id}
                  onClick={onNavigateToTimeline}
                  className={`flex items-center h-[40px] hover:bg-slate-50/70 transition-colors duration-150 cursor-pointer group ${rowBgClass}`}
                  title={`${p.fullName} — ${p.startDateStr} to ${p.deadlineDateStr} (${p.durationHours}h)${p.atRisk ? ' · COLLISION' : ''}`}
                >
                  {/* Pinned Left Label - widened so real project names fit without ellipsis */}
                  <div className="sticky left-0 z-10 w-56 sm:w-64 px-3.5 h-full flex items-center justify-between bg-white group-hover:bg-slate-50/70 border-r border-black/[0.05] shrink-0 transition-colors duration-150">
                    <div className="flex items-center gap-1.5 min-w-0 pr-1.5">
                      <span className="text-[13px] font-semibold text-[#1A1D23] whitespace-nowrap group-hover:text-blue-600 transition-colors">
                        {p.name}
                      </span>
                      {p.atRisk && (
                        <span className="rounded-full px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[9px] font-sans font-semibold tracking-wide uppercase border border-amber-200/50 shrink-0">
                          Collision
                        </span>
                      )}
                    </div>
                    <span className="font-sans text-[11px] text-[#6B7280] shrink-0 whitespace-nowrap">
                      {p.deadlineDateStr}
                    </span>
                  </div>

                  {/* 14-Day Timeline Bar Area (No day gridlines, week separator at col 7) */}
                  <div className="flex-1 h-full relative flex items-center">
                    {/* Week separator line at 50% (Day 7) */}
                    <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-black/[0.05] pointer-events-none" />

                    {/* Today soft marker band */}
                    <div 
                      style={{ left: '0%', width: `${(1 / 14) * 100}%` }}
                      className="absolute top-0 bottom-0 bg-blue-600/[0.05] z-5 pointer-events-none"
                    />

                    {/* Hard vertical tick at deadline (Amber tick 3px wide for collision) */}
                    {hasDeadlineInView && p.atRisk && (
                      <div
                        style={{
                          left: `${leftPct + widthPct}%`,
                        }}
                        className="absolute top-0 bottom-0 w-[3px] bg-amber-500 rounded-full z-20 -translate-x-1/2 pointer-events-none"
                        title={`Deadline Collision: ${p.deadlineDateStr}`}
                      />
                    )}

                    {/* Project Span Bar (20px height, rounded-full pill) */}
                    <div
                      style={{
                        left: `${leftPct}%`,
                        width: `${widthPct}%`,
                      }}
                      className="absolute h-[20px] flex items-center z-10"
                    >
                      <div
                        style={{
                          backgroundColor: areaStyle.hexColor,
                          boxShadow: `0 1px 3px rgba(${areaStyle.rgbValues}, 0.25)`,
                        }}
                        className="h-[20px] w-full rounded-full flex items-center px-2.5 relative transition-transform duration-150 group-hover:-translate-y-0.5"
                      >
                        <span className="font-sans text-[11px] font-semibold text-white truncate leading-none">
                          {p.name}
                        </span>

                        {/* If deadline is beyond Day 14, overflow indicator */}
                        {!hasDeadlineInView && (
                          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 border-t border-r border-white rotate-45 opacity-90" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Caption (Pills, Not Squares) */}
        <div className="h-7 px-4 bg-slate-50/80 border-t border-black/[0.05] flex items-center justify-between text-[11px] text-[#6B7280] shrink-0 select-none">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Collision Risk</span>
            </span>
            <span className="text-black/[0.1]">·</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span>Career</span>
            </span>
            <span className="text-black/[0.1]">·</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#059669]" />
              <span>Magneto</span>
            </span>
          </div>
          <span 
            onClick={onNavigateToTimeline}
            className="hover:underline text-blue-600 cursor-pointer font-medium"
          >
            Open 4-week Timeline →
          </span>
        </div>
      </div>
    </section>
  );
};
