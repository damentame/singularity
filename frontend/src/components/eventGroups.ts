import { getEventDisplayName, PlannerEvent } from '@/contexts/EventContext';

export interface EventGroup {
  code: string;
  events: PlannerEvent[];
  anchor: PlannerEvent;
}

const byDateThenName = (a: PlannerEvent, b: PlannerEvent) => {
  const byDate = (a.date || '').localeCompare(b.date || '');
  if (byDate !== 0) return byDate;
  return getEventDisplayName(a).localeCompare(getEventDisplayName(b));
};

export function collectEventGroups(events: PlannerEvent[]): { groups: EventGroup[]; ungrouped: PlannerEvent[] } {
  const buckets = new Map<string, PlannerEvent[]>();
  const ungrouped: PlannerEvent[] = [];

  for (const event of events) {
    const code = event.groupCode?.trim();
    if (!code) {
      ungrouped.push(event);
      continue;
    }
    const list = buckets.get(code) ?? [];
    list.push(event);
    buckets.set(code, list);
  }

  const groups = [...buckets.entries()]
    .map(([code, members]) => {
      const sorted = [...members].sort(byDateThenName);
      return { code, events: sorted, anchor: sorted[0] };
    })
    .sort((a, b) => byDateThenName(a.anchor, b.anchor) || a.code.localeCompare(b.code));

  return { groups, ungrouped };
}

export function formatGroupDateSpan(events: PlannerEvent[]): string {
  const dates = events.map((event) => event.date).filter(Boolean).sort();
  if (dates.length === 0) return 'Date TBC';
  const label = (value: string) =>
    new Date(value + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  if (dates[0] === dates[dates.length - 1]) return label(dates[0]);
  return `${label(dates[0])} – ${label(dates[dates.length - 1])}`;
}

export function groupClientTotal(
  events: PlannerEvent[],
  priceOf: (event: PlannerEvent) => number,
): { total: number | null; currencies: string[] } {
  const currencies = [...new Set(events.map((event) => event.billingCurrency || event.currency || 'ZAR'))];
  if (currencies.length > 1) return { total: null, currencies };
  return {
    total: events.reduce((sum, event) => sum + priceOf(event), 0),
    currencies,
  };
}
