import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { getCountryConfigOrDefault, calculateVatBreakdown, formatCurrency, getCurrencySymbol } from '@/data/countryConfig';



// ─── Types ───────────────────────────────────────────────────────────────────

// ─── v11: Client Accounts ────────────────────────────────────────────────────

export type ClientType = 'corporate' | 'wedding' | 'celebration';

export interface ClientAccount {
  id: string;
  clientType: ClientType;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhoneCode: string;
  primaryContactPhone: string;
  country: string;
  region: string;
  city: string;
  billingAddress: string;
  vatNumber: string;            // corporate only
  companyName: string;          // corporate only
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  corporate: 'Corporate',
  wedding: 'Wedding',
  celebration: 'Celebration',
};

export const createDefaultClientAccount = (clientType: ClientType): Omit<ClientAccount, 'id' | 'createdAt' | 'updatedAt'> => ({
  clientType,
  primaryContactName: '',
  primaryContactEmail: '',
  primaryContactPhoneCode: '',
  primaryContactPhone: '',
  country: '',
  region: '',
  city: '',
  billingAddress: '',
  vatNumber: '',
  companyName: '',
  isActive: true,
});

export type TimeType = 'normal' | 'after_hours' | 'sunday';
export type EventType = 'wedding' | 'celebration' | 'corporate';


export const TIME_MULTIPLIERS: Record<TimeType, number> = {
  normal: 1.0,
  after_hours: 1.5,
  sunday: 2.0,
};

export const TIME_LABELS: Record<TimeType, string> = {
  normal: 'Normal',
  after_hours: 'After Hours',
  sunday: 'Sunday',
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  wedding: 'Wedding',
  celebration: 'Celebration',
  corporate: 'Corporate',
};

export type VenueType = 'hotel' | 'wine_estate' | 'private_home' | 'restaurant' | 'beach' | 'other' | '';

export const VENUE_TYPE_LABELS: Record<string, string> = {
  hotel: 'Hotel',
  wine_estate: 'Wine Estate',
  private_home: 'Private Home',
  restaurant: 'Restaurant',
  beach: 'Beach',
  other: 'Other',
};

export type ItemCategory =
  | 'furniture'
  | 'tableware'
  | 'glassware'
  | 'linen'
  | 'lighting'
  | 'florals'
  | 'staffing'
  | 'entertainment'
  | 'photo_video'
  | 'catering'
  | 'beverages'
  | 'decor'
  | 'stationery'
  | 'av_technical'
  | 'transport'
  | 'other';

export const CATEGORY_LABELS: Record<ItemCategory, string> = {
  furniture: 'Furniture',
  tableware: 'Tableware',
  glassware: 'Glassware',
  linen: 'Linen',
  lighting: 'Lighting',
  florals: 'Florals',
  staffing: 'Staffing',
  entertainment: 'Entertainment',
  photo_video: 'Photo / Video',
  catering: 'Catering',
  beverages: 'Beverages',
  decor: 'Decor',
  stationery: 'Stationery',
  av_technical: 'AV / Technical',
  transport: 'Transport / Logistics',
  other: 'Other',
};

export const CATEGORY_ORDER: ItemCategory[] = [
  'furniture', 'tableware', 'glassware', 'linen', 'lighting',
  'florals', 'staffing', 'entertainment', 'photo_video',
  'catering', 'beverages', 'decor', 'stationery', 'av_technical',
  'transport', 'other',
];


const LABOUR_CATEGORIES: ItemCategory[] = ['staffing'];

// ─── Configurable Option Selection ───────────────────────────────────────────

export interface OptionSelection {
  optionId: string;
  valueKey: string;
  displayLabel: string;
  isCustom: boolean;
}

export const makeOptionSelection = (valueKey: string, displayLabel: string, optionId?: string): OptionSelection => ({
  optionId: optionId || '',
  valueKey,
  displayLabel,
  isCustom: !optionId,
});

// ─── Client Details ──────────────────────────────────────────────────────────

export interface CorporateClient {
  companyName: string;
  vatNumber: string;
  registrationNumber: string;
  billingAddress: string;
  contactFirstName: string;
  contactSurname: string;
  contactEmail: string;
  contactTelephoneCode: string;
  contactTelephone: string;
  accountsPayableEmail: string;
}

export interface WeddingClient {
  partner1FirstName: string;
  partner1Surname: string;
  partner2FirstName: string;
  partner2Surname: string;
  primaryEmail: string;
  primaryTelephoneCode: string;
  primaryTelephone: string;
  billingName: string;
  billingAddress: string;
}

export interface CelebrationClient {
  hostFirstName: string;
  hostSurname: string;
  hostEmail: string;
  hostTelephoneCode: string;
  hostTelephone: string;
  billingName: string;
  billingAddress: string;
}

export type ClientDetails = CorporateClient | WeddingClient | CelebrationClient;

// ─── Venue Spaces ────────────────────────────────────────────────────────────

export interface VenueSpace {
  id: string;
  name: string;
  notes: string;
  capacity: number | null;
  spaceType?: OptionSelection;
}

// ─── Event Programs ──────────────────────────────────────────────────────────

export interface EventProgram {
  id: string;
  programName: string;
  programTemplate?: OptionSelection;
  programDate: string;
  sortOrder: number;
  venuePropertyName: string;
  primaryVenueSpaceIds: string[];
  backupVenuePropertyName: string;
  backupVenueSpaceIds: string[];
  notes: string;
  status: 'active' | 'cancelled' | 'completed';
}

// ─── Moment Types ────────────────────────────────────────────────────────────

export type MomentType =
  | 'welcome_drinks'
  | 'ceremony'
  | 'cocktail_hour'
  | 'reception'
  | 'dinner'
  | 'after_party'
  | 'breakfast'
  | 'other';

export const MOMENT_TYPE_LABELS: Record<MomentType, string> = {
  welcome_drinks: 'Welcome Drinks',
  ceremony: 'Ceremony',
  cocktail_hour: 'Cocktail Hour',
  reception: 'Reception',
  dinner: 'Dinner',
  after_party: 'After Party',
  breakfast: 'Breakfast',
  other: 'Other',
};

export const MOMENT_PRESETS = [
  'Welcome Dinner', 'Drinks Reception', 'Ceremony', 'Reception',
  'After Party', 'Next-Day Breakfast', 'Welcome', 'Main Event', 'After Function', 'Other',
] as const;

export interface EventMoment {
  id: string;
  name: string;
  momentType: MomentType;
  momentTypeOption?: OptionSelection;
  date: string;
  startTime: string;
  endTime: string;
  venueSpaceId: string;
  backupVenueSpaceId: string;
  notes: string;
  programId: string;
  parentMomentId: string;
  sortOrder: number;
}


// ─── RFQ ─────────────────────────────────────────────────────────────────────

export interface RFQMessage {
  id: string;
  lineItemId: string;
  jobCode: string;
  supplierEmail: string;
  supplierName: string;
  message: string;
  status: 'sent' | 'replied' | 'accepted' | 'declined';
  sentAt: string;
  reply?: string;
  repliedAt?: string;
}

// ─── Line Item Spec (Operational Notes) ──────────────────────────────────────

export type SpecStatus = 'DRAFT' | 'CONFIRMED' | 'IN_PROGRESS' | 'FINAL';

export interface LineItemSpec {
  id: string;
  ownerType: 'PROPOSAL_ITEM' | 'SALES_ORDER_ITEM';
  ownerId: string;                    // line item id
  programId: string;                  // '' = overall
  venueSpaceId: string;               // '' = unassigned
  placementLabel: string;             // e.g. "Garden entrance table"
  placementDetails: string;           // exact placement instructions
  visualBrief: string;                // style notes
  exclusions: string;                 // "no fragrant flowers"
  culturalConstraints: string;        // culture/religion notes
  safetyConstraints: string;          // fire restrictions etc.
  supplierNotes: string;              // what supplier must know
  internalNotes: string;              // planner team only
  clientVisibleNotes: string;         // polished summary for client
  referenceAssetIds: string[];        // image/PDF references
  floorplanAssetIds: string[];        // floorplan markups
  status: SpecStatus;
  updatedAt: string;
}

export const SPEC_STATUS_LABELS: Record<SpecStatus, string> = {
  DRAFT: 'Draft',
  CONFIRMED: 'Confirmed',
  IN_PROGRESS: 'In Progress',
  FINAL: 'Final',
};

export const createEmptySpec = (ownerId: string, ownerType: 'PROPOSAL_ITEM' | 'SALES_ORDER_ITEM' = 'PROPOSAL_ITEM'): Omit<LineItemSpec, 'id'> => ({
  ownerType,
  ownerId,
  programId: '',
  venueSpaceId: '',
  placementLabel: '',
  placementDetails: '',
  visualBrief: '',
  exclusions: '',
  culturalConstraints: '',
  safetyConstraints: '',
  supplierNotes: '',
  internalNotes: '',
  clientVisibleNotes: '',
  referenceAssetIds: [],
  floorplanAssetIds: [],
  status: 'DRAFT',
  updatedAt: new Date().toISOString(),
});

// ─── Tasks ───────────────────────────────────────────────────────────────────

export type TaskStatus = 'TODO' | 'DOING' | 'DONE' | 'BLOCKED';
export type TaskLinkedType = 'EVENT' | 'PROGRAM' | 'MOMENT' | 'PROPOSAL_ITEM' | 'SALES_ORDER_ITEM' | 'PACKING_LIST';

export interface EventTask {
  id: string;
  linkedType: TaskLinkedType;
  linkedId: string;
  title: string;
  description: string;
  assignedTo: string;                 // user name or email
  dueAt: string;                      // ISO datetime
  status: TaskStatus;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'To Do',
  DOING: 'In Progress',
  DONE: 'Done',
  BLOCKED: 'Blocked',
};

// ─── Shopping Lists ──────────────────────────────────────────────────────────

export type ShoppingListStatus = 'DRAFT' | 'APPROVED' | 'ORDERED' | 'RECEIVED' | 'CLOSED';
export type ShoppingItemStatus = 'NEEDED' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';
export type PurchaseType = 'BUY' | 'RENT' | 'REUSE' | 'SERVICE' | 'OTHER';

export const SHOPPING_LIST_STATUS_LABELS: Record<ShoppingListStatus, string> = {
  DRAFT: 'Draft',
  APPROVED: 'Approved',
  ORDERED: 'Ordered',
  RECEIVED: 'Received',
  CLOSED: 'Closed',
};

export const SHOPPING_ITEM_STATUS_LABELS: Record<ShoppingItemStatus, string> = {
  NEEDED: 'Needed',
  ORDERED: 'Ordered',
  RECEIVED: 'Received',
  CANCELLED: 'Cancelled',
};

export const PURCHASE_TYPE_LABELS: Record<PurchaseType, string> = {
  BUY: 'Buy',
  RENT: 'Rent',
  REUSE: 'Reuse',
  SERVICE: 'Service',
  OTHER: 'Other',
};

export interface ShoppingListItem {
  id: string;
  shoppingListId: string;
  sourceLineItemId: string;           // original proposal/SO item
  productId: string;
  titleSnapshot: string;
  quantity: number;
  unitTypeSnapshot: string;
  estimatedUnitCost: number;
  estimatedTotalCost: number;
  purchaseType: PurchaseType;
  storeOrVendor: string;
  requiredByDate: string;
  specLinkIds: string[];              // references to line_item_specs
  notes: string;
  status: ShoppingItemStatus;
}

export interface ShoppingList {
  id: string;
  eventId: string;
  programId: string;                  // '' = overall
  listName: string;
  status: ShoppingListStatus;
  supplierName: string;
  currency: string;
  totalEstimate: number;
  items: ShoppingListItem[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Sales Orders ────────────────────────────────────────────────────────────

export type SalesOrderStatus = 'DRAFT' | 'CONFIRMED' | 'IN_PROGRESS' | 'DELIVERED' | 'INVOICED' | 'CLOSED';

export const SALES_ORDER_STATUS_LABELS: Record<SalesOrderStatus, string> = {
  DRAFT: 'Draft',
  CONFIRMED: 'Confirmed',
  IN_PROGRESS: 'In Progress',
  DELIVERED: 'Delivered',
  INVOICED: 'Invoiced',
  CLOSED: 'Closed',
};

export interface SalesOrderItem {
  id: string;
  salesOrderId: string;
  sourceLineItemId: string;           // original proposal item id
  name: string;
  category: ItemCategory;
  quantity: number;
  snapshotUnitPrice: number;
  snapshotClientPrice: number;
  snapshotDescription: string;
  specIds: string[];                  // copied spec IDs
  internalNotes: string;
  clientVisibleNotes: string;
  imageUrl: string;
}

export interface SalesOrder {
  id: string;
  eventId: string;
  orderNumber: string;
  status: SalesOrderStatus;
  snapshotVersion: number;            // which proposal version was accepted
  items: SalesOrderItem[];
  totalAmount: number;
  currency: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Cost Line Item (v10: added isDryHire) ─────────────────────────────────

export interface CostLineItem {
  id: string;
  name: string;
  category: ItemCategory;
  quantity: number;
  isGuestDependent: boolean;
  guestRatio: number;
  unitCost: number;
  setupCost: number;
  breakdownCost: number;
  deliveryCost: number;
  deliveryType: 'flat' | 'per_km';
  markupPercent: number;
  flagged: boolean;
  notes: string;
  rfqSent: boolean;
  rfqJobCode: string;
  momentId: string;
  timeType: TimeType;
  imageUrl: string;
  productId: string;
  programId: string;
  snapshotUnitPrice?: number;
  snapshotDescription?: string;
  snapshotCurrency?: string;
  // v6
  internalNotes: string;
  clientVisibleNotes: string;
  specIds: string[];
  // v7: Supplier Assignment
  supplierAssignmentId: string;
  // v8: VAT / Tax snapshot per line item
  supplierPriceIncludesVat: boolean;   // default from event.defaultPricesIncludeVat
  vatRateUsed: number;                 // snapshot from event.vatRate at time of entry
  // v10: Dry Hire flag for refundable deposit calculation
  isDryHire: boolean;                  // default false
}





export interface EventVersion {
  id: string;
  versionNumber: number;
  timestamp: string;
  changeDescription: string;
  guestCount: number;
  lineItems: CostLineItem[];
}

// ─── v7: Control Tower Types ─────────────────────────────────────────────────

export type SupplierAssignmentStatus = 'PENDING' | 'QUOTE_RECEIVED' | 'QUOTE_REVISED' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
export type ApprovalRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ApprovalRequestType = 'QUOTE_ACCEPTANCE' | 'ADJUSTMENT';
export type BudgetLineType = 'SUPPLIER_QUOTE' | 'ADJUSTMENT';

export const ASSIGNMENT_STATUS_LABELS: Record<SupplierAssignmentStatus, string> = {
  PENDING: 'Pending', QUOTE_RECEIVED: 'Quote Received', QUOTE_REVISED: 'Quote Revised',
  ACCEPTED: 'Accepted', DECLINED: 'Declined', CANCELLED: 'Cancelled',
};

export const ASSIGNMENT_STATUS_COLORS: Record<SupplierAssignmentStatus, string> = {
  PENDING: '#9CA3AF', QUOTE_RECEIVED: '#F59E0B', QUOTE_REVISED: '#3B82F6',
  ACCEPTED: '#22C55E', DECLINED: '#EF4444', CANCELLED: '#6B7280',
};

export interface SupplierAssignment {
  id: string;
  eventId: string;
  lineItemId: string;
  supplierName: string;
  supplierEmail: string;
  supplierCompanyId: string;
  status: SupplierAssignmentStatus;
  acceptedQuoteId: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierQuote {
  id: string;
  assignmentId: string;
  versionNumber: number;
  amount: number;
  currency: string;
  fileUrl: string;
  fileName: string;
  notes: string;
  isAccepted: boolean;
  status: 'SUBMITTED' | 'REVISED' | 'ACCEPTED' | 'REJECTED';
  submittedAt: string;
}

export interface ApprovalRequest {
  id: string;
  eventId: string;
  type: ApprovalRequestType;
  referenceId: string;           // quoteId or adjustmentId
  referenceLabel: string;        // human-readable label
  amount: number;
  requestedBy: string;
  requestedAt: string;
  approvedBy: string;
  approvedAt: string;
  status: ApprovalRequestStatus;
  notes: string;
}

export interface BudgetLine {
  id: string;
  eventId: string;
  type: BudgetLineType;
  description: string;
  amount: number;
  referenceId: string;           // quoteId or approvalRequestId
  approvalRequestId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface ActivityLogEntry {
  id: string;
  eventId: string;
  action: string;
  details: string;
  actor: string;
  timestamp: string;
}

// ─── v9: RFQ Batch + Supplier Extranet Types ─────────────────────────────────

export type RFQBatchStatus = 'DRAFT' | 'SENT' | 'QUOTED' | 'REVISED' | 'ACCEPTED' | 'LOCKED' | 'CANCELLED';

export const RFQ_BATCH_STATUS_LABELS: Record<RFQBatchStatus, string> = {
  DRAFT: 'Draft', SENT: 'Sent', QUOTED: 'Quoted', REVISED: 'Revised',
  ACCEPTED: 'Accepted', LOCKED: 'Locked', CANCELLED: 'Cancelled',
};

export const RFQ_BATCH_STATUS_COLORS: Record<RFQBatchStatus, string> = {
  DRAFT: '#9CA3AF', SENT: '#3B82F6', QUOTED: '#F59E0B', REVISED: '#8B5CF6',
  ACCEPTED: '#22C55E', LOCKED: '#059669', CANCELLED: '#6B7280',
};

export const generatePortalToken = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let token = '';
  for (let i = 0; i < 32; i++) token += chars[Math.floor(Math.random() * chars.length)];
  return token;
};

export interface RFQBatch {
  id: string;
  eventId: string;
  supplierId: string;            // supplierAssignment supplier reference or ad-hoc name
  supplierName: string;
  supplierEmail: string;
  status: RFQBatchStatus;
  createdAt: string;
  sentAt: string;
  acceptedAt: string;
  lastSupplierSaveAt: string;
  currentSupplierDraftVersion: number;
  currentSubmittedVersion: number;
  portalToken: string;
  messageToSupplier: string;
  includeVatInfo: boolean;
  includeMomentSpaceContext: boolean;
}

export interface RFQBatchItem {
  id: string;
  rfqBatchId: string;
  lineItemId: string;
  qtySnapshot: number;
  unitTypeSnapshot: string;
  momentIdSnapshot: string;
  spaceIdSnapshot: string;
  installationLabelSnapshot: string;
  itemNameSnapshot: string;
  itemNotesSnapshot: string;
  categorySnapshot: string;
  createdAt: string;
}

export interface SupplierQuoteVersionItem {
  rfqBatchItemId: string;
  supplierUnitPriceInput: number;
  supplierPriceIncludesVat: boolean;
  vatRateUsed: number;
  currency: string;
  leadTimeDays: number;
  availabilityNotes: string;
}

export interface SupplierQuoteVersion {
  id: string;
  rfqBatchId: string;
  versionNumber: number;
  type: 'DRAFT_SAVE' | 'SUBMITTED';
  createdAt: string;
  submittedAt: string;
  supplierNotes: string;
  items: SupplierQuoteVersionItem[];
  totals: { net: number; vat: number; gross: number };
}

// ─── Planner Event (v9: added RFQ Batch fields) ──────────────────────────────



export interface PlannerEvent {
  id: string;
  name: string;
  date: string;
  endDate: string;
  eventType: EventType;
  eventTypeOption?: OptionSelection;
  clientDetails: ClientDetails;
  clientAccountId: string;             // v11: linked client account
  venue: string;
  venueType: VenueType;
  country: string;
  region: string;
  city: string;
  venueSpaces: VenueSpace[];
  moments: EventMoment[];
  guestCount: number;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  lineItems: CostLineItem[];
  versions: EventVersion[];
  currentVersion: number;
  rfqMessages: RFQMessage[];
  jobCode: string;
  companyName: string;
  divisionName: string;
  eventTitle: string;
  programs: EventProgram[];
  backupVenue: string;
  backupVenueSpaces: VenueSpace[];
  // v6
  specs: LineItemSpec[];
  tasks: EventTask[];
  shoppingLists: ShoppingList[];
  salesOrders: SalesOrder[];
  // v7: Control Tower
  supplierAssignments: SupplierAssignment[];
  supplierQuotes: SupplierQuote[];
  approvalRequests: ApprovalRequest[];
  budgetLines: BudgetLine[];
  activityLog: ActivityLogEntry[];
  // v8: Finance / Currency / VAT
  currency: string;                    // ISO currency code e.g. "ZAR"
  vatRate: number;                     // decimal e.g. 0.15 for 15%
  vatName: string;                     // "VAT", "TVA", "MwSt", "GST"
  defaultPricesIncludeVat: boolean;    // default for new line items
  // v12: Billing separation + presentation
  billingCountry: string;              // ISO country code for billing (may differ from event location)
  billingCurrency: string;             // ISO currency code for client billing
  vatEnabled: boolean;                 // toggle VAT on/off for this event
  showPricing: boolean;                // pricing visibility toggle (persisted)
}



export interface CalculatedLineItem extends CostLineItem {
  timeMultiplier: number;
  totalSupplierCost: number;
  clientPrice: number;
  marginValue: number;
  marginPercent: number;
  // v8: VAT breakdown
  supplierNet: number;
  vatValue: number;
  supplierGross: number;
}

export interface EventSummary {
  totalSupplierCost: number;
  totalClientPrice: number;
  grossMarginPercent: number;
  grossMarginValue: number;
  marginWarning: boolean;
  // v8: VAT totals
  totalNet: number;
  totalVat: number;
  totalGross: number;
}

// ─── v7: Budget Calculation Helpers ──────────────────────────────────────────

export const getConfirmedSpend = (event: PlannerEvent): number => {
  const acceptedQuoteTotal = (event.supplierQuotes || [])
    .filter(q => q.isAccepted)
    .reduce((s, q) => s + q.amount, 0);
  const approvedAdjustments = (event.budgetLines || [])
    .filter(bl => bl.type === 'ADJUSTMENT' && bl.status === 'APPROVED')
    .reduce((s, bl) => s + bl.amount, 0);
  return acceptedQuoteTotal + approvedAdjustments;
};

export const getProposalTotal = (event: PlannerEvent, calculateLineItem: (item: CostLineItem) => CalculatedLineItem): number => {
  return event.lineItems.reduce((s, li) => s + calculateLineItem(li).clientPrice, 0);
};

export const getBudgetVariance = (proposalTotal: number, confirmedSpend: number): { amount: number; percent: number } => {
  const amount = proposalTotal - confirmedSpend;
  const percent = proposalTotal > 0 ? (amount / proposalTotal) * 100 : 0;
  return { amount, percent };
};

export const getMarginOnConfirmed = (proposalTotal: number, confirmedSpend: number): number => {
  return proposalTotal > 0 ? ((proposalTotal - confirmedSpend) / proposalTotal) * 100 : 0;
};


// ─── Display Name Helper ─────────────────────────────────────────────────────

export const getEventDisplayName = (event: PlannerEvent): string => {
  if (event.companyName) {
    const parts = [event.companyName, event.divisionName, event.eventTitle].filter(Boolean);
    if (parts.length > 1) return parts.join(' — ');
    if (parts.length === 1) return parts[0];
  }
  return event.name || 'Untitled Event';
};

// ─── Default Client Details ──────────────────────────────────────────────────

export const defaultCorporateClient: CorporateClient = {
  companyName: '', vatNumber: '', registrationNumber: '', billingAddress: '',
  contactFirstName: '', contactSurname: '', contactEmail: '',
  contactTelephoneCode: '', contactTelephone: '',
  accountsPayableEmail: '',
};

export const defaultWeddingClient: WeddingClient = {
  partner1FirstName: '', partner1Surname: '', partner2FirstName: '', partner2Surname: '',
  primaryEmail: '', primaryTelephoneCode: '', primaryTelephone: '',
  billingName: '', billingAddress: '',
};

export const defaultCelebrationClient: CelebrationClient = {
  hostFirstName: '', hostSurname: '', hostEmail: '',
  hostTelephoneCode: '', hostTelephone: '',
  billingName: '', billingAddress: '',
};

export const getDefaultClientDetails = (eventType: EventType): ClientDetails => {
  switch (eventType) {
    case 'corporate': return { ...defaultCorporateClient };
    case 'wedding': return { ...defaultWeddingClient };
    case 'celebration': return { ...defaultCelebrationClient };
  }
};

// ─── Default Moments ─────────────────────────────────────────────────────────

const inferMomentType = (name: string): MomentType => {
  const n = name.toLowerCase();
  if (n.includes('welcome') || n.includes('drinks reception')) return 'welcome_drinks';
  if (n.includes('ceremony')) return 'ceremony';
  if (n.includes('cocktail')) return 'cocktail_hour';
  if (n.includes('reception')) return 'reception';
  if (n.includes('dinner') || n.includes('main event')) return 'dinner';
  if (n.includes('after')) return 'after_party';
  if (n.includes('breakfast')) return 'breakfast';
  return 'other';
};

export const getDefaultMoments = (eventType: EventType, eventDate: string): EventMoment[] => {
  const makeId = () => `mom-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  let sortCounter = 0;
  const m = (name: string): EventMoment => ({
    id: makeId(), name, momentType: inferMomentType(name),
    date: eventDate, startTime: '', endTime: '', venueSpaceId: '', backupVenueSpaceId: '', notes: '',
    programId: '', parentMomentId: '', sortOrder: (sortCounter += 10),
  });

  switch (eventType) {
    case 'wedding':
      return [m('Drinks Reception'), m('Ceremony'), m('Reception'), m('After Party')];
    case 'corporate':
      return [m('Welcome'), m('Main Event'), m('After Function')];
    case 'celebration':
      return [m('Main Event')];
  }
};

// ─── Default Line Items ──────────────────────────────────────────────────────

const generateJobCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'JOB-';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
};

const generateOrderNumber = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'SO-';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
};

const defaultLineItems: Omit<CostLineItem, 'id' | 'supplierAssignmentId' | 'supplierPriceIncludesVat' | 'vatRateUsed' | 'isDryHire'>[] = [



  { name: 'Round Tables (10-seater)', category: 'furniture', quantity: 10, isGuestDependent: true, guestRatio: 0.1, unitCost: 250, setupCost: 50, breakdownCost: 50, deliveryCost: 150, deliveryType: 'flat', markupPercent: 35, flagged: false, notes: '', rfqSent: false, rfqJobCode: '', momentId: '', timeType: 'normal', imageUrl: '', productId: '', programId: '', internalNotes: '', clientVisibleNotes: '', specIds: [] },
  { name: 'Tiffany Chairs', category: 'furniture', quantity: 100, isGuestDependent: true, guestRatio: 1.0, unitCost: 55, setupCost: 5, breakdownCost: 5, deliveryCost: 500, deliveryType: 'flat', markupPercent: 35, flagged: false, notes: '', rfqSent: false, rfqJobCode: '', momentId: '', timeType: 'normal', imageUrl: '', productId: '', programId: '', internalNotes: '', clientVisibleNotes: '', specIds: [] },
  { name: 'Cocktail Tables', category: 'furniture', quantity: 4, isGuestDependent: false, guestRatio: 0, unitCost: 180, setupCost: 30, breakdownCost: 30, deliveryCost: 100, deliveryType: 'flat', markupPercent: 35, flagged: false, notes: '', rfqSent: false, rfqJobCode: '', momentId: '', timeType: 'normal', imageUrl: '', productId: '', programId: '', internalNotes: '', clientVisibleNotes: '', specIds: [] },
  { name: 'Dinner Plates', category: 'tableware', quantity: 100, isGuestDependent: true, guestRatio: 1.0, unitCost: 12, setupCost: 0, breakdownCost: 0, deliveryCost: 200, deliveryType: 'flat', markupPercent: 40, flagged: false, notes: '', rfqSent: false, rfqJobCode: '', momentId: '', timeType: 'normal', imageUrl: '', productId: '', programId: '', internalNotes: '', clientVisibleNotes: '', specIds: [] },
  { name: 'Side Plates', category: 'tableware', quantity: 100, isGuestDependent: true, guestRatio: 1.0, unitCost: 8, setupCost: 0, breakdownCost: 0, deliveryCost: 0, deliveryType: 'flat', markupPercent: 40, flagged: false, notes: '', rfqSent: false, rfqJobCode: '', momentId: '', timeType: 'normal', imageUrl: '', productId: '', programId: '', internalNotes: '', clientVisibleNotes: '', specIds: [] },
  { name: 'Cutlery Set (per guest)', category: 'tableware', quantity: 100, isGuestDependent: true, guestRatio: 1.0, unitCost: 35, setupCost: 0, breakdownCost: 0, deliveryCost: 200, deliveryType: 'flat', markupPercent: 40, flagged: false, notes: '', rfqSent: false, rfqJobCode: '', momentId: '', timeType: 'normal', imageUrl: '', productId: '', programId: '', internalNotes: '', clientVisibleNotes: '', specIds: [] },
  { name: 'Wine Glasses', category: 'glassware', quantity: 200, isGuestDependent: true, guestRatio: 2.0, unitCost: 8, setupCost: 0, breakdownCost: 0, deliveryCost: 150, deliveryType: 'flat', markupPercent: 40, flagged: false, notes: '', rfqSent: false, rfqJobCode: '', momentId: '', timeType: 'normal', imageUrl: '', productId: '', programId: '', internalNotes: '', clientVisibleNotes: '', specIds: [] },
  { name: 'Champagne Flutes', category: 'glassware', quantity: 100, isGuestDependent: true, guestRatio: 1.0, unitCost: 10, setupCost: 0, breakdownCost: 0, deliveryCost: 0, deliveryType: 'flat', markupPercent: 40, flagged: false, notes: '', rfqSent: false, rfqJobCode: '', momentId: '', timeType: 'normal', imageUrl: '', productId: '', programId: '', internalNotes: '', clientVisibleNotes: '', specIds: [] },
  { name: 'Water Glasses', category: 'glassware', quantity: 100, isGuestDependent: true, guestRatio: 1.0, unitCost: 6, setupCost: 0, breakdownCost: 0, deliveryCost: 0, deliveryType: 'flat', markupPercent: 40, flagged: false, notes: '', rfqSent: false, rfqJobCode: '', momentId: '', timeType: 'normal', imageUrl: '', productId: '', programId: '', internalNotes: '', clientVisibleNotes: '', specIds: [] },
  { name: 'Table Linen', category: 'linen', quantity: 10, isGuestDependent: true, guestRatio: 0.1, unitCost: 120, setupCost: 0, breakdownCost: 0, deliveryCost: 100, deliveryType: 'flat', markupPercent: 40, flagged: false, notes: '', rfqSent: false, rfqJobCode: '', momentId: '', timeType: 'normal', imageUrl: '', productId: '', programId: '', internalNotes: '', clientVisibleNotes: '', specIds: [] },
  { name: 'Napkins', category: 'linen', quantity: 100, isGuestDependent: true, guestRatio: 1.0, unitCost: 15, setupCost: 0, breakdownCost: 0, deliveryCost: 0, deliveryType: 'flat', markupPercent: 40, flagged: false, notes: '', rfqSent: false, rfqJobCode: '', momentId: '', timeType: 'normal', imageUrl: '', productId: '', programId: '', internalNotes: '', clientVisibleNotes: '', specIds: [] },
  { name: 'Lighting Package', category: 'lighting', quantity: 1, isGuestDependent: false, guestRatio: 0, unitCost: 4500, setupCost: 800, breakdownCost: 500, deliveryCost: 500, deliveryType: 'flat', markupPercent: 30, flagged: false, notes: '', rfqSent: false, rfqJobCode: '', momentId: '', timeType: 'normal', imageUrl: '', productId: '', programId: '', internalNotes: '', clientVisibleNotes: '', specIds: [] },
  { name: 'Fairy Light Canopy', category: 'lighting', quantity: 1, isGuestDependent: false, guestRatio: 0, unitCost: 2800, setupCost: 600, breakdownCost: 400, deliveryCost: 300, deliveryType: 'flat', markupPercent: 30, flagged: false, notes: '', rfqSent: false, rfqJobCode: '', momentId: '', timeType: 'normal', imageUrl: '', productId: '', programId: '', internalNotes: '', clientVisibleNotes: '', specIds: [] },
  { name: 'Centrepieces', category: 'florals', quantity: 10, isGuestDependent: true, guestRatio: 0.1, unitCost: 450, setupCost: 100, breakdownCost: 0, deliveryCost: 200, deliveryType: 'flat', markupPercent: 35, flagged: false, notes: '', rfqSent: false, rfqJobCode: '', momentId: '', timeType: 'normal', imageUrl: '', productId: '', programId: '', internalNotes: '', clientVisibleNotes: '', specIds: [] },
  { name: 'Bridal Bouquet', category: 'florals', quantity: 1, isGuestDependent: false, guestRatio: 0, unitCost: 1200, setupCost: 0, breakdownCost: 0, deliveryCost: 0, deliveryType: 'flat', markupPercent: 35, flagged: false, notes: '', rfqSent: false, rfqJobCode: '', momentId: '', timeType: 'normal', imageUrl: '', productId: '', programId: '', internalNotes: '', clientVisibleNotes: '', specIds: [] },
  { name: 'Event Manager', category: 'staffing', quantity: 1, isGuestDependent: false, guestRatio: 0, unitCost: 3500, setupCost: 0, breakdownCost: 0, deliveryCost: 0, deliveryType: 'flat', markupPercent: 30, flagged: false, notes: '', rfqSent: false, rfqJobCode: '', momentId: '', timeType: 'normal', imageUrl: '', productId: '', programId: '', internalNotes: '', clientVisibleNotes: '', specIds: [] },
  { name: 'Wait Staff', category: 'staffing', quantity: 10, isGuestDependent: true, guestRatio: 0.1, unitCost: 850, setupCost: 0, breakdownCost: 0, deliveryCost: 0, deliveryType: 'flat', markupPercent: 25, flagged: false, notes: '', rfqSent: false, rfqJobCode: '', momentId: '', timeType: 'normal', imageUrl: '', productId: '', programId: '', internalNotes: '', clientVisibleNotes: '', specIds: [] },
  { name: 'Bartender', category: 'staffing', quantity: 2, isGuestDependent: true, guestRatio: 0.02, unitCost: 1200, setupCost: 0, breakdownCost: 0, deliveryCost: 0, deliveryType: 'flat', markupPercent: 25, flagged: false, notes: '', rfqSent: false, rfqJobCode: '', momentId: '', timeType: 'normal', imageUrl: '', productId: '', programId: '', internalNotes: '', clientVisibleNotes: '', specIds: [] },
  { name: 'Chef / Kitchen Staff', category: 'staffing', quantity: 3, isGuestDependent: true, guestRatio: 0.03, unitCost: 1500, setupCost: 0, breakdownCost: 0, deliveryCost: 0, deliveryType: 'flat', markupPercent: 25, flagged: false, notes: '', rfqSent: false, rfqJobCode: '', momentId: '', timeType: 'normal', imageUrl: '', productId: '', programId: '', internalNotes: '', clientVisibleNotes: '', specIds: [] },
  { name: 'DJ / Entertainment', category: 'entertainment', quantity: 1, isGuestDependent: false, guestRatio: 0, unitCost: 5000, setupCost: 500, breakdownCost: 300, deliveryCost: 0, deliveryType: 'flat', markupPercent: 20, flagged: false, notes: '', rfqSent: false, rfqJobCode: '', momentId: '', timeType: 'normal', imageUrl: '', productId: '', programId: '', internalNotes: '', clientVisibleNotes: '', specIds: [] },
  { name: 'Sound System', category: 'entertainment', quantity: 1, isGuestDependent: false, guestRatio: 0, unitCost: 3500, setupCost: 500, breakdownCost: 300, deliveryCost: 400, deliveryType: 'flat', markupPercent: 30, flagged: false, notes: '', rfqSent: false, rfqJobCode: '', momentId: '', timeType: 'normal', imageUrl: '', productId: '', programId: '', internalNotes: '', clientVisibleNotes: '', specIds: [] },
  { name: 'Photographer', category: 'photo_video', quantity: 1, isGuestDependent: false, guestRatio: 0, unitCost: 8000, setupCost: 0, breakdownCost: 0, deliveryCost: 0, deliveryType: 'flat', markupPercent: 20, flagged: false, notes: '', rfqSent: false, rfqJobCode: '', momentId: '', timeType: 'normal', imageUrl: '', productId: '', programId: '', internalNotes: '', clientVisibleNotes: '', specIds: [] },
  { name: 'Videographer', category: 'photo_video', quantity: 1, isGuestDependent: false, guestRatio: 0, unitCost: 12000, setupCost: 0, breakdownCost: 0, deliveryCost: 0, deliveryType: 'flat', markupPercent: 20, flagged: false, notes: '', rfqSent: false, rfqJobCode: '', momentId: '', timeType: 'normal', imageUrl: '', productId: '', programId: '', internalNotes: '', clientVisibleNotes: '', specIds: [] },
  { name: 'Catering (per head)', category: 'catering', quantity: 100, isGuestDependent: true, guestRatio: 1.0, unitCost: 350, setupCost: 0, breakdownCost: 0, deliveryCost: 0, deliveryType: 'flat', markupPercent: 30, flagged: false, notes: '', rfqSent: false, rfqJobCode: '', momentId: '', timeType: 'normal', imageUrl: '', productId: '', programId: '', internalNotes: '', clientVisibleNotes: '', specIds: [] },
  { name: 'Beverage Package (per head)', category: 'beverages', quantity: 100, isGuestDependent: true, guestRatio: 1.0, unitCost: 200, setupCost: 0, breakdownCost: 0, deliveryCost: 0, deliveryType: 'flat', markupPercent: 30, flagged: false, notes: '', rfqSent: false, rfqJobCode: '', momentId: '', timeType: 'normal', imageUrl: '', productId: '', programId: '', internalNotes: '', clientVisibleNotes: '', specIds: [] },

];


// ─── Context ─────────────────────────────────────────────────────────────────

interface EventContextType {
  events: PlannerEvent[];
  selectedEventId: string | null;
  selectedEvent: PlannerEvent | null;
  createEvent: (params: CreateEventParams) => string;
  updateEvent: (eventId: string, updates: Partial<PlannerEvent>) => void;
  deleteEvent: (eventId: string) => void;
  selectEvent: (eventId: string | null) => void;
  updateGuestCount: (eventId: string, newCount: number) => void;
  updateLineItem: (eventId: string, itemId: string, updates: Partial<CostLineItem>) => void;
  addLineItem: (eventId: string, item: Omit<CostLineItem, 'id'>) => void;
  removeLineItem: (eventId: string, itemId: string) => void;
  calculateLineItem: (item: CostLineItem) => CalculatedLineItem;
  calculateSummary: (items: CostLineItem[]) => EventSummary;
  getCalculatedItems: (event: PlannerEvent) => CalculatedLineItem[];
  saveVersion: (eventId: string, description: string) => void;
  restoreVersion: (eventId: string, versionId: string) => void;
  duplicateEvent: (eventId: string) => string;
  addRFQMessage: (eventId: string, msg: Omit<RFQMessage, 'id' | 'sentAt' | 'status'>) => void;
  // Venue Spaces
  addVenueSpace: (eventId: string, space: Omit<VenueSpace, 'id'>) => void;
  updateVenueSpace: (eventId: string, spaceId: string, updates: Partial<VenueSpace>) => void;
  removeVenueSpace: (eventId: string, spaceId: string) => void;
  // Moments
  addMoment: (eventId: string, moment: Omit<EventMoment, 'id'>) => void;
  updateMoment: (eventId: string, momentId: string, updates: Partial<EventMoment>) => void;
  removeMoment: (eventId: string, momentId: string) => void;
  // Programs
  addProgram: (eventId: string, program: Omit<EventProgram, 'id'>) => void;
  updateProgram: (eventId: string, programId: string, updates: Partial<EventProgram>) => void;
  removeProgram: (eventId: string, programId: string) => void;
  // Backup Venue Spaces
  addBackupVenueSpace: (eventId: string, space: Omit<VenueSpace, 'id'>) => void;
  removeBackupVenueSpace: (eventId: string, spaceId: string) => void;
  // ─── v6: Specs ─────────────────────────────────────────────────────────────
  addSpec: (eventId: string, spec: Omit<LineItemSpec, 'id'>) => string;
  updateSpec: (eventId: string, specId: string, updates: Partial<LineItemSpec>) => void;
  removeSpec: (eventId: string, specId: string) => void;
  getSpecsForItem: (event: PlannerEvent, lineItemId: string) => LineItemSpec[];
  // ─── v6: Tasks ─────────────────────────────────────────────────────────────
  addTask: (eventId: string, task: Omit<EventTask, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (eventId: string, taskId: string, updates: Partial<EventTask>) => void;
  removeTask: (eventId: string, taskId: string) => void;
  // ─── v6: Shopping Lists ────────────────────────────────────────────────────
  addShoppingList: (eventId: string, list: Omit<ShoppingList, 'id' | 'items' | 'createdAt' | 'updatedAt'>) => string;
  updateShoppingList: (eventId: string, listId: string, updates: Partial<ShoppingList>) => void;
  removeShoppingList: (eventId: string, listId: string) => void;
  addShoppingListItem: (eventId: string, listId: string, item: Omit<ShoppingListItem, 'id'>) => void;
  updateShoppingListItem: (eventId: string, listId: string, itemId: string, updates: Partial<ShoppingListItem>) => void;
  removeShoppingListItem: (eventId: string, listId: string, itemId: string) => void;
  // ─── v6: Sales Orders (Accept Proposal Workflow) ───────────────────────────
  acceptProposal: (eventId: string) => string;
  updateSalesOrder: (eventId: string, orderId: string, updates: Partial<SalesOrder>) => void;
  generateShoppingListFromSO: (eventId: string, salesOrderId: string) => string;
}

export interface CreateEventParams {
  name: string;
  date: string;
  endDate?: string;
  eventType: EventType;
  eventTypeOption?: OptionSelection;
  venue: string;
  venueType?: VenueType;
  country: string;
  region: string;
  city: string;
  guestCount: number;
  companyName?: string;
  divisionName?: string;
  eventTitle?: string;
  clientAccountId?: string;            // v11: linked client account
}


const EventContext = createContext<EventContextType>({} as EventContextType);

export const useEventContext = () => useContext(EventContext);

// ─── Provider ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'theone_events_v6';

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<PlannerEvent[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch { return []; }
    }
    // Migrate from v5
    const v5 = localStorage.getItem('theone_events_v5');
    if (v5) {
      try {
        const old = JSON.parse(v5);
        const migrated = old.map((e: any) => migrateToV6(e));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
      } catch { return []; }
    }
    // Migrate from v4/v3
    for (const key of ['theone_events_v4', 'theone_events_v3']) {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          const old = JSON.parse(raw);
          const migrated = old.map((e: any) => migrateToV6(e));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
          return migrated;
        } catch { /* continue */ }
      }
    }
    return [];
  });
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const persistEvents = useCallback((newEvents: PlannerEvent[]) => {
    setEvents(newEvents);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newEvents));
  }, []);

  const selectedEvent = events.find(e => e.id === selectedEventId) || null;

  const createEvent = useCallback((params: CreateEventParams): string => {
    const id = `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const jobCode = generateJobCode();

    // v8: Resolve country config for finance defaults
    const countryConfig = getCountryConfigOrDefault(params.country || 'ZA');

    const lineItems: CostLineItem[] = defaultLineItems.map(item => ({
      ...item,
      supplierAssignmentId: '',
      supplierPriceIncludesVat: countryConfig.defaultPricesIncludeVat,
      vatRateUsed: countryConfig.vatRate,
      isDryHire: false,
      id: `li-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      quantity: item.isGuestDependent ? Math.max(1, Math.ceil(params.guestCount * item.guestRatio)) : item.quantity,
    }));



    const moments = getDefaultMoments(params.eventType, params.date);

    const newEvent: PlannerEvent = {
      id, name: params.name, date: params.date,
      endDate: params.endDate || params.date,
      eventType: params.eventType,
      eventTypeOption: params.eventTypeOption,
      clientDetails: getDefaultClientDetails(params.eventType),
      clientAccountId: params.clientAccountId || '',
      venue: params.venue, venueType: params.venueType || '',
      country: params.country || 'ZA', region: params.region || '', city: params.city || '',
      venueSpaces: [], moments, guestCount: params.guestCount,

      status: 'active', createdAt: now, updatedAt: now,
      lineItems,
      versions: [{
        id: `ver-${Date.now()}`, versionNumber: 1, timestamp: now,
        changeDescription: 'Initial event creation',
        guestCount: params.guestCount,
        lineItems: JSON.parse(JSON.stringify(lineItems)),
      }],
      currentVersion: 1, rfqMessages: [], jobCode,
      companyName: params.companyName || '',
      divisionName: params.divisionName || '',
      eventTitle: params.eventTitle || '',
      programs: [],
      backupVenue: '',
      backupVenueSpaces: [],
      // v6
      specs: [], tasks: [], shoppingLists: [], salesOrders: [],
      // v7: Control Tower
      supplierAssignments: [], supplierQuotes: [], approvalRequests: [], budgetLines: [], activityLog: [],
      // v8: Finance / Currency / VAT
      currency: countryConfig.currencyIso,
      vatRate: countryConfig.vatRate,
      vatName: countryConfig.vatName,
      defaultPricesIncludeVat: countryConfig.defaultPricesIncludeVat,
      // v12: Billing separation
      billingCountry: params.country || 'ZA',
      billingCurrency: countryConfig.currencyIso,
      vatEnabled: countryConfig.vatRate > 0,
      showPricing: true,
    };





    persistEvents([...events, newEvent]);
    return id;
  }, [events, persistEvents]);

  const updateEvent = useCallback((eventId: string, updates: Partial<PlannerEvent>) => {
    persistEvents(events.map(e =>
      e.id === eventId ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
    ));
  }, [events, persistEvents]);

  const deleteEvent = useCallback((eventId: string) => {
    persistEvents(events.filter(e => e.id !== eventId));
    if (selectedEventId === eventId) setSelectedEventId(null);
  }, [events, selectedEventId, persistEvents]);

  const selectEvent = useCallback((eventId: string | null) => {
    setSelectedEventId(eventId);
  }, []);

  const updateGuestCount = useCallback((eventId: string, newCount: number) => {
    persistEvents(events.map(e => {
      if (e.id !== eventId) return e;
      const updatedItems = e.lineItems.map(item => {
        if (!item.isGuestDependent) return item;
        const newQty = Math.max(1, Math.ceil(newCount * item.guestRatio));
        return { ...item, quantity: newQty, flagged: newQty !== item.quantity };
      });
      return { ...e, guestCount: newCount, lineItems: updatedItems, updatedAt: new Date().toISOString() };
    }));
  }, [events, persistEvents]);

  const updateLineItem = useCallback((eventId: string, itemId: string, updates: Partial<CostLineItem>) => {
    persistEvents(events.map(e => {
      if (e.id !== eventId) return e;
      return {
        ...e,
        lineItems: e.lineItems.map(item => item.id === itemId ? { ...item, ...updates } : item),
        updatedAt: new Date().toISOString(),
      };
    }));
  }, [events, persistEvents]);

  const addLineItem = useCallback((eventId: string, item: Omit<CostLineItem, 'id'>) => {
    const id = `li-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    persistEvents(events.map(e => {
      if (e.id !== eventId) return e;
      return { ...e, lineItems: [...e.lineItems, { ...item, id }], updatedAt: new Date().toISOString() };
    }));
  }, [events, persistEvents]);

  const removeLineItem = useCallback((eventId: string, itemId: string) => {
    persistEvents(events.map(e => {
      if (e.id !== eventId) return e;
      return {
        ...e,
        lineItems: e.lineItems.filter(item => item.id !== itemId),
        specs: (e.specs || []).filter(s => s.ownerId !== itemId),
        updatedAt: new Date().toISOString(),
      };
    }));
  }, [events, persistEvents]);

  const calculateLineItem = useCallback((item: CostLineItem): CalculatedLineItem => {
    const itemTimeType = item.timeType || 'normal';
    const timeMultiplier = TIME_MULTIPLIERS[itemTimeType];
    const isLabour = LABOUR_CATEGORIES.includes(item.category);
    const effectiveMultiplier = isLabour ? timeMultiplier : 1.0;
    const baseCost = item.quantity * item.unitCost;
    const setupAdjusted = item.setupCost * effectiveMultiplier;
    const breakdownAdjusted = item.breakdownCost * effectiveMultiplier;
    const totalInputCost = baseCost + item.deliveryCost + setupAdjusted + breakdownAdjusted;

    // v8: VAT-aware calculations
    const vatRate = item.vatRateUsed ?? 0;
    const priceIncVat = item.supplierPriceIncludesVat ?? true;
    const vat = calculateVatBreakdown(totalInputCost, priceIncVat, vatRate);

    // totalSupplierCost = the gross (VAT-inclusive) cost to supplier
    const totalSupplierCost = vat.supplierGross;

    // Client price = gross * (1 + markup)
    const clientPrice = vat.supplierGross * (1 + item.markupPercent / 100);
    const marginValue = clientPrice - vat.supplierGross;
    const marginPercent = clientPrice > 0 ? (marginValue / clientPrice) * 100 : 0;

    return {
      ...item,
      timeMultiplier: effectiveMultiplier,
      totalSupplierCost,
      clientPrice,
      marginValue,
      marginPercent,
      supplierNet: vat.supplierNet,
      vatValue: vat.vatValue,
      supplierGross: vat.supplierGross,
    };
  }, []);

  const calculateSummary = useCallback((items: CostLineItem[]): EventSummary => {
    let totalSupplierCost = 0;
    let totalClientPrice = 0;
    let totalNet = 0;
    let totalVat = 0;
    let totalGross = 0;
    items.forEach(item => {
      const calc = calculateLineItem(item);
      totalSupplierCost += calc.totalSupplierCost;
      totalClientPrice += calc.clientPrice;
      totalNet += calc.supplierNet;
      totalVat += calc.vatValue;
      totalGross += calc.supplierGross;
    });
    const grossMarginValue = totalClientPrice - totalSupplierCost;
    const grossMarginPercent = totalClientPrice > 0 ? (grossMarginValue / totalClientPrice) * 100 : 0;
    return {
      totalSupplierCost, totalClientPrice, grossMarginPercent, grossMarginValue,
      marginWarning: grossMarginPercent < 25,
      totalNet, totalVat, totalGross,
    };
  }, [calculateLineItem]);


  const getCalculatedItems = useCallback((event: PlannerEvent): CalculatedLineItem[] => {
    return event.lineItems.map(item => calculateLineItem(item));
  }, [calculateLineItem]);

  const saveVersion = useCallback((eventId: string, description: string) => {
    persistEvents(events.map(e => {
      if (e.id !== eventId) return e;
      const newVersion: EventVersion = {
        id: `ver-${Date.now()}`, versionNumber: e.currentVersion + 1,
        timestamp: new Date().toISOString(), changeDescription: description,
        guestCount: e.guestCount, lineItems: JSON.parse(JSON.stringify(e.lineItems)),
      };
      return {
        ...e, versions: [...e.versions, newVersion], currentVersion: e.currentVersion + 1,
        updatedAt: new Date().toISOString(),
        lineItems: e.lineItems.map(item => ({ ...item, flagged: false })),
      };
    }));
  }, [events, persistEvents]);

  const restoreVersion = useCallback((eventId: string, versionId: string) => {
    persistEvents(events.map(e => {
      if (e.id !== eventId) return e;
      const version = e.versions.find(v => v.id === versionId);
      if (!version) return e;
      return { ...e, guestCount: version.guestCount, lineItems: JSON.parse(JSON.stringify(version.lineItems)), updatedAt: new Date().toISOString() };
    }));
  }, [events, persistEvents]);

  const duplicateEvent = useCallback((eventId: string): string => {
    const event = events.find(e => e.id === eventId);
    if (!event) return '';
    const id = `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const newEvent: PlannerEvent = {
      ...JSON.parse(JSON.stringify(event)),
      id, name: `${getEventDisplayName(event)} (Copy)`, status: 'draft' as const,
      createdAt: now, updatedAt: now, jobCode: generateJobCode(),
      versions: [{
        id: `ver-${Date.now()}`, versionNumber: 1, timestamp: now,
        changeDescription: `Duplicated from "${getEventDisplayName(event)}"`,
        guestCount: event.guestCount, lineItems: JSON.parse(JSON.stringify(event.lineItems)),
      }],
      currentVersion: 1, salesOrders: [], shoppingLists: [],
    };
    persistEvents([...events, newEvent]);
    return id;
  }, [events, persistEvents]);

  const addRFQMessage = useCallback((eventId: string, msg: Omit<RFQMessage, 'id' | 'sentAt' | 'status'>) => {
    persistEvents(events.map(e => {
      if (e.id !== eventId) return e;
      const newMsg: RFQMessage = { ...msg, id: `rfq-${Date.now()}`, sentAt: new Date().toISOString(), status: 'sent' };
      return {
        ...e, rfqMessages: [...(e.rfqMessages || []), newMsg],
        lineItems: e.lineItems.map(item => item.id === msg.lineItemId ? { ...item, rfqSent: true, rfqJobCode: msg.jobCode } : item),
        updatedAt: new Date().toISOString(),
      };
    }));
  }, [events, persistEvents]);

  // ─── Venue Spaces ──────────────────────────────────────────────────────────

  const addVenueSpace = useCallback((eventId: string, space: Omit<VenueSpace, 'id'>) => {
    const id = `vs-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    persistEvents(events.map(e => e.id !== eventId ? e : { ...e, venueSpaces: [...(e.venueSpaces || []), { ...space, id }], updatedAt: new Date().toISOString() }));
  }, [events, persistEvents]);

  const updateVenueSpace = useCallback((eventId: string, spaceId: string, updates: Partial<VenueSpace>) => {
    persistEvents(events.map(e => e.id !== eventId ? e : { ...e, venueSpaces: (e.venueSpaces || []).map(s => s.id === spaceId ? { ...s, ...updates } : s), updatedAt: new Date().toISOString() }));
  }, [events, persistEvents]);

  const removeVenueSpace = useCallback((eventId: string, spaceId: string) => {
    persistEvents(events.map(e => e.id !== eventId ? e : {
      ...e, venueSpaces: (e.venueSpaces || []).filter(s => s.id !== spaceId),
      moments: (e.moments || []).map(m => m.venueSpaceId === spaceId ? { ...m, venueSpaceId: '' } : m),
      updatedAt: new Date().toISOString(),
    }));
  }, [events, persistEvents]);

  // ─── Moments ───────────────────────────────────────────────────────────────

  const addMoment = useCallback((eventId: string, moment: Omit<EventMoment, 'id'>) => {
    const id = `mom-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    persistEvents(events.map(e => e.id !== eventId ? e : { ...e, moments: [...(e.moments || []), { ...moment, id }], updatedAt: new Date().toISOString() }));
  }, [events, persistEvents]);

  const updateMoment = useCallback((eventId: string, momentId: string, updates: Partial<EventMoment>) => {
    persistEvents(events.map(e => e.id !== eventId ? e : { ...e, moments: (e.moments || []).map(m => m.id === momentId ? { ...m, ...updates } : m), updatedAt: new Date().toISOString() }));
  }, [events, persistEvents]);

  const removeMoment = useCallback((eventId: string, momentId: string) => {
    persistEvents(events.map(e => e.id !== eventId ? e : {
      ...e, moments: (e.moments || []).filter(m => m.id !== momentId && m.parentMomentId !== momentId),
      lineItems: e.lineItems.map(li => li.momentId === momentId ? { ...li, momentId: '' } : li),
      updatedAt: new Date().toISOString(),
    }));
  }, [events, persistEvents]);

  // ─── Programs ──────────────────────────────────────────────────────────────

  const addProgram = useCallback((eventId: string, program: Omit<EventProgram, 'id'>) => {
    const id = `prog-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    persistEvents(events.map(e => e.id !== eventId ? e : { ...e, programs: [...(e.programs || []), { ...program, id }], updatedAt: new Date().toISOString() }));
  }, [events, persistEvents]);

  const updateProgram = useCallback((eventId: string, programId: string, updates: Partial<EventProgram>) => {
    persistEvents(events.map(e => e.id !== eventId ? e : { ...e, programs: (e.programs || []).map(p => p.id === programId ? { ...p, ...updates } : p), updatedAt: new Date().toISOString() }));
  }, [events, persistEvents]);

  const removeProgram = useCallback((eventId: string, programId: string) => {
    persistEvents(events.map(e => e.id !== eventId ? e : {
      ...e, programs: (e.programs || []).filter(p => p.id !== programId),
      moments: (e.moments || []).map(m => m.programId === programId ? { ...m, programId: '' } : m),
      lineItems: e.lineItems.map(li => li.programId === programId ? { ...li, programId: '' } : li),
      updatedAt: new Date().toISOString(),
    }));
  }, [events, persistEvents]);

  // ─── Backup Venue Spaces ───────────────────────────────────────────────────

  const addBackupVenueSpace = useCallback((eventId: string, space: Omit<VenueSpace, 'id'>) => {
    const id = `bvs-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    persistEvents(events.map(e => e.id !== eventId ? e : { ...e, backupVenueSpaces: [...(e.backupVenueSpaces || []), { ...space, id }], updatedAt: new Date().toISOString() }));
  }, [events, persistEvents]);

  const removeBackupVenueSpace = useCallback((eventId: string, spaceId: string) => {
    persistEvents(events.map(e => e.id !== eventId ? e : { ...e, backupVenueSpaces: (e.backupVenueSpaces || []).filter(s => s.id !== spaceId), updatedAt: new Date().toISOString() }));
  }, [events, persistEvents]);

  // ─── v6: Specs ─────────────────────────────────────────────────────────────

  const addSpec = useCallback((eventId: string, spec: Omit<LineItemSpec, 'id'>): string => {
    const id = `spec-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    persistEvents(events.map(e => {
      if (e.id !== eventId) return e;
      const newSpecs = [...(e.specs || []), { ...spec, id }];
      // Also link spec to the line item
      const updatedItems = e.lineItems.map(li =>
        li.id === spec.ownerId ? { ...li, specIds: [...(li.specIds || []), id] } : li
      );
      return { ...e, specs: newSpecs, lineItems: updatedItems, updatedAt: new Date().toISOString() };
    }));
    return id;
  }, [events, persistEvents]);

  const updateSpec = useCallback((eventId: string, specId: string, updates: Partial<LineItemSpec>) => {
    persistEvents(events.map(e => e.id !== eventId ? e : {
      ...e, specs: (e.specs || []).map(s => s.id === specId ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s),
      updatedAt: new Date().toISOString(),
    }));
  }, [events, persistEvents]);

  const removeSpec = useCallback((eventId: string, specId: string) => {
    persistEvents(events.map(e => {
      if (e.id !== eventId) return e;
      return {
        ...e,
        specs: (e.specs || []).filter(s => s.id !== specId),
        lineItems: e.lineItems.map(li => ({ ...li, specIds: (li.specIds || []).filter(sid => sid !== specId) })),
        updatedAt: new Date().toISOString(),
      };
    }));
  }, [events, persistEvents]);

  const getSpecsForItem = useCallback((event: PlannerEvent, lineItemId: string): LineItemSpec[] => {
    return (event.specs || []).filter(s => s.ownerId === lineItemId);
  }, []);

  // ─── v6: Tasks ─────────────────────────────────────────────────────────────

  const addTask = useCallback((eventId: string, task: Omit<EventTask, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = `task-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();
    persistEvents(events.map(e => e.id !== eventId ? e : {
      ...e, tasks: [...(e.tasks || []), { ...task, id, createdAt: now, updatedAt: now }],
      updatedAt: now,
    }));
  }, [events, persistEvents]);

  const updateTask = useCallback((eventId: string, taskId: string, updates: Partial<EventTask>) => {
    persistEvents(events.map(e => e.id !== eventId ? e : {
      ...e, tasks: (e.tasks || []).map(t => t.id === taskId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t),
      updatedAt: new Date().toISOString(),
    }));
  }, [events, persistEvents]);

  const removeTask = useCallback((eventId: string, taskId: string) => {
    persistEvents(events.map(e => e.id !== eventId ? e : {
      ...e, tasks: (e.tasks || []).filter(t => t.id !== taskId), updatedAt: new Date().toISOString(),
    }));
  }, [events, persistEvents]);

  // ─── v6: Shopping Lists ────────────────────────────────────────────────────

  const addShoppingList = useCallback((eventId: string, list: Omit<ShoppingList, 'id' | 'items' | 'createdAt' | 'updatedAt'>): string => {
    const id = `sl-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();
    persistEvents(events.map(e => e.id !== eventId ? e : {
      ...e, shoppingLists: [...(e.shoppingLists || []), { ...list, id, items: [], createdAt: now, updatedAt: now }],
      updatedAt: now,
    }));
    return id;
  }, [events, persistEvents]);

  const updateShoppingList = useCallback((eventId: string, listId: string, updates: Partial<ShoppingList>) => {
    persistEvents(events.map(e => e.id !== eventId ? e : {
      ...e, shoppingLists: (e.shoppingLists || []).map(l => l.id === listId ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l),
      updatedAt: new Date().toISOString(),
    }));
  }, [events, persistEvents]);

  const removeShoppingList = useCallback((eventId: string, listId: string) => {
    persistEvents(events.map(e => e.id !== eventId ? e : {
      ...e, shoppingLists: (e.shoppingLists || []).filter(l => l.id !== listId), updatedAt: new Date().toISOString(),
    }));
  }, [events, persistEvents]);

  const addShoppingListItem = useCallback((eventId: string, listId: string, item: Omit<ShoppingListItem, 'id'>) => {
    const id = `sli-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    persistEvents(events.map(e => {
      if (e.id !== eventId) return e;
      return {
        ...e,
        shoppingLists: (e.shoppingLists || []).map(l => {
          if (l.id !== listId) return l;
          const newItems = [...l.items, { ...item, id }];
          const totalEstimate = newItems.reduce((s, i) => s + (i.estimatedTotalCost || 0), 0);
          return { ...l, items: newItems, totalEstimate, updatedAt: new Date().toISOString() };
        }),
        updatedAt: new Date().toISOString(),
      };
    }));
  }, [events, persistEvents]);

  const updateShoppingListItem = useCallback((eventId: string, listId: string, itemId: string, updates: Partial<ShoppingListItem>) => {
    persistEvents(events.map(e => {
      if (e.id !== eventId) return e;
      return {
        ...e,
        shoppingLists: (e.shoppingLists || []).map(l => {
          if (l.id !== listId) return l;
          const newItems = l.items.map(i => i.id === itemId ? { ...i, ...updates } : i);
          const totalEstimate = newItems.reduce((s, i) => s + (i.estimatedTotalCost || 0), 0);
          return { ...l, items: newItems, totalEstimate, updatedAt: new Date().toISOString() };
        }),
        updatedAt: new Date().toISOString(),
      };
    }));
  }, [events, persistEvents]);

  const removeShoppingListItem = useCallback((eventId: string, listId: string, itemId: string) => {
    persistEvents(events.map(e => {
      if (e.id !== eventId) return e;
      return {
        ...e,
        shoppingLists: (e.shoppingLists || []).map(l => {
          if (l.id !== listId) return l;
          const newItems = l.items.filter(i => i.id !== itemId);
          const totalEstimate = newItems.reduce((s, i) => s + (i.estimatedTotalCost || 0), 0);
          return { ...l, items: newItems, totalEstimate, updatedAt: new Date().toISOString() };
        }),
        updatedAt: new Date().toISOString(),
      };
    }));
  }, [events, persistEvents]);

  // ─── v6: Accept Proposal → Create Sales Order ─────────────────────────────

  const acceptProposal = useCallback((eventId: string): string => {
    const event = events.find(e => e.id === eventId);
    if (!event) return '';
    const soId = `so-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    // Snapshot all line items + copy specs
    const soItems: SalesOrderItem[] = event.lineItems.map(li => {
      const calc = calculateLineItem(li);
      return {
        id: `soi-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        salesOrderId: soId,
        sourceLineItemId: li.id,
        name: li.name,
        category: li.category,
        quantity: li.quantity,
        snapshotUnitPrice: li.unitCost,
        snapshotClientPrice: calc.clientPrice,
        snapshotDescription: li.notes || li.name,
        specIds: [...(li.specIds || [])],
        internalNotes: li.internalNotes || '',
        clientVisibleNotes: li.clientVisibleNotes || '',
        imageUrl: li.imageUrl || '',
      };
    });

    // Copy specs with new owner type
    const copiedSpecs: LineItemSpec[] = (event.specs || [])
      .filter(s => s.ownerType === 'PROPOSAL_ITEM')
      .map(s => ({
        ...s,
        id: `spec-so-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        ownerType: 'SALES_ORDER_ITEM' as const,
        updatedAt: now,
      }));

    const totalAmount = soItems.reduce((s, i) => s + i.snapshotClientPrice, 0);

    const salesOrder: SalesOrder = {
      id: soId,
      eventId,
      orderNumber: generateOrderNumber(),
      status: 'CONFIRMED',
      snapshotVersion: event.currentVersion,
      items: soItems,
      totalAmount,
      currency: event.currency || 'ZAR',

      notes: '',
      createdAt: now,
      updatedAt: now,
    };

    persistEvents(events.map(e => {
      if (e.id !== eventId) return e;
      return {
        ...e,
        salesOrders: [...(e.salesOrders || []), salesOrder],
        specs: [...(e.specs || []), ...copiedSpecs],
        status: 'active' as const,
        updatedAt: now,
      };
    }));

    return soId;
  }, [events, persistEvents, calculateLineItem]);

  const updateSalesOrder = useCallback((eventId: string, orderId: string, updates: Partial<SalesOrder>) => {
    persistEvents(events.map(e => e.id !== eventId ? e : {
      ...e, salesOrders: (e.salesOrders || []).map(so => so.id === orderId ? { ...so, ...updates, updatedAt: new Date().toISOString() } : so),
      updatedAt: new Date().toISOString(),
    }));
  }, [events, persistEvents]);

  // ─── v6: Generate Shopping List from Sales Order ───────────────────────────

  const generateShoppingListFromSO = useCallback((eventId: string, salesOrderId: string): string => {
    const event = events.find(e => e.id === eventId);
    if (!event) return '';
    const so = (event.salesOrders || []).find(s => s.id === salesOrderId);
    if (!so) return '';

    const listId = `sl-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();

    const items: ShoppingListItem[] = so.items.map(soi => ({
      id: `sli-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      shoppingListId: listId,
      sourceLineItemId: soi.sourceLineItemId,
      productId: '',
      titleSnapshot: soi.name,
      quantity: soi.quantity,
      unitTypeSnapshot: 'EACH',
      estimatedUnitCost: soi.snapshotUnitPrice,
      estimatedTotalCost: soi.snapshotUnitPrice * soi.quantity,
      purchaseType: 'BUY' as PurchaseType,
      storeOrVendor: '',
      requiredByDate: event.date || '',
      specLinkIds: soi.specIds || [],
      notes: '',
      status: 'NEEDED' as ShoppingItemStatus,
    }));

    const totalEstimate = items.reduce((s, i) => s + i.estimatedTotalCost, 0);

    const list: ShoppingList = {
      id: listId,
      eventId,
      programId: '',
      listName: `Shopping List — ${so.orderNumber}`,
      status: 'DRAFT',
      supplierName: '',
      currency: 'ZAR',
      totalEstimate,
      items,
      notes: '',
      createdAt: now,
      updatedAt: now,
    };

    persistEvents(events.map(e => e.id !== eventId ? e : {
      ...e, shoppingLists: [...(e.shoppingLists || []), list], updatedAt: now,
    }));

    return listId;
  }, [events, persistEvents]);

  return (
    <EventContext.Provider value={{
      events, selectedEventId, selectedEvent,
      createEvent, updateEvent, deleteEvent, selectEvent,
      updateGuestCount, updateLineItem, addLineItem, removeLineItem,
      calculateLineItem, calculateSummary, getCalculatedItems,
      saveVersion, restoreVersion, duplicateEvent, addRFQMessage,
      addVenueSpace, updateVenueSpace, removeVenueSpace,
      addMoment, updateMoment, removeMoment,
      addProgram, updateProgram, removeProgram,
      addBackupVenueSpace, removeBackupVenueSpace,
      // v6
      addSpec, updateSpec, removeSpec, getSpecsForItem,
      addTask, updateTask, removeTask,
      addShoppingList, updateShoppingList, removeShoppingList,
      addShoppingListItem, updateShoppingListItem, removeShoppingListItem,
      acceptProposal, updateSalesOrder, generateShoppingListFromSO,
    }}>
      {children}
    </EventContext.Provider>
  );
};

// ─── Migration: any → v6/v7/v8 ───────────────────────────────────────────────

function migrateToV6(e: any): PlannerEvent {
  const eventType = e.eventType || 'wedding';
  const clientDetails = migrateClientDetails(e.clientDetails, eventType);
  const countryIso = e.country || 'ZA';
  const cfg = getCountryConfigOrDefault(countryIso);

  return {
    ...e,
    clientAccountId: e.clientAccountId || '',

    eventType,
    clientDetails,
    endDate: e.endDate || e.date || '',
    country: countryIso,
    city: e.city || e.region || '',
    region: e.region || '',
    venueSpaces: (e.venueSpaces || []).map((s: any) => ({ ...s, spaceType: s.spaceType || undefined })),
    moments: (e.moments || []).map((m: any) => ({
      ...m, momentType: m.momentType || 'other',
      backupVenueSpaceId: m.backupVenueSpaceId || '',
      programId: m.programId || '', parentMomentId: m.parentMomentId || '', sortOrder: m.sortOrder || 0,
    })),

    lineItems: (e.lineItems || []).map((li: any) => ({
      ...li,
      timeType: li.timeType || e.timeType || 'normal',
      momentId: li.momentId || '', imageUrl: li.imageUrl || '', productId: li.productId || '',
      programId: li.programId || '',
      internalNotes: li.internalNotes || '',
      clientVisibleNotes: li.clientVisibleNotes || '',
      specIds: li.specIds || [],
      supplierAssignmentId: li.supplierAssignmentId || '',
      // v8: VAT snapshot defaults from country config
      supplierPriceIncludesVat: li.supplierPriceIncludesVat ?? (e.defaultPricesIncludeVat ?? cfg.defaultPricesIncludeVat),
      vatRateUsed: li.vatRateUsed ?? (e.vatRate ?? cfg.vatRate),
    })),
    versions: (e.versions || []).map((v: any) => ({
      ...v,
      lineItems: (v.lineItems || []).map((li: any) => ({
        ...li, timeType: li.timeType || e.timeType || 'normal',
        imageUrl: li.imageUrl || '', productId: li.productId || '', programId: li.programId || '',
        internalNotes: li.internalNotes || '', clientVisibleNotes: li.clientVisibleNotes || '', specIds: li.specIds || [],
        supplierAssignmentId: li.supplierAssignmentId || '',
        supplierPriceIncludesVat: li.supplierPriceIncludesVat ?? cfg.defaultPricesIncludeVat,
        vatRateUsed: li.vatRateUsed ?? cfg.vatRate,
      })),
    })),
    companyName: e.companyName || '',
    divisionName: e.divisionName || '',
    eventTitle: e.eventTitle || '',
    programs: e.programs || [],
    backupVenue: e.backupVenue || '',
    backupVenueSpaces: e.backupVenueSpaces || [],
    // v6 fields
    specs: e.specs || [],
    tasks: e.tasks || [],
    shoppingLists: e.shoppingLists || [],
    salesOrders: e.salesOrders || [],
    // v7 fields
    supplierAssignments: e.supplierAssignments || [],
    supplierQuotes: e.supplierQuotes || [],
    approvalRequests: e.approvalRequests || [],
    budgetLines: e.budgetLines || [],
    activityLog: e.activityLog || [],
    currency: e.currency || cfg.currencyIso,
    vatRate: e.vatRate ?? cfg.vatRate,
    vatName: e.vatName || cfg.vatName,
    defaultPricesIncludeVat: e.defaultPricesIncludeVat ?? cfg.defaultPricesIncludeVat,
    // v12: Billing separation
    billingCountry: e.billingCountry || e.country || countryIso,
    billingCurrency: e.billingCurrency || e.currency || cfg.currencyIso,
    vatEnabled: e.vatEnabled ?? (e.vatRate ?? cfg.vatRate) > 0,
    showPricing: e.showPricing ?? true,
  };

}



function migrateClientDetails(details: any, eventType: string): ClientDetails {
  if (!details) return getDefaultClientDetails((eventType as EventType) || 'wedding');
  if (eventType === 'corporate') return { ...defaultCorporateClient, ...details };
  if (eventType === 'wedding') return { ...defaultWeddingClient, ...details };
  if (eventType === 'celebration') return { ...defaultCelebrationClient, ...details };
  return details;
}
