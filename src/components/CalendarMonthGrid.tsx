import React, { useMemo } from 'react';
import { Task, ExternalCommitment } from '../types';
import { CALENDAR_ACTIVITIES } from '../data/calendarActivities';
import { TIMELINE_PROJECTS } from '../data/timelineData';
import { getAreaStyle } from '../utils/areaColor';

interface CalendarMonthGridProps {
  currentDate: Date;
  tasks: Task[];
  commitments: ExternalCommitment[];
  onSelectTask: (task: Task) => void;
  onSelectDay: (dayNumber: number, date: Date) => void;
}

interface MonthEventChip {
  id: string;
  title: string;
  area: string;
  projectName?: string;
  isShift: boolean;
  rgbValues: string;
  task: Task;
}

interface MonthCell {
  id: string;
  date: Date;
  dayNumber: number;
  monthIndex: number; // 0-indexed
  year: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  dayOfWeekKey: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export const CalendarMonthGrid: React.FC<CalendarMonthGridProps> = ({
  currentDate,
  tasks,
  commitments,
  onSelectTask,
  onSelectDay,
}) => {
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed (8 = September)

  // 1. Calculate the 35 or 42 cells of the 7-column month grid (Monday start)
  const { cells, numWeeks } = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    // JS getDay(): 0 = Sun, 1 = Mon, ..., 6 = Sat
    // Convert to Monday = 0, ..., Sunday = 6
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
    const weeksCount = totalCells / 7;

    const result: MonthCell[] = [];

    for (let i = 0; i < totalCells; i++) {
      let cellDate: Date;
      let isCurMonth = false;

      if (i < startOffset) {
        // Trailing days from previous month
        const prevDayNum = daysInPrevMonth - startOffset + i + 1;
        cellDate = new Date(currentYear, currentMonth - 1, prevDayNum);
        isCurMonth = false;
      } else if (i < startOffset + daysInMonth) {
        // Days in current month
        const curDayNum = i - startOffset + 1;
        cellDate = new Date(currentYear, currentMonth, curDayNum);
        isCurMonth = true;
      } else {
        // Leading days of next month
        const nextDayNum = i - (startOffset + daysInMonth) + 1;
        cellDate = new Date(currentYear, currentMonth + 1, nextDayNum);
        isCurMonth = false;
      }

      // Today in demo context is Monday, September 7, 2026
      const isToday = 
        cellDate.getFullYear() === 2026 && 
        cellDate.getMonth() === 8 && 
        cellDate.getDate() === 7;

      const dayOfWeekIdx = (cellDate.getDay() + 6) % 7;
      const dayOfWeekKey = DAY_NAMES[dayOfWeekIdx];

      result.push({
        id: `month-cell-${cellDate.getFullYear()}-${cellDate.getMonth()}-${cellDate.getDate()}`,
        date: cellDate,
        dayNumber: cellDate.getDate(),
        monthIndex: cellDate.getMonth(),
        year: cellDate.getFullYear(),
        isCurrentMonth: isCurMonth,
        isToday,
        dayOfWeekKey,
      });
    }

    return { cells: result, numWeeks: weeksCount };
  }, [currentYear, currentMonth]);

  // 2. Build map of events for each day of the month
  const eventsByDayKey = useMemo(() => {
    const map = new Map<string, MonthEventChip[]>();

    // Helper to add chip
    const addChip = (dateStrKey: string, chip: MonthEventChip) => {
      const existing = map.get(dateStrKey) || [];
      if (!existing.some((c) => c.id === chip.id || c.title.toLowerCase() === chip.title.toLowerCase())) {
        existing.push(chip);
        map.set(dateStrKey, existing);
      }
    };

    // A. September 7–13: detailed calendar activities from CALENDAR_ACTIVITIES
    // ROUTINE ITEMS (sleep, meditation, commute, meals) do NOT appear in month view!
    CALENDAR_ACTIVITIES.forEach((act) => {
      const isRoutine = 
        act.category === 'sleep' || 
        act.category === 'routine' || 
        act.category === 'commute' || 
        act.category === 'meal' ||
        (act.category === 'wellness' && (
          act.title.toLowerCase().includes('meditation') ||
          act.title.toLowerCase().includes('yoga') ||
          act.title.toLowerCase().includes('routine')
        ));

      if (isRoutine) return;

      const isShift = act.category === 'shift' || act.title.toLowerCase().includes('starbucks');
      const dateKey = `2026-8-${act.dayNumber}`;

      // Associate with matching Task or synthesize clean Task
      const matchingTask = tasks.find((t) => 
        t.title.toLowerCase() === act.title.toLowerCase() ||
        (act.subtitle && t.projectName.toLowerCase().includes(act.subtitle.toLowerCase()))
      );

      const synthesizedTask: Task = matchingTask || {
        id: `act-task-${act.id}`,
        projectId: isShift ? 'proj-starbucks' : 'proj-activity',
        projectName: isShift ? 'Starbucks' : (act.subtitle?.split('—')[0]?.trim() || 'Work Block'),
        title: act.title,
        description: act.notes || act.subtitle || `${act.startTime} — ${act.endTime} (${act.endMinutes - act.startMinutes}m)`,
        durationMinutes: act.endMinutes - act.startMinutes,
        durationDisplay: `${((act.endMinutes - act.startMinutes) / 60).toFixed(1)}h`,
        column: 'in_progress',
        area: isShift ? 'Magneto' : act.category === 'dev' ? 'Career' : 'Shamanicca',
        priority: isShift ? 'P1' : 'P2',
        energy: act.category === 'deep_work' ? 'Deep' : 'Medium',
        scheduledDay: act.day,
        scheduledStart: act.startTime,
        scheduledEnd: act.endTime,
        subtasks: [
          { id: `st-${act.id}-1`, title: 'Preparation & check-in', completed: true },
          { id: `st-${act.id}-2`, title: 'Execute focus block', completed: false },
        ],
        notes: act.notes || 'Scheduled calendar work block.',
      };

      const style = getAreaStyle(synthesizedTask.area, synthesizedTask.projectName);
      const rgbValues = isShift ? '5, 150, 105' : style.rgbValues;

      addChip(dateKey, {
        id: `chip-act-${act.id}`,
        title: act.title,
        area: synthesizedTask.area,
        projectName: synthesizedTask.projectName,
        isShift,
        rgbValues,
        task: synthesizedTask,
      });
    });

    // B. Scheduled recurring shifts across September (e.g. Mon, Wed, Fri shifts)
    // Shift blocks render first in each cell, with a stronger fill (20%)
    const shiftDaysSeptember = [
      { day: 31, month: 7, title: 'Starbucks — Opening Barista Shift' }, // Aug 31
      { day: 2, month: 8, title: 'Retail Shift — Floor Lead' },         // Sep 2
      { day: 4, month: 8, title: 'Starbucks — Morning Barista Shift' },  // Sep 4
      { day: 14, month: 8, title: 'Starbucks — Opening Barista Shift' }, // Sep 14
      { day: 16, month: 8, title: 'Retail Shift — Mid-Day Lead' },       // Sep 16
      { day: 18, month: 8, title: 'Starbucks — Morning Barista Shift' }, // Sep 18
      { day: 21, month: 8, title: 'Starbucks — Opening Barista Shift' }, // Sep 21
      { day: 23, month: 8, title: 'Retail Shift — Mid-Day Lead' },       // Sep 23
      { day: 25, month: 8, title: 'Starbucks — Morning Barista Shift' }, // Sep 25
      { day: 28, month: 8, title: 'Starbucks — Opening Barista Shift' }, // Sep 28
      { day: 30, month: 8, title: 'Retail Shift — Floor Lead' },         // Sep 30
      { day: 2, month: 9, title: 'Starbucks — Morning Barista Shift' },  // Oct 2
    ];

    shiftDaysSeptember.forEach((s) => {
      const dateKey = `2026-${s.month}-${s.day}`;
      const shiftTask: Task = {
        id: `shift-task-${s.month}-${s.day}`,
        projectId: 'proj-starbucks',
        projectName: 'Starbucks — Work Shift',
        title: s.title,
        description: 'Scheduled retail shift (8h work · 9h door-to-door buffer).',
        durationMinutes: 480,
        durationDisplay: '8h',
        column: 'in_progress',
        area: 'Magneto',
        priority: 'P1',
        energy: 'Medium',
        subtasks: [
          { id: 'st-shift-1', title: 'Open store & verify food delivery', completed: true },
          { id: 'st-shift-2', title: 'Morning service rush', completed: false },
        ],
      };

      addChip(dateKey, {
        id: `chip-shift-${s.month}-${s.day}`,
        title: s.title,
        area: 'Magneto',
        projectName: 'Starbucks',
        isShift: true,
        rgbValues: '5, 150, 105',
        task: shiftTask,
      });
    });

    // C. Tasks from `tasks` with due dates across September
    tasks.forEach((t) => {
      if (!t.dueDate) return;

      let targetDay: number | null = null;
      let targetMonth = 8; // September

      if (t.dueDate.includes('Today')) {
        targetDay = 7;
      } else if (t.dueDate.includes('Sep')) {
        const match = t.dueDate.match(/Sep\s+(\d+)/);
        if (match) targetDay = parseInt(match[1], 10);
      } else if (t.dueDate.includes('Aug')) {
        const match = t.dueDate.match(/Aug\s+(\d+)/);
        if (match) {
          targetDay = parseInt(match[1], 10);
          targetMonth = 7;
        }
      } else if (t.dueDate.includes('Oct')) {
        const match = t.dueDate.match(/Oct\s+(\d+)/);
        if (match) {
          targetDay = parseInt(match[1], 10);
          targetMonth = 9;
        }
      }

      if (targetDay !== null) {
        const dateKey = `2026-${targetMonth}-${targetDay}`;
        const style = getAreaStyle(t.area, t.projectName);
        const isShift = t.projectName.toLowerCase().includes('starbucks') || t.title.toLowerCase().includes('shift');

        addChip(dateKey, {
          id: `chip-task-${t.id}`,
          title: t.title,
          area: t.area,
          projectName: t.projectName,
          isShift,
          rgbValues: isShift ? '5, 150, 105' : style.rgbValues,
          task: t,
        });
      }
    });

    // D. Project milestones & deliverables from TIMELINE_PROJECTS
    TIMELINE_PROJECTS.forEach((proj) => {
      if (proj.deadlineDateStr) {
        const match = proj.deadlineDateStr.match(/(Sep|Oct)\s+(\d+)/);
        if (match) {
          const monthIdx = match[1] === 'Sep' ? 8 : 9;
          const dayNum = parseInt(match[2], 10);
          const dateKey = `2026-${monthIdx}-${dayNum}`;

          const style = getAreaStyle('Career', proj.name);
          const milestoneTask: Task = {
            id: `milestone-${proj.id}`,
            projectId: proj.id,
            projectName: proj.fullName,
            title: `${proj.name} — Target Delivery Deadline`,
            description: `${proj.fullName} client deliverable milestone. Target hours: ${proj.durationHours}h.`,
            durationMinutes: proj.durationHours * 60,
            durationDisplay: `${proj.durationHours}h`,
            column: 'in_progress',
            area: 'Career',
            priority: 'P1',
            energy: 'Deep',
            isMilestone: true,
            dueDate: `${match[1]} ${dayNum}`,
            subtasks: proj.deliverables.map((d) => ({
              id: d.id,
              title: d.title,
              completed: d.progress === 100,
            })),
          };

          addChip(dateKey, {
            id: `chip-milestone-${proj.id}`,
            title: `${proj.name} Delivery`,
            area: 'Career',
            projectName: proj.name,
            isShift: false,
            rgbValues: style.rgbValues,
            task: milestoneTask,
          });
        }
      }
    });

    return map;
  }, [tasks]);

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-hidden min-h-0 w-full select-none">
      <div 
        id="calendar-month-container"
        className="flex-1 bg-white rounded-[20px] border border-black/[0.04] flex flex-col overflow-hidden shadow-[0_2px_8px_rgba(30,35,50,0.06),0_1px_2px_rgba(30,35,50,0.04)] min-h-0"
      >
        {/* Day Column Headers (Mon, Tue, Wed, Thu, Fri, Sat, Sun) */}
        <div className="grid grid-cols-7 border-b border-black/[0.04] bg-white shrink-0 select-none">
          {DAY_NAMES.map((name) => (
            <div
              key={name}
              className="py-2.5 px-3 text-center text-xs font-semibold text-[#6B7280] border-r border-black/[0.04] last:border-r-0"
            >
              {name}
            </div>
          ))}
        </div>

        {/* 7-Column Month Grid with Weeks as Rows (Fills full height) */}
        <div 
          className={`flex-1 grid grid-cols-7 ${
            numWeeks === 5 ? 'grid-rows-5' : 'grid-rows-6'
          } min-h-0 divide-y divide-black/[0.04] bg-white`}
        >
          {cells.map((cell) => {
            const dateKey = `${cell.year}-${cell.monthIndex}-${cell.dayNumber}`;
            const rawChips = eventsByDayKey.get(dateKey) || [];

            // Shift blocks render first in each cell, with a stronger fill (20%)
            const sortedChips = [...rawChips].sort((a, b) => {
              if (a.isShift && !b.isShift) return -1;
              if (!a.isShift && b.isShift) return 1;
              return 0;
            });

            // Up to 3 event chips, then "+N more"
            const displayChips = sortedChips.slice(0, 3);
            const remainingCount = sortedChips.length - 3;

            return (
              <div
                key={cell.id}
                onClick={() => onSelectDay(cell.dayNumber, cell.date)}
                className={`p-1.5 sm:p-2 border-r border-black/[0.04] last:border-r-0 flex flex-col justify-between overflow-hidden cursor-pointer transition-colors hover:bg-slate-50/70 group ${
                  !cell.isCurrentMonth 
                    ? 'opacity-40 bg-slate-50/30' 
                    : cell.isToday 
                    ? 'bg-blue-600/[0.015]' 
                    : ''
                }`}
                title={`Click to view ${cell.dayOfWeekKey} ${cell.date.toLocaleDateString()}`}
              >
                {/* Cell Header: Date Number */}
                <div className="flex items-center justify-between shrink-0 mb-1">
                  {cell.isToday ? (
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold shadow-2xs">
                      {cell.dayNumber}
                    </div>
                  ) : (
                    <span 
                      className={`text-xs font-semibold w-6 h-6 flex items-center justify-center transition-colors ${
                        cell.isCurrentMonth ? 'text-[#1A1D23] group-hover:text-blue-600' : 'text-[#9CA3AF]'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>
                  )}
                </div>

                {/* Event Chips (Up to 3, then +N more) */}
                <div className="flex-1 flex flex-col gap-1 min-h-0 overflow-hidden justify-start">
                  {displayChips.map((chip) => (
                    <div
                      key={chip.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTask(chip.task);
                      }}
                      style={{
                        backgroundColor: chip.isShift
                          ? `rgba(${chip.rgbValues}, 0.20)`
                          : `rgba(${chip.rgbValues}, 0.12)`,
                      }}
                      className="rounded-[8px] border-0 px-2 py-1 text-xs font-sans font-medium text-[#1A1D23] truncate cursor-pointer transition-all duration-150 hover:brightness-95 hover:shadow-2xs active:scale-[0.98] select-none shrink-0"
                      title={`${chip.title} (${chip.projectName || chip.area})`}
                    >
                      {chip.title}
                    </div>
                  ))}

                  {remainingCount > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDay(cell.dayNumber, cell.date);
                      }}
                      className="text-[11px] font-semibold text-[#6B7280] hover:text-blue-600 px-1 py-0.5 text-left cursor-pointer transition-colors truncate"
                    >
                      +{remainingCount} more
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
