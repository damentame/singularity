import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  X, Heart, PartyPopper, Building2, ChevronDown, ChevronRight, ChevronLeft,
  Search, UserPlus, Check, Phone, Mail, User, Briefcase, BookTemplate, Loader2, Layers, FileText, Trash2,
  FilePlus,
} from 'lucide-react';
import {
  EventType, EVENT_TYPE_LABELS, CreateEventParams, ClientType, ClientDetails,
  CorporateClient, WeddingClient, CelebrationClient,
} from '@/contexts/EventContext';
import { useAppContext } from '@/contexts/AppContext';
import { COUNTRIES, POPULAR_COUNTRIES, getCountryByCode } from '@/data/countries';
import { getCountryConfigOrDefault, CURRENCY_OPTIONS } from '@/data/countryConfig';
import {
  DbClient,
  fetchClients,
  createClient,
  getDbClientDisplayName,
  addClientDivision,
} from '@/data/clientDbStore';
import FastQuantityInput from './FastQuantityInput';
import { toast } from '@/components/ui/use-toast';


const GOLD = '#C9A24A';

const EVENT_TYPE_ICONS: Record<string, React.ReactNode> = {
  wedding: <Heart className="w-5 h-5" />,
  celebration: <PartyPopper className="w-5 h-5" />,
  corporate: <Building2 className="w-5 h-5" />,
};

const EVENT_TYPE_DESCRIPTIONS: Record<string, string> = {
  wedding: 'Wedding celebration with partner details',
  celebration: 'Private celebration with host details',
  corporate: 'Corporate event with company details',
};

const CLIENT_TYPE_MAP: Record<EventType, ClientType> = {
  wedding: 'wedding',
  celebration: 'celebration',
  corporate: 'corporate',
};

interface CreateEventModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (params: CreateEventParams) => void;
  preselectedClientId?: string;
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({ open, onClose, onCreate, preselectedClientId }) => {
  const { user } = useAppContext();

  // ─── Step state ────────────────────────────────────────────────────────────
  const [step, setStep] = useState<1 | 2>(1);

  // ─── Step 1: Event Type + Client ───────────────────────────────────────────
  const [eventType, setEventType] = useState<EventType>('wedding');
  const [clientMode, setClientMode] = useState<'search' | 'new'>('search');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [allAccounts, setAllAccounts] = useState<DbClient[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [creatingClient, setCreatingClient] = useState(false);

  // New client fields
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhoneCode, setNewClientPhoneCode] = useState('+27');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientCompany, setNewClientCompany] = useState('');
  const [newClientCountry, setNewClientCountry] = useState('ZA');

  // ─── Step 2: Event Details ─────────────────────────────────────────────────
  const [eventName, setEventName] = useState('');
  const [date, setDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [venue, setVenue] = useState('');
  const [country, setCountry] = useState('ZA');
  const [region, setRegion] = useState('');
  const [city, setCity] = useState('');
  const [currency, setCurrency] = useState('ZAR');
  const [currencyTouched, setCurrencyTouched] = useState(false);
  const [guestCount, setGuestCount] = useState(100);
  // Corporate naming
  const [companyName, setCompanyName] = useState('');
  const [divisionName, setDivisionName] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [startingPoint, setStartingPoint] = useState<'blank' | 'catalog'>('blank');
  // Client company-level details (VAT/registration/billing/contact), pre-filled from the
  // client record — carried through silently, editable afterward on the event itself.
  const [clientDetails, setClientDetails] = useState<ClientDetails | null>(null);

  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ─── Existing accounts (shared Supabase client directory) ──────────────────
  useEffect(() => {
    if (!open) return;
    setLoadingAccounts(true);
    fetchClients()
      .then(setAllAccounts)
      .finally(() => setLoadingAccounts(false));
  }, [open]);

  const filteredAccounts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allAccounts;
    return allAccounts.filter(a =>
      a.primary_contact_name.toLowerCase().includes(q) ||
      a.primary_contact_email.toLowerCase().includes(q) ||
      a.company_name.toLowerCase().includes(q)
    );
  }, [allAccounts, searchQuery]);

  const selectedAccount = useMemo(
    () => allAccounts.find(a => a.id === selectedAccountId),
    [allAccounts, selectedAccountId]
  );

  // Currency follows the selected country by default, until the coordinator picks one explicitly
  useEffect(() => {
    if (!currencyTouched) setCurrency(getCountryConfigOrDefault(country).currencyIso);
  }, [country, currencyTouched]);

  const sortedCountries = useMemo(() => {
    const popular = POPULAR_COUNTRIES.map(code => COUNTRIES.find(c => c.code === code)).filter(Boolean);
    const rest = COUNTRIES.filter(c => !POPULAR_COUNTRIES.includes(c.code));
    return { popular, rest };
  }, []);

  // ─── Reset on open/close ───────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      setStep(1);
      setEventType('wedding');
      setClientMode('search');
      setSelectedAccountId('');
      setSearchQuery('');
      setNewClientName('');
      setNewClientEmail('');
      setNewClientPhoneCode('+27');
      setNewClientPhone('');
      setNewClientCompany('');
      setNewClientCountry('ZA');
      setEventName('');
      setDate('');
      setEndDate('');
      setVenue('');
      setCountry('ZA');
      setRegion('');
      setCity('');
      setCurrency('ZAR');
      setCurrencyTouched(false);
      setGuestCount(100);
      setCompanyName('');
      setDivisionName('');
      setEventTitle('');
      setStartingPoint('blank');
      setClientDetails(null);
    }
  }, [open]);

  // ─── Jump straight to Step 2 when opened for a specific (already-onboarded) client ──
  useEffect(() => {
    if (!open || !preselectedClientId || loadingAccounts) return;
    const account = allAccounts.find(a => a.id === preselectedClientId);
    if (!account) return;
    setClientMode('search');
    setSelectedAccountId(account.id);
    setSearchQuery(getDbClientDisplayName(account));
    if (account.client_type === 'corporate') setEventType('corporate');
    applyAccountPrefill(account);
    setStep(2);
  }, [open, preselectedClientId, allAccounts, loadingAccounts]);

  if (!open) return null;

  const isCorporate = eventType === 'corporate';

  // ─── Map a client record onto the ClientDetails shape a proposal needs ─────
  // Snapshot at creation time — not a live link — so later edits to the client
  // record don't retroactively rewrite an already-created proposal.
  function buildClientDetailsFromAccount(account: DbClient, type: EventType): ClientDetails {
    if (type === 'corporate') {
      const [contactFirstName, ...rest] = (account.primary_contact_name || '').split(' ');
      const details: CorporateClient = {
        companyName: account.company_name || '',
        vatNumber: account.vat_number || '',
        registrationNumber: account.registration_number || '',
        billingAddress: account.billing_address || '',
        contactFirstName: contactFirstName || '',
        contactSurname: rest.join(' '),
        contactEmail: account.primary_contact_email || '',
        contactTelephoneCode: account.primary_contact_phone_code || '+27',
        contactTelephone: account.primary_contact_phone || '',
        accountsPayableEmail: account.accounts_payable_email || '',
      };
      return details;
    }
    if (type === 'wedding') {
      const details: WeddingClient = {
        partner1FirstName: '', partner1Surname: '', partner2FirstName: '', partner2Surname: '',
        primaryEmail: account.primary_contact_email || '',
        primaryTelephoneCode: account.primary_contact_phone_code || '+27',
        primaryTelephone: account.primary_contact_phone || '',
        billingName: account.primary_contact_name || '',
        billingAddress: account.billing_address || '',
      };
      return details;
    }
    const details: CelebrationClient = {
      hostFirstName: '', hostSurname: '',
      hostEmail: account.primary_contact_email || '',
      hostTelephoneCode: account.primary_contact_phone_code || '+27',
      hostTelephone: account.primary_contact_phone || '',
      billingName: account.primary_contact_name || '',
      billingAddress: account.billing_address || '',
    };
    return details;
  }

  // ─── Pre-fill Step 2 fields from a resolved client account ─────────────────
  function applyAccountPrefill(account: DbClient) {
    if (account.country) setCountry(account.country);
    if (account.client_type === 'corporate' && account.company_name) setCompanyName(account.company_name);
    if (account.client_type !== 'corporate' && account.primary_contact_name) setEventName(prev => prev || account.primary_contact_name);
    setClientDetails(buildClientDetailsFromAccount(account, eventType));
  }

  // ─── Step 1 validation ─────────────────────────────────────────────────────
  const canProceedToStep2 = () => {
    if (clientMode === 'search') return !!selectedAccountId;
    // New client: name required, email required
    if (!newClientName.trim()) return false;
    if (!newClientEmail.trim()) return false;
    if (isCorporate && !newClientCompany.trim()) return false;
    return true;
  };

  // ─── Proceed to Step 2 ────────────────────────────────────────────────────
  const handleProceed = async () => {
    if (!canProceedToStep2() || creatingClient) return;

    // If creating a new client, persist it to the shared client directory now
    if (clientMode === 'new') {
      if (!user?.id) return;
      setCreatingClient(true);
      try {
        const account = await createClient({
          coordinator_id: user.id,
          client_type: CLIENT_TYPE_MAP[eventType],
          primary_contact_name: newClientName.trim(),
          primary_contact_email: newClientEmail.trim(),
          primary_contact_phone_code: newClientPhoneCode,
          primary_contact_phone: newClientPhone.trim(),
          company_name: isCorporate ? newClientCompany.trim() : '',
          country: newClientCountry,
          region: '',
          city: '',
          billing_address: '',
          vat_number: '',
          registration_number: '',
          accounts_payable_email: '',
          divisions: [],
          style_preferences: {},
          budget_history: [],
          notes: '',
          mood_board_refs: [],
          tags: [],
          is_active: true,
        });
        if (!account) {
          toast({ title: 'Error', description: 'Could not save client. Please try again.', variant: 'destructive' });
          return;
        }
        setAllAccounts(prev => [account, ...prev]);
        setSelectedAccountId(account.id);
        applyAccountPrefill(account);
      } finally {
        setCreatingClient(false);
      }
    } else if (selectedAccount) {
      applyAccountPrefill(selectedAccount);
    }

    setStep(2);
  };

  // ─── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = isCorporate
      ? (eventTitle.trim() || companyName.trim() || 'Untitled Event')
      : (eventName.trim() || 'Untitled Event');

    // Remember a newly-used division against the client so it's suggested next time
    if (isCorporate && selectedAccount && divisionName.trim()) {
      addClientDivision(selectedAccount, divisionName.trim());
    }

    onCreate({
      name: finalName,
      date,
      endDate: endDate || date,
      eventType,
      venue: venue.trim(),
      country,
      region: region.trim(),
      city: city.trim(),
      guestCount,
      companyName: isCorporate ? companyName.trim() : undefined,
      divisionName: isCorporate ? divisionName.trim() : undefined,
      eventTitle: isCorporate ? eventTitle.trim() : undefined,
      clientAccountId: selectedAccountId,
      useStandardCatalog: startingPoint === 'catalog',
      clientDetails: clientDetails || undefined,
      currency,
    });
  };

  // ─── Select existing account ───────────────────────────────────────────────
  const handleSelectAccount = (account: DbClient) => {
    setSelectedAccountId(account.id);
    setSearchQuery(getDbClientDisplayName(account));
    setShowDropdown(false);
  };

  // ─── Input styling helper ──────────────────────────────────────────────────
  const inputStyle = "w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-colors";
  const inputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    (e.target as HTMLElement).style.borderColor = GOLD;
  };
  const inputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    (e.target as HTMLElement).style.borderColor = '#E5E5E5';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 animate-slideUp max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ border: '1px solid rgba(201,162,74,0.15)' }}
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-black/5 transition-colors">
          <X className="w-4 h-4 text-gray-400" />
        </button>

        <h2 className="text-xl font-light mb-1" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#1A1A1A' }}>
          Create New Event
        </h2>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6 mt-2">
          <div className="flex items-center gap-1.5">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{
                backgroundColor: step >= 1 ? GOLD : '#E5E5E5',
                color: step >= 1 ? '#FFF' : '#999',
              }}
            >
              {step > 1 ? <Check className="w-3 h-3" /> : '1'}
            </div>
            <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: step >= 1 ? GOLD : '#999' }}>
              Client
            </span>
          </div>
          <div className="flex-1 h-px" style={{ backgroundColor: step >= 2 ? GOLD : '#E5E5E5' }} />
          <div className="flex items-center gap-1.5">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{
                backgroundColor: step >= 2 ? GOLD : '#E5E5E5',
                color: step >= 2 ? '#FFF' : '#999',
              }}
            >
              2
            </div>
            <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: step >= 2 ? GOLD : '#999' }}>
              Event Details
            </span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* STEP 1: Event Type + Client Account                               */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div className="space-y-5">
            {/* Event Type */}
            <div>
              <label className="block text-[10px] uppercase tracking-[0.15em] mb-3" style={{ color: GOLD, fontWeight: 600 }}>
                Event Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(EVENT_TYPE_LABELS) as EventType[]).map((et) => (
                  <button
                    key={et}
                    type="button"
                    onClick={() => setEventType(et)}
                    className="flex flex-col items-center gap-2 py-4 px-3 rounded-xl border transition-all"
                    style={{
                      backgroundColor: eventType === et ? 'rgba(201,162,74,0.06)' : '#FFF',
                      borderColor: eventType === et ? GOLD : '#EFEFEF',
                      color: eventType === et ? GOLD : '#999',
                    }}
                  >
                    {EVENT_TYPE_ICONS[et] || <Briefcase className="w-5 h-5" />}
                    <span className="text-xs font-medium">{EVENT_TYPE_LABELS[et]}</span>
                    <span className="text-[9px] text-gray-400 text-center leading-tight">
                      {EVENT_TYPE_DESCRIPTIONS[et] || ''}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px" style={{ backgroundColor: 'rgba(201,162,74,0.1)' }} />

            {/* Client Account Section */}
            <div>
              <label className="block text-[10px] uppercase tracking-[0.15em] mb-3" style={{ color: GOLD, fontWeight: 600 }}>
                <User className="w-3 h-3 inline mr-1" />
                Client Account
              </label>

              {/* Toggle: Search Existing / Create New */}
              <div className="flex gap-1 p-1 rounded-lg mb-4" style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}>
                <button
                  type="button"
                  onClick={() => { setClientMode('search'); setSelectedAccountId(''); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all"
                  style={{
                    backgroundColor: clientMode === 'search' ? '#FFF' : 'transparent',
                    color: clientMode === 'search' ? '#1A1A1A' : '#999',
                    boxShadow: clientMode === 'search' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  <Search className="w-3 h-3" />
                  Select Existing
                </button>
                <button
                  type="button"
                  onClick={() => { setClientMode('new'); setSelectedAccountId(''); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all"
                  style={{
                    backgroundColor: clientMode === 'new' ? '#FFF' : 'transparent',
                    color: clientMode === 'new' ? '#1A1A1A' : '#999',
                    boxShadow: clientMode === 'new' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  <UserPlus className="w-3 h-3" />
                  Create New
                </button>
              </div>

              {/* ─── Search Existing ─── */}
              {clientMode === 'search' && (
                <div ref={searchRef} className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); setSelectedAccountId(''); }}
                      onFocus={() => setShowDropdown(true)}
                      placeholder="Search by name, email, or company..."
                      className="w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm outline-none transition-colors"
                      style={{ borderColor: selectedAccountId ? '#22C55E' : '#E5E5E5', color: '#1A1A1A' }}
                    />
                    {selectedAccountId && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Check className="w-4 h-4 text-green-500" />
                      </div>
                    )}
                  </div>

                  {/* Dropdown */}
                  {showDropdown && !selectedAccountId && (
                    <div
                      className="absolute z-10 top-full left-0 right-0 mt-1 bg-white rounded-xl border shadow-lg max-h-48 overflow-y-auto"
                      style={{ borderColor: 'rgba(201,162,74,0.2)' }}
                    >
                      {loadingAccounts ? (
                        <div className="px-4 py-6 text-center text-xs text-gray-400">
                          <Loader2 className="w-4 h-4 animate-spin inline mr-1.5" /> Loading clients...
                        </div>
                      ) : filteredAccounts.length === 0 ? (
                        <div className="px-4 py-6 text-center">
                          <p className="text-xs text-gray-400 mb-2">No clients found</p>
                          <button
                            type="button"
                            onClick={() => {
                              setClientMode('new');
                              if (searchQuery.trim()) {
                                // For corporate, search query is likely a company name
                                if (isCorporate) {
                                  setNewClientCompany(searchQuery.trim());
                                } else {
                                  setNewClientName(searchQuery.trim());
                                }
                              }
                              setShowDropdown(false);
                            }}

                            className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                            style={{ color: GOLD, backgroundColor: 'rgba(201,162,74,0.08)' }}
                          >
                            <UserPlus className="w-3 h-3 inline mr-1" />
                            Create New Client
                          </button>
                        </div>
                      ) : (
                        filteredAccounts.map((acct) => {
                          const countryObj = getCountryByCode(acct.country);
                          return (
                            <button
                              key={acct.id}
                              type="button"
                              onClick={() => handleSelectAccount(acct)}
                              className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b last:border-b-0 flex items-center gap-3"
                              style={{ borderColor: 'rgba(0,0,0,0.04)' }}
                            >
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: 'rgba(201,162,74,0.1)' }}
                              >
                                {acct.client_type === 'corporate'
                                  ? <Building2 className="w-3.5 h-3.5" style={{ color: GOLD }} />
                                  : acct.client_type === 'wedding'
                                    ? <Heart className="w-3.5 h-3.5" style={{ color: GOLD }} />
                                    : <PartyPopper className="w-3.5 h-3.5" style={{ color: GOLD }} />
                                }
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-800 truncate">
                                  {getDbClientDisplayName(acct)}
                                </div>
                                <div className="text-[10px] text-gray-400 truncate">
                                  {acct.client_type === 'corporate' && acct.primary_contact_name && (
                                    <span>Contact: {acct.primary_contact_name} · </span>
                                  )}
                                  {acct.primary_contact_email}
                                  {countryObj ? ` · ${countryObj.flag} ${countryObj.name}` : ''}
                                </div>

                              </div>
                              <span
                                className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
                                style={{ backgroundColor: 'rgba(201,162,74,0.08)', color: GOLD }}
                              >
                                {acct.client_type}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* Selected account preview */}
                  {selectedAccount && (
                    <div
                      className="mt-3 p-3 rounded-xl flex items-center gap-3"
                      style={{ backgroundColor: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.15)' }}
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'rgba(201,162,74,0.1)' }}
                      >
                        {selectedAccount.client_type === 'corporate'
                          ? <Building2 className="w-4 h-4" style={{ color: GOLD }} />
                          : <User className="w-4 h-4" style={{ color: GOLD }} />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800">
                          {getDbClientDisplayName(selectedAccount)}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {selectedAccount.client_type === 'corporate' && selectedAccount.primary_contact_name && (
                            <span className="mr-1.5">Contact: {selectedAccount.primary_contact_name} ·</span>
                          )}
                          {selectedAccount.primary_contact_email}
                          {selectedAccount.primary_contact_phone ? ` · ${selectedAccount.primary_contact_phone_code} ${selectedAccount.primary_contact_phone}` : ''}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setSelectedAccountId(''); setSearchQuery(''); }}
                        className="text-[10px] text-gray-400 hover:text-red-500 transition-colors"
                      >
                        Change
                      </button>
                    </div>
                  )}

                </div>
              )}

              {/* ─── Create New Client ─── */}
              {clientMode === 'new' && (
                <div className="p-4 rounded-xl space-y-3" style={{ backgroundColor: '#FAFAF7', border: '1px solid rgba(201,162,74,0.12)' }}>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">New Client Details</p>

                  {/* ── CORPORATE: Organisation first, then Contact Person ── */}
                  {isCorporate && (
                    <>
                      {/* Organisation / Client Name (the company IS the client) */}
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">
                          Client / Organisation Name <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                          <input
                            type="text"
                            value={newClientCompany}
                            onChange={(e) => setNewClientCompany(e.target.value)}
                            placeholder="e.g. Acme Corporation"
                            className="w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm outline-none transition-colors"
                            style={{ borderColor: '#E5E5E5', color: '#1A1A1A' }}
                            onFocus={inputFocus}
                            onBlur={inputBlur}
                          />
                        </div>
                        <p className="text-[9px] text-gray-400 mt-0.5 ml-1">The organisation or company commissioning the event</p>
                      </div>

                      {/* Contact Person (who works for the organisation) */}
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">
                          Contact Person <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                          <input
                            type="text"
                            value={newClientName}
                            onChange={(e) => setNewClientName(e.target.value)}
                            placeholder="e.g. Jane Smith"
                            className="w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm outline-none transition-colors"
                            style={{ borderColor: '#E5E5E5', color: '#1A1A1A' }}
                            onFocus={inputFocus}
                            onBlur={inputBlur}
                          />
                        </div>
                        <p className="text-[9px] text-gray-400 mt-0.5 ml-1">The person at the organisation managing this event</p>
                      </div>

                      {/* Contact Email */}
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">
                          Contact Email <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                          <input
                            type="email"
                            value={newClientEmail}
                            onChange={(e) => setNewClientEmail(e.target.value)}
                            placeholder="jane@acmecorp.com"
                            className="w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm outline-none transition-colors"
                            style={{ borderColor: '#E5E5E5', color: '#1A1A1A' }}
                            onFocus={inputFocus}
                            onBlur={inputBlur}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* ── NON-CORPORATE: Client Name (person IS the client) ── */}
                  {!isCorporate && (
                    <>
                      {/* Client Name */}
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">
                          Client Name <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                          <input
                            type="text"
                            value={newClientName}
                            onChange={(e) => setNewClientName(e.target.value)}
                            placeholder={eventType === 'wedding' ? 'e.g. Sarah & James Smith' : 'e.g. John Doe'}
                            className="w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm outline-none transition-colors"
                            style={{ borderColor: '#E5E5E5', color: '#1A1A1A' }}
                            onFocus={inputFocus}
                            onBlur={inputBlur}
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">
                          Email <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                          <input
                            type="email"
                            value={newClientEmail}
                            onChange={(e) => setNewClientEmail(e.target.value)}
                            placeholder="client@example.com"
                            className="w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm outline-none transition-colors"
                            style={{ borderColor: '#E5E5E5', color: '#1A1A1A' }}
                            onFocus={inputFocus}
                            onBlur={inputBlur}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Phone (shared for all types) */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">
                      {isCorporate ? 'Contact Phone' : 'Phone'}
                    </label>
                    <div className="flex gap-2">
                      <div className="relative w-24 flex-shrink-0">
                        <select
                          value={newClientPhoneCode}
                          onChange={(e) => setNewClientPhoneCode(e.target.value)}
                          className="w-full px-2 py-2.5 rounded-lg border text-xs outline-none appearance-none bg-white pr-6"
                          style={{ borderColor: '#E5E5E5', color: '#1A1A1A' }}
                        >
                          {COUNTRIES.filter(c => POPULAR_COUNTRIES.includes(c.code)).map(c => (
                            <option key={c.code} value={c.dialCode}>{c.flag} {c.dialCode}</option>
                          ))}
                          <option disabled>──────</option>
                          {COUNTRIES.map(c => (
                            <option key={`all-${c.code}`} value={c.dialCode}>{c.flag} {c.dialCode}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                      </div>
                      <div className="relative flex-1">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input
                          type="tel"
                          value={newClientPhone}
                          onChange={(e) => setNewClientPhone(e.target.value)}
                          placeholder="82 123 4567"
                          className="w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm outline-none transition-colors"
                          style={{ borderColor: '#E5E5E5', color: '#1A1A1A' }}
                          onFocus={inputFocus}
                          onBlur={inputBlur}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Country */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Country</label>
                    <div className="relative">
                      <select
                        value={newClientCountry}
                        onChange={(e) => setNewClientCountry(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors appearance-none bg-white pr-8"
                        style={{ borderColor: '#E5E5E5', color: '#1A1A1A' }}
                      >
                        <option value="">Select...</option>
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
                  </div>
                </div>
              )}
            </div>


            {/* Proceed button */}
            <button
              type="button"
              onClick={handleProceed}
              disabled={!canProceedToStep2() || creatingClient}
              className="w-full py-3 rounded-lg text-sm font-medium uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: GOLD, color: '#FFF' }}
            >
              {creatingClient ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Continue to Event Details
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* STEP 2: Event Details                                              */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Back button + client summary */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="p-1.5 rounded-lg hover:bg-black/5 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-400" />
              </button>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-gray-400">Client</div>
                <div className="text-sm font-medium text-gray-700 truncate">
                  {selectedAccount
                    ? getDbClientDisplayName(selectedAccount)
                    : isCorporate
                      ? (newClientCompany || newClientName)
                      : newClientName
                  }
                </div>
                {isCorporate && !selectedAccount && newClientName && (
                  <div className="text-[10px] text-gray-400 truncate">
                    Contact: {newClientName}
                  </div>
                )}
                {selectedAccount?.client_type === 'corporate' && selectedAccount.primary_contact_name && (
                  <div className="text-[10px] text-gray-400 truncate">
                    Contact: {selectedAccount.primary_contact_name} · {selectedAccount.primary_contact_email}
                  </div>
                )}
                {selectedAccount && selectedAccount.client_type !== 'corporate' && selectedAccount.primary_contact_email && (
                  <div className="text-[10px] text-gray-400 truncate">
                    {selectedAccount.primary_contact_email}
                  </div>
                )}
              </div>

              <span
                className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: 'rgba(201,162,74,0.08)', color: GOLD }}
              >
                {EVENT_TYPE_LABELS[eventType]}
              </span>
            </div>

            <div className="h-px" style={{ backgroundColor: 'rgba(201,162,74,0.1)' }} />

            {/* Event Name (non-corporate) */}
            {!isCorporate && (
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1.5">
                  Event Name
                </label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder={
                    eventType === 'wedding' ? 'e.g. Smith & Jones Wedding' :
                    'e.g. 50th Birthday Celebration'
                  }
                  className={inputStyle}
                  style={{ borderColor: '#E5E5E5', color: '#1A1A1A' }}
                  onFocus={inputFocus}
                  onBlur={inputBlur}
                  required
                />
              </div>
            )}

            {/* Corporate Naming */}
            {isCorporate && (
              <div className="p-4 rounded-xl" style={{ backgroundColor: '#FAFAF7', border: '1px solid rgba(201,162,74,0.12)' }}>
                <label className="block text-[10px] uppercase tracking-[0.15em] mb-3" style={{ color: GOLD, fontWeight: 600 }}>
                  <Building2 className="w-3 h-3 inline mr-1" />
                  Corporate Structure
                </label>
                <p className="text-[10px] text-gray-400 mb-3">Display: Company - Division - Event Title</p>
                {selectedAccount && (selectedAccount.vat_number || selectedAccount.registration_number || selectedAccount.billing_address) && (
                  <p className="text-[10px] mb-3 flex items-center gap-1" style={{ color: GOLD }}>
                    <Check className="w-3 h-3" /> VAT, registration &amp; billing details already on file for this client — no need to re-enter them.
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">
                      Company <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Acme Corp"
                      className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                      style={{ borderColor: '#E5E5E5', color: '#1A1A1A' }}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">Division</label>
                    <input
                      type="text"
                      list="division-suggestions"
                      value={divisionName}
                      onChange={(e) => setDivisionName(e.target.value)}
                      placeholder="Marketing"
                      className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                      style={{ borderColor: '#E5E5E5', color: '#1A1A1A' }}
                    />
                    {selectedAccount && (selectedAccount.divisions || []).length > 0 && (
                      <datalist id="division-suggestions">
                        {(selectedAccount.divisions || []).map((d) => <option key={d} value={d} />)}
                      </datalist>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">
                      Event Title <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      placeholder="Annual Gala 2026"
                      className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                      style={{ borderColor: '#E5E5E5', color: '#1A1A1A' }}
                      required
                    />
                  </div>
                </div>
                {/* Live preview */}
                {(companyName || eventTitle) && (
                  <div className="mt-3 px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(201,162,74,0.06)' }}>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">Preview: </span>
                    <span className="text-xs font-medium" style={{ color: '#1A1A1A' }}>
                      {[companyName, divisionName, eventTitle].filter(Boolean).join(' - ') || '...'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1.5">Start Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => {
                    const newStart = e.target.value;
                    setDate(newStart);
                    if (endDate && endDate < newStart) setEndDate(newStart);
                  }}
                  className={inputStyle}
                  style={{ borderColor: '#E5E5E5', color: '#1A1A1A', minHeight: '44px', fontSize: '15px' }}
                  onFocus={inputFocus}
                  onBlur={inputBlur}
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1.5">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  min={date || undefined}
                  onFocus={(e) => { if (!endDate && date) setEndDate(date); inputFocus(e); }}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={inputStyle}
                  style={{ borderColor: '#E5E5E5', color: '#1A1A1A', minHeight: '44px', fontSize: '15px' }}
                  onBlur={inputBlur}
                />
              </div>
            </div>

            {/* Location: Country + Region + City */}
            <div>
              <label className="block text-[10px] uppercase tracking-[0.15em] mb-3" style={{ color: GOLD, fontWeight: 600 }}>
                Location
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1.5">Country</label>
                  <div className="relative">
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors appearance-none bg-white pr-8"
                      style={{ borderColor: '#E5E5E5', color: '#1A1A1A' }}
                    >
                      <option value="">Select...</option>
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
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1.5">Region / State</label>
                  <input
                    type="text"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="e.g. Western Cape"
                    className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors"
                    style={{ borderColor: '#E5E5E5', color: '#1A1A1A' }}
                    onFocus={inputFocus}
                    onBlur={inputBlur}
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1.5">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Cape Town"
                    className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors"
                    style={{ borderColor: '#E5E5E5', color: '#1A1A1A' }}
                    onFocus={inputFocus}
                    onBlur={inputBlur}
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1.5">Currency</label>
                  <div className="relative">
                    <select
                      value={currency}
                      onChange={(e) => { setCurrency(e.target.value); setCurrencyTouched(true); }}
                      className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors appearance-none bg-white pr-8"
                      style={{ borderColor: '#E5E5E5', color: '#1A1A1A' }}
                    >
                      {CURRENCY_OPTIONS.map((c) => (
                        <option key={c.iso} value={c.iso}>{c.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Venue */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1.5">Venue</label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="Venue name"
                className={inputStyle}
                style={{ borderColor: '#E5E5E5', color: '#1A1A1A' }}
                onFocus={inputFocus}
                onBlur={inputBlur}
              />
            </div>

            {/* Guest Count */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-400 mb-2">Guest Count</label>
              <FastQuantityInput
                value={guestCount}
                onChange={setGuestCount}
                min={1}
                max={2000}
                presets={[50, 80, 100, 120, 150, 200, 250]}
              />
            </div>

            {/* Starting Point */}
            <div>
              <label className="block text-[10px] uppercase tracking-[0.15em] mb-3" style={{ color: GOLD, fontWeight: 600 }}>
                <FilePlus className="w-3 h-3 inline mr-1" />
                Starting Point
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStartingPoint('blank')}
                  className="flex flex-col items-start gap-1 py-3 px-3 rounded-xl border text-left transition-all"
                  style={{
                    backgroundColor: startingPoint === 'blank' ? 'rgba(201,162,74,0.06)' : '#FFF',
                    borderColor: startingPoint === 'blank' ? GOLD : '#EFEFEF',
                  }}
                >
                  <span className="text-xs font-medium" style={{ color: startingPoint === 'blank' ? GOLD : '#1A1A1A' }}>
                    Start Blank
                  </span>
                  <span className="text-[9px] text-gray-400 leading-tight">
                    Empty quote — add items as you build
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setStartingPoint('catalog')}
                  className="flex flex-col items-start gap-1 py-3 px-3 rounded-xl border text-left transition-all"
                  style={{
                    backgroundColor: startingPoint === 'catalog' ? 'rgba(201,162,74,0.06)' : '#FFF',
                    borderColor: startingPoint === 'catalog' ? GOLD : '#EFEFEF',
                  }}
                >
                  <span className="text-xs font-medium" style={{ color: startingPoint === 'catalog' ? GOLD : '#1A1A1A' }}>
                    Standard Catalog
                  </span>
                  <span className="text-[9px] text-gray-400 leading-tight">
                    Pre-fill with common items &amp; typical pricing
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-lg text-sm font-medium uppercase tracking-wider transition-all hover:shadow-lg"
              style={{ backgroundColor: GOLD, color: '#FFF' }}
            >
              Create Event
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateEventModal;
