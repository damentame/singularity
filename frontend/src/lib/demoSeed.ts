// ─── Demo Seed ────────────────────────────────────────────────────────────────
// Populates localStorage with realistic demo events + injects mock suppliers.
// Triggered by the "Load Demo Data" button in PlannerDashboard.

import { AppSupplier } from './supplierDirectory';

const STORAGE_KEY = 'theone_events_v6';

// ─── Mock Suppliers ────────────────────────────────────────────────────────────
// Returned as fallback by searchAppSuppliers when Supabase has no real results.
export const MOCK_SUPPLIERS: AppSupplier[] = [
  {
    userId: 'demo-sup-001',
    businessName: 'Luminary Décor & Florals',
    tradingName: 'Luminary Events',
    email: 'hello@luminarydecor.co.za',
    city: 'Johannesburg',
    country: 'ZA',
    serviceRadius: '60',
    categories: ['florals', 'decor', 'lighting'],
    coverImageUrl: null,
  },
  {
    userId: 'demo-sup-002',
    businessName: 'Platinum Catering Co.',
    tradingName: 'Platinum Catering',
    email: 'bookings@platinumcatering.co.za',
    city: 'Sandton',
    country: 'ZA',
    serviceRadius: '80',
    categories: ['catering', 'beverages', 'staffing'],
    coverImageUrl: null,
  },
  {
    userId: 'demo-sup-003',
    businessName: 'Lens & Light Photography',
    tradingName: 'Lens & Light',
    email: 'studio@lensandlight.co.za',
    city: 'Johannesburg',
    country: 'ZA',
    serviceRadius: '150',
    categories: ['photo_video'],
    coverImageUrl: null,
  },
  {
    userId: 'demo-sup-004',
    businessName: 'SoundWave AV Solutions',
    tradingName: 'SoundWave',
    email: 'av@soundwavesa.co.za',
    city: 'Midrand',
    country: 'ZA',
    serviceRadius: '100',
    categories: ['av_technical', 'entertainment', 'lighting'],
    coverImageUrl: null,
  },
  {
    userId: 'demo-sup-005',
    businessName: 'Heritage Furniture Hire',
    tradingName: 'Heritage Hire',
    email: 'orders@heritagehire.co.za',
    city: 'Johannesburg',
    country: 'ZA',
    serviceRadius: '50',
    categories: ['furniture', 'tableware', 'linen', 'glassware'],
    coverImageUrl: null,
  },
  {
    userId: 'demo-sup-006',
    businessName: 'Cape Elegance Events',
    tradingName: 'Cape Elegance',
    email: 'info@capeelegance.co.za',
    city: 'Cape Town',
    country: 'ZA',
    serviceRadius: '80',
    categories: ['decor', 'florals', 'linen', 'furniture'],
    coverImageUrl: null,
  },
  {
    userId: 'demo-sup-007',
    businessName: 'BlueWater Catering',
    tradingName: 'BlueWater',
    email: 'events@bluewatercatering.co.za',
    city: 'Cape Town',
    country: 'ZA',
    serviceRadius: '60',
    categories: ['catering', 'beverages'],
    coverImageUrl: null,
  },
  {
    userId: 'demo-sup-008',
    businessName: 'Swift Executive Transport',
    tradingName: 'Swift Transport',
    email: 'bookings@swifttransport.co.za',
    city: 'Johannesburg',
    country: 'ZA',
    serviceRadius: '200',
    categories: ['transport'],
    coverImageUrl: null,
  },
];

// ─── Demo Events ──────────────────────────────────────────────────────────────

const now = new Date().toISOString();

function li(id: string, name: string, category: string, qty: number, unitCost: number, momentId: string, markup = 30): any {
  return {
    id, name, category, quantity: qty, isGuestDependent: false, guestRatio: 1,
    unitCost, setupCost: 0, breakdownCost: 0, deliveryCost: 0,
    deliveryType: 'flat', markupPercent: markup, flagged: false,
    notes: '', rfqSent: false, rfqJobCode: '', momentId,
    timeType: 'normal', imageUrl: '', productId: '', programId: '',
    internalNotes: '', clientVisibleNotes: '',
    specIds: [], supplierAssignmentId: '',
    supplierPriceIncludesVat: false, vatRateUsed: 0.15, isDryHire: false,
  };
}

function task(id: string, title: string, status: string, due: string, priority: string): any {
  return {
    id, title, description: '', status, priority, dueDate: due,
    assignedTo: '', completedAt: '', createdAt: now, updatedAt: now,
  };
}

function assignment(id: string, eventId: string, lineItemId: string, supplierName: string, supplierEmail: string, status = 'PENDING'): any {
  return {
    id, eventId, lineItemId, supplierName, supplierEmail,
    supplierCompanyId: '', status,
    acceptedQuoteId: '', notes: '', createdAt: now, updatedAt: now,
  };
}

// ─── Event 1: The Sterling Wedding ────────────────────────────────────────────
const weddingId = 'demo-event-wedding-001';
const wMom1 = 'demo-mom-w-ceremony';
const wMom2 = 'demo-mom-w-cocktail';
const wMom3 = 'demo-mom-w-reception';

const sterlingWedding: any = {
  id: weddingId,
  name: 'The Sterling & Nkosi Wedding',
  eventTitle: 'The Sterling & Nkosi Wedding',
  date: '2026-12-05',
  endDate: '2026-12-05',
  eventType: 'wedding',
  clientDetails: {
    name: 'Emma Sterling',
    email: 'emma.sterling@gmail.com',
    phone: '+27 82 555 0101',
    address: '12 Waterfall Drive, Sandton, 2196',
    company: '',
    notes: 'Bride prefers ivory & gold palette. Groom prefers minimal fuss.',
  },
  clientAccountId: '',
  venue: 'Waterfall Manor Estate',
  venueType: 'wine_estate',
  country: 'ZA',
  region: 'Gauteng',
  city: 'Johannesburg',
  venueSpaces: [
    { id: 'vs-w-1', name: 'Chapel Gardens', capacity: 130, notes: '' },
    { id: 'vs-w-2', name: 'Terrace Lawn', capacity: 200, notes: 'Cocktail hour space' },
    { id: 'vs-w-3', name: 'Grand Ballroom', capacity: 150, notes: 'Reception venue' },
  ],
  moments: [
    { id: wMom1, name: 'Ceremony', startTime: '14:00', endTime: '15:00', notes: 'Outdoor chapel' },
    { id: wMom2, name: 'Cocktail Hour', startTime: '15:30', endTime: '17:00', notes: 'Terrace Lawn' },
    { id: wMom3, name: 'Evening Reception', startTime: '17:30', endTime: '23:00', notes: 'Grand Ballroom' },
  ],
  guestCount: 120,
  status: 'active',
  currency: 'ZAR',
  vatRate: 0.15,
  vatName: 'VAT',
  defaultPricesIncludeVat: false,
  vatEnabled: true,
  billingCountry: 'ZA',
  billingCurrency: 'ZAR',
  showPricing: false,
  jobCode: 'EVT-2026-0042',
  companyName: 'Singularity Events',
  divisionName: 'Weddings & Celebrations',
  lineItems: [
    li('demo-li-w-01', 'Bridal Floral Arch', 'florals', 1, 12500, wMom1, 25),
    li('demo-li-w-02', 'Pew End Florals (per pair)', 'florals', 16, 380, wMom1, 25),
    li('demo-li-w-03', 'Garden Chiavari Chairs', 'furniture', 130, 75, wMom1, 30),
    li('demo-li-w-04', 'String Light Canopy', 'lighting', 1, 8500, wMom2, 30),
    li('demo-li-w-05', 'Cocktail Tables & Linen', 'furniture', 12, 450, wMom2, 30),
    li('demo-li-w-06', 'Canapé Platter Service (per 20 pax)', 'catering', 6, 1800, wMom2, 35),
    li('demo-li-w-07', 'Bar Service Staff', 'staffing', 4, 1200, wMom2, 20),
    li('demo-li-w-08', 'Welcome Drinks — Sparkling & Soft', 'beverages', 120, 95, wMom2, 40),
    li('demo-li-w-09', 'Ballroom Centrepieces (per table)', 'florals', 15, 2200, wMom3, 25),
    li('demo-li-w-10', '3-Course Plated Dinner (per head)', 'catering', 120, 650, wMom3, 30),
    li('demo-li-w-11', 'Full Bar Package (per head)', 'beverages', 120, 420, wMom3, 35),
    li('demo-li-w-12', 'Wedding Photographer (full day)', 'photo_video', 1, 22000, wMom1, 20),
    li('demo-li-w-13', 'Videographer (highlight reel)', 'photo_video', 1, 15000, wMom1, 20),
    li('demo-li-w-14', 'DJ & Sound System', 'entertainment', 1, 9500, wMom3, 25),
    li('demo-li-w-15', 'Ivory Damask Table Linen (per table)', 'linen', 15, 320, wMom3, 30),
    li('demo-li-w-16', 'Fine Glassware Set (per table)', 'glassware', 15, 280, wMom3, 30),
  ],
  supplierAssignments: [
    assignment('demo-sa-w-01', weddingId, 'demo-li-w-01', 'Luminary Décor & Florals', 'hello@luminarydecor.co.za', 'QUOTE_RECEIVED'),
    assignment('demo-sa-w-02', weddingId, 'demo-li-w-02', 'Luminary Décor & Florals', 'hello@luminarydecor.co.za', 'QUOTE_RECEIVED'),
    assignment('demo-sa-w-03', weddingId, 'demo-li-w-09', 'Luminary Décor & Florals', 'hello@luminarydecor.co.za', 'QUOTE_RECEIVED'),
    assignment('demo-sa-w-04', weddingId, 'demo-li-w-10', 'Platinum Catering Co.', 'bookings@platinumcatering.co.za', 'PENDING'),
    assignment('demo-sa-w-05', weddingId, 'demo-li-w-11', 'Platinum Catering Co.', 'bookings@platinumcatering.co.za', 'PENDING'),
    assignment('demo-sa-w-06', weddingId, 'demo-li-w-12', 'Lens & Light Photography', 'studio@lensandlight.co.za', 'ACCEPTED'),
    assignment('demo-sa-w-07', weddingId, 'demo-li-w-13', 'Lens & Light Photography', 'studio@lensandlight.co.za', 'ACCEPTED'),
    assignment('demo-sa-w-08', weddingId, 'demo-li-w-14', 'SoundWave AV Solutions', 'av@soundwavesa.co.za', 'PENDING'),
  ],
  tasks: [
    task('demo-task-w-01', 'Confirm ceremony floral arch design with Luminary', 'IN_PROGRESS', '2026-11-01', 'HIGH'),
    task('demo-task-w-02', 'Send menu tasting invitation to couple', 'TODO', '2026-10-15', 'HIGH'),
    task('demo-task-w-03', 'Confirm photographer shot list', 'DONE', '2026-10-01', 'MEDIUM'),
    task('demo-task-w-04', 'Finalise seating plan & table layout', 'TODO', '2026-11-20', 'HIGH'),
    task('demo-task-w-05', 'Order wedding cake — confirm flavours', 'TODO', '2026-11-10', 'MEDIUM'),
    task('demo-task-w-06', 'Brief bar team on signature cocktail', 'TODO', '2026-12-01', 'LOW'),
  ],
  rfqMessages: [],
  versions: [],
  currentVersion: 1,
  specs: [],
  shoppingLists: [],
  salesOrders: [],
  supplierQuotes: [],
  approvalRequests: [],
  budgetLines: [],
  activityLog: [],
  programs: [],
  backupVenue: 'Indoors — Glasshouse Pavilion',
  backupVenueSpaces: [],
  createdAt: now,
  updatedAt: now,
};

// ─── Event 2: Apex Corporate Summit ───────────────────────────────────────────
const corpId = 'demo-event-corp-002';
const cMom1 = 'demo-mom-c-morning';
const cMom2 = 'demo-mom-c-lunch';
const cMom3 = 'demo-mom-c-cocktails';

const apexSummit: any = {
  id: corpId,
  name: 'Apex Group Leadership Summit 2026',
  eventTitle: 'Apex Group Leadership Summit 2026',
  date: '2026-09-18',
  endDate: '2026-09-19',
  eventType: 'corporate',
  clientDetails: {
    name: 'Sipho Dlamini',
    email: 'sdlamini@apexgroup.co.za',
    phone: '+27 11 888 4200',
    address: '1 Sandown Valley Crescent, Sandton, 2196',
    company: 'Apex Group Holdings',
    notes: 'Two-day summit. Day 1: strategy sessions + gala dinner. Day 2: workshops + networking lunch.',
  },
  clientAccountId: '',
  venue: 'Sandton Convention Centre',
  venueType: 'other',
  country: 'ZA',
  region: 'Gauteng',
  city: 'Johannesburg',
  venueSpaces: [
    { id: 'vs-c-1', name: 'Plenary Hall A', capacity: 100, notes: 'Main conference hall' },
    { id: 'vs-c-2', name: 'Exhibition Foyer', capacity: 150, notes: 'Networking & catering' },
  ],
  moments: [
    { id: cMom1, name: 'Morning Plenary Sessions', startTime: '08:00', endTime: '12:00', notes: 'Keynotes & strategy presentations' },
    { id: cMom2, name: 'Networking Lunch', startTime: '12:00', endTime: '14:00', notes: 'Exhibition Foyer' },
    { id: cMom3, name: 'Executive Cocktail Function', startTime: '19:00', endTime: '22:00', notes: 'Gala dinner — Day 1 evening' },
  ],
  guestCount: 80,
  status: 'draft',
  currency: 'ZAR',
  vatRate: 0.15,
  vatName: 'VAT',
  defaultPricesIncludeVat: false,
  vatEnabled: true,
  billingCountry: 'ZA',
  billingCurrency: 'ZAR',
  showPricing: false,
  jobCode: 'EVT-2026-0051',
  companyName: 'Singularity Events',
  divisionName: 'Corporate & Conferencing',
  lineItems: [
    li('demo-li-c-01', 'LED Conference Screen (p/day)', 'av_technical', 2, 4500, cMom1, 30),
    li('demo-li-c-02', 'Wireless Lapel Microphone Set', 'av_technical', 4, 1200, cMom1, 30),
    li('demo-li-c-03', 'Conference Chairs', 'furniture', 100, 65, cMom1, 25),
    li('demo-li-c-04', 'Morning Tea & Coffee Station (per head)', 'catering', 80, 120, cMom1, 35),
    li('demo-li-c-05', 'Buffet Lunch (per head)', 'catering', 80, 380, cMom2, 30),
    li('demo-li-c-06', 'Soft Drinks & Juice Station', 'beverages', 80, 90, cMom2, 35),
    li('demo-li-c-07', 'Exhibition Tables & Linen', 'furniture', 8, 420, cMom2, 25),
    li('demo-li-c-08', 'Event Photographer (full day)', 'photo_video', 1, 12000, cMom1, 20),
    li('demo-li-c-09', 'Cocktail Bar Service (per head)', 'beverages', 80, 280, cMom3, 40),
    li('demo-li-c-10', 'Gala Dinner — 3-Course (per head)', 'catering', 80, 750, cMom3, 30),
    li('demo-li-c-11', 'Cocktail Table Arrangements (per table)', 'florals', 10, 650, cMom3, 25),
    li('demo-li-c-12', 'Executive Coach Transfer (per vehicle)', 'transport', 3, 3500, cMom1, 20),
  ],
  supplierAssignments: [
    assignment('demo-sa-c-01', corpId, 'demo-li-c-01', 'SoundWave AV Solutions', 'av@soundwavesa.co.za', 'PENDING'),
    assignment('demo-sa-c-02', corpId, 'demo-li-c-02', 'SoundWave AV Solutions', 'av@soundwavesa.co.za', 'PENDING'),
    assignment('demo-sa-c-03', corpId, 'demo-li-c-08', 'Lens & Light Photography', 'studio@lensandlight.co.za', 'PENDING'),
    assignment('demo-sa-c-04', corpId, 'demo-li-c-12', 'Swift Executive Transport', 'bookings@swifttransport.co.za', 'PENDING'),
  ],
  tasks: [
    task('demo-task-c-01', 'Confirm AV setup walkthrough with venue', 'TODO', '2026-09-01', 'HIGH'),
    task('demo-task-c-02', 'Send menu options to client for approval', 'IN_PROGRESS', '2026-08-15', 'HIGH'),
    task('demo-task-c-03', 'Arrange executive name tags & place cards', 'TODO', '2026-09-10', 'MEDIUM'),
    task('demo-task-c-04', 'Confirm transport pick-up schedule with Apex HR', 'TODO', '2026-09-05', 'MEDIUM'),
  ],
  rfqMessages: [],
  versions: [],
  currentVersion: 1,
  specs: [],
  shoppingLists: [],
  salesOrders: [],
  supplierQuotes: [],
  approvalRequests: [],
  budgetLines: [],
  activityLog: [],
  programs: [],
  backupVenue: '',
  backupVenueSpaces: [],
  createdAt: now,
  updatedAt: now,
};

// ─── Seed Function ─────────────────────────────────────────────────────────────
export function seedDemoData(): number {
  const existing = localStorage.getItem(STORAGE_KEY);
  let events: any[] = [];
  try {
    events = existing ? JSON.parse(existing) : [];
  } catch {
    events = [];
  }

  // Only add events that don't already exist
  const existingIds = new Set(events.map((e: any) => e.id));
  const toAdd = [sterlingWedding, apexSummit].filter(e => !existingIds.has(e.id));

  if (toAdd.length === 0) return 0;

  const merged = [...events, ...toAdd];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  return toAdd.length;
}

export function clearDemoData(): void {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (!existing) return;
  try {
    const events: any[] = JSON.parse(existing);
    const filtered = events.filter(
      (e: any) => !e.id.startsWith('demo-event-')
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch {
    // ignore
  }
}
