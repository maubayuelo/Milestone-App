import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ChevronsRight, 
  Maximize2, 
  Minimize2, 
  Share2, 
  Link as LinkIcon, 
  Star, 
  Check, 
  Clock, 
  Calendar as CalendarIcon, 
  ArrowUpRight, 
  FileText, 
  AlertCircle,
  HelpCircle,
  AlertTriangle,
  Lock,
  Pause,
  Send,
  Paperclip,
  Upload,
  Download,
  ExternalLink,
  File
} from 'lucide-react';
import { Task, BoardColumnId, TaskComment, AttachedFile } from '../types';
import { getAreaStyle } from '../utils/areaColor';

interface TaskPeekModalProps {
  task: Task | null;
  onClose: () => void;
  onUpdateTask: (updated: Task) => void;
  masterProjects?: { id: string; name: string }[];
  onOpenFileInLightbox?: (file: AttachedFile) => void;
  allAttachments?: AttachedFile[];
  onAddAttachmentToTask?: (taskId: string, file: AttachedFile) => void;
}

const DEFAULT_MASTER_PROJECTS = [
  { id: 'p-agentic', name: 'AI Tooling & Agentic Skills' },
  { id: 'p-shamanicca-content', name: 'Shamanicca Content Engine' },
  { id: 'p-shamanicca-ecom', name: 'Shamanicca eCommerce — Fase 2' },
  { id: 'p-dangel', name: 'Dangel Therapist — Landing Page' },
  { id: 'p-trepied', name: 'TrePied — Landing Page' },
  { id: 'p-shamanicca-app', name: 'Shamanicca — App Freemium de Meditación' },
  { id: 'p-magneto-pivot', name: 'Magneto — Exploración de pivote a AI Agency' },
  { id: 'p-montreal', name: 'Montreal — Búsqueda Coop Habitación 2027' },
  { id: 'p-komorebi', name: 'Komorebi Tea — Ecommerce & Landing' },
  { id: 'p-sonder', name: 'Sonder Film Co. — Production Portfolio' },
  { id: 'p-stillness', name: 'Stillness App — Editorial & Audio CMS' },
];

const AREA_OPTIONS = [
  { name: 'Career' },
  { name: 'Magneto' },
  { name: 'Shamanicca' },
];

const STATUS_OPTIONS: { id: BoardColumnId; label: string }[] = [
  { id: 'todo', label: 'To Do' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'waiting', label: 'Waiting' },
  { id: 'in_review', label: 'In Review' },
  { id: 'handoff', label: 'Handoff' },
  { id: 'done', label: 'Done' },
  { id: 'paused', label: 'Paused' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'backlog', label: 'Backlog' },
];

const PRIORITY_OPTIONS = [
  { label: 'Urgent', code: 'P1' },
  { label: 'Important', code: 'P2' },
  { label: 'Normal', code: 'P2' },
  { label: 'Low', code: 'P3' },
];

export const TaskPeekModal: React.FC<TaskPeekModalProps> = ({
  task,
  onClose,
  onUpdateTask,
  masterProjects = DEFAULT_MASTER_PROJECTS,
  onOpenFileInLightbox = (_file: AttachedFile) => {},
  allAttachments = [],
  onAddAttachmentToTask = (_taskId: string, _file: AttachedFile) => {},
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);

  // Derive attachments belonging to this task (both inside task.attachments and allAttachments), newest first
  const taskAttachments = React.useMemo(() => {
    if (!task) return [];
    const direct = task.attachments || [];
    const matched = allAttachments.filter((f) => f.entityType === 'task' && f.entityId === task.id);
    const combined = [...direct];
    matched.forEach((m) => {
      if (!combined.some((c) => c.id === m.id)) {
        combined.push(m);
      }
    });
    // Newest first
    return combined.slice().reverse();
  }, [task, allAttachments]);

  // Dropdown states
  const [openDropdown, setOpenDropdown] = useState<'area' | 'status' | 'priority' | 'project' | null>(null);
  const [projectSearch, setProjectSearch] = useState<string>('');
  const [newCommentText, setNewCommentText] = useState<string>('');

  // Paused flow form state
  const [showPauseModal, setShowPauseModal] = useState<boolean>(false);
  const [pauseReviewDate, setPauseReviewDate] = useState<string>('');
  const [pauseReassignProject, setPauseReassignProject] = useState<string>('');

  // Date picker quick entry state
  const [isSettingDueDate, setIsSettingDueDate] = useState<boolean>(false);
  const [tempDueDate, setTempDueDate] = useState<string>('');

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (openDropdown) {
          setOpenDropdown(null);
        } else if (showPauseModal) {
          setShowPauseModal(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, openDropdown, showPauseModal]);

  // Click outside dropdown handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  if (!task) return null;

  const areaStyle = getAreaStyle(task.area, task.projectName);
  const isUrgent = task.priorityLabel === 'Urgent' || task.priority === 'P1';
  const hasDueDate = Boolean(task.dueDate && task.dueDate.trim() !== '' && task.dueDate.toLowerCase() !== 'empty');

  const handleUpdate = (fields: Partial<Task>) => {
    onUpdateTask({
      ...task,
      ...fields,
    });
  };

  const handleCopyLink = () => {
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 1500);
  };

  const handleSelectStatus = (colId: BoardColumnId) => {
    if (colId === 'paused') {
      setShowPauseModal(true);
      setPauseReviewDate(task.pausedReviewDate || '2026-09-18');
      setPauseReassignProject(task.pausedReassignProject || masterProjects[0]?.name || '');
      setOpenDropdown(null);
      return;
    }
    handleUpdate({ column: colId });
    setOpenDropdown(null);
  };

  const handleSavePause = () => {
    if (!pauseReviewDate.trim() || !pauseReassignProject.trim()) return;
    handleUpdate({
      column: 'paused',
      pausedReviewDate: pauseReviewDate.trim(),
      pausedReassignProject: pauseReassignProject.trim(),
    });
    setShowPauseModal(false);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    const newComment: TaskComment = {
      id: `comm-${Date.now()}`,
      author: 'You',
      initials: 'YO',
      content: newCommentText.trim(),
      timestamp: 'Just now',
    };
    handleUpdate({ comments: [...(task.comments || []), newComment] });
    setNewCommentText('');
  };

  const handleFileUpload = (file: File) => {
    if (!task) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('File exceeds 10MB limit.');
      return;
    }
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    let fType: 'image' | 'pdf' | 'document' = 'document';
    if (file.type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'heic'].includes(ext)) {
      fType = 'image';
    } else if (ext === 'pdf') {
      fType = 'pdf';
    }
    const url = URL.createObjectURL(file);
    const sizeFormatted = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    const newAtt: AttachedFile = {
      id: `att-task-${Date.now()}`,
      name: file.name,
      sizeBytes: file.size,
      sizeFormatted,
      fileType: fType,
      extension: ext,
      url,
      thumbnailUrl: fType === 'image' ? url : undefined,
      pageCount: fType === 'pdf' ? 1 : undefined,
      uploadedAt: 'Just now',
      entityType: 'task',
      entityId: task.id,
      entityName: task.title,
    };
    onAddAttachmentToTask(task.id, newAtt);
    handleUpdate({
      attachments: [...(task.attachments || []), newAtt],
    });
  };

  const filteredProjects = masterProjects.filter((p) =>
    p.name.toLowerCase().includes(projectSearch.toLowerCase())
  );

  return (
    <div 
      id="task-peek-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-end sm:items-center sm:justify-end transition-all select-none"
    >
      <div
        id="task-peek-panel"
        onClick={(e) => e.stopPropagation()}
        className={`w-full bg-white transition-all duration-200 border-t sm:border-t-0 sm:border-l border-slate-200 shadow-2xl flex flex-col h-[92vh] sm:h-full overflow-hidden ${
          isExpanded ? 'sm:max-w-4xl max-w-full' : 'sm:max-w-2xl max-w-full'
        }`}
      >
        {/* Notion-style Top Bar */}
        <div className="sticky top-0 z-20 px-4 sm:px-6 py-2.5 border-b border-slate-100 bg-white/95 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-400">
            <button
              id="btn-collapse-peek"
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer text-slate-500"
              title="Close side peek"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
            <button
              id="btn-expand-peek"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-md hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer text-slate-500 hidden sm:inline-flex"
              title={isExpanded ? 'Restore side peek' : 'Expand full page'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleCopyLink}
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"
              title="Copy link"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <LinkIcon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className={`p-1.5 rounded-md hover:bg-slate-100 transition cursor-pointer ${
                isFavorite ? 'text-amber-500' : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Favorite task"
            >
              <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Content */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-6 space-y-6">
          
          {/* Header Title */}
          <div className="pt-2">
            <input
              type="text"
              value={task.title}
              onChange={(e) => handleUpdate({ title: e.target.value })}
              className="w-full text-xl sm:text-2xl font-bold text-slate-900 border-b border-transparent hover:border-slate-200 focus:border-blue-500 focus:outline-none transition py-1 bg-transparent"
              placeholder="Untitled Task"
            />
          </div>

          {/* NOTION PROPERTIES TABLE (Fixed properties only, 'Add a property' removed) */}
          <div className="space-y-1 text-sm border-y border-slate-100 py-3">
            
            {/* 1. AREA */}
            <div className="flex items-center py-1.5 px-2 rounded-lg hover:bg-slate-50 transition relative">
              <div className="w-32 flex items-center gap-2 text-xs font-mono text-slate-500 select-none">
                <span>Area</span>
              </div>
              <div className="flex-1">
                <button
                  onClick={() => setOpenDropdown(openDropdown === 'area' ? null : 'area')}
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium ${areaStyle.outlineChipClass} cursor-pointer`}
                >
                  <span>{areaStyle.area}</span>
                </button>

                {openDropdown === 'area' && (
                  <div 
                    ref={dropdownRef}
                    className="absolute left-32 top-10 z-30 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 w-44 space-y-1 text-xs"
                  >
                    {AREA_OPTIONS.map((a) => (
                      <button
                        key={a.name}
                        onClick={() => {
                          handleUpdate({ area: a.name });
                          setOpenDropdown(null);
                        }}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-slate-100 transition cursor-pointer text-left font-mono"
                      >
                        <span>{a.name}</span>
                        {task.area === a.name && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 2. DUE: Urgent + empty renders as unresolved state with "Set a date" action */}
            <div className="flex items-center py-1.5 px-2 rounded-lg hover:bg-slate-50 transition relative">
              <div className="w-32 flex items-center gap-2 text-xs font-mono text-slate-500 select-none">
                <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Due</span>
              </div>
              <div className="flex-1 flex items-center gap-2">
                {isUrgent && !hasDueDate ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#C5221F] border border-[#C5221F] bg-transparent px-2 py-0.5 rounded">
                      <AlertCircle className="w-3 h-3 text-[#C5221F]" />
                      <span>Unresolved due date</span>
                    </span>
                    {!isSettingDueDate ? (
                      <button
                        onClick={() => {
                          setIsSettingDueDate(true);
                          setTempDueDate('Tomorrow, 5:00 pm');
                        }}
                        className="text-[11px] font-mono font-medium text-[#1A1918] hover:underline cursor-pointer"
                      >
                        Set a date
                      </button>
                    ) : (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={tempDueDate}
                          onChange={(e) => setTempDueDate(e.target.value)}
                          className="text-xs font-mono border border-[#E5E4E0] rounded px-1.5 py-0.5 focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => {
                            handleUpdate({ dueDate: tempDueDate });
                            setIsSettingDueDate(false);
                          }}
                          className="text-[10px] font-mono px-2 py-0.5 bg-[#1A1918] hover:bg-[#2E2D2B] text-white rounded cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    )}
                  </div>
                ) : hasDueDate ? (
                  <div className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-mono border border-slate-200 px-2 py-0.5 rounded">
                    <span>{task.dueDate}</span>
                    <button
                      onClick={() => handleUpdate({ dueDate: '' })}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer ml-1"
                      title="Clear due date"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder="Set a date..."
                    value={task.dueDate || ''}
                    onChange={(e) => handleUpdate({ dueDate: e.target.value })}
                    className="text-xs font-mono text-slate-500 placeholder-slate-400 bg-transparent border-none focus:outline-none w-48"
                  />
                )}
              </div>
            </div>

            {/* 3. PRIORITY */}
            <div className="flex items-center py-1.5 px-2 rounded-lg hover:bg-slate-50 transition relative">
              <div className="w-32 flex items-center gap-2 text-xs font-mono text-slate-500 select-none">
                <span>Priority</span>
              </div>
              <div className="flex-1">
                <button
                  onClick={() => setOpenDropdown(openDropdown === 'priority' ? null : 'priority')}
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium border ${
                    isUrgent ? 'border-red-200 text-[#F0523C]' : 'border-slate-200 text-slate-700'
                  } bg-transparent cursor-pointer`}
                >
                  <span>{task.priorityLabel || (isUrgent ? 'Urgent' : 'Normal')}</span>
                </button>

                {openDropdown === 'priority' && (
                  <div 
                    ref={dropdownRef}
                    className="absolute left-32 top-10 z-30 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 w-40 space-y-1 text-xs"
                  >
                    {PRIORITY_OPTIONS.map((p) => (
                      <button
                        key={p.label}
                        onClick={() => {
                          handleUpdate({ priority: p.code, priorityLabel: p.label });
                          setOpenDropdown(null);
                        }}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-slate-100 transition cursor-pointer text-left font-mono"
                      >
                        <span>{p.label}</span>
                        {(task.priorityLabel === p.label || (!task.priorityLabel && task.priority === p.code)) && (
                          <Check className="w-3.5 h-3.5 text-blue-600" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 4. STATUS */}
            <div className="flex items-center py-1.5 px-2 rounded-lg hover:bg-slate-50 transition relative">
              <div className="w-32 flex items-center gap-2 text-xs font-mono text-slate-500 select-none">
                <span>Status</span>
              </div>
              <div className="flex-1">
                <button
                  onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium border border-slate-200 text-slate-700 bg-transparent cursor-pointer"
                >
                  <span>{task.column === 'paused' ? 'Paused' : task.column.replace('_', ' ')}</span>
                </button>

                {openDropdown === 'status' && (
                  <div 
                    ref={dropdownRef}
                    className="absolute left-32 top-10 z-30 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 w-48 space-y-1 text-xs"
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <button
                        key={st.id}
                        onClick={() => handleSelectStatus(st.id)}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-slate-100 transition cursor-pointer text-left font-mono"
                      >
                        <span>{st.label}</span>
                        {task.column === st.id && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 5. PROJECT RELATION */}
            <div className="flex items-center py-1.5 px-2 rounded-lg hover:bg-slate-50 transition relative">
              <div className="w-32 flex items-center gap-2 text-xs font-mono text-slate-500 select-none">
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                <span>Project</span>
              </div>
              <div className="flex-1">
                <button
                  onClick={() => setOpenDropdown(openDropdown === 'project' ? null : 'project')}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-mono border border-slate-200 px-2 py-0.5 rounded hover:bg-slate-50 transition cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate max-w-xs">{task.projectRelation || task.projectName}</span>
                </button>

                {openDropdown === 'project' && (
                  <div 
                    ref={dropdownRef}
                    className="absolute left-0 sm:left-32 top-10 z-40 bg-white border border-slate-200 rounded-xl shadow-2xl p-2.5 w-80 space-y-2 text-xs"
                  >
                    <input
                      type="text"
                      placeholder="Link a project..."
                      value={projectSearch}
                      onChange={(e) => setProjectSearch(e.target.value)}
                      className="w-full text-xs font-mono text-slate-800 placeholder-slate-400 bg-transparent border-b border-slate-200 pb-1 focus:outline-none"
                      autoFocus
                    />
                    <div className="max-h-52 overflow-y-auto space-y-1">
                      {filteredProjects.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            handleUpdate({ projectRelation: p.name, projectName: p.name });
                            setOpenDropdown(null);
                          }}
                          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-slate-100 transition cursor-pointer text-left font-mono"
                        >
                          <span className="truncate">{p.name}</span>
                          {(task.projectRelation || task.projectName).includes(p.name) && (
                            <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* NOTES SECTION */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-600 font-bold">
              Notes
            </h4>
            <textarea
              rows={3}
              value={task.notes || ''}
              onChange={(e) => handleUpdate({ notes: e.target.value })}
              placeholder="Task context, notes, and checklist..."
              className="w-full text-xs text-slate-800 leading-relaxed placeholder-slate-400 border border-slate-200 rounded-lg p-3 focus:border-blue-400 focus:outline-none transition resize-y font-mono"
            />
          </div>

          {/* ============================================================
              COMPACT ATTACHMENT ROW (Newest First)
              - Images: inline thumbnail, click for lightbox
              - PDFs: file chip with name, page count and size
              - Documents: file chip
              ============================================================ */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-600 font-bold flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                  <span>Attachments ({taskAttachments.length})</span>
                </h4>
                <span className="text-[10px] font-mono text-slate-400">newest first</span>
              </div>

              <label 
                htmlFor={`task-file-upload-${task.id}`}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1A1918] bg-[#FAF9F7] hover:bg-[#F4F3F0] px-2.5 py-1 rounded-lg cursor-pointer transition-colors duration-200 border border-[#E5E4E0] hover:border-[#1A1918]"
              >
                <Upload className="w-3.5 h-3.5 text-[#787774]" />
                <span>Attach file</span>
                <input 
                  id={`task-file-upload-${task.id}`}
                  type="file"
                  className="hidden"
                  accept=".png,.jpg,.jpeg,.heic,.pdf,.docx,.md,.txt,image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                      e.target.value = '';
                    }
                  }}
                />
              </label>
            </div>

            {taskAttachments.length === 0 ? (
              <div 
                onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
                onDragLeave={() => setIsDraggingFile(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingFile(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                className={`p-3 rounded-lg border border-dashed transition text-center text-xs ${
                  isDraggingFile ? 'border-[#1A1918] bg-[#F4F3F0] text-[#1A1918]' : 'border-[#E5E4E0] text-[#787774]'
                }`}
              >
                No files attached to this task. Drag & drop here or attach in Coach.
              </div>
            ) : (
              <div className="space-y-1.5">
                {taskAttachments.map((att) => (
                  <div
                    key={att.id}
                    className="p-2 rounded-lg border border-[#E5E4E0] bg-[#FAF9F7] hover:border-[#1A1918] transition-colors duration-200 flex items-center justify-between gap-2.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {att.fileType === 'image' ? (
                        <div 
                          onClick={() => onOpenFileInLightbox(att)}
                          className="w-10 h-10 rounded bg-[#F4F3F0] overflow-hidden shrink-0 border border-[#E5E4E0] cursor-pointer relative group/img"
                        >
                          <img 
                            src={att.url} 
                            alt={att.name} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/img:opacity-100 transition flex items-center justify-center text-white">
                            <ExternalLink className="w-3 h-3" />
                          </div>
                        </div>
                      ) : att.fileType === 'pdf' ? (
                        <div className="w-10 h-10 rounded bg-white text-[#C5221F] flex flex-col items-center justify-center font-bold text-[9px] shrink-0 border border-[#E5E4E0]">
                          <FileText className="w-4 h-4" />
                          <span className="leading-none mt-0.5 font-mono">PDF</span>
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded bg-white text-[#1A1918] flex flex-col items-center justify-center font-bold text-[9px] shrink-0 border border-[#E5E4E0] uppercase">
                          <File className="w-4 h-4" />
                          <span className="leading-none mt-0.5 font-mono">{att.extension}</span>
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <span 
                          onClick={() => {
                            if (att.fileType === 'image') onOpenFileInLightbox(att);
                          }}
                          className={`text-xs font-medium text-[#1A1918] block truncate ${
                            att.fileType === 'image' ? 'cursor-pointer hover:underline' : ''
                          }`}
                          title={att.name}
                        >
                          {att.name}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] font-mono tabular-nums text-[#787774] mt-0.5">
                          <span>{att.sizeFormatted}</span>
                          {att.pageCount && <span>• {att.pageCount} pages</span>}
                          <span>• {att.uploadedAt}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {att.fileType === 'image' && (
                        <button
                          onClick={() => onOpenFileInLightbox(att)}
                          className="p-1 rounded text-[#787774] hover:text-[#1A1918] hover:bg-[#F4F3F0] transition cursor-pointer"
                          title="Open preview"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <a
                        href={att.url}
                        download={att.name}
                        className="p-1 rounded text-[#787774] hover:text-[#1A1918] hover:bg-[#F4F3F0] transition cursor-pointer"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ============================================================
              NEW REQUIRED SECTION BELOW NOTES:
              - Estimate vs actual time
              - Reschedule count when 3 or more ("moved 4×")
              - "Blocked by" relation field
              ============================================================ */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-600 font-bold">
              Execution & Dependencies
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Estimate vs Actual Time */}
              <div className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/50 space-y-1">
                <span className="font-mono text-slate-500 text-[11px] block">
                  Estimate vs Actual Time
                </span>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-slate-700 font-medium">
                    Est: {task.durationDisplay || '2h 10m'}
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="text-[#2563EB] font-semibold">
                    Actual: {task.actualDisplay || '1h 45m'}
                  </span>
                </div>
              </div>

              {/* Reschedule Count (rendered when >= 3) */}
              <div className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/50 space-y-1">
                <span className="font-mono text-slate-500 text-[11px] block">
                  Reschedule History
                </span>
                {task.rescheduleCount && task.rescheduleCount >= 3 ? (
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-amber-700 border border-amber-200 bg-amber-50 px-2 py-0.5 rounded">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    <span>moved {task.rescheduleCount}×</span>
                  </span>
                ) : (
                  <span className="font-mono text-slate-500 text-[11px]">
                    No reschedule alerts (moved &lt; 3×)
                  </span>
                )}
              </div>
            </div>

            {/* Blocked by relation field */}
            <div className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/50 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-slate-500 text-[11px] flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Blocked by:</span>
                </span>
              </div>
              <input
                type="text"
                value={task.blockedBy || ''}
                onChange={(e) => handleUpdate({ blockedBy: e.target.value })}
                placeholder="None (e.g. Shopify headless webhook sync)"
                className="w-full text-xs font-mono text-slate-800 bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:border-[#2563EB] focus:outline-none"
              />
            </div>
          </div>

          {/* COMMENTS SECTION */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-600 font-bold">
              Comments
            </h4>

            <div className="space-y-2">
              {task.comments?.map((comm) => (
                <div key={comm.id} className="p-2.5 rounded-lg border border-slate-200/80 bg-slate-50/40 space-y-1 text-xs font-mono">
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span className="font-bold text-slate-800">{comm.author}</span>
                    <span>{comm.timestamp}</span>
                  </div>
                  <p className="text-slate-700">{comm.content}</p>
                </div>
              ))}
            </div>

            {/* Add Comment Input */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                placeholder="Write a comment..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                className="flex-1 text-xs font-mono text-slate-800 border border-slate-200 rounded-lg px-3 py-2 focus:border-[#2563EB] focus:outline-none"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-mono font-medium transition cursor-pointer"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ============================================================
          PAUSED STATUS MODAL:
          "Setting Status to Paused opens a required two-field form:
           'review on [date]' and 'reassign those hours to [project]'.
           Save stays disabled until both are filled. An open-ended pause must be impossible."
          ============================================================ */}
      {showPauseModal && (
        <div 
          className="fixed inset-0 z-60 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={(e) => e.stopPropagation()}
        >
          <div 
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 select-none"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <Pause className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-mono">
                    Pause Task Allocation
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Open-ended pauses are forbidden. Reallocate hours now.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPauseModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              {/* Field 1: review on [date] */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  1. Review on [date] *
                </label>
                <input
                  type="date"
                  value={pauseReviewDate}
                  onChange={(e) => setPauseReviewDate(e.target.value)}
                  className="w-full text-xs font-mono border border-slate-200 rounded-lg p-2.5 focus:border-[#2563EB] focus:outline-none"
                  required
                />
              </div>

              {/* Field 2: reassign those hours to [project] */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  2. Reassign those hours to [project] *
                </label>
                <select
                  value={pauseReassignProject}
                  onChange={(e) => setPauseReassignProject(e.target.value)}
                  className="w-full text-xs font-mono border border-slate-200 rounded-lg p-2.5 focus:border-[#2563EB] focus:outline-none cursor-pointer"
                  required
                >
                  <option value="">Select target project...</option>
                  {masterProjects.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Actions: Save is disabled until both fields are filled */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPauseModal(false)}
                className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-mono cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePause}
                disabled={!pauseReviewDate.trim() || !pauseReassignProject.trim()}
                className={`px-4 py-2 rounded-lg text-xs font-mono font-semibold transition cursor-pointer ${
                  !pauseReviewDate.trim() || !pauseReassignProject.trim()
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-[#2563EB] hover:bg-blue-700 text-white shadow-xs'
                }`}
              >
                Confirm Pause & Reassign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
