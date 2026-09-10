import React, { useState, useMemo, useRef } from 'react';
import { Task, Project } from '../types';
import { 
  TIMELINE_PROJECTS, 
  TIMELINE_DAYS_28, 
  TimelineProject, 
  TimelineDeliverable,
  TimelineDay 
} from '../data/timelineData';
import { 
  ChevronRight, 
  ChevronDown, 
  AlertTriangle, 
  Plus, 
  CheckCircle2,
  Clock,
  Check,
  Flag,
  CircleDot
} from 'lucide-react';
import { getAreaStyle, CanonicalArea } from '../utils/areaColor';

interface GanttTimelineProps {
  projects?: Project[];
  selectedProjectId?: string;
  onSelectProject?: (id: string) => void;
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onOpenCapture: () => void;
}

// Tree node definition for Area -> Project -> Task
interface AreaTreeNode {
  area: CanonicalArea;
  projects: TimelineProject[];
  minStartDay: number;
  maxEndDay: number;
}

export const GanttTimeline: React.FC<GanttTimelineProps> = ({
  selectedProjectId,
  onSelectProject,
  tasks,
  onSelectTask,
  onOpenCapture,
}) => {
  const [filterAtRiskOnly, setFilterAtRiskOnly] = useState<boolean>(false);
  
  // Collapsible tree state:
  // Areas expanded by default
  const [expandedAreas, setExpandedAreas] = useState<Record<string, boolean>>({
    'Career': true,
    'Magneto': true,
    'Shamanicca': true,
    'Finances': true,
    'Health & Soul': true,
    'Personal': true,
  });

  // Projects expanded by default for primary projects
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({
    'proj-komorebi': true,
    'proj-sonder': true,
    'proj-magneto-pivot': true,
    'proj-stillness': true,
  });

  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const totalDays = 28; // 4-week horizon (Sep 7 — Oct 4, 2026)

  // Filter projects
  const filteredProjects = useMemo(() => {
    if (filterAtRiskOnly) {
      return TIMELINE_PROJECTS.filter((p) => p.atRisk);
    }
    return TIMELINE_PROJECTS;
  }, [filterAtRiskOnly]);

  // Group into Area -> Project tree
  const areaTree = useMemo(() => {
    const areasMap: Record<string, TimelineProject[]> = {};

    filteredProjects.forEach((p) => {
      if (!areasMap[p.area]) {
        areasMap[p.area] = [];
      }
      areasMap[p.area].push(p);
    });

    const tree: AreaTreeNode[] = [];
    const canonicalOrder: CanonicalArea[] = [
      'Career',
      'Magneto',
      'Shamanicca',
      'Finances',
      'Health & Soul',
      'Personal',
    ];

    canonicalOrder.forEach((areaName) => {
      const projs = areasMap[areaName];
      if (projs && projs.length > 0) {
        let minStart = 28;
        let maxEnd = 1;
        projs.forEach((p) => {
          if (p.startDay < minStart) minStart = p.startDay;
          if (p.endDay > maxEnd) maxEnd = p.endDay;
        });

        tree.push({
          area: areaName,
          projects: projs,
          minStartDay: Math.max(1, minStart),
          maxEndDay: Math.min(totalDays, maxEnd),
        });
      }
    });

    return tree;
  }, [filteredProjects]);

  const atRiskCount = TIMELINE_PROJECTS.filter((p) => p.atRisk).length;

  // Toggle Area expand
  const toggleArea = (area: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedAreas((prev) => ({ ...prev, [area]: !prev[area] }));
  };

  // Toggle Project expand
  const toggleProject = (projId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedProjects((prev) => ({ ...prev, [projId]: !prev[projId] }));
  };

  // Expand / Collapse all
  const toggleExpandAll = () => {
    const allProjsExpanded = filteredProjects.every((p) => expandedProjects[p.id]);
    const nextProjs: Record<string, boolean> = {};
    const nextAreas: Record<string, boolean> = {};

    areaTree.forEach((a) => {
      nextAreas[a.area] = !allProjsExpanded;
    });
    filteredProjects.forEach((p) => {
      nextProjs[p.id] = !allProjsExpanded;
    });

    setExpandedAreas(nextAreas);
    setExpandedProjects(nextProjs);
  };

  // Flat list of visible tree rows for dependency SVG arrow indexing
  const visibleRows = useMemo(() => {
    const rows: {
      type: 'area' | 'project' | 'task';
      id: string;
      area: CanonicalArea;
      projectId?: string;
      item?: TimelineDeliverable;
    }[] = [];

    areaTree.forEach((a) => {
      rows.push({ type: 'area', id: `area-${a.area}`, area: a.area });
      if (expandedAreas[a.area]) {
        a.projects.forEach((p) => {
          rows.push({ type: 'project', id: p.id, area: p.area, projectId: p.id });
          if (expandedProjects[p.id]) {
            p.deliverables.forEach((del) => {
              rows.push({
                type: 'task',
                id: del.id,
                area: p.area,
                projectId: p.id,
                item: del,
              });
            });
          }
        });
      }
    });

    return rows;
  }, [areaTree, expandedAreas, expandedProjects]);

  // Build dependency connections
  const dependencies = useMemo(() => {
    const deps: {
      fromId: string;
      toId: string;
      fromIndex: number;
      toIndex: number;
      fromEndDay: number;
      toStartDay: number;
      isAtRisk?: boolean;
    }[] = [];

    const rowIndexMap: Record<string, number> = {};
    visibleRows.forEach((r, idx) => {
      rowIndexMap[r.id] = idx;
    });

    visibleRows.forEach((r) => {
      if (r.type === 'task' && r.item && r.item.dependsOn) {
        const predId = r.item.dependsOn;
        const fromIndex = rowIndexMap[predId];
        const toIndex = rowIndexMap[r.id];

        if (fromIndex !== undefined && toIndex !== undefined) {
          const predRow = visibleRows[fromIndex];
          if (predRow.item) {
            deps.push({
              fromId: predId,
              toId: r.id,
              fromIndex,
              toIndex,
              fromEndDay: predRow.item.endDay,
              toStartDay: r.item.startDay,
              isAtRisk: r.item.atRisk || predRow.item.atRisk,
            });
          }
        }
      }
    });

    return deps;
  }, [visibleRows]);

  // Row height constants (matching DOM layout)
  const ROW_HEIGHT_AREA = 40;
  const ROW_HEIGHT_PROJECT = 48;
  const ROW_HEIGHT_TASK = 38;

  // Calculate cumulative Y-offsets for SVG dependency arrows
  const rowYPositions = useMemo(() => {
    const yMap: Record<string, { top: number; center: number }> = {};
    let currentY = 0;

    visibleRows.forEach((r) => {
      let height = ROW_HEIGHT_TASK;
      if (r.type === 'area') height = ROW_HEIGHT_AREA;
      else if (r.type === 'project') height = ROW_HEIGHT_PROJECT;

      yMap[r.id] = {
        top: currentY,
        center: currentY + height / 2,
      };
      currentY += height;
    });

    return { yMap, totalHeight: currentY };
  }, [visibleRows]);

  return (
    <div id="view-timeline" className="flex-1 flex flex-col h-full min-h-0 min-w-0 bg-[#F7F7F8] overflow-hidden select-none text-[#1A1D23]">
      
      {/* 1. Header Toolbar */}
      <header 
        id="timeline-header-bar"
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-3.5 bg-white border-b border-black/[0.04] shrink-0 shadow-2xs z-20"
      >
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-[#1A1D23] tracking-tight">
              Project Timeline & Capacity Gantt
            </h1>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full border border-black/[0.06] text-[#6B7280] bg-[#F7F7F8] font-semibold">
              4-Week Horizon · Sep 7 — Oct 4, 2026
            </span>
          </div>
          <p className="text-xs text-[#6B7280]">
            Collapsible Area → Project → Task tree with live daily capacity & milestone tracking.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {/* At-risk filter toggle */}
          <button
            onClick={() => setFilterAtRiskOnly(!filterAtRiskOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] text-xs font-semibold rounded-xl border transition-all duration-200 cursor-pointer active:scale-[0.98] ${
              filterAtRiskOnly
                ? 'bg-red-50 border-red-200 text-red-700 shadow-2xs'
                : 'bg-white border-black/[0.06] text-[#1A1D23] hover:bg-slate-50 shadow-2xs'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            <span>At-Risk Only ({atRiskCount})</span>
          </button>

          {/* Expand/collapse tree */}
          <button
            onClick={toggleExpandAll}
            className="px-3 py-1.5 min-h-[38px] text-xs font-semibold rounded-xl border border-black/[0.06] bg-white text-[#6B7280] hover:text-[#1A1D23] hover:bg-slate-50 transition-all duration-200 cursor-pointer shadow-2xs active:scale-[0.98]"
          >
            Toggle All Rows
          </button>

          {/* Add deliverable */}
          <button
            onClick={onOpenCapture}
            className="flex items-center gap-1.5 px-3.5 py-1.5 min-h-[38px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all duration-200 cursor-pointer shadow-[0_2px_8px_rgba(37,99,235,0.25)] active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Deliverable</span>
          </button>
        </div>
      </header>

      {/* 2. Legend & Notification Bar */}
      <div 
        id="timeline-sub-banner"
        className="px-6 py-2 bg-white border-b border-black/[0.04] flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 z-10"
      >
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
          <span className="font-semibold text-[#1A1D23]">
            Capacity Warning:
          </span>
          <span className="text-[#6B7280]">
            Mon Sep 14 (Komorebi demo, 7.5h committed) & Wed Sep 16 (Sonder 4K sign-off, 7.5h committed) have &lt;1h free buffer.
          </span>
        </div>

        {/* Legend pills */}
        <div className="flex items-center gap-3.5 text-[11px] text-[#6B7280]">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rotate-45 bg-amber-500 border border-white shadow-2xs" />
            <span>Milestone</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-1.5 rounded-full bg-blue-600" />
            <span>Summary Bar</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-slate-400 relative">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 border-t border-r border-slate-500 rotate-45" />
            </div>
            <span>Dependency</span>
          </div>
          <div className="flex items-center gap-1.5 pl-2 border-l border-black/[0.06]">
            <span className="w-2.5 h-2.5 rounded-xs bg-red-500/[0.15] border border-red-300/40" />
            <span>Low Capacity (&lt;1.5h)</span>
          </div>
        </div>
      </div>

      {/* 3. Main Gantt Chart Canvas Container */}
      <div className="flex-1 p-4 sm:p-6 overflow-hidden flex flex-col min-h-0">
        <div 
          ref={timelineContainerRef}
          id="timeline-grid-container"
          className="flex-1 overflow-x-auto overflow-y-auto bg-white rounded-2xl shadow-[0_2px_8px_rgba(30,35,50,0.06),0_1px_2px_rgba(30,35,50,0.04)] border border-black/[0.06] flex flex-col relative scrollbar-thin"
        >
          <div className="min-w-[1240px] flex-1 flex flex-col">
            
            {/* -------------------------------------------------------------
                A. TOP HEADER ROW 1: 4-WEEK GROUP HEADERS
                ------------------------------------------------------------- */}
            <div className="flex items-center h-8 bg-slate-50/90 border-b border-black/[0.06] sticky top-0 z-40 shrink-0 select-none">
              {/* Pinned Left Panel Column Header: Name, Status, Due */}
              <div className="sticky left-0 z-50 w-[380px] h-full flex items-center bg-slate-50 border-r border-black/[0.06] text-[11px] font-semibold text-[#6B7280] shrink-0 shadow-[1px_0_0_0_rgba(0,0,0,0.04)]">
                <div className="flex-1 px-4 truncate">Hierarchy (Area → Project → Task)</div>
                <div className="w-24 px-2 text-left truncate">Status</div>
                <div className="w-20 px-3 text-right truncate">Due</div>
              </div>

              {/* 4 Week Group Headers */}
              <div className="flex-1 grid grid-cols-4 h-full divide-x divide-black/[0.06]">
                <div className="px-3 flex items-center justify-between text-[11px] text-[#6B7280]">
                  <span className="font-semibold text-[#1A1D23]">Week 1 · Sep 7–13</span>
                  <span className="text-[#9CA3AF] text-[10px]">W37</span>
                </div>
                <div className="px-3 flex items-center justify-between text-[11px] text-[#6B7280] bg-red-500/[0.03]">
                  <span className="font-semibold text-red-600 flex items-center gap-1.5">
                    <span>Week 2 · Sep 14–20</span>
                    <span className="text-[10px] font-bold rounded-full px-1.5 py-0.2 bg-red-100 text-red-700">Collision</span>
                  </span>
                  <span className="text-red-400 text-[10px]">W38</span>
                </div>
                <div className="px-3 flex items-center justify-between text-[11px] text-[#6B7280]">
                  <span className="font-semibold text-[#1A1D23]">Week 3 · Sep 21–27</span>
                  <span className="text-[#9CA3AF] text-[10px]">W39</span>
                </div>
                <div className="px-3 flex items-center justify-between text-[11px] text-[#6B7280]">
                  <span className="font-semibold text-[#1A1D23]">Week 4 · Sep 28–Oct 4</span>
                  <span className="text-[#9CA3AF] text-[10px]">W40</span>
                </div>
              </div>
            </div>

            {/* -------------------------------------------------------------
                B. TOP HEADER ROW 2: 28 DAY COLUMNS + "TODAY" MARKER
                ------------------------------------------------------------- */}
            <div className="flex items-center h-10 bg-white border-b border-black/[0.06] sticky top-8 z-30 shrink-0 select-none">
              {/* Pinned Left subheader */}
              <div className="sticky left-0 z-40 w-[380px] h-full flex items-center bg-white border-r border-black/[0.06] text-[11px] text-[#9CA3AF] shrink-0 font-mono shadow-[1px_0_0_0_rgba(0,0,0,0.04)]">
                <div className="flex-1 px-4 text-xs font-sans text-[#6B7280] font-medium">Name</div>
                <div className="w-24 px-2 text-left">State</div>
                <div className="w-20 px-3 text-right">Target</div>
              </div>

              {/* 28 Day Columns with Day shading based on available hours */}
              <div className="flex-1 grid grid-cols-28 h-full relative">
                {TIMELINE_DAYS_28.map((day) => {
                  const isWeekBoundary = day.dayIndex % 7 === 0;
                  
                  // Day shading class based on available hours
                  let dayShadeClass = '';
                  if (day.capacityStatus === 'low') {
                    dayShadeClass = 'bg-amber-500/[0.07]';
                  } else if (day.isWeekend) {
                    dayShadeClass = 'bg-slate-50/60';
                  }

                  return (
                    <div
                      key={day.dayIndex}
                      className={`h-full flex flex-col items-center justify-center transition-colors relative ${
                        isWeekBoundary ? 'border-r border-black/[0.06]' : ''
                      } ${dayShadeClass} ${
                        day.isToday ? 'bg-blue-600/[0.08]' : ''
                      }`}
                      title={`${day.dayName}, ${day.month} ${day.dayOfMonth} · ${day.committedHours}h committed, ${day.freeHours}h free`}
                    >
                      <span className="text-[10px] font-sans text-[#9CA3AF] leading-none">
                        {day.shortDayName}
                      </span>
                      <span className={`text-[12px] font-sans leading-tight ${
                        day.isToday ? 'font-bold text-blue-700' : 'font-semibold text-[#1A1D23]'
                      }`}>
                        {day.dayOfMonth}
                      </span>

                      {/* "Today" Badge on Day 3 */}
                      {day.isToday && (
                        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider shadow-xs whitespace-nowrap z-30">
                          Today
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* -------------------------------------------------------------
                C. MAIN CANVAS BODY (TREE ROWS + GANTT BARS + SVG ARROWS)
                ------------------------------------------------------------- */}
            <div className="flex-1 relative min-h-[300px]">
              
              {/* Background Day Shading Grid Layer */}
              <div className="absolute inset-0 flex pointer-events-none z-0">
                {/* Space matching pinned left panel */}
                <div className="w-[380px] shrink-0 border-r border-black/[0.06]" />

                {/* 28 Day Column Shading */}
                <div className="flex-1 grid grid-cols-28 h-full divide-x divide-black/[0.03]">
                  {TIMELINE_DAYS_28.map((day) => {
                    const isWeekBoundary = day.dayIndex % 7 === 0;

                    let bgClass = 'bg-transparent';
                    if (day.capacityStatus === 'low') {
                      bgClass = 'bg-amber-500/[0.04]';
                    } else if (day.isWeekend) {
                      bgClass = 'bg-black/[0.012]';
                    }

                    return (
                      <div
                        key={`col-bg-${day.dayIndex}`}
                        className={`h-full relative ${bgClass} ${
                          isWeekBoundary ? 'border-r border-black/[0.06]' : ''
                        }`}
                      >
                        {/* Vertical "Today" line on Day 3 */}
                        {day.isToday && (
                          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[2px] bg-blue-500/70 z-15 pointer-events-none" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SVG Overlay Layer for Dependency Arrows */}
              <svg 
                className="absolute inset-0 w-full h-full pointer-events-none z-20"
                style={{ minHeight: rowYPositions.totalHeight }}
              >
                <defs>
                  <marker
                    id="gantt-arrow"
                    viewBox="0 0 10 10"
                    refX="7"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#64748B" />
                  </marker>
                  <marker
                    id="gantt-arrow-risk"
                    viewBox="0 0 10 10"
                    refX="7"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#EF4444" />
                  </marker>
                </defs>

                {/* Render Curved Dependency Lines */}
                {dependencies.map((dep, dIdx) => {
                  const fromY = rowYPositions.yMap[dep.fromId]?.center ?? 0;
                  const toY = rowYPositions.yMap[dep.toId]?.center ?? 0;

                  // Compute X positions on timeline (each day column is 1/28 of canvas width after 380px)
                  // Offset by left 380px
                  const colWidthPct = 100 / totalDays;
                  const fromXPct = (dep.fromEndDay / totalDays) * 100;
                  const toXPct = ((dep.toStartDay - 1) / totalDays) * 100;

                  return (
                    <path
                      key={`dep-${dIdx}`}
                      d={`M calc(380px + ${fromXPct}%) ${fromY} C calc(380px + ${fromXPct}% + 20px) ${fromY}, calc(380px + ${toXPct}% - 20px) ${toY}, calc(380px + ${toXPct}%) ${toY}`}
                      fill="none"
                      stroke={dep.isAtRisk ? '#EF4444' : '#64748B'}
                      strokeWidth="1.75"
                      strokeDasharray={dep.isAtRisk ? '3 3' : 'none'}
                      markerEnd={dep.isAtRisk ? 'url(#gantt-arrow-risk)' : 'url(#gantt-arrow)'}
                      opacity={0.8}
                    />
                  );
                })}
              </svg>

              {/* -------------------------------------------------------------
                  D. COLLAPSIBLE TREE ROWS (Area → Project → Task)
                  ------------------------------------------------------------- */}
              <div className="relative z-10 flex flex-col">
                {areaTree.map((areaNode) => {
                  const areaStyle = getAreaStyle(areaNode.area);
                  const isAreaExpanded = expandedAreas[areaNode.area];

                  // Area level start and width
                  const aLeftPct = ((areaNode.minStartDay - 1) / totalDays) * 100;
                  const aWidthPct = Math.max(((areaNode.maxEndDay - areaNode.minStartDay + 1) / totalDays) * 100, 4);

                  return (
                    <div key={`area-${areaNode.area}`} className="flex flex-col border-b border-black/[0.05]">
                      
                      {/* LEVEL 1: AREA ROW (Height: 40px) */}
                      <div 
                        style={{ height: `${ROW_HEIGHT_AREA}px` }}
                        onClick={(e) => toggleArea(areaNode.area, e)}
                        className="flex items-center bg-slate-50/85 hover:bg-slate-100/80 transition-colors cursor-pointer group"
                      >
                        {/* Pinned Left: Area Header */}
                        <div className="sticky left-0 z-30 w-[380px] h-full flex items-center bg-slate-50 group-hover:bg-slate-100/90 border-r border-black/[0.06] shrink-0 px-3 shadow-[1px_0_0_0_rgba(0,0,0,0.04)]">
                          <div className="flex-1 flex items-center gap-2 min-w-0 pr-2">
                            <button
                              onClick={(e) => toggleArea(areaNode.area, e)}
                              className="text-[#6B7280] hover:text-[#1A1D23] p-1 rounded-md hover:bg-slate-200 shrink-0"
                            >
                              {isAreaExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <span 
                              style={{ backgroundColor: areaStyle.hexColor }}
                              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" 
                            />
                            <span className="font-bold text-xs uppercase tracking-wider text-[#1A1D23] truncate">
                              {areaNode.area}
                            </span>
                            <span className="text-[11px] font-mono text-[#9CA3AF] shrink-0">
                              ({areaNode.projects.length})
                            </span>
                          </div>

                          <div className="w-24 px-2 text-left">
                            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-white border border-black/[0.06] text-[#475569]">
                              Domain
                            </span>
                          </div>

                          <div className="w-20 px-3 text-right font-mono text-[11px] text-[#6B7280]">
                            {areaNode.projects.length} projs
                          </div>
                        </div>

                        {/* Timeline Canvas: Area Summary Bar */}
                        <div className="flex-1 h-full relative flex items-center">
                          <div
                            style={{
                              left: `${aLeftPct}%`,
                              width: `${aWidthPct}%`,
                            }}
                            className="absolute h-4 flex items-center"
                          >
                            <div
                              style={{
                                backgroundColor: `${areaStyle.hexColor}30`,
                                borderColor: areaStyle.hexColor,
                              }}
                              className="h-3.5 w-full rounded-md border border-dashed flex items-center px-2 relative"
                              title={`${areaNode.area} Domain Span: Day ${areaNode.minStartDay} — Day ${areaNode.maxEndDay}`}
                            >
                              <span 
                                style={{ color: areaStyle.hexColor }}
                                className="text-[10px] font-bold tracking-wider uppercase truncate leading-none"
                              >
                                {areaNode.area} Summary
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* LEVEL 2: PROJECTS WITHIN AREA */}
                      {isAreaExpanded && areaNode.projects.map((p) => {
                        const isProjExpanded = expandedProjects[p.id];
                        const pStart = Math.max(1, p.startDay);
                        const pEnd = Math.min(totalDays, p.endDay);
                        const pLeftPct = ((pStart - 1) / totalDays) * 100;
                        const pWidthPct = Math.max(((pEnd - pStart + 1) / totalDays) * 100, 3.5);

                        return (
                          <div key={p.id} className="flex flex-col border-b border-black/[0.03]">
                            
                            {/* PROJECT ROW (Height: 48px) */}
                            <div 
                              style={{ height: `${ROW_HEIGHT_PROJECT}px` }}
                              onClick={() => {
                                if (onSelectProject) onSelectProject(p.id);
                              }}
                              className="flex items-center hover:bg-slate-50/70 transition-colors cursor-pointer group"
                            >
                              {/* Pinned Left: Project Name, Status, Due */}
                              <div className="sticky left-0 z-30 w-[380px] h-full flex items-center bg-white group-hover:bg-slate-50 border-r border-black/[0.06] shrink-0 pl-6 pr-3 shadow-[1px_0_0_0_rgba(0,0,0,0.04)]">
                                <div className="flex-1 flex items-center gap-2 min-w-0 pr-2">
                                  <button
                                    onClick={(e) => toggleProject(p.id, e)}
                                    className="text-[#6B7280] hover:text-[#1A1D23] p-1 rounded-md hover:bg-slate-100 shrink-0"
                                  >
                                    {isProjExpanded ? (
                                      <ChevronDown className="w-3.5 h-3.5" />
                                    ) : (
                                      <ChevronRight className="w-3.5 h-3.5" />
                                    )}
                                  </button>

                                  <div className="flex flex-col min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[13px] font-bold text-[#1A1D23] truncate group-hover:text-blue-600 transition-colors">
                                        {p.name}
                                      </span>
                                    </div>
                                    <span className="text-[11px] text-[#6B7280] truncate leading-tight">
                                      {p.client}
                                    </span>
                                  </div>
                                </div>

                                {/* Status Column */}
                                <div className="w-24 px-2 text-left">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    p.atRisk
                                      ? 'bg-red-50 text-red-700 border-red-200'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  }`}>
                                    {p.status}
                                  </span>
                                </div>

                                {/* Due Column */}
                                <div className="w-20 px-3 text-right font-mono text-[11px] font-semibold text-[#1A1D23]">
                                  {p.deadlineDateStr}
                                </div>
                              </div>

                              {/* Timeline Canvas: Project Summary Bar */}
                              <div className="flex-1 h-full relative flex items-center">
                                {/* Project Bar */}
                                <div
                                  style={{
                                    left: `${pLeftPct}%`,
                                    width: `${pWidthPct}%`,
                                  }}
                                  className="absolute h-6 flex items-center"
                                >
                                  <div
                                    style={{
                                      backgroundColor: areaStyle.hexColor,
                                      boxShadow: `0 1px 3px rgba(${areaStyle.rgbValues}, 0.2)`,
                                    }}
                                    className="h-6 w-full rounded-full flex items-center justify-between px-3 relative transition-transform duration-150 hover:-translate-y-0.5"
                                    title={`${p.fullName} · ${p.startDateStr} to ${p.deadlineDateStr} (${p.durationHours}h)`}
                                  >
                                    <span className="text-white text-[11px] font-semibold truncate leading-none">
                                      {p.name}
                                    </span>
                                    <span className="text-white/80 font-mono text-[10px] tabular-nums shrink-0 ml-1">
                                      {p.durationHours}h
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* LEVEL 3: TASKS / DELIVERABLES */}
                            {isProjExpanded && p.deliverables.map((del) => {
                              const dStart = Math.max(1, del.startDay);
                              const dEnd = Math.min(totalDays, del.endDay);
                              const dLeftPct = ((dStart - 1) / totalDays) * 100;
                              const dWidthPct = Math.max(((dEnd - dStart + 1) / totalDays) * 100, 2.5);

                              return (
                                <div
                                  key={del.id}
                                  style={{ height: `${ROW_HEIGHT_TASK}px` }}
                                  onClick={() => {
                                    const matchTask = tasks.find((t) =>
                                      t.title.toLowerCase().includes(del.title.toLowerCase().slice(0, 15))
                                    );
                                    if (matchTask) onSelectTask(matchTask);
                                  }}
                                  className="flex items-center hover:bg-blue-50/40 transition-colors cursor-pointer group bg-slate-50/40"
                                >
                                  {/* Pinned Left: Deliverable Title, Status, Due */}
                                  <div className="sticky left-0 z-30 w-[380px] h-full flex items-center bg-slate-50/95 group-hover:bg-blue-50/70 border-r border-black/[0.06] shrink-0 pl-12 pr-3 shadow-[1px_0_0_0_rgba(0,0,0,0.04)]">
                                    <div className="flex-1 flex items-center gap-2 min-w-0 pr-2">
                                      {del.isMilestone ? (
                                        <div className="w-3.5 h-3.5 rotate-45 bg-amber-500 border border-white shrink-0 shadow-2xs" />
                                      ) : (
                                        <CircleDot className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                      )}
                                      <span className="text-xs text-[#374151] truncate group-hover:text-[#1A1D23]">
                                        {del.title}
                                      </span>
                                    </div>

                                    {/* Task Status */}
                                    <div className="w-24 px-2 text-left">
                                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                                        del.status === 'done'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : del.status === 'in-progress'
                                          ? 'bg-blue-100 text-blue-800 font-semibold'
                                          : 'bg-slate-100 text-slate-600'
                                      }`}>
                                        {del.status}
                                      </span>
                                    </div>

                                    {/* Task Due */}
                                    <div className="w-20 px-3 text-right font-mono text-[11px] text-[#6B7280]">
                                      {del.dueStr}
                                    </div>
                                  </div>

                                  {/* Timeline Canvas: Task Bar / Milestone Diamond */}
                                  <div className="flex-1 h-full relative flex items-center">
                                    {/* Milestone Diamond Marker */}
                                    {del.isMilestone ? (
                                      <div
                                        style={{
                                          left: `${((dEnd - 0.5) / totalDays) * 100}%`,
                                        }}
                                        className="absolute -translate-x-1/2 flex items-center gap-2 z-20 group/ms"
                                        title={`Milestone: ${del.title} (Due Day ${dEnd})`}
                                      >
                                        <div className="w-4 h-4 rotate-45 bg-amber-500 hover:bg-amber-600 border-2 border-white shadow-md transition-transform hover:scale-125 cursor-pointer" />
                                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100/90 border border-amber-300/60 px-1.5 py-0.2 rounded-md whitespace-nowrap hidden sm:inline">
                                          {del.title}
                                        </span>
                                      </div>
                                    ) : (
                                      /* Standard Deliverable Task Bar */
                                      <div
                                        style={{
                                          left: `${dLeftPct}%`,
                                          width: `${dWidthPct}%`,
                                        }}
                                        className="absolute h-4 flex items-center z-10"
                                      >
                                        <div
                                          style={{
                                            backgroundColor: `${areaStyle.hexColor}25`,
                                            borderColor: areaStyle.hexColor,
                                          }}
                                          className="h-4 w-full rounded-md border flex items-center justify-between px-1.5 relative transition-transform hover:-translate-y-0.5"
                                          title={`${del.title} (${del.progress}% done)`}
                                        >
                                          {/* Progress Fill */}
                                          <div
                                            style={{
                                              width: `${del.progress}%`,
                                              backgroundColor: `${areaStyle.hexColor}40`,
                                            }}
                                            className="absolute left-0 top-0 bottom-0 rounded-l-md"
                                          />
                                          <span className="text-[10px] font-medium text-[#1A1D23] truncate leading-none relative z-10">
                                            {del.title}
                                          </span>
                                          <span className="text-[9px] font-mono text-[#4B5563] relative z-10 shrink-0 ml-1">
                                            {del.progress}%
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* -------------------------------------------------------------
                E. CAPACITY LANE BELOW THE CHART (Fix 4: Free vs. Committed Hours)
                ------------------------------------------------------------- */}
            <div 
              id="gantt-capacity-lane"
              className="border-t-2 border-black/[0.08] bg-slate-50/95 sticky bottom-0 z-40 shrink-0 select-none shadow-[0_-2px_8px_rgba(0,0,0,0.04)]"
            >
              <div className="flex items-stretch h-14">
                {/* Left panel capacity label */}
                <div className="sticky left-0 z-50 w-[380px] h-full flex flex-col justify-center px-4 bg-slate-100 border-r border-black/[0.08] shrink-0 shadow-[1px_0_0_0_rgba(0,0,0,0.04)]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1A1D23] uppercase tracking-[0.04em] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>Daily Capacity Lane</span>
                    </span>
                    <span className="text-[11px] font-mono text-[#6B7280]">
                      Free vs. Committed
                    </span>
                  </div>
                  <span className="text-[10px] text-[#6B7280] mt-0.5">
                    Day shading highlights buffer shortage &lt;1.5h
                  </span>
                </div>

                {/* 28 Day Capacity Metrics */}
                <div className="flex-1 grid grid-cols-28 h-full divide-x divide-black/[0.05]">
                  {TIMELINE_DAYS_28.map((day) => {
                    const pctCommitted = Math.min(100, Math.round((day.committedHours / day.totalCapacityHours) * 100));

                    return (
                      <div
                        key={`cap-${day.dayIndex}`}
                        className={`h-full flex flex-col justify-between p-1 text-center relative transition-colors ${
                          day.capacityStatus === 'low'
                            ? 'bg-amber-500/[0.12]'
                            : day.isWeekend
                            ? 'bg-black/[0.02]'
                            : 'hover:bg-slate-100'
                        }`}
                        title={`Day ${day.dayOfMonth} (${day.dayName}): ${day.committedHours}h committed / ${day.freeHours}h free (${day.totalCapacityHours}h total capacity)`}
                      >
                        {/* Top: Committed vs Free numbers */}
                        <div className="flex flex-col items-center">
                          <span className={`font-mono text-[11px] leading-tight ${
                            day.capacityStatus === 'low'
                              ? 'font-bold text-red-700'
                              : 'font-semibold text-[#1A1D23]'
                          }`}>
                            {day.committedHours}h
                          </span>
                          <span className={`font-mono text-[9px] leading-none ${
                            day.capacityStatus === 'low' ? 'text-red-600 font-bold' : 'text-[#6B7280]'
                          }`}>
                            {day.freeHours}h free
                          </span>
                        </div>

                        {/* Bottom: Visual Mini-bar (Committed in blue/amber, Free in slate/gray) */}
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            style={{ width: `${pctCommitted}%` }}
                            className={`h-full rounded-full transition-all ${
                              day.capacityStatus === 'low' ? 'bg-red-500' : 'bg-blue-600'
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 4. Bottom Footer Status */}
      <footer 
        id="timeline-footer-status"
        className="h-10 px-6 bg-white border-t border-black/[0.04] flex items-center justify-between text-xs text-[#6B7280] shrink-0 select-none overflow-x-auto z-10"
      >
        <div className="flex items-center gap-3 text-[12px]">
          <span className="font-semibold text-[#1A1D23]">
            {filteredProjects.length} Active Projects in Tree
          </span>
          <span className="text-black/[0.1]">·</span>
          <span className="font-mono tabular-nums text-[#1A1D23]">
            172h Total Committed Workload
          </span>
          <span className="text-black/[0.1]">·</span>
          <span className="text-amber-700 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>2 Milestone Overlap Collisions Detected</span>
          </span>
        </div>

        <div className="text-[11px] text-[#6B7280] hidden sm:block font-sans">
          Gantt capacity lane indicates daily workload relative to 8h work threshold.
        </div>
      </footer>

    </div>
  );
};
