import React, { useState, useEffect, useMemo } from 'react';
import { Command, CornerDownLeft, X, Sparkles } from 'lucide-react';
import { Task, Project } from '../types';

interface CaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onCreateTask: (task: Task) => void;
}

export const CaptureModal: React.FC<CaptureModalProps> = ({
  isOpen,
  onClose,
  projects,
  onCreateTask,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Dynamic Natural Language parsing
  const parsed = useMemo(() => {
    const lower = query.toLowerCase();
    
    // Project matching
    let matchedProject = projects[0];
    if (lower.includes('sonder') || lower.includes('film') || lower.includes('video')) {
      matchedProject = projects.find(p => p.id === 'proj-sonder') || projects[0];
    } else if (lower.includes('stillness') || lower.includes('meditation') || lower.includes('audio')) {
      matchedProject = projects.find(p => p.id === 'proj-stillness') || projects[0];
    } else if (lower.includes('komorebi') || lower.includes('tea') || lower.includes('shopify')) {
      matchedProject = projects.find(p => p.id === 'proj-komorebi') || projects[0];
    }

    // Estimate matching
    let durationMinutes = 90;
    let durationDisplay = '1h30';
    const matchHourMin = lower.match(/(\d+)h(\d+)?m?/);
    const matchMinOnly = lower.match(/(\d+)\s*(?:min|m)\b/);
    const matchHourOnly = lower.match(/(\d+)\s*(?:h|hours?)\b/);

    if (matchHourMin) {
      const hours = parseInt(matchHourMin[1], 10);
      const mins = matchHourMin[2] ? parseInt(matchHourMin[2], 10) : 0;
      durationMinutes = hours * 60 + mins;
      durationDisplay = mins > 0 ? `${hours}h${mins}` : `${hours}h00`;
    } else if (matchMinOnly) {
      durationMinutes = parseInt(matchMinOnly[1], 10);
      durationDisplay = `${durationMinutes} min`;
    } else if (matchHourOnly) {
      const hours = parseInt(matchHourOnly[1], 10);
      durationMinutes = hours * 60;
      durationDisplay = `${hours}h00`;
    }

    // Energy matching
    let energy: 'Deep' | 'Medium' | 'Low' = 'Medium';
    if (lower.includes('deep') || lower.includes('hard') || lower.includes('focus') || lower.includes('refactor')) {
      energy = 'Deep';
    } else if (lower.includes('low') || lower.includes('easy') || lower.includes('quick') || lower.includes('admin')) {
      energy = 'Low';
    }

    // Priority matching
    let priority: 'P1' | 'P2' | 'P3' = 'P2';
    if (lower.includes('urgent') || lower.includes('asap') || lower.includes('today') || lower.includes('p1')) {
      priority = 'P1';
    } else if (lower.includes('someday') || lower.includes('later') || lower.includes('p3')) {
      priority = 'P3';
    }

    // Due Date
    let dueDate = 'Tomorrow, 17:00';
    let scheduledDay = 'Sat';
    if (lower.includes('today')) {
      dueDate = 'Today, 20:00';
      scheduledDay = 'Fri';
    } else if (lower.includes('monday') || lower.includes('mon')) {
      dueDate = 'Mon, Sep 7';
      scheduledDay = 'Mon';
    } else if (lower.includes('sunday') || lower.includes('sun')) {
      dueDate = 'Sun before shift';
      scheduledDay = 'Sun';
    }

    // Cleaned title
    let title = query.trim() || 'New development task';
    if (query.trim()) {
      title = query
        .replace(/\b(for|in|at)\s+(komorebi|sonder|stillness|film|tea)\b/gi, '')
        .replace(/\b(\d+h\d*m?|\d+\s*min|\d+\s*h)\b/gi, '')
        .replace(/\b(deep|medium|low)\s*(energy)?\b/gi, '')
        .replace(/\b(urgent|today|tomorrow|monday|sunday|asap|p1|p2|p3)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (!title) title = query.trim();
    }

    return {
      project: matchedProject,
      title: title.charAt(0).toUpperCase() + title.slice(1),
      durationMinutes,
      durationDisplay,
      energy,
      priority,
      dueDate,
      scheduledDay,
    };
  }, [query, projects]);

  const handleCreate = () => {
    if (!query.trim()) return;
    const newTask: Task = {
      id: `task-custom-${Date.now()}`,
      projectId: parsed.project.id,
      projectName: parsed.project.name,
      title: parsed.title,
      description: `Captured via quick natural language prompt: "${query}"`,
      durationMinutes: parsed.durationMinutes,
      durationDisplay: parsed.durationDisplay,
      column: 'todo',
      area: 'Magneto',
      priority: parsed.priority,
      priorityLabel: parsed.priority === 'P1' ? 'Urgent' : parsed.priority === 'P2' ? 'Important' : 'Normal',
      energy: parsed.energy,
      projectRelation: parsed.project.name,
      notes: `Captured via prompt: "${query}"`,
      dueDate: parsed.dueDate,
      scheduledDay: parsed.scheduledDay,
      subtasks: [
        { id: `sub-${Date.now()}-1`, title: 'Define interface specification', completed: false },
        { id: `sub-${Date.now()}-2`, title: 'Run staging test harness', completed: false },
      ],
    };
    onCreateTask(newTask);
    setQuery('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      id="capture-modal-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity"
    >
      <div
        id="capture-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 bg-white shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
      >
        {/* Mobile handle indicator */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-3 sm:hidden" />

        <div className="flex flex-col gap-4">
          {/* Header row */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <Command className="w-4 h-4 text-[#2563EB]" />
              <span>Quick Create Task</span>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Single Natural Language Input */}
          <div className="relative">
            <input
              type="text"
              id="capture-query-input"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCreate();
                }
              }}
              placeholder="e.g. Build checkout drawer for Komorebi tomorrow 2h deep energy"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:outline-none transition"
            />
          </div>

          {/* Parsed Result Preview */}
          <div 
            id="capture-parsed-preview"
            className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5"
          >
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <span>Smart Parse Preview</span>
              <span className="text-[#2563EB]">{parsed.project.name.split('—')[0].trim()}</span>
            </div>

            <div className="text-sm font-bold text-slate-900">
              {parsed.title}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-semibold">
                {parsed.durationDisplay}
              </div>
              <div className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                {parsed.energy} Energy
              </div>
              <div className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                {parsed.priority}
              </div>
              <div className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-500">
                Due: {parsed.dueDate}
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-400">
              Calculates buffer against shift times
            </span>

            <button
              id="btn-confirm-capture"
              onClick={handleCreate}
              disabled={!query.trim()}
              className="primary-btn text-xs py-2 px-4 flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Add Task</span>
              <CornerDownLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
