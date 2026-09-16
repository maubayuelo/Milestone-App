export interface TimelineRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

// SVG has no viewBox scaling, so one user unit equals one CSS pixel.
// Measurements come from actual bars (or milestone diamonds), including layout borders.
export function dependencyPath(
  origin: Pick<TimelineRect, 'left' | 'top'>,
  source?: TimelineRect,
  target?: TimelineRect,
): string | null {
  if (!source || !target) return null;
  const values = [origin.left, origin.top, source.left, source.top, source.width,
    source.height, target.left, target.top, target.width, target.height];
  if (!values.every(Number.isFinite) || source.width <= 0 || source.height <= 0 ||
    target.width <= 0 || target.height <= 0) return null;

  const fromX = source.left + source.width - origin.left;
  const fromY = source.top + source.height / 2 - origin.top;
  const toX = target.left - origin.left;
  const toY = target.top + target.height / 2 - origin.top;
  return `M ${fromX} ${fromY} C ${fromX + 20} ${fromY}, ${toX - 20} ${toY}, ${toX} ${toY}`;
}
