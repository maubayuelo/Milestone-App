import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectsView } from './ProjectsView';
import type { Project } from '../types';

const projects: Project[] = [
  { id: 'alpha', name: 'Alpha launch', client: 'Northwind', scope: 'Brand identity', area: 'Magneto', starred: true },
  { id: 'beta', name: 'Beta roadmap', client: 'Contoso', scope: 'Quarterly planning', area: 'Career', starred: true },
  { id: 'gamma', name: 'Gamma refresh', client: 'Fabrikam', scope: 'Website delivery', area: 'Magneto' },
];

function setup() {
  const user = userEvent.setup();
  const { container } = render(
    <ProjectsView projects={projects} tasks={[]} onSelectProject={vi.fn()}
      onCreateProject={vi.fn()} onToggleStarProject={vi.fn()} />,
  );
  const expectResults = (names: string[], starred = false) => {
    expect(within(screen.getByRole('banner')).getByText(
      `${names.length} ${names.length === 1 ? 'project' : 'projects'}`,
    )).toBeInTheDocument();
    // All Projects deliberately repeats starred cards in a separate highlight row.
    const section = container.querySelector(starred ? '#starred-only-section' : '#areas-grouped-section')!;
    const cards = within(section as HTMLElement).queryAllByRole('heading', { level: 4 })
      .filter(heading => projects.some(project => project.name === heading.textContent));
    expect(cards.map(card => card.textContent).sort()).toEqual([...names].sort());
  };
  return { user, expectResults, search: screen.getByPlaceholderText('Search projects...') };
}

describe('Projects filtering', () => {
  it('shows all projects grouped by area and the filtered total', () => {
    const { expectResults } = setup();
    expectResults(['Alpha launch', 'Beta roadmap', 'Gamma refresh']);
  });

  it('keeps Starred header count and rendered cards aligned through search and clearing', async () => {
    const { user, search, expectResults } = setup();
    await user.click(screen.getByRole('button', { name: /Starred Projects/ }));
    expectResults(['Alpha launch', 'Beta roadmap'], true);
    await user.type(search, 'alpha');
    expectResults(['Alpha launch'], true);
    await user.clear(search);
    await user.type(search, 'gamma');
    expectResults([], true);
    expect(screen.getByText('No starred projects match your search.')).toBeInTheDocument();
    await user.clear(search);
    expectResults(['Alpha launch', 'Beta roadmap'], true);
  });

  it('filters by area and restores all projects when that area is selected again', async () => {
    const { user, expectResults } = setup();
    const area = within(screen.getByRole('complementary')).getByText('Magneto');
    await user.click(area);
    expectResults(['Alpha launch', 'Gamma refresh']);
    await user.click(area);
    expectResults(['Alpha launch', 'Beta roadmap', 'Gamma refresh']);
  });

  it.each([
    ['name', 'ALPHA', ['Alpha launch']],
    ['client', 'NORTHWIND', ['Alpha launch']],
    ['scope', 'IDENTITY', ['Alpha launch']],
    ['area', 'MAGNETO', ['Alpha launch', 'Gamma refresh']],
  ])('searches %s case-insensitively', async (_field, query, names) => {
    const { user, search, expectResults } = setup();
    await user.type(search, query);
    expectResults(names);
  });

  it('intersects text search with the selected area', async () => {
    const { user, search, expectResults } = setup();
    await user.click(within(screen.getByRole('complementary')).getByText('Magneto'));
    await user.type(search, 'alpha');
    expectResults(['Alpha launch']);
    await user.clear(search);
    await user.type(search, 'beta');
    expectResults([]);
  });
});
