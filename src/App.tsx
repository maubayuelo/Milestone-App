import React, { useState, useEffect } from 'react';
import { 
  ViewType, 
  Task, 
  AtRiskItem, 
  ChatMessage, 
  BoardColumnId, 
  AttachedFile, 
  ExtractedShiftRow, 
  ExtractedTaskRow,
  ExternalCommitment
} from './types';
import { 
  INITIAL_PROJECTS, 
  INITIAL_TASKS, 
  INITIAL_COMMITMENTS, 
  INITIAL_AT_RISK, 
  INITIAL_CHAT_MESSAGES 
} from './mockData';
import { INITIAL_ATTACHMENTS, extractAttachmentProposal } from './data/attachmentsData';
import { Navigation } from './components/Navigation';
import { ChatPanel } from './components/ChatPanel';
import { BottomNavBar } from './components/BottomNavBar';
import { TaskPeekModal } from './components/TaskPeekModal';
import { CaptureModal } from './components/CaptureModal';
import { LightboxModal } from './components/LightboxModal';
import { ProjectFilesModal } from './components/ProjectFilesModal';
import { CalendarView } from './views/CalendarView';
import { TodayView } from './views/TodayView';
import { BoardView } from './views/BoardView';
import { GanttTimeline } from './components/GanttTimeline';

export default function App() {
  // Desktop view routing: 'today' | 'calendar' | 'board' | 'timeline'
  const [currentView, setCurrentView] = useState<ViewType>('today');
  const [chatCollapsed, setChatCollapsed] = useState<boolean>(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(INITIAL_PROJECTS[0].id);
  
  // Data states
  const [projects] = useState(INITIAL_PROJECTS);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [commitments, setCommitments] = useState<ExternalCommitment[]>(INITIAL_COMMITMENTS);
  const [atRiskItems, setAtRiskItems] = useState<AtRiskItem[]>(INITIAL_AT_RISK);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  
  // Attachments & Modals
  const [attachments, setAttachments] = useState<AttachedFile[]>(INITIAL_ATTACHMENTS);
  const [lightboxFile, setLightboxFile] = useState<AttachedFile | null>(null);
  const [isProjectFilesOpen, setIsProjectFilesOpen] = useState<boolean>(false);
  
  // Persistent session undo state (Rule: Extraction is reversible for the whole session — a persistent undo, not a toast)
  const [activeSessionUndo, setActiveSessionUndo] = useState<{
    proposalId: string;
    description: string;
  } | null>(null);
  const [undoSnapshot, setUndoSnapshot] = useState<{
    commitments?: ExternalCommitment[];
    tasks?: Task[];
  } | null>(null);

  // Board view mode & filter states
  const [boardDisplayMode, setBoardDisplayMode] = useState<'kanban' | 'gantt'>('kanban');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('all');

  // Modals & Panels
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isCaptureOpen, setIsCaptureOpen] = useState<boolean>(false);
  const [overageMinutes, setOverageMinutes] = useState<number>(30);
  const [calendarDayNumber, setCalendarDayNumber] = useState<number>(7);

  // Global Cmd+K keyboard shortcut & window scroll reset
  useEffect(() => {
    window.scrollTo(0, 0);
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCaptureOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync selected task with latest task state if updated
  const handleUpdateTask = (updated: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setSelectedTask(updated);
  };

  // Add new captured task
  const handleCreateTask = (newTask: Task) => {
    setTasks((prev) => [newTask, ...prev]);
    
    // Add feedback message in chat assistant
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    setChatMessages((prev) => [
      ...prev,
      {
        id: `msg-captured-${Date.now()}`,
        sender: 'assistant',
        timestamp: timeStr,
        text: `Captured "${newTask.title}" for ${newTask.projectName.split('—')[0].trim()} (${newTask.durationDisplay}, ${newTask.energy} energy). Shift buffer preserved.`,
      },
    ]);
  };

  // Reschedule an at-risk item
  const handleRescheduleAtRisk = (item: AtRiskItem) => {
    setAtRiskItems((prev) => prev.filter((r) => r.id !== item.id));
    setOverageMinutes((prev) => Math.max(0, prev - 15));
    
    setTasks((prev) =>
      prev.map((t) =>
        t.id === item.taskId
          ? { ...t, dueDate: 'Next Tue, Sep 8 (Rescheduled)', scheduledDay: 'Tue' }
          : t
      )
    );

    setChatMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        timestamp: '13:05',
        text: `Rescheduled "${item.title}". Moved to next Tuesday after Dr. Halpert appointment, preserving Friday evening down-time.`,
      },
    ]);
  };

  // Shorten an at-risk item
  const handleShortenAtRisk = (item: AtRiskItem) => {
    setAtRiskItems((prev) => prev.filter((r) => r.id !== item.id));
    setOverageMinutes((prev) => Math.max(0, prev - 30));

    setTasks((prev) =>
      prev.map((t) =>
        t.id === item.taskId
          ? {
              ...t,
              durationMinutes: Math.round(item.hoursAvailable * 60),
              durationDisplay: `${item.hoursAvailable}h00`,
            }
          : t
      )
    );

    setChatMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        timestamp: '13:06',
        text: `Trimmed "${item.title}" to ${item.hoursAvailable}h scope. Deliverable fits within Friday shift recovery gap.`,
      },
    ]);
  };

  // Drop an at-risk item
  const handleDropAtRisk = (item: AtRiskItem) => {
    setAtRiskItems((prev) => prev.filter((r) => r.id !== item.id));
    setOverageMinutes((prev) => Math.max(0, prev - 20));

    setChatMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        timestamp: '13:07',
        text: `Dropped "${item.title}" from immediate commitment queue. Logged in Backlog for next freelance cycle.`,
      },
    ]);
  };

  // Move task column on board
  const handleMoveTaskColumn = (taskId: string, newCol: BoardColumnId) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, column: newCol } : t))
    );
  };

  // Move task time on calendar
  const handleMoveTaskTime = (taskId: string, day: string, startHour: string) => {
    const [h] = startHour.split(':').map(Number);
    const endH = (h + 2).toString().padStart(2, '0');
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              scheduledDay: day,
              scheduledStart: startHour,
              scheduledEnd: `${endH}:00`,
            }
          : t
      )
    );
  };

  // Chat message submission with attachment parsing & proposal
  const handleSendMessage = (text: string, attachment?: AttachedFile) => {
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }).toLowerCase();

    // If attachment present, register to global store and task if linked
    if (attachment) {
      setAttachments((prev) => [attachment, ...prev]);

      if (attachment.entityType === 'task') {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === attachment.entityId
              ? { ...t, attachments: [attachment, ...(t.attachments || [])] }
              : t
          )
        );
      }
    }

    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      timestamp: timeStr,
      text: text || (attachment ? `Attached: ${attachment.name}` : ''),
      attachments: attachment ? [attachment] : undefined,
    };

    if (attachment) {
      // Extraction Proposal logic
      const { summary, proposal, responseMessage } = extractAttachmentProposal(attachment);

      const replyMsg: ChatMessage = {
        id: `msg-assistant-${Date.now() + 1}`,
        sender: 'assistant',
        timestamp: timeStr,
        text: responseMessage,
        proposal,
      };

      setChatMessages((prev) => [...prev, userMsg, replyMsg]);
      return;
    }

    // Default conversational responses
    let replyText = "I've reviewed your commitments. Your freelance blocks are structured around the Westport Provisions schedule without exceeding fatigue limits.";
    let suggestedAction: ChatMessage['suggestedAction'] = undefined;

    const lower = text.toLowerCase();
    if (lower.includes('overage') || lower.includes('rebalance') || lower.includes('30 min') || lower.includes('30m')) {
      replyText = "To resolve today's 30 min overage, shorten the WebGL reel scrubber task from 47 min to 25 min (prototype pass). This secures a 45-minute buffer before your evening break.";
      suggestedAction = {
        label: 'Apply: Shorten WebGL task to 25 min',
        actionType: 'shorten_webgl',
        payload: 'task-s-webgl',
      };
    } else if (lower.includes('sunday') || lower.includes('shift')) {
      replyText = "Your Sunday shift runs 14:30 to 21:15 (Registers & Safe Audit). That leaves 08:30 to 13:00 (4h30) available for deep work on the Stillness App binaural oscillator.";
    } else if (lower.includes('energy') || lower.includes('low')) {
      replyText = "For low energy slots after physical retail shifts, batch these 2 tasks: Komorebi vertical glyph review (55 min) and structured schema meta review (40 min). No heavy logic required.";
    } else if (lower.includes('sonder') || lower.includes('video')) {
      replyText = "Sonder Film Co. has 3 active deliverables. The frame-accurate video scrubber requires 4h of uninterrupted deep focus, best scheduled for Saturday morning.";
    }

    const replyMsg: ChatMessage = {
      id: `msg-assistant-${Date.now() + 1}`,
      sender: 'assistant',
      timestamp: timeStr,
      text: replyText,
      suggestedAction,
    };

    setChatMessages((prev) => [...prev, userMsg, replyMsg]);
  };

  // Proposal: Apply Shifts to Calendar
  const handleApplyShifts = (proposalId: string, shifts: ExtractedShiftRow[]) => {
    // Snapshot for persistent undo
    setUndoSnapshot({ commitments: [...commitments] });

    // Map shifts into ExternalCommitments
    const newCommitments: ExternalCommitment[] = shifts.map((s, idx) => {
      const dayMap: { [k: string]: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun' } = {
        'Mon Sep 14': 'Mon',
        'Tue Sep 15': 'Tue',
        'Wed Sep 16': 'Wed',
        'Thu Sep 17': 'Thu',
        'Fri Sep 18': 'Fri',
      };
      const day = dayMap[s.date] || 'Mon';

      return {
        id: `comm-shift-${Date.now()}-${idx}`,
        title: `Westport Shift (${s.startTime} — ${s.endTime})`,
        subline: 'Barista / Inventory · Store #0824',
        day,
        startTime: s.startTime,
        endTime: s.endTime,
        durationDisplay: `${s.shiftHours}h00`,
        location: 'Store #0824',
      };
    });

    setCommitments((prev) => [...prev, ...newCommitments]);

    // Mark proposal applied in chat
    setChatMessages((prev) =>
      prev.map((m) =>
        m.proposal && m.proposal.id === proposalId
          ? { ...m, proposal: { ...m.proposal, applied: true } }
          : m
      )
    );

    setActiveSessionUndo({
      proposalId,
      description: `${shifts.length} shifts added to calendar from schedule photo.`,
    });
  };

  // Proposal: Apply Tasks to Board
  const handleApplyTasks = (
    proposalId: string,
    proposedTasks: ExtractedTaskRow[],
    projectId?: string
  ) => {
    // Snapshot for undo
    setUndoSnapshot({ tasks: [...tasks] });

    const accepted = proposedTasks.filter((t) => t.accepted);
    const targetProject = projects.find((p) => p.id === projectId) || projects[0];

    const newTasks: Task[] = accepted.map((t, idx) => ({
      id: `task-imported-${Date.now()}-${idx}`,
      projectId: targetProject.id,
      title: t.title,
      projectName: targetProject.name,
      projectRelation: targetProject.name,
      description: `Deliverable extracted from client brief. Estimated ${t.estimate}.`,
      area: 'career',
      column: 'todo',
      durationMinutes: t.estimate.includes('1h 30m') ? 90 : t.estimate.includes('2h 15m') ? 135 : 60,
      durationDisplay: t.estimate,
      energy: 'Medium',
      priority: 'P2',
      priorityLabel: 'Important',
      isDeliverable: true,
      subtasks: [],
      comments: [],
      attachments: [],
    }));

    setTasks((prev) => [...newTasks, ...prev]);

    // Mark proposal applied
    setChatMessages((prev) =>
      prev.map((m) =>
        m.proposal && m.proposal.id === proposalId
          ? { ...m, proposal: { ...m.proposal, applied: true } }
          : m
      )
    );

    setActiveSessionUndo({
      proposalId,
      description: `${accepted.length} tasks added to ${targetProject.name.split('—')[0].trim()} from brief.`,
    });
  };

  // Proposal: Apply Deadline from Contract
  const handleApplyDeadline = (date: string, description: string) => {
    // Set deadline on relevant task or project
    setTasks((prev) =>
      prev.map((t) =>
        t.projectName.toLowerCase().includes('komorebi')
          ? { ...t, dueDate: date }
          : t
      )
    );

    setChatMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        timestamp: 'Just now',
        text: `Target delivery deadline updated to ${date} (${description}). Milestone markers aligned on Timeline.`,
      },
    ]);
  };

  // Persistent Undo Action
  const handleUndoProposal = (proposalId: string) => {
    if (undoSnapshot) {
      if (undoSnapshot.commitments) setCommitments(undoSnapshot.commitments);
      if (undoSnapshot.tasks) setTasks(undoSnapshot.tasks);
    }

    setActiveSessionUndo(null);
    setUndoSnapshot(null);

    // Revert proposal in messages
    setChatMessages((prev) =>
      prev.map((m) =>
        m.proposal && m.proposal.id === proposalId
          ? { ...m, proposal: { ...m.proposal, applied: false } }
          : m
      )
    );

    setChatMessages((prev) => [
      ...prev,
      {
        id: `msg-undo-${Date.now()}`,
        sender: 'assistant',
        timestamp: 'Just now',
        text: 'Reverted batch import. Calendar and Board have been restored to prior state.',
      },
    ]);
  };

  // Add attachment directly to a task
  const handleAddAttachmentToTask = (taskId: string, file: AttachedFile) => {
    setAttachments((prev) => [file, ...prev]);
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, attachments: [file, ...(t.attachments || [])] }
          : t
      )
    );
  };

  // Delete file
  const handleDeleteFile = (fileId: string) => {
    setAttachments((prev) => prev.filter((f) => f.id !== fileId));
    setTasks((prev) =>
      prev.map((t) => ({
        ...t,
        attachments: t.attachments?.filter((a) => a.id !== fileId) || [],
      }))
    );
  };

  const handleActionClick = (actionType: string, payload?: string) => {
    if (actionType === 'shorten_webgl' || payload === 'task-s-webgl') {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === 'task-s-webgl'
            ? { ...t, durationMinutes: 25, durationDisplay: '25 min', scheduledEnd: '16:40' }
            : t
        )
      );
      setOverageMinutes(0);
      setChatMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          sender: 'assistant',
          timestamp: '13:15',
          text: 'WebGL scrub task shortened to 25 min. Today’s schedule is now balanced with 0 overage.',
        },
      ]);
    } else if (actionType === 'reschedule' && payload) {
      const task = tasks.find((t) => t.id === payload);
      if (task) {
        setSelectedTask(task);
      }
    }
  };

  // Open message view / focus chat from task card
  const handleOpenMessageForTask = (task: Task) => {
    setChatCollapsed(false);
    setChatMessages((prev) => [
      ...prev,
      {
        id: `msg-open-${Date.now()}`,
        sender: 'assistant',
        timestamp: 'Just now',
        text: `Viewing details for "${task.title}" (${task.projectName}). Estimated ${task.durationDisplay}. All retail buffers intact.`,
      },
    ]);
  };

  // Today view task partitioning
  const primaryTodayTask = tasks.find((t) => t.column === 'in-progress') || tasks[0];
  const secondaryTodayTasks = tasks.filter(
    (t) => t.id !== primaryTodayTask.id && (t.scheduledDay === 'Today' || t.column === 'next-up')
  );

  return (
    <div 
      className={`h-full w-full max-h-full max-w-full bg-[#F7F7F8] font-sans antialiased text-slate-900 overflow-hidden select-none grid ${
        chatCollapsed
          ? 'grid-cols-1 md:grid-cols-[88px_1fr]'
          : 'grid-cols-1 md:grid-cols-[88px_1fr] xl:grid-cols-[88px_1fr_380px]'
      }`}
    >
      {/* 1. Left Nav Rail (88px explicit grid column on desktop, hidden on mobile) */}
      <Navigation
        currentView={currentView}
        onViewChange={(view) => setCurrentView(view)}
        onOpenCapture={() => setIsCaptureOpen(true)}
        chatCollapsed={chatCollapsed}
        onToggleChat={() => setChatCollapsed((prev) => !prev)}
        onOpenFiles={() => setIsProjectFilesOpen(true)}
      />

      {/* 2. Central App Canvas (Fills 1fr in the grid) */}
      <main 
        id="main-content-layout"
        className="h-full overflow-hidden flex flex-col bg-[#F7F7F8] min-w-0"
      >
        {currentView === 'calendar' && (
          <CalendarView
            tasks={tasks}
            commitments={commitments}
            onSelectTask={setSelectedTask}
            onMoveTaskTime={handleMoveTaskTime}
            onOpenCapture={() => setIsCaptureOpen(true)}
            initialDayNumber={calendarDayNumber}
          />
        )}

        {currentView === 'today' && (
          <TodayView
            primaryTask={primaryTodayTask}
            secondaryTasks={secondaryTodayTasks}
            atRiskItems={atRiskItems}
            onSelectTask={setSelectedTask}
            onRescheduleAtRisk={handleRescheduleAtRisk}
            onShortenAtRisk={handleShortenAtRisk}
            onDropAtRisk={handleDropAtRisk}
            onOpenMessage={handleOpenMessageForTask}
            onNavigateToCalendar={(_dayKey, dayNumber) => {
              if (dayNumber) setCalendarDayNumber(dayNumber);
              setCurrentView('calendar');
            }}
            onNavigateToTimeline={() => setCurrentView('timeline')}
            onOpenCreate={() => setIsCaptureOpen(true)}
            overageMinutes={overageMinutes}
            commitments={commitments}
            tasks={tasks}
          />
        )}

        {currentView === 'board' && (
          <BoardView
            projects={projects}
            selectedProjectId={selectedProjectId}
            onSelectProject={setSelectedProjectId}
            tasks={tasks}
            onSelectTask={setSelectedTask}
            onMoveTaskColumn={handleMoveTaskColumn}
            onOpenCapture={() => setIsCaptureOpen(true)}
            selectedAreaFilter={selectedAreaFilter}
            selectedStatusFilter={selectedStatusFilter}
            selectedProjectFilter={selectedProjectFilter}
          />
        )}

        {currentView === 'timeline' && (
          <GanttTimeline
            projects={projects}
            selectedProjectId={selectedProjectId}
            onSelectProject={setSelectedProjectId}
            tasks={tasks}
            onSelectTask={setSelectedTask}
            onOpenCapture={() => setIsCaptureOpen(true)}
          />
        )}
      </main>

      {/* 3. Right Collapsible Coach Panel */}
      <ChatPanel
        collapsed={chatCollapsed}
        onToggleCollapse={() => setChatCollapsed((prev) => !prev)}
        messages={chatMessages}
        onSendMessage={handleSendMessage}
        tasks={tasks}
        projects={projects}
        commitments={commitments}
        onActionClick={handleActionClick}
        overageMinutes={overageMinutes}
        onOpenFileInLightbox={(file) => setLightboxFile(file)}
        onApplyShifts={handleApplyShifts}
        onApplyTasks={handleApplyTasks}
        onApplyDeadline={handleApplyDeadline}
        onUndoProposal={handleUndoProposal}
        onOpenProjectFiles={() => setIsProjectFilesOpen(true)}
        activeSessionUndo={activeSessionUndo}
      />

      {/* 4. Desktop Right Slide-Over Inspector Drawer */}
      <TaskPeekModal
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdateTask={handleUpdateTask}
        masterProjects={projects}
        onOpenFileInLightbox={(file) => setLightboxFile(file)}
        allAttachments={attachments}
        onAddAttachmentToTask={handleAddAttachmentToTask}
      />

      {/* 5. Desktop Centered Quick Capture Modal (Cmd+K) */}
      <CaptureModal
        isOpen={isCaptureOpen}
        onClose={() => setIsCaptureOpen(false)}
        projects={projects}
        onCreateTask={handleCreateTask}
      />

      {/* 6. Lightbox Modal for Full Image Inspection & Zoom */}
      <LightboxModal
        file={lightboxFile}
        onClose={() => setLightboxFile(null)}
      />

      {/* 7. Searchable Project Files List & Supabase Storage Quota */}
      <ProjectFilesModal
        isOpen={isProjectFilesOpen}
        onClose={() => setIsProjectFilesOpen(false)}
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProjectId={setSelectedProjectId}
        files={attachments}
        onUploadFile={(newFile) => setAttachments((prev) => [newFile, ...prev])}
        onDeleteFile={handleDeleteFile}
        onOpenFileInLightbox={(file) => setLightboxFile(file)}
      />

      {/* 8. Mobile Bottom Navigation Bar (below 768px) */}
      <BottomNavBar
        currentView={currentView}
        onViewChange={(view) => setCurrentView(view)}
        onOpenCreate={() => setIsCaptureOpen(true)}
      />
    </div>
  );
}
