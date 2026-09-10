import React, { useState, useMemo, useCallback } from 'react';
import { Task } from '../types';
import { AreaBadge } from './AreaBadge';
import { Pin, ArrowUpRight, Play, CheckCircle2 } from 'lucide-react';

interface NextUpCardProps {
  tasks: Task[];
  currentBlockId: string;
  remainingFreeMinutes: number;
  onSelectTask: (task: Task) => void;
  onStartTask: (task: Task) => void;
  onOpenBoard: () => void;
}

export const NextUpCard: React.FC<NextUpCardProps> = ({
  tasks,
  currentBlockId,
  remainingFreeMinutes,
  onSelectTask,
  onStartTask,
  onOpenBoard,
}) => {
  const [sortMode, setSortMode] = useState<'due' | 'shortest'>('due');
  const [pinnedTaskId, setPinnedTaskId] = useState<string | null>(null);
  const [exitingTaskId, setExitingTaskId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<boolean>(false);

  // Filter for ready tasks: status === 'queued' and no unresolved blockedBy (strictly deduplicated)
  const readyTasks = useMemo(() => {
    const seen = new Set<string>();
    const result: Task[] = [];

    for (const t of tasks) {
      if (!t || !t.id || seen.has(t.id)) continue;
      if (t.id === currentBlockId) continue;
      if (t.column === 'done' || t.status === 'done' || t.column === 'in_progress') continue;

      // Status check: must be queued (or fallback to queued/todo/next-up if status unset)
      const isQueued =
        t.status === 'queued' ||
        (!t.status && (t.column === 'queued' || t.column === 'todo' || t.column === 'next-up'));
      if (!isQueued) continue;

      // Unresolved blockedBy check
      if (t.blockedBy) {
        const blockers = Array.isArray(t.blockedBy) ? t.blockedBy : [t.blockedBy];
        const hasUnresolved = blockers.some((bId) => {
          const blockerTask = tasks.find((item) => item.id === bId);
          return blockerTask && blockerTask.column !== 'done' && blockerTask.status !== 'done';
        });
        if (hasUnresolved) continue;
      }

      seen.add(t.id);
      result.push(t);
    }
    return result;
  }, [tasks, currentBlockId]);

  // Sort logic: pinned item always at top; then either dueAt ascending or estimateMinutes ascending
  const sortedTasks = useMemo(() => {
    const list = [...readyTasks];

    list.sort((a, b) => {
      const isAPinned = a.id === pinnedTaskId || !!a.pinned;
      const isBPinned = b.id === pinnedTaskId || !!b.pinned;
      if (isAPinned && !isBPinned) return -1;
      if (!isAPinned && isBPinned) return 1;

      if (sortMode === 'due') {
        const dueA = a.dueAt ? new Date(a.dueAt).getTime() : 9999999999999;
        const dueB = b.dueAt ? new Date(b.dueAt).getTime() : 9999999999999;
        if (dueA !== dueB) return dueA - dueB;
        const estA = a.estimateMinutes ?? a.durationMinutes ?? 0;
        const estB = b.estimateMinutes ?? b.durationMinutes ?? 0;
        return estA - estB;
      } else {
        const estA = a.estimateMinutes ?? a.durationMinutes ?? 0;
        const estB = b.estimateMinutes ?? b.durationMinutes ?? 0;
        if (estA !== estB) return estA - estB;
        const dueA = a.dueAt ? new Date(a.dueAt).getTime() : 9999999999999;
        const dueB = b.dueAt ? new Date(b.dueAt).getTime() : 9999999999999;
        return dueA - dueB;
      }
    });

    return list;
  }, [readyTasks, sortMode, pinnedTaskId]);

  // Compute the capacity cut index ONCE — enforces invariant: at most ONE divider in the list
  const cutIndex = useMemo(() => {
    let running = 0;
    for (let i = 0; i < sortedTasks.length; i++) {
      const est = sortedTasks[i].estimateMinutes ?? sortedTasks[i].durationMinutes ?? 0;
      running += est;
      if (running > remainingFreeMinutes) {
        return i; // Divider is inserted immediately before this index
      }
    }
    return -1; // Everything fits today
  }, [sortedTasks, remainingFreeMinutes]);

  const itemsWithCapacity = useMemo(() => {
    return sortedTasks.map((t, index) => {
      const est = t.estimateMinutes ?? t.durationMinutes ?? 0;
      const exceeds = cutIndex !== -1 && index >= cutIndex;
      const showDividerBefore = cutIndex !== -1 && index === cutIndex;
      return {
        task: t,
        estimate: est,
        exceeds,
        showDividerBefore,
      };
    });
  }, [sortedTasks, cutIndex]);

  // Footer recount excluding any currently exiting task
  const activeTasks = useMemo(() => {
    return sortedTasks.filter((t) => t.id !== exitingTaskId);
  }, [sortedTasks, exitingTaskId]);

  const totalReadyCount = activeTasks.length;
  const totalMinutes = useMemo(() => {
    return activeTasks.reduce((acc, t) => acc + (t.estimateMinutes ?? t.durationMinutes ?? 0), 0);
  }, [activeTasks]);

  // Handle task start with 200-250ms row exit animation
  const handleStartTask = useCallback(
    (task: Task, e?: React.MouseEvent) => {
      e?.stopPropagation();
      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (prefersReduced) {
        onStartTask(task);
        return;
      }

      setExitingTaskId(task.id);
      setTimeout(() => {
        setExitingTaskId(null);
        onStartTask(task);
      }, 220);
    },
    [onStartTask]
  );

  const togglePin = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinnedTaskId((prev) => (prev === taskId ? null : taskId));
  };

  const toggleSort = () => {
    setSortMode((prev) => (prev === 'due' ? 'shortest' : 'due'));
  };

  // Expand-in-place: Default 4 rows, expand to show all without internal scroller
  const visibleItems = expanded ? itemsWithCapacity : itemsWithCapacity.slice(0, 4);

  return (
    <div
      id="dashboard-next-up-card"
      className="bg-white rounded-2xl border border-black/[0.06] shadow-sm flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-black/[0.05] flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-semibold tracking-[0.04em] text-[#9CA3AF]">
            Next Up · Queued
          </span>
          <span className="text-xs font-mono text-slate-400">({totalReadyCount})</span>
        </div>

        {/* Clickable sort label */}
        <button
          type="button"
          onClick={toggleSort}
          className="text-xs text-slate-500 hover:text-blue-600 transition-colors cursor-pointer flex items-center gap-1 font-medium select-none"
          title="Click to toggle sorting"
          aria-label={`Sorted ${sortMode === 'due' ? 'by due date' : 'shortest first'}. Click to toggle`}
        >
          <span className="text-[11px] text-slate-400">sort:</span>
          <span className="underline decoration-slate-300 underline-offset-2">
            {sortMode === 'due' ? 'by due date' : 'shortest first'}
          </span>
        </button>
      </div>

      {/* List Container */}
      {sortedTasks.length === 0 ? (
        <div className="p-6 text-center text-sm text-slate-500">
          <p className="mb-2">Nothing queued. Everything scheduled is on the timeline.</p>
          <button
            onClick={onOpenBoard}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
          >
            Open board <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <>
          <div
            role="list"
            aria-label="Queued tasks"
            className="w-full divide-y divide-black/[0.04]"
          >
            {visibleItems.map(({ task, estimate, exceeds, showDividerBefore }) => {
              const isPinned = task.id === pinnedTaskId || (!pinnedTaskId && !!task.pinned);
              const isExiting = task.id === exitingTaskId;

              return (
                <React.Fragment key={task.id}>
                  {/* Capacity cut line */}
                  {showDividerBefore && (
                    <div
                      role="separator"
                      className="px-4 py-1.5 bg-amber-500/[0.07] border-y border-amber-500/20 flex items-center justify-between text-[11px] font-medium text-amber-800 tracking-wide select-none"
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span>doesn't fit today</span>
                      </span>
                      <span className="font-mono text-[10px] text-amber-700/80">
                        after {remainingFreeMinutes}m free window
                      </span>
                    </div>
                  )}

                  {/* Task Row */}
                  <div
                    role="listitem"
                    tabIndex={0}
                    onClick={() => onSelectTask(task)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        onSelectTask(task);
                      } else if (e.key === ' ') {
                        e.preventDefault();
                        handleStartTask(task);
                      }
                    }}
                    onFocus={(e) => {
                      e.currentTarget.scrollIntoView({ block: 'nearest' });
                    }}
                    style={{
                      transition: 'opacity 220ms ease, transform 220ms ease, max-height 220ms ease',
                      transform: isExiting ? 'translateX(24px)' : 'translateX(0)',
                      opacity: isExiting ? 0 : exceeds ? 0.6 : 1,
                    }}
                    className={`group relative flex items-center justify-between gap-3 px-4 py-2.5 min-h-[58px] hover:bg-slate-50/90 cursor-pointer focus:outline-none focus:bg-blue-50/50 transition-colors ${
                      isPinned ? 'bg-amber-500/[0.03]' : ''
                    }`}
                  >
                    {/* Left: Tag + Title */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Area badge chip */}
                      <div className="shrink-0">
                        <AreaBadge area={task.area} size="sm" />
                      </div>

                      {/* Task title (clamps to 2 lines, never 1) */}
                      <span
                        title={task.title}
                        className="text-xs font-medium text-[#1A1D23] line-clamp-2 leading-tight select-none group-hover:text-blue-600 transition-colors"
                      >
                        {task.title}
                      </span>
                    </div>

                    {/* Right: Duration + Actions */}
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {/* Duration (right-aligned, monospace) */}
                      <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                        {task.durationDisplay || `${estimate}m`}
                      </span>

                      {/* Pin button */}
                      <button
                        type="button"
                        onClick={(e) => togglePin(task.id, e)}
                        title={isPinned ? 'Unpin task' : 'Pin task to top'}
                        aria-label={isPinned ? 'Unpin task' : 'Pin task to top'}
                        className={`p-1 rounded-md transition-opacity ${
                          isPinned
                            ? 'text-amber-600 opacity-100 hover:bg-amber-100'
                            : 'text-slate-400 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-slate-200/60'
                        }`}
                      >
                        <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-current' : ''}`} />
                      </button>

                      {/* Ghost "Start" button */}
                      <button
                        type="button"
                        onClick={(e) => handleStartTask(task, e)}
                        title="Start task now"
                        aria-label={`Start task: ${task.title}`}
                        className="px-2 py-1 rounded-md text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-600 hover:text-white transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 flex items-center gap-1 shadow-xs"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Start</span>
                      </button>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          {/* Expand in place toggle (Desktop & Mobile) */}
          {itemsWithCapacity.length > 4 && (
            <div className="p-2 bg-slate-50/50 border-t border-black/[0.04] text-center shrink-0">
              <button
                type="button"
                id="btn-next-up-toggle"
                onClick={() => setExpanded((prev) => !prev)}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 py-1 px-3 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
              >
                {expanded
                  ? 'Show less'
                  : `Show all (${itemsWithCapacity.length})`}
              </button>
            </div>
          )}
        </>
      )}

      {/* Sticky Footer */}
      <div className="px-4 py-2.5 bg-slate-50/90 border-t border-black/[0.05] flex items-center justify-between text-xs select-none shrink-0">
        <span
          aria-live="polite"
          className="text-slate-600 font-medium font-mono text-[11px] tracking-tight"
        >
          {totalReadyCount} ready · {totalMinutes}m
        </span>

        <button
          type="button"
          onClick={onOpenBoard}
          className="font-semibold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1 transition-colors"
        >
          Open board <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
