export type ViewType = 'today' | 'calendar' | 'projects' | 'tasks' | 'timeline' | 'messages' | 'board';

export type TaskColumnId = 
  | 'backlog' 
  | 'todo' 
  | 'in_progress' 
  | 'waiting' 
  | 'in_review' 
  | 'done' 
  | 'cancelled' 
  | 'handoff'
  | 'paused';

export type BoardColumnId = TaskColumnId;

export interface ProjectCategory {
  id: string;
  name: string;
  color: string;
  badgeLetter: string;
  description?: string;
  icon?: string;
  isTemplateCategory?: boolean;
}

export type CanonicalArea = 'Career' | 'Magneto' | 'Shamanicca' | 'Finances' | 'Health & Soul' | 'Reference' | 'Personal';

export interface Project {
  id: string;
  name: string;
  client: string;
  scope: string;
  categoryId?: string;
  categoryName?: string;
  area: CanonicalArea | string;
  color?: string;
  gradient?: string;
  starred?: boolean;
  pinned?: boolean;
  isClosed?: boolean;
  isArchived?: boolean;
  lastViewedAt?: string;
  createdAt?: string;
  startAt?: string;
  dueAt?: string;
  hasCollision?: boolean;
}

export type ProjectStanding = {
  project: Project;
  committedMinutes: number;
  completedMinutes: number;
  progress: number;            // 0..1
  nextTask: Task | null;
  daysRemaining: number;
  availableBeforeDue: number;  // minutes
  risk: 'onTrack' | 'atRisk' | 'blocked' | 'noTasksLinked';
  expectedProgress: number;    // 0..1, elapsed startAt → now over startAt → dueAt
  paceDeltaMinutes: number;    // negative = behind pace
  hasNoLinkedTasks?: boolean;
};

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskComment {
  id: string;
  author: string;
  avatarUrl?: string;
  initials?: string;
  timestamp: string;
  text?: string;
  content?: string;
}

export interface TaskProperty {
  id: string;
  name: string;
  type: 'text' | 'select' | 'checkbox' | 'date' | 'url';
  value: string;
}

export interface Task {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  icon?: string; // e.g. '📝', '🏛️', '🔴', '💻'
  description: string;
  durationMinutes: number;
  durationDisplay: string;
  column: BoardColumnId;
  area: string;
  areaColor?: string;
  priority: 'P1' | 'P2' | 'P3' | string;
  priorityLabel?: string; // 'Important', 'Urgent', 'Low', 'Normal'
  energy: 'Deep' | 'Medium' | 'Low' | 'Empty';
  isMilestone?: boolean;
  scheduledDay?: string; // 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'
  scheduledStart?: string; // '13:30'
  scheduledEnd?: string; // '15:45'
  dueDate?: string;
  isToday?: boolean;
  subtasks: Subtask[];
  notes?: string;
  projectRelation?: string;
  tags?: string[];
  comments?: TaskComment[];
  customProperties?: TaskProperty[];
  actualMinutes?: number;
  actualDisplay?: string;
  estimateMinutes?: number;
  rescheduleCount?: number;
  blockedBy?: string[] | string;
  pinned?: boolean;
  dueAt?: string;
  status?: 'queued' | 'in_progress' | 'done' | 'backlog' | string;
  pausedReviewDate?: string;
  pausedReassignProject?: string;
  waitingSentDaysAgo?: number;
  slaHours?: number;
  followUpSent?: boolean;
  attachments?: AttachedFile[];
}

export type AttachmentFileType = 'image' | 'pdf' | 'document';
export type AttachmentEntityType = 'task' | 'project' | 'calendar';

export interface AttachedFile {
  id: string;
  name: string;
  sizeBytes: number;
  sizeFormatted: string;
  fileType: AttachmentFileType;
  extension: string;
  url: string;
  thumbnailUrl?: string;
  pageCount?: number;
  uploadedAt: string;
  entityType: AttachmentEntityType;
  entityId: string;
  entityName: string;
  parsedSummary?: string;
  categoryTag?: 'shift_schedule' | 'client_brief' | 'design_ref' | 'error_screenshot' | 'contract_invoice' | 'general';
}

export interface ExtractedShiftRow {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  shiftHours: number;
  doorToDoorFormatted: string;
  availableWindowFormatted: string;
  conflictWarning?: string;
  isLowConfidence?: boolean;
  confidenceNote?: string;
  confirmed?: boolean;
}

export interface ExtractedTaskRow {
  id: string;
  title: string;
  estimate: string;
  accepted: boolean;
}

export interface ExtractedProposal {
  id: string;
  type: 'shift_schedule' | 'client_brief' | 'contract_invoice' | 'none';
  summary: string;
  shifts?: ExtractedShiftRow[];
  tasks?: ExtractedTaskRow[];
  projectId?: string;
  projectName?: string;
  deadlineWarning?: {
    date: string;
    description: string;
    actionLabel: string;
  };
  applied?: boolean;
}

export interface ExternalCommitment {
  id: string;
  title: string;
  subline: string;
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  startTime: string; // '07:00'
  endTime: string; // '12:30'
  durationDisplay: string;
  location: string;
}

export interface AtRiskItem {
  id: string;
  taskId: string;
  projectName: string;
  title: string;
  shortfall: string; // e.g. "needs 4h, 1h30 available before Fri"
  hoursNeeded: number;
  hoursAvailable: number;
  dueDate: string;
}

export interface ChatAction {
  label: string;
  type: string;
  payload?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text: string;
  attachments?: AttachedFile[];
  proposal?: ExtractedProposal;
  suggestedAction?: {
    label: string;
    actionType: 'reschedule' | 'filter' | 'focus' | 'shorten_webgl' | string;
    payload?: string;
  };
  actions?: ChatAction[];
}

export type ActivityCategory = 
  | 'shift' 
  | 'dev' 
  | 'deep_work' 
  | 'routine' 
  | 'wellness' 
  | 'commute' 
  | 'meal' 
  | 'personal' 
  | 'sleep';

export interface CalendarActivity {
  id: string;
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  dayNumber: number; // 7 to 13
  title: string;
  subtitle?: string;
  startTime: string; // e.g. "5:30am"
  endTime: string;   // e.g. "1:15pm"
  startMinutes: number; // minutes from 00:00 (e.g. 5:30 am = 330)
  endMinutes: number;   // minutes from 00:00 (e.g. 1:15 pm = 795)
  category: ActivityCategory;
  bgClass: string;
  borderClass: string;
  textClass: string;
  iconType: string;
  notes?: string;
}

