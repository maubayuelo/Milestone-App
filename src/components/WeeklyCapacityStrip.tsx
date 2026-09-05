import React from 'react';
import { ExternalCommitment, Task } from '../types';
import { getAreaStyle } from '../utils/areaColor';

export interface CommittedBlock {
  id: string;
  name: string;
  startTime: string; // e.g. "4:00p", "8:00a", "3:00p"
}

interface DayCapacityData {
  key: string;
  label: string;
  date: string;
  dayNumber: number;
  isToday: boolean;
  hasShift: boolean;
  shiftTitle: string; // e.g. "Starbucks 5:30a–1:15p"
  committedBlocks: CommittedBlock[];
  totalBlocksCount: number;
  freeHours: number;
  committedHours: number;
  deltaMinutes: number;
  deltaText: string;
  isDeficit: boolean;
}

interface WeeklyCapacityStripProps {
  commitments?: ExternalCommitment[];
  tasks?: Task[];
  overageMinutes?: number;
  onSelectDay: (dayKey: string, dayNumber: number) => void;
}

export const WeeklyCapacityStrip: React.FC<WeeklyCapacityStripProps> = ({
  commitments = [],
  tasks = [],
  overageMinutes = 30,
  onSelectDay,
}) => {
  // Baseline configuration for the 7 calendar days (Mon-Sun, Sep 7–13, 2026)
  const daysConfig = [
    { key: 'Mon', label: 'Mon', date: 'Sep 7', dayNumber: 7, isToday: true },
    { key: 'Tue', label: 'Tue', date: 'Sep 8', dayNumber: 8, isToday: false },
    { key: 'Wed', label: 'Wed', date: 'Sep 9', dayNumber: 9, isToday: false },
    { key: 'Thu', label: 'Thu', date: 'Sep 10', dayNumber: 10, isToday: false },
    { key: 'Fri', label: 'Fri', date: 'Sep 11', dayNumber: 11, isToday: false },
    { key: 'Sat', label: 'Sat', date: 'Sep 12', dayNumber: 12, isToday: false },
    { key: 'Sun', label: 'Sun', date: 'Sep 13', dayNumber: 13, isToday: false },
  ];

  // Derive per-day data with named real blocks (filtered of routine/recovery items)
  const daysData: DayCapacityData[] = daysConfig.map((cfg) => {
    // Check if custom external commitments exist for this day
    const dayCommitments = commitments.filter((c) => c.day === cfg.key);
    const externalShift = dayCommitments.find(
      (c) => c.title.toLowerCase().includes('shift') || c.subline?.toLowerCase().includes('westport')
    );

    let hasShift = true;
    let shiftTitle = 'Starbucks 5:30a–1:15p';
    let freeHours = 5.0;
    let committedHours = 5.0;
    let deltaMinutes = 0;
    let rawBlocks: CommittedBlock[] = [];

    if (cfg.key === 'Mon') {
      hasShift = true;
      shiftTitle = externalShift ? `${externalShift.subline || 'Shift'} ${externalShift.startTime || '5:30a'}` : 'Starbucks 5:30a–1:15p';
      freeHours = 5.0;
      // Connects directly to overageMinutes prop from Today view
      const deficit = overageMinutes > 0;
      committedHours = deficit ? 5.0 + overageMinutes / 60 : 4.75;
      deltaMinutes = -overageMinutes;
      rawBlocks = [
        { id: 'mon-b1', name: 'Frontend Dev', startTime: '3:00p' },
        { id: 'mon-b2', name: 'Magneto', startTime: '4:00p' },
        { id: 'mon-b3', name: 'Sonder WebGL', startTime: '5:30p' },
      ];
    } else if (cfg.key === 'Tue') {
      hasShift = true;
      shiftTitle = 'Starbucks 5:30a–1:15p';
      freeHours = 5.0;
      committedHours = 3.5;
      deltaMinutes = 90; // +1.5h
      rawBlocks = [
        { id: 'tue-b1', name: 'Frontend Dev', startTime: '3:00p' },
        { id: 'tue-b2', name: 'Job Search', startTime: '4:00p' },
        { id: 'tue-b3', name: 'Magneto', startTime: '5:00p' },
      ];
    } else if (cfg.key === 'Wed') {
      hasShift = true;
      shiftTitle = 'Starbucks 5:30a–1:15p';
      freeHours = 4.0;
      committedHours = 4.0;
      deltaMinutes = 0;
      rawBlocks = [
        { id: 'wed-b1', name: 'Frontend Dev', startTime: '3:00p' },
        { id: 'wed-b2', name: 'Job Search', startTime: '4:00p' },
        { id: 'wed-b3', name: 'Magneto', startTime: '5:00p' },
      ];
    } else if (cfg.key === 'Thu') {
      hasShift = true;
      shiftTitle = 'Starbucks 5:30a–1:15p';
      freeHours = 5.0;
      committedHours = 4.0;
      deltaMinutes = 60; // +1.0h
      rawBlocks = [
        { id: 'thu-b1', name: 'Frontend Dev', startTime: '3:00p' },
        { id: 'thu-b2', name: 'Magneto', startTime: '4:00p' },
        { id: 'thu-b3', name: 'Shamanicca', startTime: '5:30p' },
      ];
    } else if (cfg.key === 'Fri') {
      hasShift = true;
      shiftTitle = 'Starbucks 5:30a–1:15p';
      freeHours = 3.5;
      committedHours = 4.5;
      deltaMinutes = -60; // -1.0h deficit
      // Explicitly shows why Friday is in deficit: 4 real blocks scheduled in a 3.5h window
      rawBlocks = [
        { id: 'fri-b1', name: 'Frontend Dev', startTime: '3:00p' },
        { id: 'fri-b2', name: 'Magneto', startTime: '4:00p' },
        { id: 'fri-b3', name: 'Komorebi Demo', startTime: '5:30p' },
        { id: 'fri-b4', name: 'Sonder QA', startTime: '6:45p' },
      ];
    } else if (cfg.key === 'Sat') {
      hasShift = false;
      shiftTitle = 'No shift';
      freeHours = 7.0;
      committedHours = 4.0;
      deltaMinutes = 180; // +3.0h
      rawBlocks = [
        { id: 'sat-b1', name: 'Magneto Sprint', startTime: '4:30a' },
        { id: 'sat-b2', name: 'Shamanicca Audio', startTime: '8:00a' },
        { id: 'sat-b3', name: 'Groceries', startTime: '12:30p' },
      ];
    } else if (cfg.key === 'Sun') {
      hasShift = false;
      shiftTitle = 'No shift';
      freeHours = 4.5;
      committedHours = 3.5;
      deltaMinutes = 60; // +1.0h
      rawBlocks = [
        { id: 'sun-b1', name: 'Family & Friends', startTime: '10:00a' },
        { id: 'sun-b2', name: 'Weekly Review', startTime: '5:00p' },
        { id: 'sun-b3', name: 'Sprint Planning', startTime: '6:30p' },
      ];
    }

    const isDeficit = deltaMinutes < 0;
    let deltaText = '0m';
    if (deltaMinutes < 0) {
      const absMin = Math.abs(deltaMinutes);
      deltaText = absMin >= 60 ? `-${(absMin / 60).toFixed(1)}h` : `-${absMin}m`;
    } else if (deltaMinutes > 0) {
      deltaText = deltaMinutes >= 60 ? `+${(deltaMinutes / 60).toFixed(1)}h` : `+${deltaMinutes}m`;
    }

    return {
      key: cfg.key,
      label: cfg.label,
      date: cfg.date,
      dayNumber: cfg.dayNumber,
      isToday: cfg.isToday,
      hasShift,
      shiftTitle,
      committedBlocks: rawBlocks.slice(0, 3), // up to 3 blocks displayed
      totalBlocksCount: rawBlocks.length,
      freeHours,
      committedHours,
      deltaMinutes,
      deltaText,
      isDeficit,
    };
  });

  return (
    <nav
      aria-label="Weekly capacity orientation with named blocks"
      id="weekly-capacity-strip"
      className="w-full shrink-0 select-none"
    >
      {/* 
        FIX 2 (REVISED) SPECIFICATION:
        - Height: ~180px (up from 110px — names need room)
        - Mobile: horizontal scroll with snap, column min-width 128px. Labels stay legible; never shrink below 12px.
        - Desktop: 7-column equal grid
      */}
      <div 
        className="w-full flex md:grid md:grid-cols-7 gap-2 overflow-x-auto snap-x snap-mandatory pb-1 md:pb-0 scrollbar-none"
      >
        {daysData.map((day) => {
          const hasMoreBlocks = day.totalBlocksCount > 3;
          const moreCount = day.totalBlocksCount - 3;

          return (
            <button
              key={day.key}
              type="button"
              onClick={() => onSelectDay(day.key, day.dayNumber)}
              title={`View ${day.label} (${day.date}) in calendar`}
              className={`min-w-[128px] md:min-w-0 flex-1 snap-start h-[180px] rounded-2xl p-3 flex flex-col justify-between text-left transition-all duration-200 cursor-pointer active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none shadow-[0_2px_8px_rgba(30,35,50,0.06),0_1px_2px_rgba(30,35,50,0.04)] ${
                day.isToday
                  ? 'border-2 border-blue-600 bg-white ring-2 ring-blue-100/50'
                  : 'border border-black/[0.04] hover:border-slate-300 bg-white'
              }`}
            >
              {/* TOP: Day label + date (sans, 12px) */}
              <div className="flex items-baseline justify-between w-full leading-none shrink-0 mb-1.5">
                <span 
                  className={`text-[12px] font-sans ${
                    day.isToday ? 'text-blue-600 font-bold' : 'text-slate-600 font-medium'
                  }`}
                >
                  {day.label}
                </span>
                <span className="text-[12px] font-sans text-slate-400">
                  {day.date}
                </span>
              </div>

              {/* MIDDLE STACK: Shift block + up to 3 committed blocks (20px each, 4px gaps, 13px sans) */}
              <div className="flex-1 flex flex-col gap-1 w-full min-h-0">
                {/* 1. The shift block, named with its time: "Starbucks 5:30a–1:15p" (solid fill — anchor) */}
                {day.hasShift ? (
                  <div 
                    className="h-[20px] bg-slate-800 text-white rounded-[4px] px-1.5 flex items-center shrink-0 leading-none"
                    title={day.shiftTitle}
                  >
                    <span className="text-[12px] font-sans font-medium truncate whitespace-nowrap">
                      {day.shiftTitle}
                    </span>
                  </div>
                ) : (
                  <div 
                    className="h-[20px] bg-slate-100/60 text-slate-400 rounded-[4px] px-1.5 flex items-center shrink-0 leading-none"
                    title="No retail shift"
                  >
                    <span className="text-[11px] font-sans italic truncate whitespace-nowrap">
                      {day.shiftTitle}
                    </span>
                  </div>
                )}

                {/* 2. Up to 3 committed blocks below it, each showing circular area dot, NAME + start time */}
                {day.committedBlocks.map((block) => {
                  const blockStyle = getAreaStyle(block.name);
                  return (
                    <div
                      key={block.id}
                      style={{
                        backgroundColor: `rgba(${blockStyle.rgbValues}, 0.12)`,
                      }}
                      className="h-[20px] hover:opacity-90 transition-opacity rounded-[4px] px-1.5 flex items-center justify-between shrink-0 leading-none"
                      title={`${block.name} at ${block.startTime}`}
                    >
                      <div className="flex items-center gap-1 min-w-0 pr-1">
                        <span 
                          className="w-1.5 h-1.5 rounded-full shrink-0" 
                          style={{ backgroundColor: blockStyle.hexColor }}
                        />
                        <span className="text-[12px] font-sans text-slate-800 truncate font-medium whitespace-nowrap">
                          {block.name}
                        </span>
                      </div>
                      <span className="font-mono tabular-nums text-[10px] text-slate-500 shrink-0 whitespace-nowrap">
                        {block.startTime}
                      </span>
                    </div>
                  );
                })}

                {/* 3. If more than 3, a muted "+N more" */}
                {hasMoreBlocks && (
                  <div className="h-[20px] px-1.5 flex items-center shrink-0 leading-none">
                    <span className="text-[11px] font-sans text-slate-400 font-medium whitespace-nowrap">
                      +{moreCount} more
                    </span>
                  </div>
                )}
              </div>

              {/* BOTTOM: Free-window total and delta (mono, tabular-nums, deficit in red) */}
              <div className="flex items-center justify-between w-full leading-none pt-1.5 shrink-0 border-t border-slate-100">
                <span className="font-mono tabular-nums text-[11px] text-slate-400 truncate">
                  {day.freeHours.toFixed(1)}h free
                </span>
                <span
                  className={`font-mono tabular-nums text-[11px] font-semibold ${
                    day.isDeficit ? 'text-red-600' : day.deltaMinutes > 0 ? 'text-emerald-700' : 'text-slate-500'
                  }`}
                >
                  {day.deltaText}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
