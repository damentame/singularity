// ─── Venue Load-In / Load-Out ───────────────────────────────────────────────
// A venue is occupied longer than the event's own show dates: it needs setup
// (load-in) time before `date` and strike/breakdown (load-out) time after
// `endDate`. These helpers derive the actual occupied window from an event's
// setupDays/strikeDays and check it against other events at the same venue.

// Structural type (not imported from EventContext.tsx) so this module has no
// dependency on it — EventContext.tsx itself needs to call these helpers.
export interface VenueScheduledEvent {
  id: string;
  venue: string;
  status: string;
  date: string;
  endDate: string;
  setupDays: number;
  strikeDays: number;
}

export const addDays = (dateStr: string, days: number): string => {
  if (!dateStr) return dateStr;
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

export interface VenueRange {
  start: string;
  end: string;
}

export const getVenueOccupiedRange = (event: VenueScheduledEvent): VenueRange => ({
  start: addDays(event.date, -(event.setupDays || 0)),
  end: addDays(event.endDate || event.date, event.strikeDays || 0),
});

const rangesOverlap = (a: VenueRange, b: VenueRange): boolean =>
  !!a.start && !!a.end && !!b.start && !!b.end && a.start <= b.end && b.start <= a.end;

/** Other events (of this coordinator's own list) at the same venue whose occupied window overlaps this event's. */
export const findVenueConflicts = <T extends VenueScheduledEvent>(event: T, allEvents: T[]): T[] => {
  const venue = (event.venue || '').trim().toLowerCase();
  if (!venue) return [];
  const range = getVenueOccupiedRange(event);

  return allEvents.filter(other => {
    if (other.id === event.id) return false;
    if (other.status === 'cancelled') return false;
    if ((other.venue || '').trim().toLowerCase() !== venue) return false;
    return rangesOverlap(range, getVenueOccupiedRange(other));
  });
};
