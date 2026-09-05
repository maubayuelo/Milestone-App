export type CanonicalArea = 'Career' | 'Magneto' | 'Shamanicca' | 'Wellness';

export interface AreaStyleConfig {
  area: CanonicalArea;
  letter: 'C' | 'M' | 'S' | 'W';
  leftBorderClass: string; // 3px left border
  tagClass: string;        // pastel fill of hue at 12%, darker version text, radius 999px, 11px semibold
  labelClass: string;      // colored label text
  outlineChipClass: string;// pill styling for chips
  hexColor: string;
  rgbValues: string;       // e.g. "37, 99, 235"
  tintBg8: string;         // soft tint of area color at 8% opacity (no border needed)
  tintBg10: string;        // soft tint of area color at 10% opacity
  tintBg20: string;        // stronger tint of area color at 20% opacity
  tintHover10: string;     // soft tint hover at 10%
  badgeBg15: string;       // circular 32px badge bg at 15% opacity
  badgeText: string;       // solid hue for icon/letter
}

export function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getCanonicalArea(rawArea?: string, rawProjectName?: string): CanonicalArea {
  const combined = `${rawArea || ''} ${rawProjectName || ''}`.toLowerCase();
  if (
    combined.includes('magneto') || 
    combined.includes('agentic') || 
    combined.includes('ai ') ||
    combined.includes('trepied') ||
    combined.includes('dangel')
  ) {
    return 'Magneto';
  }
  if (
    combined.includes('shamanicca') || 
    combined.includes('meditación') || 
    combined.includes('binaural')
  ) {
    return 'Shamanicca';
  }
  if (
    combined.includes('wellness') || 
    combined.includes('routine') || 
    combined.includes('rest') || 
    combined.includes('recovery') ||
    combined.includes('stillness') ||
    combined.includes('yoga') ||
    combined.includes('groceries')
  ) {
    return 'Wellness';
  }
  return 'Career';
}

export function getAreaStyle(rawArea?: string, rawProjectName?: string): AreaStyleConfig {
  const area = getCanonicalArea(rawArea, rawProjectName);
  switch (area) {
    case 'Magneto':
      return {
        area: 'Magneto',
        letter: 'M',
        leftBorderClass: 'border-l-[3px] border-l-[#059669]',
        tagClass: 'bg-[#059669]/[0.12] text-[#047857] rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide',
        labelClass: 'text-[#059669]',
        outlineChipClass: 'bg-[#059669]/[0.12] text-[#047857] rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
        hexColor: '#059669',
        rgbValues: '5, 150, 105',
        tintBg8: 'bg-[#059669]/[0.08]',
        tintBg10: 'bg-[#059669]/[0.10]',
        tintBg20: 'bg-[#059669]/[0.20]',
        tintHover10: 'hover:bg-[#059669]/[0.10]',
        badgeBg15: 'bg-[#059669]/[0.15]',
        badgeText: 'text-[#059669]',
      };
    case 'Shamanicca':
      return {
        area: 'Shamanicca',
        letter: 'S',
        leftBorderClass: 'border-l-[3px] border-l-[#7C3AED]',
        tagClass: 'bg-[#7C3AED]/[0.12] text-[#6D28D9] rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide',
        labelClass: 'text-[#7C3AED]',
        outlineChipClass: 'bg-[#7C3AED]/[0.12] text-[#6D28D9] rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
        hexColor: '#7C3AED',
        rgbValues: '124, 58, 237',
        tintBg8: 'bg-[#7C3AED]/[0.08]',
        tintBg10: 'bg-[#7C3AED]/[0.10]',
        tintBg20: 'bg-[#7C3AED]/[0.20]',
        tintHover10: 'hover:bg-[#7C3AED]/[0.10]',
        badgeBg15: 'bg-[#7C3AED]/[0.15]',
        badgeText: 'text-[#7C3AED]',
      };
    case 'Wellness':
      return {
        area: 'Wellness',
        letter: 'W',
        leftBorderClass: 'border-l-[3px] border-l-[#D97706]',
        tagClass: 'bg-[#D97706]/[0.12] text-[#B45309] rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide',
        labelClass: 'text-[#D97706]',
        outlineChipClass: 'bg-[#D97706]/[0.12] text-[#B45309] rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
        hexColor: '#D97706',
        rgbValues: '217, 119, 6',
        tintBg8: 'bg-[#D97706]/[0.08]',
        tintBg10: 'bg-[#D97706]/[0.10]',
        tintBg20: 'bg-[#D97706]/[0.20]',
        tintHover10: 'hover:bg-[#D97706]/[0.10]',
        badgeBg15: 'bg-[#D97706]/[0.15]',
        badgeText: 'text-[#D97706]',
      };
    case 'Career':
    default:
      return {
        area: 'Career',
        letter: 'C',
        leftBorderClass: 'border-l-[3px] border-l-[#2563EB]',
        tagClass: 'bg-[#2563EB]/[0.12] text-[#1D4ED8] rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide',
        labelClass: 'text-[#2563EB]',
        outlineChipClass: 'bg-[#2563EB]/[0.12] text-[#1D4ED8] rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
        hexColor: '#2563EB',
        rgbValues: '37, 99, 235',
        tintBg8: 'bg-[#2563EB]/[0.08]',
        tintBg10: 'bg-[#2563EB]/[0.10]',
        tintBg20: 'bg-[#2563EB]/[0.20]',
        tintHover10: 'hover:bg-[#2563EB]/[0.10]',
        badgeBg15: 'bg-[#2563EB]/[0.15]',
        badgeText: 'text-[#2563EB]',
      };
  }
}

export type TaskStatusType = 'late-risk' | 'in-progress' | 'complete' | 'scheduled';

export interface StatusStyleConfig {
  status: TaskStatusType;
  label: string;
  leftBorderClass: string;
  tagClass: string;
  labelClass: string;
}

export function getStatusStyle(status: TaskStatusType | string): StatusStyleConfig {
  const s = status.toLowerCase();
  if (s.includes('late') || s.includes('risk') || s.includes('overage')) {
    return {
      status: 'late-risk',
      label: 'LATE RISK',
      leftBorderClass: 'border-l-[3px] border-l-red-500',
      tagClass: 'bg-red-500/[0.12] text-red-700 rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
      labelClass: 'text-red-600',
    };
  }
  if (s.includes('progress') || s.includes('current') || s.includes('doing')) {
    return {
      status: 'in-progress',
      label: 'IN PROGRESS',
      leftBorderClass: 'border-l-[3px] border-l-orange-500',
      tagClass: 'bg-orange-500/[0.12] text-orange-700 rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
      labelClass: 'text-orange-600',
    };
  }
  if (s.includes('complete') || s.includes('done')) {
    return {
      status: 'complete',
      label: 'COMPLETE',
      leftBorderClass: 'border-l-[3px] border-l-emerald-500',
      tagClass: 'bg-emerald-500/[0.12] text-emerald-700 rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
      labelClass: 'text-emerald-600',
    };
  }
  return {
    status: 'scheduled',
    label: 'SCHEDULED',
    leftBorderClass: 'border-l-[3px] border-l-blue-500',
    tagClass: 'bg-blue-500/[0.12] text-blue-700 rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
    labelClass: 'text-blue-600',
  };
}
