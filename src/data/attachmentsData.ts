import { AttachedFile, ExtractedProposal, ExtractedShiftRow, ExtractedTaskRow } from '../types';

// Realistic SVG Data URLs for standalone zero-dependency image rendering
export const SHIFT_SCHEDULE_IMG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg width="800" height="500" viewBox="0 0 800 500" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="500" rx="12" fill="#1E293B"/>
  <rect x="20" y="20" width="760" height="460" rx="8" fill="#0F172A" stroke="#334155" stroke-width="2"/>
  
  <text x="50" y="60" fill="#F8FAFC" font-family="monospace" font-size="20" font-weight="bold">WESTPORT PROVISIONS — WEEKLY ROSTER</text>
  <text x="50" y="85" fill="#94A3B8" font-family="monospace" font-size="13">WEEK OF: SEP 14 — SEP 20 · EMPLOYEE: MAU BAYUELO · STORE #0824</text>
  
  <line x1="50" y1="105" x2="750" y2="105" stroke="#334155" stroke-width="1.5"/>
  
  <text x="50" y="135" fill="#38BDF8" font-family="monospace" font-size="14" font-weight="bold">DAY</text>
  <text x="180" y="135" fill="#38BDF8" font-family="monospace" font-size="14" font-weight="bold">ROLE</text>
  <text x="340" y="135" fill="#38BDF8" font-family="monospace" font-size="14" font-weight="bold">SHIFT HOURS</text>
  <text x="520" y="135" fill="#38BDF8" font-family="monospace" font-size="14" font-weight="bold">TOTAL</text>
  <text x="640" y="135" fill="#38BDF8" font-family="monospace" font-size="14" font-weight="bold">STATUS</text>
  
  <line x1="50" y1="150" x2="750" y2="150" stroke="#1E293B" stroke-width="2"/>
  
  <!-- Mon -->
  <text x="50" y="185" fill="#F1F5F9" font-family="monospace" font-size="13">Mon Sep 14</text>
  <text x="180" y="185" fill="#CBD5E1" font-family="monospace" font-size="13">Barista / Receive</text>
  <text x="340" y="185" fill="#34D399" font-family="monospace" font-size="13" font-weight="bold">05:30 AM — 01:15 PM</text>
  <text x="520" y="185" fill="#F1F5F9" font-family="monospace" font-size="13">7h 45m</text>
  <rect x="640" y="170" width="80" height="22" rx="4" fill="#065F46"/>
  <text x="655" y="185" fill="#A7F3D0" font-family="monospace" font-size="11" font-weight="bold">CONFIRMED</text>
  
  <!-- Tue -->
  <text x="50" y="235" fill="#F1F5F9" font-family="monospace" font-size="13">Tue Sep 15</text>
  <text x="180" y="235" fill="#CBD5E1" font-family="monospace" font-size="13">Floor Lead</text>
  <text x="340" y="235" fill="#34D399" font-family="monospace" font-size="13" font-weight="bold">06:00 AM — 01:30 PM</text>
  <text x="520" y="235" fill="#F1F5F9" font-family="monospace" font-size="13">7h 30m</text>
  <rect x="640" y="220" width="80" height="22" rx="4" fill="#065F46"/>
  <text x="655" y="235" fill="#A7F3D0" font-family="monospace" font-size="11" font-weight="bold">CONFIRMED</text>
  
  <!-- Wed -->
  <text x="50" y="285" fill="#F1F5F9" font-family="monospace" font-size="13">Wed Sep 16</text>
  <text x="180" y="285" fill="#CBD5E1" font-family="monospace" font-size="13">Barista Opening</text>
  <text x="340" y="285" fill="#34D399" font-family="monospace" font-size="13" font-weight="bold">05:30 AM — 01:15 PM</text>
  <text x="520" y="285" fill="#F1F5F9" font-family="monospace" font-size="13">7h 45m</text>
  <rect x="640" y="270" width="80" height="22" rx="4" fill="#065F46"/>
  <text x="655" y="285" fill="#A7F3D0" font-family="monospace" font-size="11" font-weight="bold">CONFIRMED</text>
  
  <!-- Thu -->
  <text x="50" y="335" fill="#F1F5F9" font-family="monospace" font-size="13">Thu Sep 17</text>
  <text x="180" y="335" fill="#CBD5E1" font-family="monospace" font-size="13">Mid Shift (Tentative)</text>
  <text x="340" y="335" fill="#FBBF24" font-family="monospace" font-size="13" font-weight="bold">06:00 AM — 12:30 PM ?</text>
  <text x="520" y="335" fill="#F1F5F9" font-family="monospace" font-size="13">6h 30m</text>
  <rect x="640" y="320" width="80" height="22" rx="4" fill="#78350F"/>
  <text x="650" y="335" fill="#FDE68A" font-family="monospace" font-size="11" font-weight="bold">CHECK OCR</text>
  
  <!-- Fri -->
  <text x="50" y="385" fill="#F1F5F9" font-family="monospace" font-size="13">Fri Sep 18</text>
  <text x="180" y="385" fill="#CBD5E1" font-family="monospace" font-size="13">Receive & Merch</text>
  <text x="340" y="385" fill="#34D399" font-family="monospace" font-size="13" font-weight="bold">05:30 AM — 01:15 PM</text>
  <text x="520" y="385" fill="#F1F5F9" font-family="monospace" font-size="13">7h 45m</text>
  <rect x="640" y="370" width="80" height="22" rx="4" fill="#065F46"/>
  <text x="655" y="385" fill="#A7F3D0" font-family="monospace" font-size="11" font-weight="bold">CONFIRMED</text>
  
  <rect x="50" y="420" width="700" height="36" rx="6" fill="#1E293B" stroke="#475569" stroke-dasharray="4 4"/>
  <text x="70" y="443" fill="#94A3B8" font-family="monospace" font-size="12">NOTE: Thu shift end time handwritten (12:30 vs 1:30). Verification recommended.</text>
</svg>
`)}`;

export const DESIGN_REF_IMG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg width="800" height="500" viewBox="0 0 800 500" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="500" rx="12" fill="#FAF8F5"/>
  <rect x="240" y="40" width="320" height="420" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
  
  <!-- Drawer Header -->
  <rect x="260" y="65" width="160" height="14" rx="4" fill="#0F172A"/>
  <rect x="520" y="65" width="20" height="20" rx="10" fill="#F1F5F9"/>
  <line x1="260" y1="95" x2="540" y2="95" stroke="#F1F5F9" stroke-width="2"/>
  
  <!-- Cart Items -->
  <rect x="260" y="115" width="50" height="50" rx="8" fill="#DCFCE7"/>
  <rect x="325" y="120" width="120" height="10" rx="3" fill="#1E293B"/>
  <rect x="325" y="135" width="60" height="8" rx="2" fill="#94A3B8"/>
  <rect x="490" y="120" width="50" height="10" rx="3" fill="#0F172A"/>
  
  <rect x="260" y="180" width="50" height="50" rx="8" fill="#FEF3C7"/>
  <rect x="325" y="185" width="140" height="10" rx="3" fill="#1E293B"/>
  <rect x="325" y="200" width="70" height="8" rx="2" fill="#94A3B8"/>
  <rect x="490" y="185" width="50" height="10" rx="3" fill="#0F172A"/>
  
  <!-- Bundle Tier Progress -->
  <rect x="260" y="245" width="280" height="40" rx="8" fill="#F0FDF4" stroke="#86EFAC"/>
  <text x="275" y="268" fill="#15803D" font-family="sans-serif" font-size="11" font-weight="bold">🎉 Add 1 more tin for 15% Bundle Discount</text>
  
  <!-- Checkout button -->
  <rect x="260" y="385" width="280" height="44" rx="10" fill="#16A34A"/>
  <text x="330" y="412" fill="#FFFFFF" font-family="sans-serif" font-size="13" font-weight="bold">Checkout • $64.00</text>
  
  <text x="60" y="80" fill="#475569" font-family="monospace" font-size="14" font-weight="bold">DESIGN REFERENCE</text>
  <text x="60" y="105" fill="#64748B" font-family="monospace" font-size="11">Komorebi Tea — Cart Drawer</text>
  <text x="60" y="125" fill="#64748B" font-family="monospace" font-size="11">Figma frame #042</text>
</svg>
`)}`;

export const ERROR_SCREENSHOT_IMG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg width="800" height="500" viewBox="0 0 800 500" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="500" rx="12" fill="#0D1117"/>
  <rect x="30" y="30" width="740" height="440" rx="8" fill="#161B22" stroke="#30363D"/>
  
  <circle cx="55" cy="55" r="6" fill="#F85149"/>
  <circle cx="75" cy="55" r="6" fill="#D29922"/>
  <circle cx="95" cy="55" r="6" fill="#3FB950"/>
  
  <text x="120" y="59" fill="#8B949E" font-family="monospace" font-size="12">Developer Tools — Console (Uncaught WebGL Error)</text>
  <line x1="30" y1="75" x2="770" y2="75" stroke="#30363D"/>
  
  <rect x="45" y="95" width="710" height="55" rx="6" fill="#4C1D24" stroke="#F85149" stroke-width="1.5"/>
  <text x="65" y="120" fill="#FF7B72" font-family="monospace" font-size="13" font-weight="bold">WebGL: INVALID_OPERATION: shaderSource: invalid shader object</text>
  <text x="65" y="138" fill="#FFA198" font-family="monospace" font-size="11">at compileScrubberFragmentShader (ReelScrubber.tsx:84:19)</text>
  
  <text x="65" y="180" fill="#E6EDF3" font-family="monospace" font-size="12">Call Stack:</text>
  <text x="85" y="205" fill="#8B949E" font-family="monospace" font-size="11">> initWebGLScrubberContext (ReelScrubber.tsx:112:5)</text>
  <text x="85" y="225" fill="#8B949E" font-family="monospace" font-size="11">> handleCanvasResize (ReelScrubber.tsx:142:9)</text>
  <text x="85" y="245" fill="#8B949E" font-family="monospace" font-size="11">> ResizeObserver.callback (ReelScrubber.tsx:49:12)</text>
</svg>
`)}`;

// Initial set of attached files across projects, tasks, and calendar
export const INITIAL_ATTACHMENTS: AttachedFile[] = [
  {
    id: 'att-shift-photo-1',
    name: 'Westport_Provisions_Shift_Schedule_Sep.jpg',
    sizeBytes: 3774873,
    sizeFormatted: '3.6 MB',
    fileType: 'image',
    extension: 'jpg',
    url: SHIFT_SCHEDULE_IMG,
    thumbnailUrl: SHIFT_SCHEDULE_IMG,
    uploadedAt: 'Sep 4, 1:18 pm',
    entityType: 'calendar',
    entityId: 'calendar',
    entityName: 'Calendar: Westport Shifts',
    categoryTag: 'shift_schedule',
    parsedSummary: 'Read 5 shifts from Sep 14-20.',
  },
  {
    id: 'att-design-ref-1',
    name: 'checkout_drawer_redesign_v2.png',
    sizeBytes: 2202009,
    sizeFormatted: '2.1 MB',
    fileType: 'image',
    extension: 'png',
    url: DESIGN_REF_IMG,
    thumbnailUrl: DESIGN_REF_IMG,
    uploadedAt: 'Sep 4, 11:30 am',
    entityType: 'task',
    entityId: 'task-k-checkout',
    entityName: 'Refactor checkout drawer state & cart bundle calculation',
    categoryTag: 'design_ref',
    parsedSummary: 'Design reference attached to Task (no parsing needed).',
  },
  {
    id: 'att-spec-pdf-1',
    name: 'Komorebi_Design_Specs.pdf',
    sizeBytes: 3565158,
    sizeFormatted: '3.4 MB',
    fileType: 'pdf',
    extension: 'pdf',
    pageCount: 4,
    url: '#',
    uploadedAt: 'Sep 4, 9:45 am',
    entityType: 'task',
    entityId: 'task-k-checkout',
    entityName: 'Refactor checkout drawer state & cart bundle calculation',
    categoryTag: 'general',
  },
  {
    id: 'att-brief-doc-1',
    name: 'Client_Brief_Fall2026.docx',
    sizeBytes: 1258291,
    sizeFormatted: '1.2 MB',
    fileType: 'document',
    extension: 'docx',
    url: '#',
    uploadedAt: 'Sep 3, 4:20 pm',
    entityType: 'project',
    entityId: 'proj-komorebi',
    entityName: 'Komorebi Tea — Ecommerce & Landing',
    categoryTag: 'client_brief',
    parsedSummary: 'Read 4 proposed tasks from client brief.',
  },
  {
    id: 'att-contract-pdf-1',
    name: 'Komorebi_Master_Services_Agreement.pdf',
    sizeBytes: 5033164,
    sizeFormatted: '4.8 MB',
    fileType: 'pdf',
    extension: 'pdf',
    pageCount: 12,
    url: '#',
    uploadedAt: 'Sep 2, 2:15 pm',
    entityType: 'project',
    entityId: 'proj-komorebi',
    entityName: 'Komorebi Tea — Ecommerce & Landing',
    categoryTag: 'contract_invoice',
    parsedSummary: 'Contract detected: milestone delivery date Sep 25, 2026.',
  },
  {
    id: 'att-error-screenshot-1',
    name: 'webgl_shader_error_log.png',
    sizeBytes: 1887436,
    sizeFormatted: '1.8 MB',
    fileType: 'image',
    extension: 'png',
    url: ERROR_SCREENSHOT_IMG,
    thumbnailUrl: ERROR_SCREENSHOT_IMG,
    uploadedAt: 'Sep 4, 10:15 am',
    entityType: 'task',
    entityId: 'task-s-webgl',
    entityName: 'Optimize WebGL reel scrub and canvas shader frame drops',
    categoryTag: 'error_screenshot',
    parsedSummary: 'Error screenshot attached to Task (no parsing needed).',
  }
];

// Presets that can be quickly added in the chat composer to simulate real files
export const SAMPLE_ATTACHMENT_PRESETS: {
  id: string;
  name: string;
  label: string;
  category: 'shift_schedule' | 'client_brief' | 'design_ref' | 'error_screenshot' | 'contract_invoice';
  file: AttachedFile;
}[] = [
  {
    id: 'preset-shifts',
    name: 'Westport_Provisions_Shift_Schedule_Sep.jpg',
    label: '📷 Shift Schedule Photo',
    category: 'shift_schedule',
    file: {
      id: `att-shift-${Date.now()}`,
      name: 'Westport_Provisions_Shift_Schedule_Sep.jpg',
      sizeBytes: 3774873,
      sizeFormatted: '3.6 MB',
      fileType: 'image',
      extension: 'jpg',
      url: SHIFT_SCHEDULE_IMG,
      thumbnailUrl: SHIFT_SCHEDULE_IMG,
      uploadedAt: 'Just now',
      entityType: 'calendar',
      entityId: 'calendar',
      entityName: 'Calendar: Westport Shifts',
      categoryTag: 'shift_schedule',
      parsedSummary: 'Read 5 shifts from Sep 14-20.',
    },
  },
  {
    id: 'preset-brief',
    name: 'Client_Brief_Fall2026.docx',
    label: '📄 Client Brief (DOCX)',
    category: 'client_brief',
    file: {
      id: `att-brief-${Date.now()}`,
      name: 'Client_Brief_Fall2026.docx',
      sizeBytes: 1258291,
      sizeFormatted: '1.2 MB',
      fileType: 'document',
      extension: 'docx',
      url: '#',
      uploadedAt: 'Just now',
      entityType: 'project',
      entityId: 'proj-komorebi',
      entityName: 'Komorebi Tea — Ecommerce & Landing',
      categoryTag: 'client_brief',
      parsedSummary: 'Read 4 proposed tasks from client brief.',
    },
  },
  {
    id: 'preset-design',
    name: 'checkout_drawer_redesign_v2.png',
    label: '🖼️ Design Reference (PNG)',
    category: 'design_ref',
    file: {
      id: `att-design-${Date.now()}`,
      name: 'checkout_drawer_redesign_v2.png',
      sizeBytes: 2202009,
      sizeFormatted: '2.1 MB',
      fileType: 'image',
      extension: 'png',
      url: DESIGN_REF_IMG,
      thumbnailUrl: DESIGN_REF_IMG,
      uploadedAt: 'Just now',
      entityType: 'task',
      entityId: 'task-k-checkout',
      entityName: 'Refactor checkout drawer state & cart bundle calculation',
      categoryTag: 'design_ref',
      parsedSummary: 'Design reference attached to Task.',
    },
  },
  {
    id: 'preset-contract',
    name: 'Komorebi_Master_Services_Agreement.pdf',
    label: '📑 Contract / Invoice (PDF)',
    category: 'contract_invoice',
    file: {
      id: `att-contract-${Date.now()}`,
      name: 'Komorebi_Master_Services_Agreement.pdf',
      sizeBytes: 5033164,
      sizeFormatted: '4.8 MB',
      fileType: 'pdf',
      extension: 'pdf',
      pageCount: 12,
      url: '#',
      uploadedAt: 'Just now',
      entityType: 'project',
      entityId: 'proj-komorebi',
      entityName: 'Komorebi Tea — Ecommerce & Landing',
      categoryTag: 'contract_invoice',
      parsedSummary: 'Contract detected: milestone deadline Sep 25, 2026.',
    },
  },
];

// Parser function that simulates OCR and document extraction
export function extractAttachmentProposal(file: AttachedFile): {
  summary: string;
  proposal?: ExtractedProposal;
  responseMessage: string;
} {
  const nameLower = file.name.toLowerCase();

  // 1. Shift Schedule Photo
  if (
    file.categoryTag === 'shift_schedule' ||
    nameLower.includes('shift') ||
    nameLower.includes('schedule') ||
    nameLower.includes('roster') ||
    nameLower.includes('provisions')
  ) {
    const summary = 'Read 5 shifts from Sep 14-20.';
    const shifts: ExtractedShiftRow[] = [
      {
        id: 'shift-ex-1',
        date: 'Mon Sep 14',
        startTime: '05:30 am',
        endTime: '01:15 pm',
        shiftHours: 7.75,
        doorToDoorFormatted: '7h45 shift · 9h30 door-to-door',
        availableWindowFormatted: 'Opens 2:00 pm · 4h30 available',
        confirmed: true,
      },
      {
        id: 'shift-ex-2',
        date: 'Tue Sep 15',
        startTime: '06:00 am',
        endTime: '01:30 pm',
        shiftHours: 7.5,
        doorToDoorFormatted: '7h30 shift · 9h15 door-to-door',
        availableWindowFormatted: 'Opens 2:15 pm · 4h15 available',
        confirmed: true,
      },
      {
        id: 'shift-ex-3',
        date: 'Wed Sep 16',
        startTime: '05:30 am',
        endTime: '01:15 pm',
        shiftHours: 7.75,
        doorToDoorFormatted: '7h45 shift · 9h30 door-to-door',
        availableWindowFormatted: 'Opens 2:00 pm · 4h30 available',
        conflictWarning: 'Conflicts with Selene client call (2:00 pm)',
        confirmed: true,
      },
      {
        id: 'shift-ex-4',
        date: 'Thu Sep 17',
        startTime: '06:00 am',
        endTime: '12:30 pm',
        shiftHours: 6.5,
        doorToDoorFormatted: '6h30 shift · 8h15 door-to-door',
        availableWindowFormatted: 'Opens 1:15 pm · 5h15 available',
        isLowConfidence: true,
        confidenceNote: 'Low OCR confidence: handwritten end time (12:30 or 1:30?)',
        confirmed: false,
      },
      {
        id: 'shift-ex-5',
        date: 'Fri Sep 18',
        startTime: '05:30 am',
        endTime: '01:15 pm',
        shiftHours: 7.75,
        doorToDoorFormatted: '7h45 shift · 9h30 door-to-door',
        availableWindowFormatted: 'Opens 2:00 pm · 4h30 available',
        confirmed: true,
      },
    ];

    return {
      summary,
      proposal: {
        id: `prop-shift-${Date.now()}`,
        type: 'shift_schedule',
        summary,
        shifts,
        applied: false,
      },
      responseMessage: `I processed your shift schedule image. Here is the extraction diff for your approval before writing to the calendar:`,
    };
  }

  // 2. Client Brief (PDF / DOCX)
  if (
    file.categoryTag === 'client_brief' ||
    nameLower.includes('brief') ||
    nameLower.includes('scope') ||
    nameLower.includes('requirements')
  ) {
    const summary = 'Read 4 proposed tasks from client brief.';
    const tasks: ExtractedTaskRow[] = [
      {
        id: 'task-prop-1',
        title: 'Implement Cart Drawer Quantity Steppers & Live Subtotal',
        estimate: '1h 30m',
        accepted: true,
      },
      {
        id: 'task-prop-2',
        title: 'Stripe Webhook Idempotency & Error Handling',
        estimate: '2h 15m',
        accepted: true,
      },
      {
        id: 'task-prop-3',
        title: 'Free Shipping Progress Indicator Bar',
        estimate: '45m',
        accepted: true,
      },
      {
        id: 'task-prop-4',
        title: 'Bundle Tier Discount Logic (Matcha 3-pack)',
        estimate: '2h 00m',
        accepted: true,
      },
    ];

    return {
      summary,
      proposal: {
        id: `prop-tasks-${Date.now()}`,
        type: 'client_brief',
        summary,
        tasks,
        projectName: file.entityName,
        projectId: file.entityId,
        applied: false,
      },
      responseMessage: `I extracted the task deliverables and duration estimates from ${file.name}. Review and accept/reject tasks below before writing to the project board:`,
    };
  }

  // 3. Invoice or Contract
  if (
    file.categoryTag === 'contract_invoice' ||
    nameLower.includes('contract') ||
    nameLower.includes('agreement') ||
    nameLower.includes('invoice') ||
    nameLower.includes('terms')
  ) {
    const summary = 'Detected payment terms & milestone deadline in contract.';
    return {
      summary,
      proposal: {
        id: `prop-contract-${Date.now()}`,
        type: 'contract_invoice',
        summary,
        projectName: file.entityName,
        projectId: file.entityId,
        deadlineWarning: {
          date: 'Friday, Sep 25, 2026',
          description: 'Milestone 2 Delivery Deadline specified in Clause 4.2',
          actionLabel: 'Set Sep 25 as Project Milestone Due Date',
        },
        applied: false,
      },
      responseMessage: `I scanned ${file.name} and identified key contractual dates. Review below to apply to the project:`,
    };
  }

  // 4. Design Reference or Screenshot (no parsing required)
  return {
    summary: `Attached to ${file.entityName} (no parsing needed).`,
    proposal: {
      id: `prop-ref-${Date.now()}`,
      type: 'none',
      summary: `Stored against ${file.entityName}.`,
    },
    responseMessage: `Received and saved ${file.name} under ${file.entityName}. Stored in Supabase Storage with project-scoped RLS.`,
  };
}
