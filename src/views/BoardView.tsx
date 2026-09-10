import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Task, Project, BoardColumnId } from '../types';
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle,
  Send,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { getAreaStyle } from '../utils/areaColor';
import { AreaBadge } from '../components/AreaBadge';

interface BoardViewProps {
  projects: Project[];
  selectedProjectId: string;
  onSelectProject: (projectId: string) => void;
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onMoveTaskColumn: (taskId: string, newColumn: BoardColumnId) => void;
  onOpenCapture: () => void;
  selectedAreaFilter?: string;
  selectedStatusFilter?: string;
  searchQuery?: string;
}

const COLUMNS: { 
  id: BoardColumnId; 
  title: string; 
}[] = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'todo', title: 'To do' },
  { id: 'in_progress', title: 'In progress' },
  { id: 'waiting', title: 'Waiting' },
  { id: 'in_review', title: 'In review' },
  { id: 'handoff', title: 'Handoff' },
  { id: 'done', title: 'Done' },
  { id: 'cancelled', title: 'Cancelled' }, // Far right
];

function formatMinutesToHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h00`;
  return `${h}h${m.toString().padStart(2, '0')}`;
}

export const BoardView: React.FC<BoardViewProps> = ({
  projects,
  selectedProjectId,
  onSelectProject,
  tasks,
  onSelectTask,
  onMoveTaskColumn,
  onOpenCapture,
  selectedAreaFilter = 'all',
  selectedStatusFilter = 'all',
  searchQuery = '',
}) => {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<BoardColumnId | null>(null);
  const [cancelledCollapsed, setCancelledCollapsed] = useState<boolean>(true); // Cancelled collapsed by default
  const [sentFollowUps, setSentFollowUps] = useState<Record<string, boolean>>({});

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Requirement: "Remove the 'Project: All' option. A project must always be selected; that state cannot exist."
  useEffect(() => {
    if ((!selectedProjectId || selectedProjectId === 'all') && projects.length > 0) {
      onSelectProject(projects[0].id);
    }
  }, [selectedProjectId, projects, onSelectProject]);

  const activeProjectId = (!selectedProjectId || selectedProjectId === 'all') && projects.length > 0 
    ? projects[0].id 
    : selectedProjectId;

  const scrollBoard = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 350;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Filter tasks based on selected project (mandatory single project), area, status, and search query
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Must match project
      const matchesProject = t.projectId === activeProjectId || (t.projectRelation && t.projectRelation.includes(activeProjectId));
      if (!matchesProject) return false;

      // Area filter
      if (selectedAreaFilter !== 'all' && t.area.toLowerCase() !== selectedAreaFilter.toLowerCase()) {
        return false;
      }
      // Status filter
      if (selectedStatusFilter !== 'all' && t.column !== selectedStatusFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesNotes = (t.notes || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesNotes) return false;
      }
      return true;
    });
  }, [tasks, activeProjectId, selectedAreaFilter, selectedStatusFilter, searchQuery]);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, colId: BoardColumnId) => {
    e.preventDefault();
    setDragOverCol(colId);
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = (e: React.DragEvent, colId: BoardColumnId) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      onMoveTaskColumn(taskId, colId);
    }
    setDraggedTaskId(null);
    setDragOverCol(null);
  };

  const handleSendFollowUp = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSentFollowUps((prev) => ({ ...prev, [taskId]: true }));
  };

  return (
    <div id="view-board" className="flex-1 flex flex-col h-full min-h-0 min-w-0 bg-[#F7F7F8] overflow-hidden text-[#1A1D23]">
      {/* Project Selector Bar (No 'All' option allowed) & Scroll controls */}
      <div 
        id="board-header-bar"
        className="flex items-center justify-between gap-4 px-6 sm:px-8 py-3.5 bg-white border-b border-black/[0.04] shrink-0 select-none overflow-x-auto shadow-2xs"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase font-semibold tracking-[0.04em] text-[#9CA3AF] shrink-0">
            Project:
          </span>
          <select
            id="select-board-project"
            value={activeProjectId}
            onChange={(e) => onSelectProject(e.target.value)}
            className="text-[13px] font-semibold bg-[#F7F7F8] border border-black/[0.04] hover:border-blue-600 rounded-xl px-3.5 py-2 text-[#1A1D23] focus:outline-none transition-colors duration-200 cursor-pointer shadow-2xs"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <span className="text-[13px] text-[#6B7280] hidden md:inline ml-2">
            {filteredTasks.length} tasks in active view
          </span>
        </div>

        {/* Column scroll navigation arrows (44px touch targets) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => scrollBoard('left')}
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-white border border-black/[0.04] text-[#6B7280] hover:text-[#1A1D23] hover:bg-slate-50 transition-all duration-200 cursor-pointer shadow-2xs active:scale-[0.98]"
            title="Scroll columns left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scrollBoard('right')}
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-white border border-black/[0.04] text-[#6B7280] hover:text-[#1A1D23] hover:bg-slate-50 transition-all duration-200 cursor-pointer shadow-2xs active:scale-[0.98]"
            title="Scroll columns right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Board Columns Horizontal Container */}
      <div 
        ref={scrollContainerRef}
        id="board-columns-scroll"
        className="flex-1 overflow-x-auto overflow-y-hidden px-6 sm:px-8 py-6 select-none scrollbar-thin"
      >
        <div className="flex gap-4 h-full items-start">
          {COLUMNS.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.column === col.id);
            const isTarget = dragOverCol === col.id;
            const totalEstimatedMinutes = colTasks.reduce((acc, t) => acc + (t.durationMinutes || 60), 0);
            const totalHoursDisplay = formatMinutesToHours(totalEstimatedMinutes);

            // Cancelled column collapsed check
            if (col.id === 'cancelled' && cancelledCollapsed) {
              return (
                <div
                  key={col.id}
                  id={`board-column-${col.id}`}
                  onClick={() => setCancelledCollapsed(false)}
                  onDragOver={(e) => handleDragOver(e, col.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, col.id)}
                  className="w-14 flex flex-col items-center justify-between rounded-[20px] p-3.5 bg-slate-100/70 border border-black/[0.04] hover:bg-slate-200/50 transition-all duration-200 cursor-pointer"
                  title="Click to expand Cancelled column"
                >
                  <div className="flex flex-col items-center gap-2 pt-2">
                    <ChevronDown className="w-4 h-4 text-[#6B7280]" />
                    <span className="text-xs uppercase tracking-[0.08em] text-[#6B7280] [writing-mode:vertical-rl] font-semibold">
                      Cancelled ({colTasks.length})
                    </span>
                  </div>
                  <span className="text-xs font-mono tabular-nums text-[#6B7280]">
                    {totalHoursDisplay}
                  </span>
                </div>
              );
            }

            // In progress advisory hairline when > 3 cards
            const isInProgressOverLimit = col.id === 'in_progress' && colTasks.length > 3;

            return (
              <div
                key={col.id}
                id={`board-column-${col.id}`}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`w-80 sm:w-84 flex flex-col rounded-[20px] p-4 bg-slate-100/70 border transition-all duration-200 max-h-full shrink-0 ${
                  isTarget 
                    ? 'border-blue-600 bg-blue-50/50' 
                    : isInProgressOverLimit
                    ? 'border-red-300'
                    : 'border-black/[0.04]'
                }`}
              >
                {/* Column Header: card count AND summed estimated hours in mono type ("To do · 7 · 18h30") */}
                <div className="flex items-center justify-between pb-3 mb-3 px-1 select-none border-b border-black/[0.04]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-semibold tracking-[0.04em] text-[#6B7280]">
                      {col.title}
                    </span>
                    <span className="text-xs font-mono tabular-nums text-slate-500 font-medium">
                      · {colTasks.length} · {totalHoursDisplay}
                    </span>
                  </div>

                  {col.id === 'cancelled' && (
                    <button 
                      onClick={() => setCancelledCollapsed(true)}
                      className="text-[#6B7280] hover:text-[#1A1D23] p-1 cursor-pointer transition-colors"
                      title="Collapse column"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* In Progress Advisory Notice when > 3 cards (Deficit/at-risk state: red accent) */}
                {isInProgressOverLimit && (
                  <div className="mb-3 px-3 py-2 rounded-xl border border-red-200 bg-red-50 text-red-600 text-xs font-medium flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>WIP Advisory: {colTasks.length} cards (max 3 recommended)</span>
                  </div>
                )}

                {/* Column Cards List: 16px gap between cards */}
                <div className="column-cards-list flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
                  {colTasks.map((t) => {
                    const isWaitingOrHandoff = col.id === 'waiting' || col.id === 'handoff';
                    const daysAgo = t.waitingSentDaysAgo || (col.id === 'waiting' ? 4 : 3);
                    const isSlaExceeded = daysAgo >= 2;
                    const followUpDone = sentFollowUps[t.id];
                    const areaStyle = getAreaStyle(t.area, t.projectName);

                    return (
                      <div
                        key={t.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, t.id)}
                        onClick={() => onSelectTask(t)}
                        style={{
                          backgroundColor: `${areaStyle.hexColor}14`, // 8% area tint fill
                        }}
                        className="rounded-2xl p-5 border-0 hover:shadow-[0_4px_12px_rgba(30,35,50,0.08),0_1px_3px_rgba(30,35,50,0.05)] shadow-[0_2px_8px_rgba(30,35,50,0.06),0_1px_2px_rgba(30,35,50,0.04)] transition-all duration-200 cursor-grab active:cursor-grabbing active:scale-[0.98] select-none space-y-3 group"
                      >
                        {/* Header: Area badge + Tags */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <AreaBadge area={t.area} projectName={t.projectName} />
                            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                              <span className={areaStyle.tagClass}>
                                {t.area}
                              </span>

                              {t.priorityLabel === 'Urgent' && (
                                <span className="text-[11px] px-2.5 py-0.5 rounded-full font-mono tabular-nums font-semibold bg-red-500/[0.12] text-red-700">
                                  Urgent
                                </span>
                              )}

                              {t.priorityLabel === 'Important' && (
                                <span className="text-[11px] px-2.5 py-0.5 rounded-full text-slate-700 bg-white/70 font-semibold">
                                  Important
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Title: 15-16px, weight 600, near-black */}
                        <div>
                          <h4 className="text-[15px] font-semibold text-[#1A1D23] leading-snug group-hover:text-blue-600 transition-colors">
                            {t.title}
                          </h4>
                        </div>

                        {/* SLA Clock for Waiting & Handoff cards */}
                        {isWaitingOrHandoff && (
                          <div className="pt-2.5 border-t border-black/[0.04] flex flex-col gap-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-[#6B7280] flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-[#9CA3AF]" />
                                <span>Sent {daysAgo}d ago</span>
                              </span>
                              {isSlaExceeded && !followUpDone && (
                                <span className="text-red-600 font-semibold text-[11px]">
                                  SLA 48h exceeded
                                </span>
                              )}
                              {followUpDone && (
                                <span className="text-emerald-700 font-medium flex items-center gap-1 text-[11px]">
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Follow-up sent</span>
                                </span>
                              )}
                            </div>

                            {/* Inline Send Follow-up Action */}
                            {isSlaExceeded && !followUpDone && (
                              <button
                                onClick={(e) => handleSendFollowUp(t.id, e)}
                                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all duration-200 cursor-pointer shadow-[0_2px_8px_rgba(37,99,235,0.25)] active:scale-[0.98]"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Send follow-up</span>
                              </button>
                            )}
                          </div>
                        )}

                        {/* Card Footer: Project name and Duration in mono */}
                        <div className="flex items-center justify-between pt-2.5 border-t border-black/[0.04] text-[13px] text-[#6B7280]">
                          <span className="truncate max-w-[180px]">
                            {t.projectName.split('—')[0].trim()}
                          </span>
                          <span className="font-mono tabular-nums font-semibold text-[#1A1D23] bg-white/80 px-2 py-0.5 rounded-lg border border-black/[0.03]">
                            {t.durationDisplay}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {colTasks.length === 0 && (
                    <div className="h-24 rounded-2xl border border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-400 select-none">
                      No tasks
                    </div>
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
