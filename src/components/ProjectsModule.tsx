import React, { useState, useMemo } from 'react';
import { Project, Task, AtRiskItem, ProjectStanding } from '../types';
import { CompactGantt } from './CompactGantt';
import { getAreaStyle } from '../utils/areaColor';
import { Clock, AlertTriangle, CheckCircle2, ShieldAlert, ArrowUpRight } from 'lucide-react';

interface ProjectsModuleProps {
  projects: Project[];
  tasks: Task[];
  atRiskItems: AtRiskItem[];
  onOpenBoardForProject: (projectId: string) => void;
  onNavigateToTimeline?: () => void;
  onEditProject?: (project: Project) => void;
  onUpdateProject?: (updated: Project) => void;
}

export const ProjectsModule: React.FC<ProjectsModuleProps> = ({
  projects,
  tasks,
  atRiskItems,
  onOpenBoardForProject,
  onNavigateToTimeline,
  onEditProject,
  onUpdateProject,
}) => {
  const [activeView, setActiveView] = useState<'standing' | 'timeline'>('standing');
  const [expanded, setExpanded] = useState<boolean>(false);
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlineEditingName, setInlineEditingName] = useState<string>('');

  // Derive ProjectStanding for all active projects
  const standings: ProjectStanding[] = useMemo(() => {
    const activeProjects = projects.filter((p) => !p.isClosed);
    const now = new Date('2026-09-09T16:21:00-07:00').getTime();

    return activeProjects.map((project) => {
      // Find tasks related to this project
      const projectTasks = tasks.filter(
        (t) =>
          t.projectId === project.id ||
          (t.projectName && t.projectName.toLowerCase().includes(project.name.toLowerCase()))
      );

      const hasNoLinkedTasks = projectTasks.length === 0;

      // Tasks completed vs committed computed strictly from its own tasks
      const completedTasks = projectTasks.filter(
        (t) => t.column === 'done' || t.status === 'done'
      );
      const completedMinutes = completedTasks.reduce(
        (acc, t) => acc + (t.estimateMinutes ?? t.durationMinutes ?? 0),
        0
      );
      let committedMinutes = projectTasks.reduce(
        (acc, t) => acc + (t.estimateMinutes ?? t.durationMinutes ?? 0),
        0
      );

      // Match with atRiskItems if present
      const riskItem = atRiskItems.find(
        (r) =>
          r.projectName.toLowerCase().includes(project.name.toLowerCase()) ||
          project.name.toLowerCase().includes(r.projectName.toLowerCase())
      );

      if (riskItem) {
        committedMinutes = Math.max(committedMinutes, Math.round(riskItem.hoursNeeded * 60));
      }

      const progress = committedMinutes > 0 ? Math.min(1, completedMinutes / committedMinutes) : 0;

      // Find next ready task
      const nextTask =
        projectTasks.find((t) => {
          if (t.column === 'done' || t.status === 'done') return false;
          if (t.blockedBy) {
            const blockers = Array.isArray(t.blockedBy) ? t.blockedBy : [t.blockedBy];
            const hasUnresolved = blockers.some((bId) => {
              const bTask = tasks.find((item) => item.id === bId);
              return bTask && bTask.column !== 'done' && bTask.status !== 'done';
            });
            if (hasUnresolved) return false;
          }
          return true;
        }) || null;

      // Dates & pace
      const startTime = project.startAt
        ? new Date(project.startAt).getTime()
        : now - 8 * 86400000;
      const dueTime = project.dueAt
        ? new Date(project.dueAt).getTime()
        : now + 6 * 86400000;

      const daysRemaining = Math.max(0, Math.ceil((dueTime - now) / (1000 * 60 * 60 * 24)));
      const totalSpan = Math.max(1, dueTime - startTime);
      const elapsed = Math.max(0, now - startTime);
      const expectedProgress = Math.min(1, Math.max(0, elapsed / totalSpan));

      const expectedMinutes = expectedProgress * committedMinutes;
      const paceDeltaMinutes = Math.round(completedMinutes - expectedMinutes);

      // Available before due
      const availableBeforeDue = riskItem
        ? Math.round(riskItem.hoursAvailable * 60)
        : daysRemaining * 150; // ~2.5h per day average capacity

      // Status rule per spec:
      // When zero linked tasks → 'noTasksLinked' (never Blocked!)
      // remaining = committedMinutes - completedMinutes
      // blocked  → nextReadyTask === null && remaining > 0
      // atRisk   → availableBeforeDue < remaining
      // onTrack  → otherwise
      let risk: 'onTrack' | 'atRisk' | 'blocked' | 'noTasksLinked' = 'onTrack';
      if (hasNoLinkedTasks) {
        risk = 'noTasksLinked';
      } else {
        const remaining = committedMinutes - completedMinutes;
        if (nextTask === null && remaining > 0) {
          risk = 'blocked';
        } else if (availableBeforeDue < remaining) {
          risk = 'atRisk';
        } else {
          risk = 'onTrack';
        }
      }

      return {
        project,
        committedMinutes,
        completedMinutes,
        progress,
        nextTask,
        daysRemaining,
        availableBeforeDue,
        risk,
        expectedProgress,
        paceDeltaMinutes,
        hasNoLinkedTasks,
      };
    });
  }, [projects, tasks, atRiskItems]);

  // Sort per spec: blocked, then atRisk, then onTrack, then noTasksLinked; within each group by dueAt ascending
  const sortedStandings = useMemo(() => {
    const riskPriority: Record<'blocked' | 'atRisk' | 'onTrack' | 'noTasksLinked', number> = {
      blocked: 0,
      atRisk: 1,
      onTrack: 2,
      noTasksLinked: 3,
    };

    return [...standings].sort((a, b) => {
      if (riskPriority[a.risk] !== riskPriority[b.risk]) {
        return riskPriority[a.risk] - riskPriority[b.risk];
      }
      const dueA = a.project.dueAt ? new Date(a.project.dueAt).getTime() : 9999999999999;
      const dueB = b.project.dueAt ? new Date(b.project.dueAt).getTime() : 9999999999999;
      return dueA - dueB;
    });
  }, [standings]);

  const handleRowClick = (standing: ProjectStanding) => {
    if (inlineEditingId) return; // Ignore row click if currently renaming inline

    // Clicking a project row opens the edit side sheet per Fix 3
    if (onEditProject) {
      onEditProject(standing.project);
      return;
    }

    // Otherwise navigates to the Board filtered by that project
    onOpenBoardForProject(standing.project.id);
  };

  // Expand-in-place: Default 5 rows, expand to show all
  const visibleStandings = expanded ? sortedStandings : sortedStandings.slice(0, 5);

  const mobileVisibleCount = 4;
  const hasMoreMobile = sortedStandings.length > mobileVisibleCount;

  return (
    <section id="dashboard-projects-module" className="w-full">
      {/* Header with Segmented Control */}
      <div className="flex items-center justify-between mb-2 px-0.5">
        <span className="text-xs uppercase font-semibold tracking-[0.04em] text-[#9CA3AF]">
          Projects
        </span>

        {/* Segmented Control: Standing (default) / Timeline */}
        <div
          role="tablist"
          aria-label="Projects view mode"
          className="inline-flex items-center p-0.5 rounded-lg bg-slate-100/90 border border-black/[0.04] text-xs font-medium"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeView === 'standing'}
            onClick={() => setActiveView('standing')}
            className={`px-3 py-1 rounded-md transition-all select-none cursor-pointer ${
              activeView === 'standing'
                ? 'bg-white text-[#1A1D23] shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Standing
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeView === 'timeline'}
            onClick={() => setActiveView('timeline')}
            className={`px-3 py-1 rounded-md transition-all select-none cursor-pointer ${
              activeView === 'timeline'
                ? 'bg-white text-[#1A1D23] shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Timeline
          </button>
        </div>
      </div>

      {/* Main View Container */}
      {activeView === 'timeline' ? (
        <CompactGantt onNavigateToTimeline={onNavigateToTimeline} />
      ) : (
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden flex flex-col">
          {sortedStandings.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No active projects. Add one to start tracking hours.
            </div>
          ) : (
            <>
              {/* List Container without internal scrolling: renders visibleStandings, grows page */}
              <div
                role="list"
                aria-label="Projects standing list"
                className="w-full divide-y divide-black/[0.04]"
              >
                {visibleStandings.map((standing) => {
                  const {
                    project,
                    progress,
                    committedMinutes,
                    completedMinutes,
                    nextTask,
                    daysRemaining,
                    risk,
                    expectedProgress,
                    paceDeltaMinutes,
                    hasNoLinkedTasks,
                  } = standing;

                  const areaStyle = getAreaStyle(undefined, project.name);

                  // Pace gap label in HOURS, never percentage points
                  let paceLabel = 'on pace';
                  let paceClass = 'text-slate-700 font-semibold';
                  if (paceDeltaMinutes < -30) {
                    const hoursBehind = Math.max(1, Math.round(Math.abs(paceDeltaMinutes) / 60));
                    paceLabel = `${hoursBehind}h behind`;
                    paceClass = 'text-amber-700 font-semibold';
                  } else if (paceDeltaMinutes > 30) {
                    const hoursSlack = Math.max(1, Math.round(paceDeltaMinutes / 60));
                    paceLabel = `${hoursSlack}h of slack`;
                    paceClass = 'text-emerald-700 font-semibold';
                  }

                  // Due date format
                  const dueStr = project.dueAt
                    ? new Date(project.dueAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'Sep 20';

                  const committedHours = (committedMinutes / 60).toFixed(1).replace('.0', '');
                  const completedHours = (completedMinutes / 60).toFixed(1).replace('.0', '');

                  return (
                    <div
                      key={project.id}
                      role="listitem"
                      tabIndex={0}
                      onClick={() => handleRowClick(standing)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleRowClick(standing);
                        }
                      }}
                      onFocus={(e) => {
                        e.currentTarget.scrollIntoView({ block: 'nearest' });
                      }}
                      className="group p-3 sm:px-4 sm:py-2.5 hover:bg-slate-50/80 cursor-pointer focus:outline-none focus:bg-blue-50/40 transition-colors flex flex-col gap-1.5"
                    >
                      {/* Line 1: ● {name}  [{status}]     Due {date} · {n}d */}
                      <div className="flex items-center justify-between gap-3 min-w-0">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {/* Area Color Dot */}
                          <span
                            style={{ backgroundColor: project.color || areaStyle.hexColor }}
                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                          />

                          {/* Project Name (double-click to rename inline) */}
                          {inlineEditingId === project.id ? (
                            <input
                              type="text"
                              autoFocus
                              value={inlineEditingName}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => setInlineEditingName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.stopPropagation();
                                  if (inlineEditingName.trim() && onUpdateProject) {
                                    onUpdateProject({ ...project, name: inlineEditingName.trim() });
                                  }
                                  setInlineEditingId(null);
                                } else if (e.key === 'Escape') {
                                  e.stopPropagation();
                                  setInlineEditingId(null);
                                }
                              }}
                              onBlur={() => {
                                if (inlineEditingName.trim() && onUpdateProject && inlineEditingName.trim() !== project.name) {
                                  onUpdateProject({ ...project, name: inlineEditingName.trim() });
                                }
                                setInlineEditingId(null);
                              }}
                              className="text-[13px] font-semibold text-slate-900 bg-white border border-blue-500 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          ) : (
                            <span
                              onDoubleClick={(e) => {
                                e.stopPropagation();
                                setInlineEditingId(project.id);
                                setInlineEditingName(project.name);
                              }}
                              title="Double-click to rename inline, click row to open side sheet"
                              className="text-[13px] font-semibold text-[#1A1D23] group-hover:text-blue-600 transition-colors truncate cursor-pointer select-none"
                            >
                              {project.name}
                            </span>
                          )}

                          {/* Collision badge if project has collision */}
                          {project.hasCollision && (
                            <span className="rounded-full px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-sans font-semibold tracking-wide uppercase border border-amber-200/50 shrink-0 select-none">
                              Collision
                            </span>
                          )}

                          {/* Risk Status Chip */}
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-tight border shrink-0 select-none ${
                              risk === 'noTasksLinked'
                                ? 'bg-slate-100 text-slate-500 border-slate-200'
                                : risk === 'atRisk'
                                ? 'bg-amber-100 text-amber-800 border-amber-200'
                                : risk === 'blocked'
                                ? 'bg-slate-100 text-slate-700 border-slate-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {risk === 'noTasksLinked'
                              ? 'No tasks linked'
                              : risk === 'atRisk'
                              ? 'At risk'
                              : risk === 'blocked'
                              ? 'Blocked'
                              : 'On track'}
                          </span>
                        </div>

                        {/* Right: Due Date & Days Remaining */}
                        <div className="text-right shrink-0 flex items-center gap-1.5 text-xs text-slate-500 select-none">
                          <span className="font-medium text-slate-700">Due {dueStr}</span>
                          <span className="text-slate-300">·</span>
                          <span className="font-mono text-[11px] text-slate-500">
                            {daysRemaining}d left
                          </span>
                        </div>
                      </div>

                      {/* Line 2: {bar with pace tick} {pace label} · {done}h of {total}h · Next: {task} — {est} */}
                      <div className="flex items-center gap-2.5 w-full text-xs text-slate-500 min-w-0">
                        {/* Progress Bar with Required-Pace Tick */}
                        <div className="w-20 sm:w-28 shrink-0 relative h-2 bg-slate-100 rounded-full overflow-visible">
                          <div
                            style={{
                              width: `${Math.round(progress * 100)}%`,
                              backgroundColor: project.color || areaStyle.hexColor,
                            }}
                            className="h-full rounded-full transition-all duration-300 relative z-5"
                          />
                          {!hasNoLinkedTasks && (
                            <div
                              style={{ left: `${Math.min(100, Math.max(0, expectedProgress * 100))}%` }}
                              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[2px] h-[12px] bg-slate-800 rounded-full z-10 shadow-xs pointer-events-none"
                              title={`Required pace: ${Math.round(expectedProgress * 100)}%`}
                            />
                          )}
                        </div>

                        {/* Pace Label + Hours */}
                        <div className="shrink-0 flex items-center gap-1.5 select-none">
                          <span className={`${paceClass} text-[11px]`}>
                            {hasNoLinkedTasks ? '—' : paceLabel}
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="font-mono text-[11px] text-slate-500">
                            {completedHours}h of {committedHours}h
                          </span>
                        </div>

                        <span className="text-slate-300 shrink-0">·</span>

                        {/* Next Task Line or No Tasks Linked */}
                        <div className="min-w-0 flex-1 truncate select-none">
                          {hasNoLinkedTasks ? (
                            <span className="text-slate-400">
                              No tasks linked ·{' '}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onEditProject) onEditProject(project);
                                  else onOpenBoardForProject(project.id);
                                }}
                                className="text-blue-600 hover:underline font-medium cursor-pointer"
                              >
                                Assign tasks
                              </button>
                            </span>
                          ) : nextTask ? (
                            <span className="text-slate-700 truncate font-medium">
                              <span className="text-slate-400 font-normal mr-1">Next:</span>
                              {nextTask.title}
                              <span className="text-slate-400 font-normal ml-1">
                                — {nextTask.durationDisplay || `${nextTask.estimateMinutes || nextTask.durationMinutes}m`}
                              </span>
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">No tasks ready in queue</span>
                          )}
                        </div>

                        <span className="text-[11px] text-blue-600 group-hover:underline inline-flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-auto">
                          View <ArrowUpRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Expand in place toggle (Desktop & Mobile) */}
              {sortedStandings.length > 5 && (
                <div className="p-2.5 bg-slate-50/60 border-t border-black/[0.04] text-center shrink-0">
                  <button
                    type="button"
                    id="btn-projects-module-toggle"
                    onClick={() => setExpanded((prev) => !prev)}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 py-1 px-3 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    {expanded
                      ? 'Show less'
                      : `Show all (${sortedStandings.length})`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
};
