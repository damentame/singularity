import React, { useState, useMemo } from 'react';
import { Calendar, MapPin, Users, Building2, ChevronDown, ChevronUp, Globe, Phone } from 'lucide-react';

import {
  useEventContext,
  PlannerEvent,
  EventType,
  EVENT_TYPE_LABELS,
  VenueType,
  CorporateClient,
  WeddingClient,
  CelebrationClient,
  getDefaultClientDetails,
} from '@/contexts/EventContext';
import { COUNTRIES, POPULAR_COUNTRIES, getDialCodeByCountry } from '@/data/countries';
import { useConfigOptions } from '@/hooks/useConfigOptions';
import FastQuantityInput from './FastQuantityInput';


const GOLD = '#C9A24A';

const GoldDivider = () => (
  <div className="h-px my-5" style={{ backgroundColor: 'rgba(201,162,74,0.15)' }} />
);

const SubHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-4" style={{ color: GOLD }}>
    {children}
  </h3>
);

const FieldLabel: React.FC<{ children: React.ReactNode; required?: boolean }> = ({ children, required }) => (
  <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1.5">
    {children}
    {required && <span className="text-red-400 ml-0.5">*</span>}
  </label>
);

const TextInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}> = ({ value, onChange, placeholder, type = 'text', required }) => (
  <input
    type={type}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    required={required}
    className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors"
    style={{ borderColor: '#EFEFEF', color: '#1A1A1A' }}
    onFocus={(e) => (e.target.style.borderColor = GOLD)}
    onBlur={(e) => (e.target.style.borderColor = '#EFEFEF')}
  />
);

// ─── Phone Input with Country Code ───────────────────────────────────────────

const PhoneInput: React.FC<{
  codeValue: string;
  phoneValue: string;
  onCodeChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  required?: boolean;
}> = ({ codeValue, phoneValue, onCodeChange, onPhoneChange, required }) => {
  const sortedCountries = useMemo(() => {
    const popular = POPULAR_COUNTRIES.map(code => COUNTRIES.find(c => c.code === code)).filter(Boolean);
    const rest = COUNTRIES.filter(c => !POPULAR_COUNTRIES.includes(c.code));
    return { popular, rest };
  }, []);

  return (
    <div className="flex gap-1.5">
      <div className="relative" style={{ minWidth: '110px', maxWidth: '130px' }}>
        <select
          value={codeValue}
          onChange={(e) => onCodeChange(e.target.value)}
          className="w-full px-2 py-2 rounded-lg border text-xs outline-none transition-colors appearance-none bg-white pr-6"
          style={{ borderColor: '#EFEFEF', color: codeValue ? '#1A1A1A' : '#999' }}
        >
          <option value="">Code</option>
          <optgroup label="Popular">
            {sortedCountries.popular.map((c) => c && (
              <option key={c.code} value={c.dialCode}>{c.flag} {c.dialCode}</option>
            ))}
          </optgroup>
          <optgroup label="All Countries">
            {sortedCountries.rest.map((c) => (
              <option key={c.code} value={c.dialCode}>{c.flag} {c.dialCode} {c.name}</option>
            ))}
          </optgroup>
        </select>
        <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
      </div>
      <input
        type="tel"
        value={phoneValue}
        onChange={(e) => onPhoneChange(e.target.value)}
        placeholder="Phone number"
        required={required}
        className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none transition-colors"
        style={{ borderColor: '#EFEFEF', color: '#1A1A1A' }}
        onFocus={(e) => (e.target.style.borderColor = GOLD)}
        onBlur={(e) => (e.target.style.borderColor = '#EFEFEF')}
      />
    </div>
  );
};

// ─── Country Dropdown ────────────────────────────────────────────────────────

const CountrySelect: React.FC<{
  value: string;
  onChange: (code: string) => void;
}> = ({ value, onChange }) => {
  const sortedCountries = useMemo(() => {
    const popular = POPULAR_COUNTRIES.map(code => COUNTRIES.find(c => c.code === code)).filter(Boolean);
    const rest = COUNTRIES.filter(c => !POPULAR_COUNTRIES.includes(c.code));
    return { popular, rest };
  }, []);

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors appearance-none bg-white pr-8"
        style={{ borderColor: '#EFEFEF', color: value ? '#1A1A1A' : '#999' }}
      >
        <option value="">Select country...</option>
        <optgroup label="Popular">
          {sortedCountries.popular.map((c) => c && (
            <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
          ))}
        </optgroup>
        <optgroup label="All Countries">
          {sortedCountries.rest.map((c) => (
            <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
          ))}
        </optgroup>
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

interface EventDetailsCardProps {
  event: PlannerEvent;
}

const EventDetailsCard: React.FC<EventDetailsCardProps> = ({ event }) => {
  const { updateEvent, updateGuestCount } = useEventContext();

  const [showClientDetails, setShowClientDetails] = useState(true);

  // Configurable options
  const { options: eventTypeOptions } = useConfigOptions('EVENT_TYPE');
  const { options: venueTypeOptions } = useConfigOptions('VENUE_TYPE');

  const flaggedCount = event.lineItems.filter((i) => i.flagged).length;
  const isCorporate = event.eventType === 'corporate';

  // Auto-populate phone country code when country changes
  const handleCountryChange = (countryCode: string) => {
    const dialCode = getDialCodeByCountry(countryCode);
    updateEvent(event.id, { country: countryCode });

    if (dialCode) {
      const details = { ...event.clientDetails };
      if (event.eventType === 'corporate') {
        const c = details as CorporateClient;
        if (!c.contactTelephoneCode) {
          updateEvent(event.id, {
            country: countryCode,
            clientDetails: { ...c, contactTelephoneCode: dialCode },
          });
          return;
        }
      } else if (event.eventType === 'wedding') {
        const c = details as WeddingClient;
        if (!c.primaryTelephoneCode) {
          updateEvent(event.id, {
            country: countryCode,
            clientDetails: { ...c, primaryTelephoneCode: dialCode },
          });
          return;
        }
      } else if (event.eventType === 'celebration') {
        const c = details as CelebrationClient;
        if (!c.hostTelephoneCode) {
          updateEvent(event.id, {
            country: countryCode,
            clientDetails: { ...c, hostTelephoneCode: dialCode },
          });
          return;
        }
      }
    }
  };

  const handleEventTypeChange = (newType: EventType) => {
    const dialCode = getDialCodeByCountry(event.country || '');
    const newDetails = getDefaultClientDetails(newType);
    if (dialCode) {
      if (newType === 'corporate') (newDetails as CorporateClient).contactTelephoneCode = dialCode;
      if (newType === 'wedding') (newDetails as WeddingClient).primaryTelephoneCode = dialCode;
      if (newType === 'celebration') (newDetails as CelebrationClient).hostTelephoneCode = dialCode;
    }
    updateEvent(event.id, {
      eventType: newType,
      clientDetails: newDetails,
    });
  };

  const handleClientUpdate = (field: string, value: string) => {
    updateEvent(event.id, {
      clientDetails: { ...event.clientDetails, [field]: value },
    });
  };

  // ─── Client Details Renderers ──────────────────────────────────────────────

  const renderCorporateFields = () => {
    const c = event.clientDetails as CorporateClient;
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <FieldLabel required>Company Name</FieldLabel>
          <TextInput value={c.companyName || ''} onChange={(v) => handleClientUpdate('companyName', v)} placeholder="Company name" required />
        </div>
        <div>
          <FieldLabel>VAT / Tax Number</FieldLabel>
          <TextInput value={c.vatNumber || ''} onChange={(v) => handleClientUpdate('vatNumber', v)} placeholder="VAT number" />
        </div>
        <div>
          <FieldLabel>Registration Number</FieldLabel>
          <TextInput value={c.registrationNumber || ''} onChange={(v) => handleClientUpdate('registrationNumber', v)} placeholder="Reg number" />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <FieldLabel>Billing Address</FieldLabel>
          <TextInput value={c.billingAddress || ''} onChange={(v) => handleClientUpdate('billingAddress', v)} placeholder="Billing address" />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <div className="h-px my-3" style={{ backgroundColor: 'rgba(201,162,74,0.1)' }} />
          <p className="text-[10px] uppercase tracking-wider text-gray-300 mb-3">Contact Person</p>
        </div>
        <div>
          <FieldLabel required>First Name</FieldLabel>
          <TextInput value={c.contactFirstName || ''} onChange={(v) => handleClientUpdate('contactFirstName', v)} placeholder="First name" required />
        </div>
        <div>
          <FieldLabel required>Surname</FieldLabel>
          <TextInput value={c.contactSurname || ''} onChange={(v) => handleClientUpdate('contactSurname', v)} placeholder="Surname" required />
        </div>
        <div>
          <FieldLabel required>Email</FieldLabel>
          <TextInput value={c.contactEmail || ''} onChange={(v) => handleClientUpdate('contactEmail', v)} placeholder="email@company.com" type="email" required />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel required>
            <Phone className="w-3 h-3 inline mr-1" style={{ color: GOLD }} />
            Telephone
          </FieldLabel>
          <PhoneInput
            codeValue={c.contactTelephoneCode || ''}
            phoneValue={c.contactTelephone || ''}
            onCodeChange={(v) => handleClientUpdate('contactTelephoneCode', v)}
            onPhoneChange={(v) => handleClientUpdate('contactTelephone', v)}
            required
          />
        </div>
        <div>
          <FieldLabel>Accounts Payable Email</FieldLabel>
          <TextInput value={c.accountsPayableEmail || ''} onChange={(v) => handleClientUpdate('accountsPayableEmail', v)} placeholder="accounts@company.com" type="email" />
        </div>
      </div>
    );
  };

  const renderWeddingFields = () => {
    const c = event.clientDetails as WeddingClient;
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="sm:col-span-2 lg:col-span-3">
          <p className="text-[10px] uppercase tracking-wider text-gray-300 mb-3">Partner 1</p>
        </div>
        <div>
          <FieldLabel required>First Name</FieldLabel>
          <TextInput value={c.partner1FirstName || ''} onChange={(v) => handleClientUpdate('partner1FirstName', v)} placeholder="First name" required />
        </div>
        <div>
          <FieldLabel required>Surname</FieldLabel>
          <TextInput value={c.partner1Surname || ''} onChange={(v) => handleClientUpdate('partner1Surname', v)} placeholder="Surname" required />
        </div>
        <div />
        <div className="sm:col-span-2 lg:col-span-3">
          <p className="text-[10px] uppercase tracking-wider text-gray-300 mb-3 mt-2">Partner 2</p>
        </div>
        <div>
          <FieldLabel>First Name</FieldLabel>
          <TextInput value={c.partner2FirstName || ''} onChange={(v) => handleClientUpdate('partner2FirstName', v)} placeholder="First name" />
        </div>
        <div>
          <FieldLabel>Surname</FieldLabel>
          <TextInput value={c.partner2Surname || ''} onChange={(v) => handleClientUpdate('partner2Surname', v)} placeholder="Surname" />
        </div>
        <div />
        <div className="sm:col-span-2 lg:col-span-3 mt-2">
          <div className="h-px my-2" style={{ backgroundColor: 'rgba(201,162,74,0.1)' }} />
          <p className="text-[10px] uppercase tracking-wider text-gray-300 mb-3 mt-3">Contact & Billing</p>
        </div>
        <div>
          <FieldLabel required>Primary Email</FieldLabel>
          <TextInput value={c.primaryEmail || ''} onChange={(v) => handleClientUpdate('primaryEmail', v)} placeholder="email@example.com" type="email" required />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel required>
            <Phone className="w-3 h-3 inline mr-1" style={{ color: GOLD }} />
            Primary Telephone
          </FieldLabel>
          <PhoneInput
            codeValue={c.primaryTelephoneCode || ''}
            phoneValue={c.primaryTelephone || ''}
            onCodeChange={(v) => handleClientUpdate('primaryTelephoneCode', v)}
            onPhoneChange={(v) => handleClientUpdate('primaryTelephone', v)}
            required
          />
        </div>
        <div>
          <FieldLabel>Billing Name</FieldLabel>
          <TextInput value={c.billingName || ''} onChange={(v) => handleClientUpdate('billingName', v)} placeholder="Billing name" />
        </div>
        <div className="sm:col-span-2 lg:col-span-2">
          <FieldLabel>Billing Address</FieldLabel>
          <TextInput value={c.billingAddress || ''} onChange={(v) => handleClientUpdate('billingAddress', v)} placeholder="Billing address" />
        </div>
      </div>
    );
  };

  const renderCelebrationFields = () => {
    const c = event.clientDetails as CelebrationClient;
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <FieldLabel required>Host First Name</FieldLabel>
          <TextInput value={c.hostFirstName || ''} onChange={(v) => handleClientUpdate('hostFirstName', v)} placeholder="First name" required />
        </div>
        <div>
          <FieldLabel required>Host Surname</FieldLabel>
          <TextInput value={c.hostSurname || ''} onChange={(v) => handleClientUpdate('hostSurname', v)} placeholder="Surname" required />
        </div>
        <div>
          <FieldLabel required>Host Email</FieldLabel>
          <TextInput value={c.hostEmail || ''} onChange={(v) => handleClientUpdate('hostEmail', v)} placeholder="email@example.com" type="email" required />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel required>
            <Phone className="w-3 h-3 inline mr-1" style={{ color: GOLD }} />
            Host Telephone
          </FieldLabel>
          <PhoneInput
            codeValue={c.hostTelephoneCode || ''}
            phoneValue={c.hostTelephone || ''}
            onCodeChange={(v) => handleClientUpdate('hostTelephoneCode', v)}
            onPhoneChange={(v) => handleClientUpdate('hostTelephone', v)}
            required
          />
        </div>
        <div>
          <FieldLabel>Billing Name</FieldLabel>
          <TextInput value={c.billingName || ''} onChange={(v) => handleClientUpdate('billingName', v)} placeholder="Billing name" />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <FieldLabel>Billing Address</FieldLabel>
          <TextInput value={c.billingAddress || ''} onChange={(v) => handleClientUpdate('billingAddress', v)} placeholder="Billing address" />
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border p-6" style={{ borderColor: 'rgba(201,162,74,0.15)' }}>

      {/* ═══ A) EVENT DETAILS ═══ */}
      <SubHeading>Event Details</SubHeading>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <FieldLabel required>Event Name</FieldLabel>
          <TextInput value={event.name} onChange={(v) => updateEvent(event.id, { name: v })} placeholder="e.g. Smith Wedding" required />
        </div>
        <div>
          <FieldLabel required>Event Type</FieldLabel>
          <div className="relative">
            <select value={event.eventType || 'wedding'} onChange={(e) => handleEventTypeChange(e.target.value as EventType)}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors appearance-none bg-white pr-8"
              style={{ borderColor: '#EFEFEF', color: '#1A1A1A' }}>
              {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
              {eventTypeOptions.filter(o => !['WEDDING', 'CORPORATE', 'CELEBRATION'].includes(o.valueKey)).map(o => (
                <option key={o.id} value={o.valueKey.toLowerCase()}>{o.displayLabel}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <div>
          <FieldLabel><Calendar className="w-3 h-3 inline mr-1" style={{ color: GOLD }} />Start Date</FieldLabel>
          <TextInput value={event.date} onChange={(v) => updateEvent(event.id, { date: v })} type="date" />
        </div>
        <div>
          <FieldLabel><Calendar className="w-3 h-3 inline mr-1" style={{ color: GOLD }} />End Date</FieldLabel>
          <TextInput value={event.endDate || ''} onChange={(v) => updateEvent(event.id, { endDate: v })} type="date" />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel><Users className="w-3 h-3 inline mr-1" style={{ color: GOLD }} />Guest Count</FieldLabel>
          <FastQuantityInput value={event.guestCount} onChange={(v) => updateGuestCount(event.id, v)} min={1} max={2000} presets={[50, 80, 100, 120, 150, 200, 250]} />
        </div>
      </div>

      {/* ═══ CORPORATE NAMING ═══ */}
      {isCorporate && (
        <>
          <GoldDivider />
          <SubHeading><Building2 className="w-3.5 h-3.5 inline mr-1.5" />Corporate Structure</SubHeading>
          <p className="text-[10px] text-gray-300 mb-3 italic">Display format: Company — Division — Event Title</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <FieldLabel required>Company Name</FieldLabel>
              <TextInput value={event.companyName || ''} onChange={(v) => updateEvent(event.id, { companyName: v })} placeholder="e.g. Acme Corp" required />
            </div>
            <div>
              <FieldLabel>Division / Department</FieldLabel>
              <TextInput value={event.divisionName || ''} onChange={(v) => updateEvent(event.id, { divisionName: v })} placeholder="e.g. Marketing" />
            </div>
            <div>
              <FieldLabel>Event Title</FieldLabel>
              <TextInput value={event.eventTitle || ''} onChange={(v) => updateEvent(event.id, { eventTitle: v })} placeholder="e.g. Annual Gala 2026" />
            </div>
          </div>
        </>
      )}

      {flaggedCount > 0 && (
        <div className="mt-4 p-3 rounded-lg flex items-center gap-2" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
          <span className="text-xs text-amber-700">{flaggedCount} item{flaggedCount > 1 ? 's' : ''} flagged for supplier reconfirmation due to guest count change.</span>
        </div>
      )}

      {/* ═══ B) CLIENT DETAILS ═══ */}
      <GoldDivider />
      <button onClick={() => setShowClientDetails(!showClientDetails)} className="flex items-center gap-2 w-full text-left mb-4">
        <SubHeading>Client Details</SubHeading>
        <span className="text-[10px] text-gray-300 uppercase tracking-wider ml-1">({EVENT_TYPE_LABELS[event.eventType || 'wedding']})</span>
        <div className="flex-1" />
        {showClientDetails ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
      </button>
      {showClientDetails && (
        <div className="mb-2">
          <p className="text-[10px] text-gray-300 mb-4 italic">Client details are internal only — not shared with suppliers.</p>
          {event.eventType === 'corporate' && renderCorporateFields()}
          {event.eventType === 'wedding' && renderWeddingFields()}
          {event.eventType === 'celebration' && renderCelebrationFields()}
        </div>
      )}

      {/* ═══ C) LOCATION ═══ */}
      <GoldDivider />
      <SubHeading>Location</SubHeading>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <FieldLabel required><Globe className="w-3 h-3 inline mr-1" style={{ color: GOLD }} />Country</FieldLabel>
          <CountrySelect value={event.country || ''} onChange={handleCountryChange} />
        </div>
        <div>
          <FieldLabel>Region / State</FieldLabel>
          <TextInput value={event.region || ''} onChange={(v) => updateEvent(event.id, { region: v })} placeholder="e.g. Western Cape" />
        </div>
        <div>
          <FieldLabel required><MapPin className="w-3 h-3 inline mr-1" style={{ color: GOLD }} />City</FieldLabel>
          <TextInput value={event.city || ''} onChange={(v) => updateEvent(event.id, { city: v })} placeholder="e.g. Cape Town" required />
        </div>
        <div>
          <FieldLabel required><Building2 className="w-3 h-3 inline mr-1" style={{ color: GOLD }} />Venue</FieldLabel>
          <TextInput value={event.venue} onChange={(v) => updateEvent(event.id, { venue: v })} placeholder="Venue name" required />
        </div>
        <div>
          <FieldLabel>Venue Type</FieldLabel>
          <div className="relative">
            <select value={event.venueType || ''} onChange={(e) => updateEvent(event.id, { venueType: e.target.value as VenueType })}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors appearance-none bg-white pr-8"
              style={{ borderColor: '#EFEFEF', color: event.venueType ? '#1A1A1A' : '#999' }}>
              <option value="">Select type...</option>
              {venueTypeOptions.map((o) => (
                <option key={o.id} value={o.valueKey.toLowerCase()}>{o.displayLabel}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Note: Venue Spaces, Backup Venues, and Programs are now managed within Sub-Events & Costing */}
      <div className="mt-5 px-4 py-3 rounded-xl" style={{ backgroundColor: 'rgba(201,162,74,0.03)', border: '1px dashed rgba(201,162,74,0.15)' }}>
        <p className="text-[10px] text-gray-400 italic">
          Venue spaces, backup venues, and costing are managed per sub-event in the <span className="font-semibold" style={{ color: GOLD }}>Sub-Events & Costing</span> tab below.
        </p>
      </div>

    </div>
  );
};

export default EventDetailsCard;

