// ─── PDF Exports: Load Schedule & Order of Events ───────────────────────────
// Plain client-side jsPDF documents (no server round-trip) - deliberately
// simple stacked rows rather than a table plugin, since free-text fields
// (supplier names, notes) can be arbitrarily long and must wrap safely.

import { jsPDF } from 'jspdf';
import { PlannerEvent, EventMoment, MOMENT_TYPE_LABELS, getEventDisplayName } from '@/contexts/EventContext';
import { getCountryByCode } from '@/data/countries';

const GOLD: [number, number, number] = [201, 162, 74];
const INK: [number, number, number] = [26, 26, 26];
const MUTED: [number, number, number] = [140, 140, 140];
const MARGIN = 15;
const PAGE_WIDTH = 210; // A4 portrait, mm
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

function locationStr(event: PlannerEvent): string {
  const country = getCountryByCode(event.country || '');
  return [event.venue, event.city, country?.name].filter(Boolean).join(', ') || 'Venue TBC';
}

function formatDate(date: string): string {
  if (!date) return 'Date TBC';
  return new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function newDoc(event: PlannerEvent, title: string): { doc: jsPDF; y: number } {
  const doc = new jsPDF();
  doc.setFont('helvetica', 'normal');

  doc.setTextColor(...GOLD);
  doc.setFontSize(9);
  doc.text((event.quoteNumber || 'QUOTE PENDING').toUpperCase(), MARGIN, 16);

  doc.setTextColor(...INK);
  doc.setFontSize(18);
  doc.text(title, MARGIN, 26);

  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text(getEventDisplayName(event), MARGIN, 33);
  doc.text(locationStr(event), MARGIN, 38.5);
  doc.text(`${formatDate(event.date)}${event.endDate && event.endDate !== event.date ? ' - ' + formatDate(event.endDate) : ''}`, MARGIN, 44);

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, 49, PAGE_WIDTH - MARGIN, 49);

  return { doc, y: 58 };
}

function ensureRoom(doc: jsPDF, y: number, needed: number): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + needed > pageHeight - MARGIN) {
    doc.addPage();
    return MARGIN + 5;
  }
  return y;
}

function sectionHeading(doc: jsPDF, y: number, label: string): number {
  y = ensureRoom(doc, y, 14);
  doc.setFontSize(11);
  doc.setTextColor(...GOLD);
  doc.text(label.toUpperCase(), MARGIN, y);
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, y + 2, PAGE_WIDTH - MARGIN, y + 2);
  return y + 9;
}

// Writes a block of wrapped lines at the given x/width, returning the new y.
function writeWrapped(doc: jsPDF, text: string, x: number, y: number, maxWidth: number, lineHeight = 4.6): number {
  const lines = doc.splitTextToSize(text, maxWidth) as string[];
  lines.forEach(line => {
    y = ensureRoom(doc, y, lineHeight);
    doc.text(line, x, y);
    y += lineHeight;
  });
  return y;
}

function footer(doc: jsPDF) {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(`Generated ${new Date().toLocaleString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, MARGIN, doc.internal.pageSize.getHeight() - 10);
    doc.text(`Page ${i} of ${pages}`, PAGE_WIDTH - MARGIN - 22, doc.internal.pageSize.getHeight() - 10);
  }
}

function safeFilename(event: PlannerEvent, suffix: string): string {
  return `${suffix}-${(event.quoteNumber || event.id).replace(/[^a-zA-Z0-9-]/g, '')}.pdf`;
}

// ─── Load Schedule PDF ───────────────────────────────────────────────────────

export function exportLoadScheduleToPdf(event: PlannerEvent): void {
  const { doc, y: startY } = newDoc(event, 'Load-In / Load-Out Schedule');
  let y = startY;
  const spaceName = (id: string) => (event.venueSpaces || []).find(s => s.id === id)?.name || '';

  (['load_in', 'load_out'] as const).forEach(type => {
    const slots = (event.loadSlots || [])
      .filter(s => s.type === type)
      .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));

    y = sectionHeading(doc, y, type === 'load_in' ? 'Load-In / Setup' : 'Load-Out / Strike');

    if (slots.length === 0) {
      doc.setFontSize(9.5);
      doc.setTextColor(...MUTED);
      doc.text('No slots scheduled yet.', MARGIN, y);
      y += 10;
      return;
    }

    slots.forEach(slot => {
      y = ensureRoom(doc, y, 16);

      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...INK);
      const when = `${formatDate(slot.date)}  ·  ${slot.startTime ? `${slot.startTime}${slot.endTime ? '-' + slot.endTime : ''}` : 'Time TBC'}`;
      y = writeWrapped(doc, when, MARGIN, y, CONTENT_WIDTH, 5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...INK);
      const supplierLine = [slot.supplierName || 'Supplier TBC', slot.label].filter(Boolean).join('  ·  ');
      y = writeWrapped(doc, supplierLine, MARGIN + 4, y, CONTENT_WIDTH - 4, 4.6);

      doc.setFontSize(8.5);
      doc.setTextColor(...MUTED);
      const space = spaceName(slot.venueSpaceId);
      const statusLine = [space, slot.notifiedAt ? 'Supplier notified' : 'Not yet notified'].filter(Boolean).join('  ·  ');
      y = writeWrapped(doc, statusLine, MARGIN + 4, y, CONTENT_WIDTH - 4, 4.2);

      if (slot.notes) {
        y = writeWrapped(doc, slot.notes, MARGIN + 4, y, CONTENT_WIDTH - 4, 4.2);
      }

      y += 4;
    });
    y += 3;
  });

  footer(doc);
  doc.save(safeFilename(event, 'load-schedule'));
}

// ─── Order of Events PDF ─────────────────────────────────────────────────────

export function exportOrderOfEventsToPdf(event: PlannerEvent): void {
  const { doc, y: startY } = newDoc(event, 'Order of Events');
  let y = sectionHeading(doc, startY, 'Programme');
  const spaceName = (id: string) => (event.venueSpaces || []).find(s => s.id === id)?.name || '';

  const moments: EventMoment[] = (event.moments || [])
    .filter(m => m.momentType !== 'load_in' && m.momentType !== 'load_out')
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime) || a.sortOrder - b.sortOrder);

  if (moments.length === 0) {
    doc.setFontSize(9.5);
    doc.setTextColor(...MUTED);
    doc.text('No moments added yet.', MARGIN, y);
  }

  moments.forEach(m => {
    y = ensureRoom(doc, y, 16);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...INK);
    const time = m.startTime ? `${m.startTime}${m.endTime ? '-' + m.endTime : ''}` : 'Time TBC';
    const title = `${time}  ·  ${m.name || MOMENT_TYPE_LABELS[m.momentType]}`;
    y = writeWrapped(doc, title, MARGIN, y, CONTENT_WIDTH, 5);

    const space = spaceName(m.venueSpaceId);
    if (space) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...MUTED);
      y = writeWrapped(doc, space, MARGIN + 4, y, CONTENT_WIDTH - 4, 4.2);
    }

    if (m.notes) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...MUTED);
      y = writeWrapped(doc, m.notes, MARGIN + 4, y, CONTENT_WIDTH - 4, 4.2);
    }

    y += 4;
  });

  footer(doc);
  doc.save(safeFilename(event, 'order-of-events'));
}
