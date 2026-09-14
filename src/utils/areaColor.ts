export type CanonicalArea = 'Career' | 'Magneto' | 'Shamanicca' | 'Finances' | 'Health & Soul' | 'Learning' | 'Personal' | 'Wellness';

export interface AreaStyleConfig {
  area: CanonicalArea;
  letter: string;
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
    combined.includes('montreal') ||
    combined.includes('anormal') ||
    combined.includes('colombia') ||
    combined.includes('personal')
  ) {
    return 'Personal';
  }
  if (
    combined.includes('magneto') || 
    combined.includes('jitani') ||
    combined.includes('kio')
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
    combined.includes('finance') ||
    combined.includes('tax') ||
    combined.includes('budget')
  ) {
    return 'Finances';
  }
  if (
    combined.includes('health') ||
    combined.includes('soul') ||
    combined.includes('wellness') || 
    combined.includes('routine') || 
    combined.includes('rest') || 
    combined.includes('recovery') ||
    combined.includes('bullet journal')
  ) {
    return 'Health & Soul';
  }
  if (
    combined.includes('reference') ||
    combined.includes('docs') ||
    combined.includes('sop')
  ) {
    return 'Learning';
  }
  return 'Career';
}

export function getAreaStyle(rawArea?: string, rawProjectName?: string): AreaStyleConfig {
  const area = getCanonicalArea(rawArea, rawProjectName);
  return getAreaStyleByCanonicalArea(area);
}

// Direct lookup by canonical area — use this when the caller already has the
// canonical area value (e.g. iterating CANONICAL_AREAS) rather than raw text
// that needs keyword classification via getCanonicalArea().
export function getAreaStyleByCanonicalArea(area: CanonicalArea): AreaStyleConfig {
  switch (area) {
    case 'Magneto':
      return {
        area: 'Magneto',
        letter: 'M',
        leftBorderClass: 'border-l-[3px] border-l-[#93B84B]',
        tagClass: 'bg-[#93B84B]/[0.12] text-[#6E8A38] rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide',
        labelClass: 'text-[#93B84B]',
        outlineChipClass: 'bg-[#93B84B]/[0.12] text-[#6E8A38] rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
        hexColor: '#93B84B',
        rgbValues: '147, 184, 75',
        tintBg8: 'bg-[#93B84B]/[0.08]',
        tintBg10: 'bg-[#93B84B]/[0.10]',
        tintBg20: 'bg-[#93B84B]/[0.20]',
        tintHover10: 'hover:bg-[#93B84B]/[0.10]',
        badgeBg15: 'bg-[#93B84B]/[0.15]',
        badgeText: 'text-[#93B84B]',
      };
    case 'Shamanicca':
      return {
        area: 'Shamanicca',
        letter: 'S',
        leftBorderClass: 'border-l-[3px] border-l-[#9561D8]',
        tagClass: 'bg-[#9561D8]/[0.12] text-[#7049A2] rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide',
        labelClass: 'text-[#9561D8]',
        outlineChipClass: 'bg-[#9561D8]/[0.12] text-[#7049A2] rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
        hexColor: '#9561D8',
        rgbValues: '149, 97, 216',
        tintBg8: 'bg-[#9561D8]/[0.08]',
        tintBg10: 'bg-[#9561D8]/[0.10]',
        tintBg20: 'bg-[#9561D8]/[0.20]',
        tintHover10: 'hover:bg-[#9561D8]/[0.10]',
        badgeBg15: 'bg-[#9561D8]/[0.15]',
        badgeText: 'text-[#9561D8]',
      };
    case 'Finances':
      return {
        area: 'Finances',
        letter: 'F',
        leftBorderClass: 'border-l-[3px] border-l-[#E6A23C]',
        tagClass: 'bg-[#E6A23C]/[0.12] text-[#AD7A2D] rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide',
        labelClass: 'text-[#E6A23C]',
        outlineChipClass: 'bg-[#E6A23C]/[0.12] text-[#AD7A2D] rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
        hexColor: '#E6A23C',
        rgbValues: '230, 162, 60',
        tintBg8: 'bg-[#E6A23C]/[0.08]',
        tintBg10: 'bg-[#E6A23C]/[0.10]',
        tintBg20: 'bg-[#E6A23C]/[0.20]',
        tintHover10: 'hover:bg-[#E6A23C]/[0.10]',
        badgeBg15: 'bg-[#E6A23C]/[0.15]',
        badgeText: 'text-[#E6A23C]',
      };
    case 'Health & Soul':
    case 'Wellness':
      return {
        area: 'Health & Soul',
        letter: 'H',
        leftBorderClass: 'border-l-[3px] border-l-[#F28C9A]',
        tagClass: 'bg-[#F28C9A]/[0.12] text-[#B66974] rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide',
        labelClass: 'text-[#F28C9A]',
        outlineChipClass: 'bg-[#F28C9A]/[0.12] text-[#B66974] rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
        hexColor: '#F28C9A',
        rgbValues: '242, 140, 154',
        tintBg8: 'bg-[#F28C9A]/[0.08]',
        tintBg10: 'bg-[#F28C9A]/[0.10]',
        tintBg20: 'bg-[#F28C9A]/[0.20]',
        tintHover10: 'hover:bg-[#F28C9A]/[0.10]',
        badgeBg15: 'bg-[#F28C9A]/[0.15]',
        badgeText: 'text-[#F28C9A]',
      };
    case 'Personal':
      return {
        area: 'Personal',
        letter: 'P',
        leftBorderClass: 'border-l-[3px] border-l-[#75BDE8]',
        tagClass: 'bg-[#75BDE8]/[0.12] text-[#588EAE] rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide',
        labelClass: 'text-[#75BDE8]',
        outlineChipClass: 'bg-[#75BDE8]/[0.12] text-[#588EAE] rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
        hexColor: '#75BDE8',
        rgbValues: '117, 189, 232',
        tintBg8: 'bg-[#75BDE8]/[0.08]',
        tintBg10: 'bg-[#75BDE8]/[0.10]',
        tintBg20: 'bg-[#75BDE8]/[0.20]',
        tintHover10: 'hover:bg-[#75BDE8]/[0.10]',
        badgeBg15: 'bg-[#75BDE8]/[0.15]',
        badgeText: 'text-[#75BDE8]',
      };
    case 'Learning':
      return {
        area: 'Learning',
        letter: 'L',
        leftBorderClass: 'border-l-[3px] border-l-[#758195]',
        tagClass: 'bg-[#758195]/[0.12] text-[#586170] rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide',
        labelClass: 'text-[#758195]',
        outlineChipClass: 'bg-[#758195]/[0.12] text-[#586170] rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
        hexColor: '#758195',
        rgbValues: '117, 129, 149',
        tintBg8: 'bg-[#758195]/[0.08]',
        tintBg10: 'bg-[#758195]/[0.10]',
        tintBg20: 'bg-[#758195]/[0.20]',
        tintHover10: 'hover:bg-[#758195]/[0.10]',
        badgeBg15: 'bg-[#758195]/[0.15]',
        badgeText: 'text-[#758195]',
      };
    case 'Career':
    default:
      return {
        area: 'Career',
        letter: 'C',
        leftBorderClass: 'border-l-[3px] border-l-[#4F6FEA]',
        tagClass: 'bg-[#4F6FEA]/[0.12] text-[#3B53AF] rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide',
        labelClass: 'text-[#4F6FEA]',
        outlineChipClass: 'bg-[#4F6FEA]/[0.12] text-[#3B53AF] rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
        hexColor: '#4F6FEA',
        rgbValues: '79, 111, 234',
        tintBg8: 'bg-[#4F6FEA]/[0.08]',
        tintBg10: 'bg-[#4F6FEA]/[0.10]',
        tintBg20: 'bg-[#4F6FEA]/[0.20]',
        tintHover10: 'hover:bg-[#4F6FEA]/[0.10]',
        badgeBg15: 'bg-[#4F6FEA]/[0.15]',
        badgeText: 'text-[#4F6FEA]',
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
