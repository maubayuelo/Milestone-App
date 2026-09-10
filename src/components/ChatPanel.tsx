import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft,
  Clock,
  ArrowRight,
  TrendingUp,
  PieChart,
  CheckCircle2,
  Paperclip,
  Camera,
  X,
  FileText,
  Image as ImageIcon,
  File,
  CheckSquare,
  Folder,
  Calendar,
  Undo2,
  HardDrive,
  UploadCloud,
  ChevronDown
} from 'lucide-react';
import { 
  ChatMessage, 
  Task, 
  ExternalCommitment, 
  Project, 
  AttachedFile, 
  ExtractedShiftRow, 
  ExtractedTaskRow,
  AttachmentEntityType 
} from '../types';
import { computeCapacity } from '../utils/capacity';
import { SAMPLE_ATTACHMENT_PRESETS } from '../data/attachmentsData';
import { ProposalDiffCard } from './ProposalDiffCard';

interface ChatPanelProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string, attachment?: AttachedFile) => void;
  tasks: Task[];
  projects?: Project[];
  commitments: ExternalCommitment[];
  onActionClick?: (actionType: string, payload?: string) => void;
  overageMinutes?: number;
  onOpenFileInLightbox?: (file: AttachedFile) => void;
  onApplyShifts?: (proposalId: string, shifts: ExtractedShiftRow[]) => void;
  onApplyTasks?: (proposalId: string, tasks: ExtractedTaskRow[], projectId?: string) => void;
  onApplyDeadline?: (date: string, description: string) => void;
  onUndoProposal?: (proposalId: string) => void;
  onOpenProjectFiles?: () => void;
  activeSessionUndo?: {
    proposalId: string;
    description: string;
  } | null;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  collapsed,
  onToggleCollapse,
  messages,
  onSendMessage,
  tasks,
  projects = [],
  commitments,
  onActionClick,
  overageMinutes = 30,
  onOpenFileInLightbox = (_file: AttachedFile) => {},
  onApplyShifts = (_id: string, _shifts: ExtractedShiftRow[]) => {},
  onApplyTasks = (_id: string, _tasks: ExtractedTaskRow[], _projId?: string) => {},
  onApplyDeadline,
  onUndoProposal = (_proposalId: string) => {},
  onOpenProjectFiles = () => {},
  activeSessionUndo,
}) => {
  const [inputText, setInputText] = useState('');
  const [coachMode, setCoachMode] = useState<'today' | 'week'>('today');
  const [pendingAttachment, setPendingAttachment] = useState<AttachedFile | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Entity selection for pending attachment
  const [selectedEntityType, setSelectedEntityType] = useState<AttachmentEntityType>('task');
  const [selectedEntityId, setSelectedEntityId] = useState<string>(tasks[0]?.id || 'task-k-checkout');
  const [showEntityDropdown, setShowEntityDropdown] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  const capacity = computeCapacity(overageMinutes);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, collapsed, coachMode, pendingAttachment]);

  // Global & Container Paste Listener (Cmd+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData || !e.clipboardData.files || e.clipboardData.files.length === 0) return;
      const file = e.clipboardData.files[0];
      processRawFile(file);
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [tasks, projects]);

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processRawFile(e.dataTransfer.files[0]);
    }
  };

  // Process and validate an incoming file
  const processRawFile = (file: File) => {
    setValidationError(null);

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      setValidationError(`File exceeds 10MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB)`);
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const validExts = ['png', 'jpg', 'jpeg', 'heic', 'pdf', 'docx', 'md', 'txt'];
    if (!validExts.includes(ext) && !file.type.startsWith('image/')) {
      setValidationError(`Unsupported file type (.${ext}). Accept: PNG, JPG, HEIC, PDF, DOCX, MD, TXT.`);
      return;
    }

    let fType: 'image' | 'pdf' | 'document' = 'document';
    if (file.type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'heic'].includes(ext)) {
      fType = 'image';
    } else if (ext === 'pdf') {
      fType = 'pdf';
    }

    const url = URL.createObjectURL(file);
    const sizeFormatted = (file.size / (1024 * 1024)).toFixed(1) + ' MB';

    // Intelligent default destination entity
    const nameLower = file.name.toLowerCase();
    let defaultType: AttachmentEntityType = 'task';
    let defaultId = tasks[0]?.id || 'task-k-checkout';
    let defaultName = tasks[0]?.title || 'Current active task';

    if (nameLower.includes('shift') || nameLower.includes('schedule') || nameLower.includes('roster')) {
      defaultType = 'calendar';
      defaultId = 'calendar';
      defaultName = 'Calendar: Westport Shifts';
    } else if (nameLower.includes('brief') || nameLower.includes('contract') || nameLower.includes('agreement') || nameLower.includes('invoice')) {
      defaultType = 'project';
      defaultId = projects[0]?.id || 'proj-komorebi';
      defaultName = projects[0]?.name || 'Komorebi Tea — Ecommerce & Landing';
    }

    setSelectedEntityType(defaultType);
    setSelectedEntityId(defaultId);

    const newAtt: AttachedFile = {
      id: `att-${Date.now()}`,
      name: file.name,
      sizeBytes: file.size,
      sizeFormatted,
      fileType: fType,
      extension: ext,
      url,
      thumbnailUrl: fType === 'image' ? url : undefined,
      pageCount: fType === 'pdf' ? 1 : undefined,
      uploadedAt: 'Just now',
      entityType: defaultType,
      entityId: defaultId,
      entityName: defaultName,
    };

    setPendingAttachment(newAtt);
  };

  // Pick one of the sample presets for instant evaluation
  const handleSelectPreset = (presetId: string) => {
    const preset = SAMPLE_ATTACHMENT_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setValidationError(null);

    const file = { ...preset.file, id: `att-${Date.now()}` };
    setSelectedEntityType(file.entityType);
    setSelectedEntityId(file.entityId);
    setPendingAttachment(file);
  };

  // Change entity type
  const handleSetEntityType = (type: AttachmentEntityType) => {
    setSelectedEntityType(type);
    if (type === 'calendar') {
      setSelectedEntityId('calendar');
      if (pendingAttachment) {
        setPendingAttachment({
          ...pendingAttachment,
          entityType: 'calendar',
          entityId: 'calendar',
          entityName: 'Calendar: Westport Shifts',
        });
      }
    } else if (type === 'project') {
      const proj = projects[0] || { id: 'proj-komorebi', name: 'Komorebi Tea — Ecommerce & Landing' };
      setSelectedEntityId(proj.id);
      if (pendingAttachment) {
        setPendingAttachment({
          ...pendingAttachment,
          entityType: 'project',
          entityId: proj.id,
          entityName: proj.name,
        });
      }
    } else {
      const task = tasks[0] || { id: 'task-k-checkout', title: 'Refactor checkout drawer state' };
      setSelectedEntityId(task.id);
      if (pendingAttachment) {
        setPendingAttachment({
          ...pendingAttachment,
          entityType: 'task',
          entityId: task.id,
          entityName: task.title,
        });
      }
    }
  };

  const handleSelectSpecificEntity = (id: string, name: string) => {
    setSelectedEntityId(id);
    if (pendingAttachment) {
      setPendingAttachment({
        ...pendingAttachment,
        entityId: id,
        entityName: name,
      });
    }
    setShowEntityDropdown(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !pendingAttachment) return;

    let finalAttachment = pendingAttachment;
    if (finalAttachment) {
      finalAttachment = {
        ...finalAttachment,
        entityType: selectedEntityType,
        entityId: selectedEntityId,
        entityName:
          selectedEntityType === 'calendar'
            ? 'Calendar: Westport Shifts'
            : selectedEntityType === 'project'
            ? projects.find((p) => p.id === selectedEntityId)?.name || 'Selected Project'
            : tasks.find((t) => t.id === selectedEntityId)?.title || 'Selected Task',
      };
    }

    onSendMessage(inputText.trim(), finalAttachment || undefined);
    setInputText('');
    setPendingAttachment(null);
    setShowEntityDropdown(false);
    setValidationError(null);
  };

  const quickPromptsToday = [
    'Rebalance today’s 30m overage',
    'Shorten WebGL physics to 17m',
    'Defer audio streaming to tomorrow',
  ];

  const quickPromptsWeek = [
    'Analyze area hour distribution',
    'Am I on pace for Career client goals?',
    'Balance shifts vs Magneto exploration',
  ];

  if (collapsed) {
    return null;
  }

  return (
    <aside
      ref={panelRef}
      id="chat-panel-container"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="xl:sticky fixed right-0 top-0 bottom-0 xl:bottom-auto w-[380px] max-w-[92vw] h-screen z-40 xl:z-20 flex flex-col border-l border-black/[0.06] bg-white select-none shadow-2xl xl:shadow-none shrink-0 overflow-hidden"
    >
      {/* Drag & Drop Visual Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 bg-slate-900/90 z-50 flex flex-col items-center justify-center text-white p-6">
          <UploadCloud className="w-12 h-12 mb-3 text-blue-400" />
          <span className="text-sm font-medium">Drop to attach file to Coach</span>
          <span className="text-xs text-slate-300 mt-1 text-center">
            Accepts PNG, JPG, HEIC, PDF, DOCX, MD, TXT (Max 10MB)
          </span>
          <span className="text-[11px] text-slate-400 mt-3 bg-white/10 px-3 py-1 rounded-md">
            Extracts shifts, client brief tasks, and contracts
          </span>
        </div>
      )}

      {/* Header: Renamed to 'Coach' with Mode Toggle: Today | Week */}
      <div 
        id="chat-header"
        className="px-4 py-3 flex items-center justify-between border-b border-black/[0.06] shrink-0 bg-white"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-[0.05em] text-slate-500 font-semibold">
            Coach
          </span>
          <div className="w-2 h-2 rounded-full bg-blue-600" />
        </div>

        {/* Mode toggle: Today | Week */}
        <div className="segmented-control">
          <button
            onClick={() => setCoachMode('today')}
            className={`segmented-pill ${
              coachMode === 'today' ? 'segmented-pill-active' : ''
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setCoachMode('week')}
            className={`segmented-pill ${
              coachMode === 'week' ? 'segmented-pill-active' : ''
            }`}
          >
            Week
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onOpenProjectFiles}
            className="w-8 h-8 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
            title="Project Files & Storage"
          >
            <HardDrive className="w-4 h-4" />
          </button>
          <button
            id="btn-collapse-chat"
            onClick={onToggleCollapse}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
            title="Collapse Coach"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Session-Persistent Undo Banner */}
      {activeSessionUndo && (
        <div 
          id="coach-persistent-undo-banner"
          className="px-4 py-2 bg-[#FAF9F7] border-b border-[#E5E4E0] flex items-center justify-between text-xs text-[#1A1918] shrink-0"
        >
          <div className="flex items-center gap-2 truncate mr-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#1A1918] shrink-0" />
            <span className="truncate">{activeSessionUndo.description}</span>
          </div>
          <button
            onClick={() => onUndoProposal(activeSessionUndo.proposalId)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white text-[#1A1918] border border-[#E5E4E0] font-medium hover:bg-[#F4F3F0] transition-colors duration-200 shrink-0 cursor-pointer text-xs"
          >
            <Undo2 className="w-3 h-3" />
            <span>Undo</span>
          </button>
        </div>
      )}

      {/* Canonical Capacity Awareness Banner */}
      <div 
        id="chat-shift-banner"
        className="px-4 py-2 border-b border-[#E5E4E0] bg-[#FAF9F7] flex items-center justify-between text-xs shrink-0"
      >
        <div className="flex items-center gap-1.5 text-[#787774]">
          <Clock className="w-3.5 h-3.5 text-[#787774]" />
          <span className="text-[11px] uppercase tracking-[0.08em]">Window:</span>
        </div>
        <div className="font-medium text-[#1A1918] text-xs flex items-center gap-1.5">
          <span className="font-mono tabular-nums">{capacity.windowStart} — {capacity.windowEnd}</span>
          <span className={`text-[11px] px-1.5 py-0.5 rounded font-mono tabular-nums border ${
            capacity.isDeficit 
              ? 'border-[#C5221F] text-[#C5221F] bg-transparent' 
              : 'border-[#E5E4E0] text-[#787774] bg-transparent'
          }`}>
            {capacity.shortLabel}
          </span>
        </div>
      </div>

      {/* Messages / Scroll Area */}
      <div 
        ref={messagesContainerRef}
        id="chat-messages-scroll"
        className="flex-1 overflow-y-auto p-4 space-y-3.5 text-sm"
      >
        {coachMode === 'today' ? (
          <>
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              if (isUser) {
                return (
                  <div key={msg.id} className="space-y-1.5">
                    <div className="flex items-center justify-end gap-1.5 text-[11px] text-[#6B7280]">
                      <span className="font-mono tabular-nums">{msg.timestamp}</span>
                      <span className="font-semibold text-[#1A1D23]">You</span>
                    </div>

                    <div className="bg-blue-600 text-white rounded-2xl rounded-tr-xs p-3.5 ml-8 text-[14px] leading-relaxed space-y-2 shadow-[0_2px_8px_rgba(37,99,235,0.2)]">
                      {msg.text && <p>{msg.text}</p>}

                      {/* Display attached files in user message */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="space-y-2 pt-1 border-t border-white/10">
                          {msg.attachments.map((att) => (
                            <div key={att.id} className="space-y-1">
                              {att.fileType === 'image' ? (
                                <div 
                                  onClick={() => onOpenFileInLightbox(att)}
                                  className="relative group rounded-xl overflow-hidden border border-white/20 max-w-[200px] cursor-pointer"
                                >
                                  <img 
                                    src={att.url} 
                                    alt={att.name} 
                                    className="w-full max-h-32 object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="p-1 bg-black/80 text-[10px] text-[#D6D4CF] truncate">
                                    {att.name} ({att.sizeFormatted})
                                  </div>
                                </div>
                              ) : att.fileType === 'pdf' ? (
                                <div className="flex items-center gap-2 p-2 rounded-xl bg-white/10 border border-white/15 text-xs">
                                  <div className="w-6 h-6 rounded-lg bg-red-600/30 text-red-300 flex items-center justify-center font-medium text-[10px]">
                                    PDF
                                  </div>
                                  <div className="truncate flex-1">
                                    <span className="text-white block truncate">{att.name}</span>
                                    <span className="text-[#9D9C98] text-[11px] font-mono tabular-nums">{att.pageCount ? `${att.pageCount} pages · ` : ''}{att.sizeFormatted}</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 p-2 rounded-xl bg-white/10 border border-white/15 text-xs">
                                  <FileText className="w-5 h-5 text-[#D6D4CF] shrink-0" />
                                  <div className="truncate flex-1">
                                    <span className="text-white block truncate">{att.name}</span>
                                    <span className="text-[#9D9C98] text-[11px] font-mono tabular-nums">{att.sizeFormatted}</span>
                                  </div>
                                </div>
                              )}

                              {/* Destination entity badge */}
                              <div className="text-[11px] text-[#9D9C98] flex items-center gap-1">
                                <span>Attached to:</span>
                                <span className="text-white font-medium">{att.entityName}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280]">
                    <span className="font-semibold text-[#1A1D23]">Coach</span>
                    <span>•</span>
                    <span className="font-mono tabular-nums">{msg.timestamp}</span>
                  </div>

                  <div className="bg-white border border-black/[0.04] rounded-2xl rounded-tl-xs p-4 space-y-3 shadow-[0_2px_8px_rgba(30,35,50,0.06),0_1px_2px_rgba(30,35,50,0.04)]">
                    {msg.text && (
                      <p className="text-[#1A1D23] leading-relaxed text-[14px]">
                        {msg.text}
                      </p>
                    )}

                    {/* Proposal Diff Card if present */}
                    {msg.proposal && (
                      <ProposalDiffCard
                        proposal={msg.proposal}
                        onApplyShifts={onApplyShifts}
                        onApplyTasks={onApplyTasks}
                        onApplyDeadline={onApplyDeadline}
                        onUndoProposal={onUndoProposal}
                      />
                    )}

                    {/* Today: Render up to 3 interactive decisions */}
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-black/[0.04]">
                        <span className="text-[11px] text-[#6B7280] uppercase font-semibold tracking-[0.04em]">
                          Decisions (max 3):
                        </span>
                        <div className="space-y-1.5">
                          {msg.actions.slice(0, 3).map((act, idx) => (
                            <button
                              key={idx}
                              onClick={() => onActionClick && onActionClick(act.type, act.payload)}
                              className="w-full text-left p-3 min-h-[44px] rounded-xl border border-black/[0.04] bg-[#F7F7F8] hover:bg-slate-100 transition-all duration-200 cursor-pointer flex items-center justify-between text-xs group active:scale-[0.98]"
                            >
                              <span className="text-[#1A1D23] font-medium truncate">
                                {act.label}
                              </span>
                              <ArrowRight className="w-3.5 h-3.5 text-[#6B7280] group-hover:text-blue-600 shrink-0 ml-1 transition-colors" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          /* WEEK MODE */
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl border border-[#E5E4E0] bg-white space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#1A1918] flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#1A1918]" />
                  <span>Weekly Goal Progress</span>
                </span>
                <span className="text-[11px] font-mono tabular-nums text-[#787774]">Week 37</span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#787774]">Committed Freelance</span>
                  <span className="font-mono tabular-nums font-medium text-[#1A1918]">18.5h / 28h (66%)</span>
                </div>
                <div className="w-full h-1.5 bg-[#F4F3F0] rounded-full overflow-hidden flex">
                  <div style={{ width: '66%' }} className="bg-[#1A1918] rounded-full" />
                </div>
              </div>

              <p className="text-xs text-[#787774] leading-relaxed">
                On track for Komorebi checkout launch. Ensure 4h buffer is reserved before Sunday shift.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-[#E5E4E0] bg-white space-y-2.5">
              <span className="text-xs font-medium text-[#1A1918] block">
                Hours Split Across 3 Areas
              </span>

              <div className="space-y-2.5">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#1A1918] font-normal">Career (Client Work)</span>
                    <span className="font-mono tabular-nums font-medium text-[#1A1918]">14h30 (52%)</span>
                  </div>
                  <div className="w-full h-1 bg-[#F4F3F0] rounded-full overflow-hidden">
                    <div style={{ width: '52%' }} className="bg-[#1A1918] h-full rounded-full" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#1A1918] font-normal">Magneto (AI & Agency)</span>
                    <span className="font-mono tabular-nums font-medium text-[#1A1918]">8h15 (30%)</span>
                  </div>
                  <div className="w-full h-1 bg-[#F4F3F0] rounded-full overflow-hidden">
                    <div style={{ width: '30%' }} className="bg-[#787774] h-full rounded-full" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#1A1918] font-normal">Shamanicca (Media & App)</span>
                    <span className="font-mono tabular-nums font-medium text-[#1A1918]">5h00 (18%)</span>
                  </div>
                  <div className="w-full h-1 bg-[#F4F3F0] rounded-full overflow-hidden">
                    <div style={{ width: '18%' }} className="bg-[#9D9C98] h-full rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Validation error notice */}
      {validationError && (
        <div className="px-4 py-2 border-t border-[#C5221F] bg-transparent text-[#C5221F] text-xs flex items-center justify-between">
          <span>{validationError}</span>
          <button onClick={() => setValidationError(null)} className="cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Quick sample files chips for rapid evaluation */}
      <div className="px-4 py-1.5 border-t border-[#E5E4E0] bg-[#FAF9F7] flex items-center gap-1.5 overflow-x-auto text-[11px] shrink-0">
        <span className="text-[#9D9C98] shrink-0">Test sample:</span>
        {SAMPLE_ATTACHMENT_PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => handleSelectPreset(p.id)}
            className="px-2 py-0.5 rounded border border-[#E5E4E0] bg-white hover:border-[#1A1918] hover:text-[#1A1918] text-[#787774] whitespace-nowrap cursor-pointer transition-colors duration-200"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Pending Attachment Composer Chip (Removable + Pre-selected Target Entity) */}
      {pendingAttachment && (
        <div className="p-3 border-t border-[#E5E4E0] bg-[#FAF9F7] space-y-2 shrink-0">
          {/* File Thumbnail & Remove */}
          <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-[#E5E4E0]">
            <div className="flex items-center gap-2.5 overflow-hidden">
              {pendingAttachment.fileType === 'image' ? (
                <div 
                  onClick={() => onOpenFileInLightbox(pendingAttachment)}
                  className="w-9 h-9 rounded-md bg-[#F4F3F0] overflow-hidden border border-[#E5E4E0] shrink-0 cursor-pointer"
                >
                  <img 
                    src={pendingAttachment.url} 
                    alt={pendingAttachment.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : pendingAttachment.fileType === 'pdf' ? (
                <div className="w-9 h-9 rounded-md border border-[#E5E4E0] text-[#C5221F] flex items-center justify-center font-medium text-[10px] shrink-0">
                  PDF
                </div>
              ) : (
                <div className="w-9 h-9 rounded-md border border-[#E5E4E0] text-[#1A1918] flex items-center justify-center font-medium text-[10px] shrink-0 uppercase">
                  {pendingAttachment.extension}
                </div>
              )}

              <div className="truncate">
                <span className="text-xs font-medium text-[#1A1918] block truncate">
                  {pendingAttachment.name}
                </span>
                <span className="text-[11px] font-mono tabular-nums text-[#787774]">
                  {pendingAttachment.sizeFormatted} · Ready to parse
                </span>
              </div>
            </div>

            <button
              onClick={() => setPendingAttachment(null)}
              className="p-1 rounded-md text-[#787774] hover:text-[#C5221F] hover:bg-[#F4F3F0] transition-colors duration-200 cursor-pointer"
              title="Remove attachment"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Target Entity Picker: "Where does this file belong? — pre-selected, one tap to change: a task, a project, or the calendar." */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span className="font-semibold">Where does this file belong?</span>
              <span className="text-slate-400">1-tap to switch</span>
            </div>

            {/* 3 Entity Category Buttons */}
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleSetEntityType('task')}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-colors duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                  selectedEntityType === 'task'
                    ? 'bg-[#1A1918] text-white'
                    : 'bg-white border border-[#E5E4E0] text-[#787774] hover:bg-[#FAF9F7] hover:text-[#1A1918]'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Task</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetEntityType('project')}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-colors duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                  selectedEntityType === 'project'
                    ? 'bg-[#1A1918] text-white'
                    : 'bg-white border border-[#E5E4E0] text-[#787774] hover:bg-[#FAF9F7] hover:text-[#1A1918]'
                }`}
              >
                <Folder className="w-3.5 h-3.5" />
                <span>Project</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetEntityType('calendar')}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-colors duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                  selectedEntityType === 'calendar'
                    ? 'bg-[#1A1918] text-white'
                    : 'bg-white border border-[#E5E4E0] text-[#787774] hover:bg-[#FAF9F7] hover:text-[#1A1918]'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Calendar</span>
              </button>
            </div>

            {/* Detailed Destination Selector */}
            {selectedEntityType === 'task' && (
              <div className="relative pt-0.5">
                <button
                  type="button"
                  onClick={() => setShowEntityDropdown((prev) => !prev)}
                  className="w-full flex items-center justify-between text-left text-xs bg-white border border-[#E5E4E0] rounded-lg px-2.5 py-1.5 text-[#1A1918] hover:border-[#787774] transition-colors duration-200"
                >
                  <span className="truncate">
                    Task: {tasks.find((t) => t.id === selectedEntityId)?.title || 'Select task...'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#787774] shrink-0 ml-1" />
                </button>

                {showEntityDropdown && (
                  <div className="absolute left-0 right-0 bottom-8 z-40 bg-white border border-[#E5E4E0] rounded-lg shadow-lg p-1 max-h-36 overflow-y-auto space-y-0.5 text-xs">
                    {tasks.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleSelectSpecificEntity(t.id, t.title)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-md hover:bg-[#F4F3F0] truncate cursor-pointer transition-colors duration-200 ${
                          selectedEntityId === t.id ? 'bg-[#F4F3F0] text-[#1A1918] font-medium' : 'text-[#787774]'
                        }`}
                      >
                        {t.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedEntityType === 'project' && (
              <div className="relative pt-0.5">
                <button
                  type="button"
                  onClick={() => setShowEntityDropdown((prev) => !prev)}
                  className="w-full flex items-center justify-between text-left text-xs bg-white border border-[#E5E4E0] rounded-lg px-2.5 py-1.5 text-[#1A1918] hover:border-[#787774] transition-colors duration-200"
                >
                  <span className="truncate">
                    Project: {projects.find((p) => p.id === selectedEntityId)?.name || 'Select project...'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#787774] shrink-0 ml-1" />
                </button>

                {showEntityDropdown && (
                  <div className="absolute left-0 right-0 bottom-8 z-40 bg-white border border-[#E5E4E0] rounded-lg shadow-lg p-1 max-h-36 overflow-y-auto space-y-0.5 text-xs">
                    {projects.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectSpecificEntity(p.id, p.name)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-md hover:bg-[#F4F3F0] truncate cursor-pointer transition-colors duration-200 ${
                          selectedEntityId === p.id ? 'bg-[#F4F3F0] text-[#1A1918] font-medium' : 'text-[#787774]'
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedEntityType === 'calendar' && (
              <div className="text-xs text-[#787774] bg-[#FAF9F7] p-2 rounded-lg border border-[#E5E4E0]">
                Westport Shifts & Commute blocks. Extracted shifts will preview in a table for approval.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Prompts */}
      <div className="px-4 py-2.5 border-t border-black/[0.04] bg-slate-50/60 flex flex-wrap gap-1.5 shrink-0">
        {(coachMode === 'today' ? quickPromptsToday : quickPromptsWeek).map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => onSendMessage(prompt)}
            className="text-xs px-3 py-1.5 rounded-full border border-black/[0.04] bg-white hover:bg-slate-100 text-[#1A1D23] font-medium transition-all duration-200 cursor-pointer whitespace-nowrap active:scale-[0.98] shadow-2xs"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Composer */}
      <form 
        onSubmit={handleSubmit}
        className="p-3 border-t border-black/[0.04] bg-white flex items-center gap-2 shrink-0"
      >
        {/* Hidden File Input */}
        <input 
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".png,.jpg,.jpeg,.heic,.pdf,.docx,.md,.txt,image/*"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              processRawFile(e.target.files[0]);
              e.target.value = '';
            }
          }}
        />

        {/* Hidden Camera Input for Mobile Capture */}
        <input 
          ref={cameraInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          capture="environment"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              processRawFile(e.target.files[0]);
              e.target.value = '';
            }
          }}
        />

        {/* Paperclip button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#6B7280] hover:text-[#1A1D23] hover:bg-[#F7F7F8] transition-all duration-200 cursor-pointer shrink-0 active:scale-[0.98]"
          title="Attach file (PNG, JPG, HEIC, PDF, DOCX, MD, TXT)"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        {/* Mobile Camera button */}
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#6B7280] hover:text-[#1A1D23] hover:bg-[#F7F7F8] transition-all duration-200 cursor-pointer shrink-0 sm:hidden active:scale-[0.98]"
          title="Camera capture"
        >
          <Camera className="w-4 h-4" />
        </button>

        {/* Text Input */}
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            pendingAttachment 
              ? "Add a note or instruction for extraction..." 
              : coachMode === 'today' 
              ? "Ask Coach or drop an attachment..." 
              : "Ask Coach about weekly planning..."
          }
          className="flex-1 text-sm text-[#1A1D23] placeholder-slate-400 bg-[#F7F7F8] border border-black/[0.04] rounded-xl px-3.5 py-2 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none min-h-[44px] transition-colors"
        />

        {/* Send button (Primary: solid blue fill, 12px radius, diffuse shadow, active scale) */}
        <button
          type="submit"
          disabled={!inputText.trim() && !pendingAttachment}
          className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white transition-all duration-200 cursor-pointer shrink-0 shadow-[0_2px_8px_rgba(37,99,235,0.25)] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </aside>
  );
};
