import { describe, expect, it } from 'vitest';
import type { AtRiskItem, Project, Task } from '../types';
import { computeProjectStandings } from './projectStanding';

const project: Project = {
  id: 'alpha', name: 'Alpha', client: 'Internal', scope: 'Delivery', area: 'Career',
  // The production mock reference time is September 9, 2026 at 23:21 UTC.
  startAt: '2026-09-07T23:21:00Z', dueAt: '2026-09-11T23:21:00Z',
};

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: 'work', projectId: 'alpha', projectName: 'Alpha', title: 'Work',
    description: '', durationMinutes: 60, durationDisplay: '1h', column: 'todo',
    area: 'Career', priority: 'P2', energy: 'Medium', subtasks: [], ...overrides,
  };
}

function standing(tasks: Task[], risks: AtRiskItem[] = []) {
  return computeProjectStandings([project], tasks, risks)[0];
}

describe('project standings', () => {
  it('reports no linked tasks as noTasksLinked with zero progress', () => {
    expect(standing([])).toMatchObject({
      risk: 'noTasksLinked', hasNoLinkedTasks: true, progress: 0,
      completedMinutes: 0, committedMinutes: 0, nextTask: null,
    });
  });

  it('reports unresolved dependencies as blocked and makes work ready once resolved', () => {
    const dependency = task({ id: 'dependency', projectId: 'other', projectName: 'Other' });
    const work = task({ blockedBy: ['dependency'] });
    expect(standing([work, dependency])).toMatchObject({ risk: 'blocked', nextTask: null });
    expect(standing([work, { ...dependency, column: 'done' }])).toMatchObject({
      risk: 'onTrack', nextTask: work,
    });
  });

  it.each([[1, 'atRisk'], [2, 'onTrack']] as const)(
    'classifies two hours remaining with %s hours available as %s', (hoursAvailable, risk) => {
      const riskItem: AtRiskItem = {
        id: 'risk', taskId: 'work', projectName: 'Alpha', title: 'Capacity',
        shortfall: '', hoursNeeded: 2, hoursAvailable, dueDate: project.dueAt!,
      };
      expect(standing([task()], [riskItem])).toMatchObject({
        committedMinutes: 120, availableBeforeDue: hoursAvailable * 60, risk,
      });
    },
  );

  it('reports fully completed work as on track with full progress', () => {
    expect(standing([task({ column: 'done' })])).toMatchObject({
      risk: 'onTrack', progress: 1, nextTask: null, completedMinutes: 60,
    });
  });

  it('uses only linked work, both done markers, and estimate before duration', () => {
    expect(standing([
      task({ id: 'column-done', column: 'done', estimateMinutes: 30, durationMinutes: 90 }),
      task({ id: 'status-done', status: 'done', durationMinutes: 60 }),
      task({ id: 'pending', estimateMinutes: 90 }),
      task({ id: 'unrelated', projectId: 'other', projectName: 'Other', column: 'done', durationMinutes: 600 }),
    ])).toMatchObject({ completedMinutes: 90, committedMinutes: 180, progress: 0.5 });
  });

  it.each([[30, -30], [90, 30]])(
    'calculates pace for %s completed minutes at the schedule midpoint', (completed, delta) => {
      expect(standing([
        task({ id: 'done', column: 'done', durationMinutes: completed }),
        task({ durationMinutes: 120 - completed }),
      ])).toMatchObject({
        expectedProgress: 0.5, paceDeltaMinutes: delta, daysRemaining: 2,
        availableBeforeDue: 300, progress: completed / 120,
      });
    },
  );
});
