export interface TimelineDeliverable {
  id: string;
  title: string;
  startDay: number; // 1 to 28
  endDay: number;   // 1 to 28
  progress: number; // 0 to 100
  atRisk?: boolean;
  isMilestone?: boolean;
}

export interface TimelineProject {
  id: string;
  name: string;
  fullName: string;
  client: string;
  startDay: number; // 1 to 28 (Day 1 = Mon Sep 7, 2026)
  endDay: number;   // 1 to 28
  startDateStr: string;
  deadlineDateStr: string;
  durationHours: number;
  atRisk: boolean;
  atRiskReason?: string;
  deliverables: TimelineDeliverable[];
}

export interface TimelineDay {
  dayIndex: number;    // 1 to 28
  dayOfMonth: number;  // 7, 8... 30, 1, 2, 3, 4
  month: 'Sep' | 'Oct';
  dayName: string;     // 'Mon', 'Tue'...
  shortDayName: string;// 'M', 'T'...
  isWeekend: boolean;
  isToday: boolean;
  weekIndex: number;   // 1 to 4
  weekLabel: string;
}

// Generate the 28 days of the 4-week horizon (Sep 7 — Oct 4, 2026)
export const TIMELINE_DAYS_28: TimelineDay[] = Array.from({ length: 28 }, (_, i) => {
  const dayIndex = i + 1;
  let dayOfMonth: number;
  let month: 'Sep' | 'Oct';
  
  if (dayIndex <= 24) {
    dayOfMonth = 6 + dayIndex; // 7 to 30
    month = 'Sep';
  } else {
    dayOfMonth = dayIndex - 24; // 1 to 4
    month = 'Oct';
  }

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const shortDayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const dayOfWeekIndex = i % 7;
  const dayName = dayNames[dayOfWeekIndex];
  const shortDayName = shortDayNames[dayOfWeekIndex];
  const isWeekend = dayOfWeekIndex >= 5;
  const isToday = dayIndex === 1; // Monday, Sep 7 is Today
  const weekIndex = Math.floor(i / 7) + 1;

  const weekLabels = [
    'Week 1 · Sep 7–13',
    'Week 2 · Sep 14–20',
    'Week 3 · Sep 21–27',
    'Week 4 · Sep 28–Oct 4',
  ];

  return {
    dayIndex,
    dayOfMonth,
    month,
    dayName,
    shortDayName,
    isWeekend,
    isToday,
    weekIndex,
    weekLabel: weekLabels[weekIndex - 1],
  };
});

// The 14 days subset for the compact Dashboard view (Sep 7 — Sep 20, 2026)
export const TIMELINE_DAYS_14: TimelineDay[] = TIMELINE_DAYS_28.slice(0, 14);

export const TIMELINE_PROJECTS: TimelineProject[] = [
  {
    id: 'proj-komorebi',
    name: 'Komorebi Tea',
    fullName: 'Komorebi Tea — Ecommerce & Landing',
    client: 'Komorebi Botanicals Ltd',
    startDay: 1, // Sep 7
    endDay: 8,   // Sep 14 (Mon)
    startDateStr: 'Sep 7',
    deadlineDateStr: 'Sep 14',
    durationHours: 24,
    atRisk: true,
    atRiskReason: 'Shortfall: 2h 45m before Monday client demo',
    deliverables: [
      {
        id: 'del-k-1',
        title: 'Checkout drawer state & cart bundle calculation',
        startDay: 1,
        endDay: 3,
        atRisk: true,
        progress: 75,
      },
      {
        id: 'del-k-2',
        title: 'Dynamic brewing guide filters & tasting notes',
        startDay: 3,
        endDay: 6,
        progress: 30,
      },
      {
        id: 'del-k-3',
        title: 'Staging QA & mobile viewport sign-off',
        startDay: 7,
        endDay: 8,
        isMilestone: true,
        progress: 0,
      },
    ],
  },
  {
    id: 'proj-sonder',
    name: 'Sonder Film Co.',
    fullName: 'Sonder Film Co. — Production Portfolio',
    client: 'Sonder Cinematic Arts',
    startDay: 1, // Sep 7
    endDay: 10,  // Sep 16 (Wed)
    startDateStr: 'Sep 7',
    deadlineDateStr: 'Sep 16',
    durationHours: 36,
    atRisk: true,
    atRiskReason: 'Shortfall: 1h 30m before video reel sign-off',
    deliverables: [
      {
        id: 'del-s-1',
        title: 'Optimize WebGL reel scrub physics & pointer velocity',
        startDay: 1,
        endDay: 4,
        atRisk: true,
        progress: 60,
      },
      {
        id: 'del-s-2',
        title: 'Client video review portal & archival 4K streaming grid',
        startDay: 4,
        endDay: 8,
        progress: 20,
      },
      {
        id: 'del-s-3',
        title: '4K Director Handover & Final Sign-off',
        startDay: 9,
        endDay: 10,
        isMilestone: true,
        progress: 0,
      },
    ],
  },
  {
    id: 'proj-stillness',
    name: 'Stillness App',
    fullName: 'Stillness App — Editorial & Audio CMS',
    client: 'Stillness Studio NYC',
    startDay: 3, // Sep 9
    endDay: 16,  // Sep 22 (Tue)
    startDateStr: 'Sep 9',
    deadlineDateStr: 'Sep 22',
    durationHours: 28,
    atRisk: false,
    deliverables: [
      {
        id: 'del-st-1',
        title: 'Audio streaming chunk cache fallback for offline play',
        startDay: 3,
        endDay: 7,
        progress: 40,
      },
      {
        id: 'del-st-2',
        title: 'Sanity Studio schemas & guided meditation track library',
        startDay: 8,
        endDay: 14,
        progress: 10,
      },
      {
        id: 'del-st-3',
        title: 'Audio player cross-browser sign-off',
        startDay: 15,
        endDay: 16,
        isMilestone: true,
        progress: 0,
      },
    ],
  },
  {
    id: 'proj-magneto-pivot',
    name: 'Magneto',
    fullName: 'Magneto — Exploración de pivote a AI Agency',
    client: 'Magneto Media',
    startDay: 4, // Sep 10
    endDay: 19,  // Sep 25 (Fri)
    startDateStr: 'Sep 10',
    deadlineDateStr: 'Sep 25',
    durationHours: 18,
    atRisk: false,
    deliverables: [
      {
        id: 'del-m-1',
        title: 'Niche positioning & service packaging blueprint',
        startDay: 4,
        endDay: 10,
        progress: 50,
      },
      {
        id: 'del-m-2',
        title: 'Outbound pipeline for AI agent implementations',
        startDay: 11,
        endDay: 18,
        progress: 15,
      },
      {
        id: 'del-m-3',
        title: 'Service catalog pitch deck completion',
        startDay: 18,
        endDay: 19,
        isMilestone: true,
        progress: 0,
      },
    ],
  },
  {
    id: 'proj-shamanicca-app',
    name: 'Shamanicca App',
    fullName: 'Shamanicca — App Freemium de Meditación',
    client: 'Shamanicca Labs',
    startDay: 5, // Sep 11
    endDay: 23,  // Sep 29 (Tue)
    startDateStr: 'Sep 11',
    deadlineDateStr: 'Sep 29',
    durationHours: 30,
    atRisk: false,
    deliverables: [
      {
        id: 'del-sh-1',
        title: 'Binaural oscillator audio engine & session loop',
        startDay: 5,
        endDay: 12,
        progress: 35,
      },
      {
        id: 'del-sh-2',
        title: 'Freemium tier gating & offline audio cache',
        startDay: 13,
        endDay: 21,
        progress: 0,
      },
      {
        id: 'del-sh-3',
        title: 'Beta test release & feedback synthesis',
        startDay: 22,
        endDay: 23,
        isMilestone: true,
        progress: 0,
      },
    ],
  },
  {
    id: 'proj-trepied',
    name: 'TrePied',
    fullName: 'TrePied — Landing Page',
    client: 'TrePied Architecture',
    startDay: 8, // Sep 14
    endDay: 26,  // Oct 2 (Fri)
    startDateStr: 'Sep 14',
    deadlineDateStr: 'Oct 2',
    durationHours: 20,
    atRisk: false,
    deliverables: [
      {
        id: 'del-tr-1',
        title: 'Portfolio showcase layout & CMS project updates',
        startDay: 8,
        endDay: 18,
        progress: 20,
      },
      {
        id: 'del-tr-2',
        title: 'Client portal handover & final deployment',
        startDay: 19,
        endDay: 26,
        isMilestone: true,
        progress: 0,
      },
    ],
  },
  {
    id: 'proj-dangel',
    name: 'Dangel Therapist',
    fullName: 'Dangel Therapist — Landing Page',
    client: 'Dangel Therapy',
    startDay: 10, // Sep 16
    endDay: 28,   // Oct 4 (Sun)
    startDateStr: 'Sep 16',
    deadlineDateStr: 'Oct 4',
    durationHours: 16,
    atRisk: false,
    deliverables: [
      {
        id: 'del-d-1',
        title: 'High-conversion booking landing page & brand identity',
        startDay: 10,
        endDay: 22,
        progress: 15,
      },
      {
        id: 'del-d-2',
        title: 'Client scheduling integration & launch',
        startDay: 23,
        endDay: 28,
        isMilestone: true,
        progress: 0,
      },
    ],
  },
];
