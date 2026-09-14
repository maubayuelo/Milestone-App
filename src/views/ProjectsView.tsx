import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Project,
  Task,
  CanonicalArea,
  AtRiskItem,
  ProjectStanding
} from '../types';
import {
  Star,
  Plus,
  Search,
  Layers,
  FolderPlus,
  X,
  MoreHorizontal,
  Trash2,
  Archive,
  Pin,
  Edit3,
  BookOpen
} from 'lucide-react';
import { ProjectSideSheet } from '../components/ProjectSideSheet';
import { getCanonicalArea, getAreaStyleByCanonicalArea } from '../utils/areaColor';
import { computeProjectStandings } from '../utils/projectStanding';

interface ProjectsViewProps {
  projects: Project[];
  tasks: Task[];
  atRiskItems?: AtRiskItem[];
  onSelectProject: (projectId: string) => void;
  onOpenBoardForProject?: (projectId: string) => void;
  onCreateProject: (newProject: Omit<Project, 'id'>) => void;
  onToggleStarProject: (projectId: string) => void;
  onDeleteProject?: (projectId: string) => void;
  onUpdateProject?: (updated: Project) => void;
  onAddTask?: (newTask: Omit<Task, 'id'>) => void;
  onUpdateTask?: (updated: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  onOpenCreateTask?: (projectId?: string) => void;
}

// Fix 3: Six canonical areas in exact specified order, plus Personal as seventh
// Color is derived from utils/areaColor.ts — the single source of truth for area color.
export const CANONICAL_AREAS: {
  id: CanonicalArea;
  name: string;
  color: string;
  description: string;
}[] = [
  {
    id: 'Career',
    name: 'Career',
    color: getAreaStyleByCanonicalArea('Career').hexColor,
    description: 'Professional positions, employment and institutional commitments'
  },
  {
    id: 'Magneto',
    name: 'Magneto',
    color: getAreaStyleByCanonicalArea('Magneto').hexColor,
    description: 'Client design initiatives, brand systems, and agency deliverables'
  },
  {
    id: 'Shamanicca',
    name: 'Shamanicca',
    color: getAreaStyleByCanonicalArea('Shamanicca').hexColor,
    description: 'Mindfulness audio, ambient synthesis, and experimental ventures'
  },
  {
    id: 'Finances',
    name: 'Finances',
    color: getAreaStyleByCanonicalArea('Finances').hexColor,
    description: 'Tax preparation, freelance accounting, invoices, and budgets'
  },
  {
    id: 'Health & Soul',
    name: 'Health & Soul',
    color: getAreaStyleByCanonicalArea('Health & Soul').hexColor,
    description: 'Rest cycles, sleep consistency, mindfulness, and personal recovery'
  },
  {
    id: 'Learning',
    name: 'Learning',
    color: getAreaStyleByCanonicalArea('Learning').hexColor,
    description: 'Documentation, SOPs, archives, and evergreen reference notes'
  },
  {
    id: 'Personal',
    name: 'Personal',
    color: getAreaStyleByCanonicalArea('Personal').hexColor,
    description: 'Montreal housing project, Anormal, and personal lifestyle'
  },
];

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  tasks,
  atRiskItems = [],
  onSelectProject,
  onCreateProject,
  onToggleStarProject,
  onDeleteProject,
  onUpdateProject,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
}) => {
  const [activeAreaTab, setActiveAreaTab] = useState<'all' | 'starred' | CanonicalArea>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [selectedAreaForNewProject, setSelectedAreaForNewProject] = useState<CanonicalArea>('Career');
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  // Project creation form state
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectArea, setNewProjectArea] = useState<CanonicalArea>('Career');
  const [newProjectClient, setNewProjectClient] = useState('');
  const [newProjectScope, setNewProjectScope] = useState('');
  const [newProjectStarred, setNewProjectStarred] = useState(false);

  // Compute live task counts and completion percentage per project (Fix 1: Never a repeated constant)
  const projectMetrics = useMemo(() => {
    const metrics: Record<string, { total: number; done: number; percentage: number; hours: number }> = {};
    for (const p of projects) {
      const pTasks = tasks.filter(
        t => t.projectId === p.id || (t.projectName && t.projectName.toLowerCase().includes(p.name.toLowerCase()))
      );
      const total = pTasks.length;
      const done = pTasks.filter(t => t.column === 'done' || t.status === 'done').length;
      const percentage = total > 0 ? Math.round((done / total) * 100) : 0;
      const totalMinutes = pTasks.reduce((acc, t) => acc + (t.estimateMinutes ?? t.durationMinutes ?? 0), 0);
      const hours = Math.round((totalMinutes / 60) * 10) / 10;
      metrics[p.id] = { total, done, percentage, hours };
    }
    return metrics;
  }, [projects, tasks]);

  // Risk + pace per project (A2) — same algorithm/util as the Standing view (TodayView),
  // not recomputed, just surfaced here keyed by project id.
  const standingsById = useMemo(() => {
    const standings = computeProjectStandings(projects, tasks, atRiskItems);
    const map: Record<string, ProjectStanding> = {};
    for (const s of standings) {
      map[s.project.id] = s;
    }
    return map;
  }, [projects, tasks, atRiskItems]);

  // Active project counts per area (Fix 3: The count beside each area is ACTIVE projects, not total)
  const activeAreaCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    CANONICAL_AREAS.forEach(area => {
      counts[area.id] = projects.filter(
        p => !p.isClosed && !p.isArchived && getCanonicalArea(p.area, p.name) === area.id
      ).length;
    });
    return counts;
  }, [projects]);

  // Total active projects
  const totalActiveProjects = useMemo(() => {
    return projects.filter(p => !p.isClosed && !p.isArchived).length;
  }, [projects]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesClient = p.client?.toLowerCase().includes(q);
        const matchesScope = p.scope?.toLowerCase().includes(q);
        const matchesArea = p.area?.toLowerCase().includes(q);
        if (!matchesName && !matchesClient && !matchesScope && !matchesArea) return false;
      }

      // Tab filter
      if (activeAreaTab === 'starred') {
        return p.starred;
      }
      if (activeAreaTab !== 'all') {
        return getCanonicalArea(p.area, p.name) === activeAreaTab;
      }
      return true;
    });
  }, [projects, searchQuery, activeAreaTab]);

  // Starred projects
  const starredProjects = useMemo(() => {
    return projects.filter(p => p.starred && !p.isClosed && !p.isArchived);
  }, [projects]);

  // Group projects by canonical area
  const projectsByArea = useMemo(() => {
    const groups: { area: typeof CANONICAL_AREAS[0]; projects: Project[] }[] = [];
    
    for (const area of CANONICAL_AREAS) {
      const areaProjects = filteredProjects.filter(
        p => getCanonicalArea(p.area, p.name) === area.id
      );
      if (activeAreaTab === 'all' || activeAreaTab === area.id) {
        groups.push({ area, projects: areaProjects });
      }
    }

    return groups;
  }, [filteredProjects, activeAreaTab]);

  // Handlers
  const handleOpenCreateProjectModal = (preselectedArea?: CanonicalArea) => {
    const targetArea = preselectedArea || 'Career';
    setSelectedAreaForNewProject(targetArea);
    setNewProjectArea(targetArea);
    setNewProjectTitle('');
    setNewProjectClient('');
    setNewProjectScope('');
    setNewProjectStarred(false);
    setIsCreateProjectOpen(true);
  };

  const handleSubmitNewProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectTitle.trim()) return;

    onCreateProject({
      name: newProjectTitle.trim(),
      client: newProjectClient.trim() || 'Internal Work',
      scope: newProjectScope.trim() || 'Project roadmap and deliverables',
      area: newProjectArea,
      starred: newProjectStarred,
      lastViewedAt: new Date().toISOString(),
      createdAt: new Date().toISOString().split('T')[0],
      isClosed: false,
    });

    setIsCreateProjectOpen(false);
  };

  const handleArchiveProject = (project: Project) => {
    if (onUpdateProject) {
      onUpdateProject({
        ...project,
        isClosed: !project.isClosed,
      });
    }
  };

  return (
    <div id="projects-view" className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-[#F7F7F8]">
      {/* -------------------------------------------------------------
          1. LEFT AREAS SIDEBAR (Fix 3: 7 Canonical Areas)
          ------------------------------------------------------------- */}
      <aside 
        id="areas-sidebar" 
        className="w-full md:w-64 lg:w-72 bg-white border-r border-black/[0.06] flex flex-col shrink-0 overflow-y-auto"
      >
        <div className="p-4 border-b border-black/[0.04] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-[0_2px_6px_rgba(37,99,235,0.25)]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1A1D23] leading-none">Areas</h2>
              <span className="text-[11px] font-sans text-[#6B7280]">Life & Work Domains</span>
            </div>
          </div>
        </div>

        {/* Navigation links (Fix 3: Removed Templates & Create Workspace) */}
        <div className="p-3 space-y-1">
          <button
            onClick={() => setActiveAreaTab('all')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
              activeAreaTab === 'all'
                ? 'bg-blue-50 text-blue-700'
                : 'text-[#1A1D23] hover:bg-slate-100/70'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>All Projects</span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white border border-black/[0.06] text-[#6B7280]">
              {totalActiveProjects}
            </span>
          </button>

          <button
            onClick={() => setActiveAreaTab('starred')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
              activeAreaTab === 'starred'
                ? 'bg-amber-50 text-amber-800'
                : 'text-[#1A1D23] hover:bg-slate-100/70'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
              <span>Starred Projects</span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white border border-black/[0.06] text-[#6B7280]">
              {starredProjects.length}
            </span>
          </button>
        </div>

        <div className="px-4 py-2 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#9CA3AF]">
            Canonical Areas
          </span>
          <span className="text-[11px] font-mono text-[#9CA3AF]">{CANONICAL_AREAS.length}</span>
        </div>

        {/* List of 7 Canonical Areas */}
        <div className="px-3 pb-4 space-y-1 flex-1">
          {CANONICAL_AREAS.map((area) => {
            const activeCount = activeAreaCounts[area.id] || 0;
            const isActive = activeAreaTab === area.id;

            return (
              <div
                key={area.id}
                onClick={() => setActiveAreaTab(isActive ? 'all' : area.id)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-150 ${
                  isActive
                    ? 'bg-slate-100 text-[#1A1D23] shadow-xs'
                    : 'text-[#1A1D23] hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: area.color }}
                  />
                  <span className="truncate">{area.name}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span 
                    className={`text-[11px] font-mono px-1.5 py-0.5 rounded-md ${
                      activeCount > 0 ? 'bg-slate-100 text-slate-700 font-semibold' : 'text-[#9CA3AF]'
                    }`}
                  >
                    {activeCount}
                  </span>
                  {area.id !== 'Learning' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenCreateProjectModal(area.id);
                      }}
                      className="w-5 h-5 rounded-md hover:bg-slate-200/70 text-[#9CA3AF] hover:text-[#1A1D23] flex items-center justify-center transition-opacity"
                      title={`Add project to ${area.name}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* -------------------------------------------------------------
          2. MAIN CONTENT CANVAS
          ------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        {/* Top Action Bar (Fix 3: Renamed to All Projects) */}
        <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-black/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-[#1A1D23] tracking-tight">
              {activeAreaTab === 'all' 
                ? 'All Projects' 
                : activeAreaTab === 'starred'
                ? 'Starred Projects'
                : CANONICAL_AREAS.find(a => a.id === activeAreaTab)?.name || 'Projects'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-[#475569] text-xs font-mono font-medium">
              {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-[#F7F7F8] hover:bg-slate-100 focus:bg-white border border-black/[0.06] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all placeholder:text-[#9CA3AF]"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#1A1D23]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Create Project Button */}
            <button
              onClick={() => handleOpenCreateProjectModal(activeAreaTab !== 'all' && activeAreaTab !== 'starred' ? activeAreaTab : undefined)}
              className="flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all duration-200 shadow-[0_2px_8px_rgba(37,99,235,0.25)] active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Project</span>
            </button>
          </div>
        </header>

        {/* Canvas Body — every path below renders from `filteredProjects`, the
            same source the header count (line ~381) reads from, so the grid and
            the count can never diverge again (that divergence was the root cause
            of the "Starred Projects: 5 in the count, 0 cards" bug). */}
        <div className="p-6 md:p-8 space-y-10 max-w-7xl w-full mx-auto">
          {/* -------------------------------------------------------------
              SECTION A: ⭐ STARRED PROJECTS — embedded highlight row.
              Only in the 'all' tab (its own dedicated 'starred' tab view is
              Section A2 below); suppressed while searching, same as before.
              ------------------------------------------------------------- */}
          {activeAreaTab === 'all' && !searchQuery && (() => {
            const starredInView = filteredProjects.filter((p) => p.starred);
            if (starredInView.length === 0) return null;
            return (
              <section id="starred-projects-section" className="space-y-4">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                  <h2 className="text-sm font-bold text-[#1A1D23] uppercase tracking-[0.04em]">
                    Starred Projects
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {starredInView.map((p) => (
                    <ProjectCard
                      key={`starred-${p.id}`}
                      project={p}
                      metrics={projectMetrics[p.id]}
                      standing={standingsById[p.id]}
                      onEditProject={() => setEditingProject(p)}
                      onToggleStar={() => onToggleStarProject(p.id)}
                      onArchive={() => handleArchiveProject(p)}
                      onDelete={onDeleteProject ? () => onDeleteProject(p.id) : undefined}
                      onSelectProject={() => onSelectProject(p.id)}
                    />
                  ))}
                </div>
              </section>
            );
          })()}

          {/* -------------------------------------------------------------
              SECTION A2: 'starred' TAB — flat grid, no area sub-grouping.
              Starred already reads as a single flat row (not grouped by area)
              in the 'all' tab above, so this dedicated view keeps that same
              visual language instead of introducing area headers for it.
              ------------------------------------------------------------- */}
          {activeAreaTab === 'starred' && (
            <section id="starred-only-section" className="space-y-4">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                <h2 className="text-sm font-bold text-[#1A1D23] uppercase tracking-[0.04em]">
                  Starred Projects
                </h2>
              </div>

              {filteredProjects.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-black/[0.08] p-6 text-center">
                  <p className="text-xs text-[#6B7280]">
                    {searchQuery ? 'No starred projects match your search.' : 'No starred projects yet.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {filteredProjects.map((p) => (
                    <ProjectCard
                      key={p.id}
                      project={p}
                      metrics={projectMetrics[p.id]}
                      standing={standingsById[p.id]}
                      onEditProject={() => setEditingProject(p)}
                      onToggleStar={() => onToggleStarProject(p.id)}
                      onArchive={() => handleArchiveProject(p)}
                      onDelete={onDeleteProject ? () => onDeleteProject(p.id) : undefined}
                      onSelectProject={() => onSelectProject(p.id)}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* -------------------------------------------------------------
              SECTION B: CANONICAL AREAS WITH PROJECTS — 'all' tab and any
              single-area tab. Not rendered for 'starred' (Section A2 owns that).
              ------------------------------------------------------------- */}
          {activeAreaTab !== 'starred' && (
          <section id="areas-grouped-section" className="space-y-10">
            {projectsByArea.map(({ area, projects: areaProjects }) => (
              <div key={area.id} className="space-y-4">
                {/* Area Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-black/[0.04] shadow-xs">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: area.color }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-[#1A1D23] tracking-tight leading-snug">
                          {area.name}
                        </h3>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                          {areaProjects.filter(p => !p.isClosed && !p.isArchived).length} active
                        </span>
                      </div>
                      <p className="text-xs text-[#6B7280]">{area.description}</p>
                    </div>
                  </div>

                  {area.id !== 'Learning' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenCreateProjectModal(area.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#1A1D23] text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Project</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Fix 3: Learning holds zero projects -> Render real empty state */}
                {area.id === 'Learning' ? (
                  <div className="bg-white rounded-2xl border border-dashed border-black/[0.08] p-8 flex flex-col items-center justify-center text-center max-w-lg mx-auto">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-2.5 shadow-2xs">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: area.color }}
                      />
                    </div>
                    <h4 className="text-sm font-bold text-[#1A1D23] mb-1">
                      No Active Projects in Learning
                    </h4>
                    <p className="text-xs text-[#6B7280] leading-relaxed max-w-md">
                      Learning holds static documentation, SOPs, archives, contracts, and evergreen notes. Active deliverables are managed within functional areas.
                    </p>
                  </div>
                ) : areaProjects.length === 0 ? (
                  /* Standard empty state for an area */
                  <div className="bg-white rounded-2xl border border-dashed border-black/[0.08] p-6 text-center">
                    <p className="text-xs text-[#6B7280]">No projects found in {area.name}.</p>
                    <button
                      onClick={() => handleOpenCreateProjectModal(area.id)}
                      className="mt-2 text-xs text-blue-600 font-semibold hover:underline"
                    >
                      + Create first project
                    </button>
                  </div>
                ) : (
                  /* Project Cards Grid */
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {areaProjects.map((p) => (
                      <ProjectCard
                        key={p.id}
                        project={p}
                        metrics={projectMetrics[p.id]}
                        standing={standingsById[p.id]}
                        onEditProject={() => setEditingProject(p)}
                        onToggleStar={() => onToggleStarProject(p.id)}
                        onArchive={() => handleArchiveProject(p)}
                        onDelete={onDeleteProject ? () => onDeleteProject(p.id) : undefined}
                        onSelectProject={() => onSelectProject(p.id)}
                      />
                    ))}

                    {/* "+ Create Project" tile */}
                    <button
                      onClick={() => handleOpenCreateProjectModal(area.id)}
                      className="group min-h-[150px] rounded-2xl bg-white hover:bg-slate-50/80 border-2 border-dashed border-black/[0.08] hover:border-blue-400 p-5 flex flex-col items-center justify-center gap-2 transition-all duration-200 cursor-pointer text-center"
                    >
                      <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-blue-50 group-hover:text-blue-600 text-[#6B7280] flex items-center justify-center transition-colors">
                        <Plus className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-[#1A1D23] group-hover:text-blue-600 transition-colors">
                        Create Project
                      </span>
                      <span className="text-[11px] font-sans text-[#9CA3AF]">
                        Add to {area.name}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </section>
          )}
        </div>
      </div>

      {/* -------------------------------------------------------------
          3. CREATE PROJECT MODAL
          ------------------------------------------------------------- */}
      {isCreateProjectOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-black/[0.08]">
            <div className="p-6 border-b border-black/[0.06] flex items-center justify-between bg-[#F7F7F8]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#1A1D23]">Create New Project</h2>
                  <p className="text-xs text-[#6B7280]">Add a live initiative to your areas</p>
                </div>
              </div>
              <button 
                onClick={() => setIsCreateProjectOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-200 flex items-center justify-center text-[#6B7280] hover:text-[#1A1D23] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewProject} className="p-6 space-y-4">
              {/* Project Title */}
              <div>
                <label className="block text-xs font-bold text-[#1A1D23] mb-1.5 uppercase tracking-[0.03em]">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Horizon Design System, Montreal Housing..."
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-black/[0.1] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                  autoFocus
                />
              </div>

              {/* Area Selector */}
              <div>
                <label className="block text-xs font-bold text-[#1A1D23] mb-1.5 uppercase tracking-[0.03em]">
                  Area *
                </label>
                <select
                  value={newProjectArea}
                  onChange={(e) => setNewProjectArea(e.target.value as CanonicalArea)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-black/[0.1] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium cursor-pointer"
                >
                  {CANONICAL_AREAS.filter(a => a.id !== 'Learning').map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Client or Initiative owner (Fix 3: Client stays a project property) */}
              <div>
                <label className="block text-xs font-bold text-[#1A1D23] mb-1.5 uppercase tracking-[0.03em]">
                  Client or Owner
                </label>
                <input
                  type="text"
                  placeholder="e.g. Jitani, Mau Bayuelo, Westport Provisions..."
                  value={newProjectClient}
                  onChange={(e) => setNewProjectClient(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-black/[0.1] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                />
              </div>

              {/* Scope & Description */}
              <div>
                <label className="block text-xs font-bold text-[#1A1D23] mb-1.5 uppercase tracking-[0.03em]">
                  Scope / Goals
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of target deliverables or milestones..."
                  value={newProjectScope}
                  onChange={(e) => setNewProjectScope(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-black/[0.1] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium resize-none"
                />
              </div>

              {/* Starred checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="star-new-proj"
                  checked={newProjectStarred}
                  onChange={(e) => setNewProjectStarred(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded-sm cursor-pointer"
                />
                <label htmlFor="star-new-proj" className="text-xs font-medium text-[#1A1D23] cursor-pointer">
                  Star this project (show in Starred Projects row)
                </label>
              </div>

              {/* Actions */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsCreateProjectOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#6B7280] hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-[0_2px_8px_rgba(37,99,235,0.25)] cursor-pointer"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          4. UNIFIED PROJECT SIDE SHEET (Fix 1: Opens SAME side sheet)
          ------------------------------------------------------------- */}
      {editingProject && (
        <ProjectSideSheet
          project={editingProject}
          tasks={tasks}
          onClose={() => setEditingProject(null)}
          onUpdateProject={(updated) => {
            setEditingProject(updated);
            if (onUpdateProject) onUpdateProject(updated);
          }}
          onAddTask={(newTask) => onAddTask?.(newTask)}
          onUpdateTask={(updatedTask) => onUpdateTask?.(updatedTask)}
          onDeleteTask={(taskId) => onDeleteTask?.(taskId)}
          onTriggerToast={() => {}}
        />
      )}
    </div>
  );
};

/* -------------------------------------------------------------------
   PROJECT CARD SUB-COMPONENT (Fix 1: With "⋯" menu for Edit / Pin / Archive / Delete)
   ------------------------------------------------------------------- */
interface ProjectCardProps {
  project: Project;
  metrics?: { total: number; done: number; percentage: number; hours: number };
  standing?: ProjectStanding;
  onEditProject: () => void;
  onToggleStar: () => void;
  onArchive: () => void;
  onDelete?: () => void;
  onSelectProject: () => void;
}

// Risk badge label/style — status is communicated ONLY here, never by card fill (A1).
const RISK_BADGE: Record<ProjectStanding['risk'], { label: string; className: string }> = {
  onTrack: { label: 'On track', className: 'bg-white/90 text-emerald-700' },
  atRisk: { label: 'At risk', className: 'bg-white/90 text-amber-700' },
  blocked: { label: 'Blocked', className: 'bg-white/90 text-slate-700' },
  noTasksLinked: { label: 'No tasks', className: 'bg-white/70 text-slate-500' },
};

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  metrics = { total: 0, done: 0, percentage: 0, hours: 0 },
  standing,
  onEditProject,
  onToggleStar,
  onArchive,
  onDelete,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [confirmAction, setConfirmAction] = useState<'archive' | 'delete' | null>(null);

  const handleToggleMenu = () => {
    if (!menuOpen && menuButtonRef.current) {
      const rect = menuButtonRef.current.getBoundingClientRect();
      // Position relative to viewport (portal renders to document.body, escaping
      // the card's overflow-hidden — see FIX-2 diagnosis).
      setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setMenuOpen((prev) => !prev);
  };

  // FIX-3: the portaled menu is `position: fixed` at coordinates captured once on
  // open — it doesn't track the button on resize or on scroll of any ancestor
  // (including <main>, scrollable since FIX-1). Rather than re-measure/reposition
  // (Floating UI territory), just close it so it never floats away from the button.
  useEffect(() => {
    if (!menuOpen) return;
    const closeMenu = () => setMenuOpen(false);
    window.addEventListener('resize', closeMenu);
    // capture: true catches scroll on any scrollable ancestor (e.g. <main>), not just window
    window.addEventListener('scroll', closeMenu, true);
    return () => {
      window.removeEventListener('resize', closeMenu);
      window.removeEventListener('scroll', closeMenu, true);
    };
  }, [menuOpen]);

  // Card fill is always the project's canonical area color — never a free
  // per-project color/gradient. Area = color, status = badge (see A1).
  const areaStyle = getAreaStyleByCanonicalArea(getCanonicalArea(project.area, project.name));
  const coverStyle = { backgroundColor: areaStyle.hexColor };

  // Pace label in hours, same thresholds/wording as the Standing view (A2 — surfaced, not recomputed).
  let paceLabel: string | null = null;
  let paceClass = 'text-white/85';
  if (standing && !standing.hasNoLinkedTasks) {
    if (standing.paceDeltaMinutes < -30) {
      const hoursBehind = Math.max(1, Math.round(Math.abs(standing.paceDeltaMinutes) / 60));
      paceLabel = `${hoursBehind}h behind`;
      paceClass = 'text-amber-200';
    } else if (standing.paceDeltaMinutes > 30) {
      const hoursSlack = Math.max(1, Math.round(standing.paceDeltaMinutes / 60));
      paceLabel = `${hoursSlack}h of slack`;
      paceClass = 'text-emerald-200';
    } else {
      paceLabel = 'on pace';
      paceClass = 'text-white/85';
    }
  }

  return (
    <div
      onClick={onEditProject}
      className={`group relative flex flex-col min-h-[150px] rounded-2xl overflow-hidden cursor-pointer shadow-[0_2px_8px_rgba(30,35,50,0.06),0_1px_2px_rgba(30,35,50,0.04)] hover:shadow-[0_8px_20px_rgba(30,35,50,0.12)] hover:-translate-y-0.5 transition-all duration-200 select-none ${
        project.isClosed ? 'opacity-60 grayscale-[40%]' : ''
      }`}
      style={coverStyle}
    >
      {/* Top Header inside card: badge/Star/Menu row, then Title on its own full-width row
          so the title never competes with the icon cluster for space (fixes truncation
          regression when the badge was sharing a row with a flex-1 title). */}
      <div className="p-4 flex flex-col gap-1.5 z-10">
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {/* Risk status badge — position consistent, color never used for status (A1/A2) */}
          {standing && (
            <span
              className={`text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full shrink-0 ${RISK_BADGE[standing.risk].className}`}
            >
              {RISK_BADGE[standing.risk].label}
            </span>
          )}

          {/* Star toggle */}
          <button
            onClick={onToggleStar}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
              project.starred
                ? 'text-amber-300 hover:scale-110'
                : 'text-white/70 hover:text-white hover:bg-white/20 opacity-0 group-hover:opacity-100'
            }`}
            title={project.starred ? 'Remove from starred' : 'Star project'}
          >
            <Star 
              className={`w-4 h-4 ${project.starred ? 'fill-amber-300' : ''}`} 
            />
          </button>

          {/* Fix 1: "⋯" Menu button */}
          <div className="relative">
            <button
              ref={menuButtonRef}
              onClick={handleToggleMenu}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
              title="Project actions"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {/* Menu Dropdown — rendered via portal to document.body so it escapes
                the card's overflow-hidden (needed for the rounded-2xl area-color
                fill) instead of being clipped by it. See FIX-2. */}
            {menuOpen && menuPos && createPortal(
              <>
                <div
                  className="fixed inset-0 z-100"
                  onClick={() => setMenuOpen(false)}
                />
                <div
                  style={{ top: menuPos.top, right: menuPos.right }}
                  className="fixed z-101 w-36 bg-white rounded-xl shadow-xl border border-black/[0.08] py-1 text-xs text-[#1A1D23] animate-in fade-in zoom-in-95 duration-100"
                >
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onEditProject();
                    }}
                    className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-100 cursor-pointer font-medium"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onToggleStar();
                    }}
                    className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-100 cursor-pointer font-medium"
                  >
                    <Pin className="w-3.5 h-3.5 text-amber-500" />
                    <span>{project.starred ? 'Unpin' : 'Pin'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setConfirmAction('archive');
                    }}
                    className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-100 cursor-pointer font-medium text-slate-700"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>{project.isClosed ? 'Unarchive' : 'Archive'}</span>
                  </button>

                  {onDelete && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setConfirmAction('delete');
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-red-50 text-red-600 cursor-pointer font-medium border-t border-black/[0.04]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </>,
              document.body
            )}

            {/* Archive/Delete confirmation — destructive-ish actions get a confirm step.
                Portaled to document.body for the same overflow-hidden reason as the menu. */}
            {confirmAction && createPortal(
              <div
                className="fixed inset-0 z-110 flex items-center justify-center bg-black/40 p-4"
                onClick={() => setConfirmAction(null)}
              >
                <div
                  role="dialog"
                  aria-modal="true"
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-xs bg-white rounded-2xl shadow-2xl border border-black/[0.08] p-5 animate-in fade-in zoom-in-95 duration-150"
                >
                  <h5 className="text-sm font-bold text-[#1A1D23] mb-1.5">
                    {confirmAction === 'delete'
                      ? 'Delete this project?'
                      : project.isClosed
                      ? 'Unarchive this project?'
                      : 'Archive this project?'}
                  </h5>
                  <p className="text-xs text-[#6B7280] leading-relaxed mb-4">
                    {confirmAction === 'delete' ? (
                      <>
                        <strong className="text-[#1A1D23]">{project.name}</strong> will be removed. This can't be undone (mock data — lost on refresh either way).
                      </>
                    ) : project.isClosed ? (
                      <>
                        <strong className="text-[#1A1D23]">{project.name}</strong> will move back to active projects.
                      </>
                    ) : (
                      <>
                        <strong className="text-[#1A1D23]">{project.name}</strong> will be archived and hidden from active views. You can unarchive it later.
                      </>
                    )}
                  </p>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmAction(null)}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#6B7280] hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirmAction === 'delete') {
                          onDelete?.();
                        } else {
                          onArchive();
                        }
                        setConfirmAction(null);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer ${
                        confirmAction === 'delete'
                          ? 'bg-red-600 hover:bg-red-700'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {confirmAction === 'delete' ? 'Delete' : project.isClosed ? 'Unarchive' : 'Archive'}
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            )}
          </div>
        </div>

        <h4 className="text-sm font-bold text-white tracking-tight leading-snug drop-shadow-xs line-clamp-2">
          {project.name}
        </h4>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom Footer inside card: pace subline, client, Live task badge & progress */}
      <div className="p-3 bg-black/20 backdrop-blur-xs flex flex-col gap-1 z-10">
        {paceLabel && (
          <span className={`text-[10px] font-semibold ${paceClass}`}>{paceLabel}</span>
        )}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium text-white/90 truncate max-w-[140px]">
            {project.client || project.area || 'Active'}
          </span>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-xs">
              {metrics.total} {metrics.total === 1 ? 'task' : 'tasks'}
            </span>
            {metrics.total > 0 && (
              <div className="flex items-center gap-1.5">
                {/* Thin inline progress bar — same track/fill shape as the Standing view's bar */}
                <div className="w-10 h-1.5 rounded-full bg-white/25 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-300"
                    style={{ width: `${metrics.percentage}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono font-medium text-white/85">
                  {metrics.percentage}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Subtle overlay on hover */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
    </div>
  );
};
