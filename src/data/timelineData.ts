import { CanonicalArea } from '../utils/areaColor';

export interface TimelineDeliverable {
  id: string;
  title: string;
  startDay: number; // 1 to 28
  endDay: number;   // 1 to 28
  progress: number; // 0 to 100
  status: 'done' | 'in-progress' | 'todo' | 'blocked';
  dueStr: string;
  atRisk?: boolean;
  isMilestone?: boolean;
  dependsOn?: string; // id of preceding deliverable
}

export interface TimelineProject {
  id: string;
  name: string;
  fullName: string;
  client: string;
  area: CanonicalArea;
  status: 'Active' | 'On Track' | 'At Risk' | 'Review';
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
  totalCapacityHours: number;
  committedHours: number;
  freeHours: number;
  capacityStatus: 'low' | 'normal' | 'ample';
}

// 28 days of the 4-week horizon (Sep 7 — Oct 4, 2026)
const DAILY_CAPACITY_METRICS = [
  // Week 1 (Sep 7-13)
  { committed: 6.5, total: 8 }, // Day 1 Mon Sep 7
  { committed: 5.0, total: 8 }, // Day 2 Tue Sep 8
  { committed: 6.0, total: 8, isToday: true }, // Day 3 Wed Sep 9 (Today)
  { committed: 4.5, total: 8 }, // Day 4 Thu Sep 10
  { committed: 5.5, total: 8 }, // Day 5 Fri Sep 11
  { committed: 1.5, total: 6 }, // Day 6 Sat Sep 12
  { committed: 1.0, total: 6 }, // Day 7 Sun Sep 13
  // Week 2 (Sep 14-20) - Collision Zone!
  { committed: 7.5, total: 8 }, // Day 8 Mon Sep 14 (Komorebi Demo)
  { committed: 5.5, total: 8 }, // Day 9 Tue Sep 15
  { committed: 7.5, total: 8 }, // Day 10 Wed Sep 16 (Sonder 4K Sign-off)
  { committed: 5.0, total: 8 }, // Day 11 Thu Sep 17
  { committed: 4.5, total: 8 }, // Day 12 Fri Sep 18
  { committed: 1.5, total: 6 }, // Day 13 Sat Sep 19
  { committed: 0.5, total: 6 }, // Day 14 Sun Sep 20
  // Week 3 (Sep 21-27)
  { committed: 5.0, total: 8 }, // Day 15 Mon Sep 21
  { committed: 4.0, total: 8 }, // Day 16 Tue Sep 22
  { committed: 4.5, total: 8 }, // Day 17 Wed Sep 23
  { committed: 5.0, total: 8 }, // Day 18 Thu Sep 24
  { committed: 3.5, total: 8 }, // Day 19 Fri Sep 25
  { committed: 1.0, total: 6 }, // Day 20 Sat Sep 26
  { committed: 0.5, total: 6 }, // Day 21 Sun Sep 27
  // Week 4 (Sep 28-Oct 4)
  { committed: 4.5, total: 8 }, // Day 22 Mon Sep 28
  { committed: 5.0, total: 8 }, // Day 23 Tue Sep 29
  { committed: 4.0, total: 8 }, // Day 24 Wed Sep 30
  { committed: 4.5, total: 8 }, // Day 25 Thu Oct 1
  { committed: 3.0, total: 8 }, // Day 26 Fri Oct 2
  { committed: 1.0, total: 6 }, // Day 27 Sat Oct 3
  { committed: 0.5, total: 6 }, // Day 28 Sun Oct 4
];

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
  const metric = DAILY_CAPACITY_METRICS[i];
  const isToday = !!metric.isToday;
  const weekIndex = Math.floor(i / 7) + 1;

  const weekLabels = [
    'Week 1 · Sep 7–13',
    'Week 2 · Sep 14–20',
    'Week 3 · Sep 21–27',
    'Week 4 · Sep 28–Oct 4',
  ];

  const committedHours = metric.committed;
  const totalCapacityHours = metric.total;
  const freeHours = Math.max(0, Math.round((totalCapacityHours - committedHours) * 10) / 10);
  
  let capacityStatus: 'low' | 'normal' | 'ample' = 'normal';
  if (freeHours <= 1.0) {
    capacityStatus = 'low';
  } else if (freeHours >= 4.0) {
    capacityStatus = 'ample';
  }

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
    totalCapacityHours,
    committedHours,
    freeHours,
    capacityStatus,
  };
});

export const TIMELINE_DAYS_14: TimelineDay[] = TIMELINE_DAYS_28.slice(0, 14);

export const TIMELINE_PROJECTS: TimelineProject[] = [
  // CAREER AREA
  {
    id: 'proj-komorebi',
    name: 'Komorebi Tea',
    fullName: 'Komorebi Tea — Ecommerce & Landing',
    client: 'Komorebi Botanicals Ltd',
    area: 'Career',
    status: 'At Risk',
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
        status: 'in-progress',
        dueStr: 'Sep 9',
        atRisk: true,
        progress: 75,
      },
      {
        id: 'del-k-2',
        title: 'Dynamic brewing guide filters & tasting notes',
        startDay: 3,
        endDay: 6,
        status: 'todo',
        dueStr: 'Sep 12',
        progress: 30,
        dependsOn: 'del-k-1',
      },
      {
        id: 'del-k-3',
        title: 'Client Demo & Staging QA Sign-off',
        startDay: 7,
        endDay: 8,
        status: 'todo',
        dueStr: 'Sep 14',
        isMilestone: true,
        atRisk: true,
        progress: 0,
        dependsOn: 'del-k-2',
      },
    ],
  },
  {
    id: 'proj-sonder',
    name: 'Sonder Film Co.',
    fullName: 'Sonder Film Co. — Production Portfolio',
    client: 'Sonder Cinematic Arts',
    area: 'Career',
    status: 'At Risk',
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
        status: 'in-progress',
        dueStr: 'Sep 10',
        atRisk: true,
        progress: 60,
      },
      {
        id: 'del-s-2',
        title: 'Client video review portal & archival 4K streaming grid',
        startDay: 4,
        endDay: 8,
        status: 'todo',
        dueStr: 'Sep 14',
        progress: 20,
        dependsOn: 'del-s-1',
      },
      {
        id: 'del-s-3',
        title: '4K Director Handover & Final Sign-off',
        startDay: 9,
        endDay: 10,
        status: 'todo',
        dueStr: 'Sep 16',
        isMilestone: true,
        atRisk: true,
        progress: 0,
        dependsOn: 'del-s-2',
      },
    ],
  },

  // MAGNETO AREA
  {
    id: 'proj-magneto-pivot',
    name: 'Magneto Pivot',
    fullName: 'Magneto — Exploración de pivote a AI Agency',
    client: 'Magneto Internal',
    area: 'Magneto',
    status: 'Active',
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
        status: 'in-progress',
        dueStr: 'Sep 16',
        progress: 50,
      },
      {
        id: 'del-m-2',
        title: 'Outbound pipeline for AI agent implementations',
        startDay: 11,
        endDay: 18,
        status: 'todo',
        dueStr: 'Sep 24',
        progress: 15,
        dependsOn: 'del-m-1',
      },
      {
        id: 'del-m-3',
        title: 'Service Catalog & Client Pitch Deck Milestone',
        startDay: 18,
        endDay: 19,
        status: 'todo',
        dueStr: 'Sep 25',
        isMilestone: true,
        progress: 0,
        dependsOn: 'del-m-2',
      },
    ],
  },
  {
    id: 'proj-trepied',
    name: 'TrePied Studio',
    fullName: 'TrePied — Architecture Showcase',
    client: 'TrePied Architecture',
    area: 'Magneto',
    status: 'Active',
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
        status: 'todo',
        dueStr: 'Sep 24',
        progress: 20,
      },
      {
        id: 'del-tr-2',
        title: 'Architecture Review & Client Deployment Milestone',
        startDay: 19,
        endDay: 26,
        status: 'todo',
        dueStr: 'Oct 2',
        isMilestone: true,
        progress: 0,
        dependsOn: 'del-tr-1',
      },
    ],
  },

  // SHAMANICCA AREA
  {
    id: 'proj-stillness',
    name: 'Stillness App',
    fullName: 'Stillness App — Editorial & Audio CMS',
    client: 'Stillness Studio NYC',
    area: 'Shamanicca',
    status: 'On Track',
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
        status: 'in-progress',
        dueStr: 'Sep 13',
        progress: 40,
      },
      {
        id: 'del-st-2',
        title: 'Sanity Studio schemas & guided meditation track library',
        startDay: 8,
        endDay: 14,
        status: 'todo',
        dueStr: 'Sep 20',
        progress: 10,
        dependsOn: 'del-st-1',
      },
      {
        id: 'del-st-3',
        title: 'Audio Player Cross-Browser Sign-off Milestone',
        startDay: 15,
        endDay: 16,
        status: 'todo',
        dueStr: 'Sep 22',
        isMilestone: true,
        progress: 0,
        dependsOn: 'del-st-2',
      },
    ],
  },
  {
    id: 'proj-shamanicca-app',
    name: 'Shamanicca Freemium',
    fullName: 'Shamanicca — App Freemium de Meditación',
    client: 'Shamanicca Labs',
    area: 'Shamanicca',
    status: 'Active',
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
        status: 'in-progress',
        dueStr: 'Sep 18',
        progress: 35,
      },
      {
        id: 'del-sh-2',
        title: 'Freemium tier gating & offline audio cache',
        startDay: 13,
        endDay: 21,
        status: 'todo',
        dueStr: 'Sep 27',
        progress: 0,
        dependsOn: 'del-sh-1',
      },
      {
        id: 'del-sh-3',
        title: 'Beta Test Release Milestone',
        startDay: 22,
        endDay: 23,
        status: 'todo',
        dueStr: 'Sep 29',
        isMilestone: true,
        progress: 0,
        dependsOn: 'del-sh-2',
      },
    ],
  },

  // FINANCES AREA
  {
    id: 'proj-tax-prep',
    name: 'Tax Prep 2026',
    fullName: 'Tax Prep 2026 — Deductions & Revenue Audit',
    client: 'Accounting & Advisory',
    area: 'Finances',
    status: 'On Track',
    startDay: 7, // Sep 13
    endDay: 20,  // Sep 26 (Sat)
    startDateStr: 'Sep 13',
    deadlineDateStr: 'Sep 26',
    durationHours: 14,
    atRisk: false,
    deliverables: [
      {
        id: 'del-tax-1',
        title: 'Reconcile Q3 client receipts & Stripe settlement logs',
        startDay: 7,
        endDay: 13,
        status: 'in-progress',
        dueStr: 'Sep 19',
        progress: 45,
      },
      {
        id: 'del-tax-2',
        title: 'CPA Review & Quarterly Tax Filing Milestone',
        startDay: 14,
        endDay: 20,
        status: 'todo',
        dueStr: 'Sep 26',
        isMilestone: true,
        progress: 0,
        dependsOn: 'del-tax-1',
      },
    ],
  },

  // HEALTH & SOUL AREA
  {
    id: 'proj-routine-rest',
    name: 'Routine & Rest',
    fullName: 'Routine & Rest — Sleep Cycle Protocol',
    client: 'Personal Well-being',
    area: 'Health & Soul',
    status: 'Active',
    startDay: 1, // Sep 7
    endDay: 28,  // Oct 4 (Sun)
    startDateStr: 'Sep 7',
    deadlineDateStr: 'Oct 4',
    durationHours: 28,
    atRisk: false,
    deliverables: [
      {
        id: 'del-rr-1',
        title: 'Consistent 11pm wind-down & no-screen protocol',
        startDay: 1,
        endDay: 14,
        status: 'in-progress',
        dueStr: 'Sep 20',
        progress: 80,
      },
      {
        id: 'del-rr-2',
        title: 'Weekly HRV recovery & outdoor rhythm check-in',
        startDay: 15,
        endDay: 28,
        status: 'todo',
        dueStr: 'Oct 4',
        isMilestone: true,
        progress: 0,
        dependsOn: 'del-rr-1',
      },
    ],
  },

  // PERSONAL AREA
  {
    id: 'proj-montreal',
    name: 'Montreal Housing',
    fullName: 'Montreal Housing Project — Lease & Relocation',
    client: 'Relocation & Housing',
    area: 'Personal',
    status: 'Active',
    startDay: 9, // Sep 15
    endDay: 27,  // Oct 3 (Sat)
    startDateStr: 'Sep 15',
    deadlineDateStr: 'Oct 3',
    durationHours: 22,
    atRisk: false,
    deliverables: [
      {
        id: 'del-mtl-1',
        title: 'Lease comparison matrix & neighborhood transit analysis',
        startDay: 9,
        endDay: 17,
        status: 'todo',
        dueStr: 'Sep 23',
        progress: 10,
      },
      {
        id: 'del-mtl-2',
        title: 'Deposit transfer & contract sign-off milestone',
        startDay: 18,
        endDay: 27,
        status: 'todo',
        dueStr: 'Oct 3',
        isMilestone: true,
        progress: 0,
        dependsOn: 'del-mtl-1',
      },
    ],
  },
];
