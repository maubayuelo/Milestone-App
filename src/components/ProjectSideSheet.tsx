import React, { useState, useEffect } from 'react';
import { Project, Task, CanonicalArea } from '../types';
import { X, Pin, Archive, Plus, Trash2, CheckCircle2, Clock, Calendar, AlertTriangle } from 'lucide-react';

interface ProjectSideSheetProps {
  project: Project | null;
  tasks: Task[];
  onClose: () => void;
  onUpdateProject: (updated: Project) => void;
  onAddTask: (newTask: Omit<Task, 'id'>) => void;
  onUpdateTask: (updated: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onTriggerToast: (message: string, onUndo?: () => void) => void;
}

export const ProjectSideSheet: React.FC<ProjectSideSheetProps> = ({
  project,
  tasks,
  onClose,
  onUpdateProject,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onTriggerToast,
}) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskEstimate, setNewTaskEstimate] = useState(45);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!project) return null;

  const projectTasks = tasks.filter(
    (t) =>
      t.projectId === project.id ||
      (t.projectName && t.projectName.toLowerCase().includes(project.name.toLowerCase()))
  );

  const handleFieldChange = <K extends keyof Project>(field: K, value: Project[K]) => {
    const previous = { ...project };
    const updated = { ...project, [field]: value };
    onUpdateProject(updated);
    onTriggerToast(`Updated ${String(field)}`, () => {
      onUpdateProject(previous);
    });
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    onAddTask({
      projectId: project.id,
      projectName: project.name,
      title: newTaskTitle.trim(),
      estimateMinutes: Number(newTaskEstimate) || 30,
      durationMinutes: Number(newTaskEstimate) || 30,
      durationDisplay: `${newTaskEstimate}m`,
      column: 'todo',
      status: 'queued',
      area: (project.area as CanonicalArea) || 'Career',
      priority: 'P2',
      energy: 'Medium',
      subtasks: [],
    });

    setNewTaskTitle('');
    onTriggerToast(`Task added to ${project.name}`);
  };

  const areas: CanonicalArea[] = ['Career', 'Magneto', 'Shamanicca', 'Finances', 'Health & Soul', 'Reference', 'Personal'];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sheet-project-title"
      className="fixed inset-0 z-50 overflow-hidden flex justify-end"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/25 backdrop-blur-xs transition-opacity"
      />

      {/* Sheet Panel */}
      <div className="relative w-full max-w-md bg-white shadow-2xl h-full flex flex-col z-10 overflow-hidden border-l border-black/[0.08] animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-black/[0.06] flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2">
            <span
              style={{ backgroundColor: project.color || '#2563EB' }}
              className="w-3 h-3 rounded-full shrink-0"
            />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Project Details
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Pin Toggle */}
            <button
              type="button"
              onClick={() => handleFieldChange('starred', !project.starred)}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                project.starred
                  ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
              title={project.starred ? 'Unpin project' : 'Pin project'}
            >
              <Pin className={`w-4 h-4 ${project.starred ? 'fill-current' : ''}`} />
            </button>

            {/* Archive Toggle */}
            <button
              type="button"
              onClick={() => handleFieldChange('isClosed', !project.isClosed)}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                project.isClosed
                  ? 'text-red-600 bg-red-50 hover:bg-red-100'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
              title={project.isClosed ? 'Unarchive project' : 'Archive project'}
            >
              <Archive className="w-4 h-4" />
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Project Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Project Name
            </label>
            <input
              id="sheet-project-title"
              type="text"
              value={project.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              className="w-full text-base font-semibold text-slate-900 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          {/* Area & Client */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Area
              </label>
              <select
                value={project.area || 'Career'}
                onChange={(e) => handleFieldChange('area', e.target.value as CanonicalArea)}
                className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                {areas.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Client / Team
              </label>
              <input
                type="text"
                value={project.client || ''}
                onChange={(e) => handleFieldChange('client', e.target.value)}
                placeholder="Client name"
                className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Dates: Start & Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Start Date
              </label>
              <input
                type="date"
                value={project.startAt ? project.startAt.split('T')[0] : '2026-09-01'}
                onChange={(e) =>
                  handleFieldChange('startAt', new Date(e.target.value).toISOString())
                }
                className="w-full text-xs font-mono border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Due Date
              </label>
              <input
                type="date"
                value={project.dueAt ? project.dueAt.split('T')[0] : '2026-09-20'}
                onChange={(e) =>
                  handleFieldChange('dueAt', new Date(e.target.value).toISOString())
                }
                className="w-full text-xs font-mono border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Scope / Notes */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Scope / Notes
            </label>
            <textarea
              rows={2}
              value={project.scope || ''}
              onChange={(e) => handleFieldChange('scope', e.target.value)}
              placeholder="Key deliverable details or client milestone..."
              className="w-full text-xs font-normal border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          {/* Divider */}
          <div className="border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Tasks ({projectTasks.length})
              </span>
            </div>

            {/* Add Task Form */}
            <form onSubmit={handleCreateTask} className="flex items-center gap-2 mb-3">
              <input
                type="text"
                placeholder="New task title..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="flex-1 text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
              <input
                type="number"
                min={5}
                step={5}
                value={newTaskEstimate}
                onChange={(e) => setNewTaskEstimate(Number(e.target.value))}
                className="w-16 text-xs border border-slate-200 rounded-lg px-2 py-1.5 font-mono text-center focus:ring-2 focus:ring-blue-600 focus:outline-none"
                title="Minutes"
              />
              <button
                type="submit"
                className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                title="Add task"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>

            {/* Task list */}
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden bg-slate-50/50">
              {projectTasks.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No tasks assigned to this project yet.
                </div>
              ) : (
                projectTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-2.5 flex items-center justify-between gap-2 hover:bg-white transition-colors text-xs group"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          t.column === 'done'
                            ? 'bg-emerald-500'
                            : t.column === 'in_progress'
                            ? 'bg-blue-500'
                            : 'bg-slate-300'
                        }`}
                      />
                      <input
                        type="text"
                        value={t.title}
                        onChange={(e) => onUpdateTask({ ...t, title: e.target.value })}
                        className="flex-1 bg-transparent hover:bg-slate-100 focus:bg-white rounded px-1.5 py-0.5 truncate font-medium text-slate-800 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-[11px] text-slate-500">
                        {t.durationDisplay || `${t.estimateMinutes || t.durationMinutes}m`}
                      </span>
                      <button
                        type="button"
                        onClick={() => onDeleteTask(t.id)}
                        className="text-slate-300 hover:text-red-600 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 transition-all"
                        title="Delete task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer info (No Save button, optimistic persistence) */}
        <div className="px-5 py-3 border-t border-black/[0.06] bg-slate-50 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <span>Changes save automatically</span>
          <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-400">
            Esc to close
          </kbd>
        </div>
      </div>
    </div>
  );
};
