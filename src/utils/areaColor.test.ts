import { describe, expect, it } from 'vitest';
import { getAreaStyleByCanonicalArea, type CanonicalArea } from './areaColor';

describe('canonical area colors', () => {
  it.each<[CanonicalArea, string]>([
    ['Career', '#4F6FEA'],
    ['Magneto', '#93B84B'],
    ['Shamanicca', '#9561D8'],
    ['Finances', '#E6A23C'],
    ['Health & Soul', '#F28C9A'],
    ['Learning', '#758195'],
    ['Personal', '#75BDE8'],
  ])('%s uses %s', (area, hexColor) => {
    expect(getAreaStyleByCanonicalArea(area)).toMatchObject({ area, hexColor });
  });
});
