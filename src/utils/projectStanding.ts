import { Project, Task, AtRiskItem, ProjectStanding } from '../types';

// Fixed mock "now" so risk/pace stays consistent across every view that
// derives ProjectStanding from the same mock dataset.
const MOCK_NOW = new Date('2026-09-09T16:21:00-07:00').getTime();

export function computeProjectStandings(
  projects: Project[],
  tasks: Task[],
  atRiskItems: AtRiskItem[]
): ProjectStanding[] {
  const activeProjects = projects.filter((p) => !p.isClosed);
  const now = MOCK_NOW;

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
}
