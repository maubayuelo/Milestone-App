import { describe, expect, it } from 'vitest';
import { dependencyPath } from './timelineGeometry';

const origin = { left: 100, top: 50 };
const source = { left: 400, top: 150, width: 80, height: 16 };
const target = { left: 520, top: 191, width: 40, height: 16 };

describe('dependency geometry', () => {
  it('uses actual bar edges and centers relative to the SVG, including row gaps', () => {
    expect(dependencyPath(origin, source, target)).toBe('M 380 108 C 400 108, 400 149, 420 149');
  });

  it('preserves local coordinates when the SVG and bars scroll together', () => {
    const move = <T extends { left: number; top: number }>(rect: T) => ({ ...rect, left: rect.left - 200, top: rect.top - 90 });
    expect(dependencyPath(move(origin), move(source), move(target))).toBe(dependencyPath(origin, source, target));
  });

  it('accepts fractional diamond bounds and emits only numeric path commands', () => {
    const path = dependencyPath(origin, source, { ...target, left: 510.5, width: 22.5, height: 22.5 });
    expect(path).toBe('M 380 108 C 400 108, 390.5 152.25, 410.5 152.25');
    expect(path).not.toMatch(/calc\(|NaN|Infinity|px|%/);
  });

  it('omits paths with a hidden source or target', () => {
    expect(dependencyPath(origin, undefined, target)).toBeNull();
    expect(dependencyPath(origin, source, undefined)).toBeNull();
  });

  it('omits paths before layout or with invalid measurements', () => {
    expect(dependencyPath(origin, { ...source, width: 0 }, target)).toBeNull();
    expect(dependencyPath(origin, source, { ...target, top: NaN })).toBeNull();
    expect(dependencyPath({ left: Infinity, top: 0 }, source, target)).toBeNull();
  });
});
