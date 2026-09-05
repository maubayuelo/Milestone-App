import { Task } from '../types';

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
}

export function formatHoursAndMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (m === 0) return `${h}h00`;
  return `${h}h${m.toString().padStart(2, '0')}`;
}

export function computeCapacity(overageMinutes: number = 30): CapacityData {
  // Shift completed at 1:15 pm (13:15)
  // Travel / transition / lunch buffer: 45 min
  // Window opens at 2:00 pm (14:00) and closes at 6:30 pm (18:30)
  const shiftEndTime = '1:15 pm';
  const bufferMinutes = 45;
  const windowStart = '2:00 pm';
  const windowEnd = '6:30 pm';
  const availableMinutes = 270; // 4h 30m
  const availableDisplay = '4h30';

  // Base committed: 270 + overageMinutes (default 30 min overage -> 300 min = 5h00)
  const committedMinutes = availableMinutes + Math.max(0, overageMinutes);
  const committedDisplay = formatHoursAndMinutes(committedMinutes);

  const deficitMinutes = Math.max(0, committedMinutes - availableMinutes);
  const surplusMinutes = Math.max(0, availableMinutes - committedMinutes);

  const isDeficit = deficitMinutes > 0;
  const isBalanced = deficitMinutes === 0;

  let sentencePrefix = '';
  let deficitHighlightText = '';
  let sentenceSuffix = '';
  let fullSentence = '';
  let shortLabel = '';

  if (isDeficit) {
    sentencePrefix = `${availableDisplay} available today after your ${shiftEndTime} shift. Committed tasks total ${committedDisplay}, leaving a `;
    deficitHighlightText = `${deficitMinutes}-minute deficit`;
    sentenceSuffix = '.';
    fullSentence = `${sentencePrefix}${deficitHighlightText}${sentenceSuffix}`;
    shortLabel = `${deficitMinutes}m deficit`;
  } else {
    sentencePrefix = `${availableDisplay} available today after your ${shiftEndTime} shift. Committed tasks total ${committedDisplay} — `;
    deficitHighlightText = 'your day is fully balanced';
    sentenceSuffix = '.';
    fullSentence = `${sentencePrefix}${deficitHighlightText}${sentenceSuffix}`;
    shortLabel = 'Balanced';
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
  };
}
