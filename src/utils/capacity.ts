import { Task } from '../types';

export type WindowState = 'before' | 'active' | 'closed';

export interface CapacityData {
  shiftEndTime: string;
  bufferMinutes: number;
  windowStart: string;
  windowEnd: string;
  availableMinutes: number;
  availableDisplay: string;
  committedMinutes: number;
  committedDisplay: string;
  deficitMinutes: number;
  surplusMinutes: number;
  isDeficit: boolean;
  isBalanced: boolean;
  fullSentence: string;
  sentencePrefix: string;
  deficitHighlightText: string;
  sentenceSuffix: string;
  shortLabel: string;
  windowState: WindowState;
  remainingMinutesLive: number;
  usedMinutesDisplay: string;
  unworkedMinutesDisplay: string;
}

export function formatHoursAndMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (m === 0) return `${h}h00`;
  return `${h}h${m.toString().padStart(2, '0')}`;
}

export function getWindowState(nowDate: Date = new Date()): {
  windowState: WindowState;
  remainingMinutesLive: number;
} {
  const hours = nowDate.getHours();
  const minutes = nowDate.getMinutes();
  const currentTotalMin = hours * 60 + minutes;

  // Window starts at 2:00 pm (14:00 = 840m) and closes at 6:30 pm (18:30 = 1110m)
  const windowStartMin = 14 * 60; // 840
  const windowEndMin = 18 * 60 + 30; // 1110

  if (currentTotalMin < windowStartMin) {
    return { windowState: 'before', remainingMinutesLive: 270 };
  } else if (currentTotalMin >= windowEndMin) {
    return { windowState: 'closed', remainingMinutesLive: 0 };
  } else {
    const rem = Math.max(0, windowEndMin - currentTotalMin);
    return { windowState: 'active', remainingMinutesLive: rem };
  }
}

export function computeCapacity(overageMinutes: number = 30, customDate?: Date): CapacityData {
  // Shift completed at 1:15 pm (13:15)
  // Travel / transition / lunch buffer: 45 min
  // Window opens at 2:00 pm (14:00) and closes at 6:30 pm (18:30)
  const shiftEndTime = '1:15 pm';
  const bufferMinutes = 45;
  const windowStart = '2:00 pm';
  const windowEnd = '6:30 pm';
  const availableMinutes = 270; // 4h 30m
  const availableDisplay = '4h30';

  const { windowState, remainingMinutesLive } = getWindowState(customDate);

  // Base committed: 270 + overageMinutes (default 30 min overage -> 300 min = 5h00)
  const committedMinutes = availableMinutes + Math.max(0, overageMinutes);
  const committedDisplay = formatHoursAndMinutes(committedMinutes);

  const deficitMinutes = Math.max(0, committedMinutes - availableMinutes);
  const surplusMinutes = Math.max(0, availableMinutes - committedMinutes);

  const isDeficit = deficitMinutes > 0;
  const isBalanced = deficitMinutes === 0;

  // For closed state: 2h10 worked of 4h30, 2h20 unworked
  const usedMinutesDisplay = '2h10';
  const unworkedMinutesDisplay = '2h20';

  let sentencePrefix = '';
  let deficitHighlightText = '';
  let sentenceSuffix = '';
  let fullSentence = '';
  let shortLabel = '';

  if (windowState === 'before') {
    sentencePrefix = 'Your window opens at 2:00 pm — ';
    deficitHighlightText = '4h30 available';
    sentenceSuffix = '.';
    fullSentence = `${sentencePrefix}${deficitHighlightText}${sentenceSuffix}`;
    shortLabel = 'Opens 2:00 pm';
  } else if (windowState === 'closed') {
    sentencePrefix = `Window closed at ${windowEnd}. ${usedMinutesDisplay} of ${availableDisplay} used, `;
    deficitHighlightText = `${unworkedMinutesDisplay} unworked`;
    sentenceSuffix = '.';
    fullSentence = `${sentencePrefix}${deficitHighlightText}${sentenceSuffix}`;
    shortLabel = 'Window closed';
  } else {
    // Active state: remaining time recomputed live
    const liveRemDisplay = formatHoursAndMinutes(remainingMinutesLive);
    if (isDeficit) {
      sentencePrefix = `${liveRemDisplay} remaining of ${availableDisplay} available today. Committed tasks total ${committedDisplay}, leaving a `;
      deficitHighlightText = `${deficitMinutes}-minute deficit`;
      sentenceSuffix = '.';
      fullSentence = `${sentencePrefix}${deficitHighlightText}${sentenceSuffix}`;
      shortLabel = `${deficitMinutes}m deficit`;
    } else {
      sentencePrefix = `${liveRemDisplay} remaining of ${availableDisplay} available today. Committed tasks total ${committedDisplay} — `;
      deficitHighlightText = 'your day is fully balanced';
      sentenceSuffix = '.';
      fullSentence = `${sentencePrefix}${deficitHighlightText}${sentenceSuffix}`;
      shortLabel = 'Balanced';
    }
  }

  return {
    shiftEndTime,
    bufferMinutes,
    windowStart,
    windowEnd,
    availableMinutes,
    availableDisplay,
    committedMinutes,
    committedDisplay,
    deficitMinutes,
    surplusMinutes,
    isDeficit,
    isBalanced,
    fullSentence,
    sentencePrefix,
    deficitHighlightText,
    sentenceSuffix,
    shortLabel,
    windowState,
    remainingMinutesLive,
    usedMinutesDisplay,
    unworkedMinutesDisplay,
  };
}
