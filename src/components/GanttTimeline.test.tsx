import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GanttTimeline } from './GanttTimeline';

function setup() {
  const onOpenCapture = vi.fn();
  const onSelectProject = vi.fn();
  render(<GanttTimeline tasks={[]} onSelectTask={vi.fn()}
    onSelectProject={onSelectProject} onOpenCapture={onOpenCapture} />);
  return { user: userEvent.setup(), onOpenCapture, onSelectProject };
}

const button = (name: string | RegExp) => screen.getByRole('button', { name });
const deliverables = () => screen.queryAllByRole('button', { name: /^Open deliverable / });
const checkout = 'Open deliverable Checkout drawer state & cart bundle calculation';

describe('Gantt Phase A controls and hierarchy', () => {
  it('starts with areas expanded and project summaries visible, with deliverables hidden', () => {
    setup();
    const areas = screen.getAllByRole('button', { name: /^Collapse area / });
    const projects = screen.getAllByRole('button', { name: /^Expand project / });
    expect(areas).toHaveLength(6);
    expect(projects).toHaveLength(9);
    for (const disclosure of areas) {
      expect(disclosure).toHaveAttribute('aria-expanded', 'true');
    }
    for (const disclosure of projects) {
      expect(disclosure).toHaveAttribute('aria-expanded', 'false');
    }
    expect(screen.getAllByRole('button', { name: /^Select project / })).toHaveLength(9);
    expect(screen.getByTitle('Komorebi Tea — Ecommerce & Landing · Sep 7 to Sep 14 (24h)')).toBeInTheDocument();
    expect(deliverables()).toHaveLength(0);
    expect(button('Expand all')).toBeInTheDocument();
  });

  it('collapses and reopens one project without triggering project selection', async () => {
    const { user, onSelectProject } = setup();
    await user.click(button('Expand project Komorebi Tea'));
    expect(deliverables()).toHaveLength(3);
    await user.click(button('Collapse project Komorebi Tea'));
    expect(button('Expand project Komorebi Tea')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('button', { name: checkout })).not.toBeInTheDocument();
    expect(deliverables()).toHaveLength(0);
    expect(onSelectProject).not.toHaveBeenCalled();
    await user.click(button('Expand project Komorebi Tea'));
    expect(button(checkout)).toBeInTheDocument();
    expect(deliverables()).toHaveLength(3);
  });

  it('supports Enter and Space on area disclosures', async () => {
    const { user } = setup();
    await user.click(button('Expand project Komorebi Tea'));
    button('Collapse area Career').focus();
    await user.keyboard('{Enter}');
    expect(button('Expand area Career')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('button', { name: 'Select project Komorebi Tea' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: checkout })).not.toBeInTheDocument();
    await user.keyboard(' ');
    expect(button('Collapse area Career')).toHaveAttribute('aria-expanded', 'true');
    expect(button(checkout)).toBeInTheDocument();
  });

  it('collapses all areas and projects, then expands the full tree', async () => {
    const { user } = setup();
    await user.click(button('Expand all'));
    await user.click(button('Collapse all'));
    expect(screen.getAllByRole('button', { name: /^Expand area / })).toHaveLength(6);
    expect(screen.queryAllByRole('button', { name: /^Select project / })).toHaveLength(0);
    expect(deliverables()).toHaveLength(0);
    // Opening an area alone must not reopen its collapsed projects.
    await user.click(button('Expand area Career'));
    expect(button('Expand project Komorebi Tea')).toHaveAttribute('aria-expanded', 'false');
    await user.click(button('Expand all'));
    expect(deliverables()).toHaveLength(23);
    expect(button('Collapse all')).toBeInTheDocument();
  });

  it('offers Expand all when an area is closed even if its projects remain expanded', async () => {
    const { user } = setup();
    await user.click(button('Expand all'));
    await user.click(button('Collapse area Career'));
    await user.click(button('Expand all'));
    expect(button('Collapse area Career')).toHaveAttribute('aria-expanded', 'true');
    expect(button(checkout)).toBeInTheDocument();
    expect(deliverables()).toHaveLength(23);
  });

  it('preserves area and project choices across a risk-filter round trip', async () => {
    const { user } = setup();
    await user.click(button('Expand all'));
    await user.click(button('Collapse project TrePied Studio'));
    await user.click(button('Collapse area Shamanicca'));
    await user.click(button(/^At-Risk Only/));
    expect(button(/^At-Risk Only/)).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getAllByRole('button', { name: /^Select project / })).toHaveLength(2);
    await user.click(button(/^At-Risk Only/));
    expect(button(/^At-Risk Only/)).toHaveAttribute('aria-pressed', 'false');
    expect(button('Expand project TrePied Studio')).toHaveAttribute('aria-expanded', 'false');
    expect(button('Expand area Shamanicca')).toHaveAttribute('aria-expanded', 'false');
    expect(button('Collapse project Magneto Pivot')).toHaveAttribute('aria-expanded', 'true');
  });

  it('retains hidden branch state when bulk actions operate on filtered projects', async () => {
    const { user } = setup();
    await user.click(button('Expand all'));
    await user.click(button('Collapse project TrePied Studio'));
    await user.click(button(/^At-Risk Only/));
    await user.click(button('Collapse all'));
    await user.click(button('Expand all'));
    await user.click(button(/^At-Risk Only/));
    expect(button('Expand project TrePied Studio')).toHaveAttribute('aria-expanded', 'false');
    expect(button('Collapse project Magneto Pivot')).toHaveAttribute('aria-expanded', 'true');
    expect(button('Collapse area Shamanicca')).toHaveAttribute('aria-expanded', 'true');
    expect(button('Collapse project Stillness App')).toHaveAttribute('aria-expanded', 'true');
  });

  it('keeps date context and opens the existing capture flow with an accurate label', async () => {
    const { user, onOpenCapture } = setup();
    expect(screen.getByRole('heading', { name: 'Timeline', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('4-Week Horizon · Sep 7 — Oct 4, 2026')).toBeInTheDocument();
    expect(button(/^At-Risk Only/)).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByRole('button', { name: 'Add Deliverable' })).not.toBeInTheDocument();
    await user.click(button('Capture task'));
    expect(onOpenCapture).toHaveBeenCalledTimes(1);
  });
});


// jsdom has no layout: these bounds simulate layout changes, not CSS correctness.
describe('Gantt dependency visibility', () => {
  afterEach(() => vi.restoreAllMocks());

  function geometry() {
    let offset = 0;
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      const id = this.getAttribute('data-dependency-anchor');
      const anchors = Array.from(document.querySelectorAll('[data-dependency-anchor]'));
      return { left: id ? 400 + offset : 100, top: id ? 150 + anchors.indexOf(this) * 39 : 50,
        width: id ? 80 : 1240, height: id ? 16 : 1000 } as DOMRect;
    });
    const { container } = render(<GanttTimeline tasks={[]} onSelectTask={vi.fn()} onOpenCapture={vi.fn()} />);
    return {
      user: userEvent.setup(),
      paths: () => container.querySelectorAll('path[data-dependency-target]'),
      resize: () => { offset = 30; act(() => window.dispatchEvent(new Event('resize'))); },
    };
  }

  it('adds and removes arrows with project and area disclosure', async () => {
    const { user, paths } = geometry();
    expect(paths()).toHaveLength(0);
    await user.click(button('Expand project Komorebi Tea'));
    expect(paths()).toHaveLength(2);
    expect(paths()[0]).toHaveAttribute('d', 'M 380 108 C 400 108, 280 147, 300 147');
    await user.click(button('Collapse project Komorebi Tea'));
    expect(paths()).toHaveLength(0);
    await user.click(button('Expand project Komorebi Tea'));
    await user.click(button('Collapse area Career'));
    expect(paths()).toHaveLength(0);
    await user.click(button('Expand area Career'));
    expect(paths()).toHaveLength(2);
  });

  it('recalculates paths on resize and removes filtered-out dependencies', async () => {
    const { user, paths, resize } = geometry();
    await user.click(button('Expand project Magneto Pivot'));
    expect(paths()).toHaveLength(2);
    const before = paths()[0].getAttribute('d');
    resize();
    expect(paths()[0].getAttribute('d')).not.toBe(before);
    expect(paths()[0].getAttribute('d')).not.toContain('calc(');
    await user.click(button(/^At-Risk Only/));
    expect(paths()).toHaveLength(0);
    await user.click(button(/^At-Risk Only/));
    expect(paths()).toHaveLength(2);
  });
});
