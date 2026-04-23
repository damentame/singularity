import React, { useState } from 'react';
import { 
  Building2, Users, CreditCard, FolderOpen, Briefcase, CheckSquare, 
  MessageSquare, ChevronDown, ChevronUp, Eye, EyeOff, Plus, Trash2,
  Edit2, Save, X, MapPin, Phone, Mail, Globe, Calendar, AlertCircle,
  Check, Clock, HardDrive, Cloud, Download, Ban
} from 'lucide-react';
import {
  CompanyDetails,
  ContactPerson,
  BankingDetails,
  SupplierTodo,
  SupplierComment,
  SupplierFullDetails,
  defaultVisibilitySettings,
  supplierDetailSections,
  saveOptions,
} from '@/data/supplierDetailsData';
import { useAppContext } from '@/contexts/AppContext';

interface SupplierDetailsPanelProps {
  supplierId: string;
  supplierName: string;
  initialData?: Partial<SupplierFullDetails>;
  onSave?: (data: SupplierFullDetails) => void;
  isReadOnly?: boolean;
  hidePricing?: boolean;
}

const SupplierDetailsPanel: React.FC<SupplierDetailsPanelProps> = ({
  supplierId,
  supplierName,
  initialData,
  onSave,
  isReadOnly = false,
  hidePricing: initialHidePricing = false,
}) => {
  const { user } = useAppContext();
  
  // Expanded sections state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    company: true,
    contacts: false,
    banking: false,
    documents: false,
    services: false,
    todos: true,
    comments: true,
  });

  // Visibility toggles
  const [visibility, setVisibility] = useState(initialData?.visibilitySettings || defaultVisibilitySettings);
  const [hidePricing, setHidePricing] = useState(initialHidePricing);

  // Company details
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails>(initialData?.companyDetails || {
    companyName: supplierName,
    registrationNumber: '',
    vatNumber: '',
    vatRegistered: false,
    physicalAddress: { street: '', city: '', state: '', postalCode: '', country: '' },
    sameAsPhysical: true,
  });

  // Contacts
  const [contacts, setContacts] = useState<ContactPerson[]>(initialData?.contacts || []);
  const [editingContact, setEditingContact] = useState<string | null>(null);

  // Banking
  const [bankingDetails, setBankingDetails] = useState<BankingDetails | undefined>(initialData?.bankingDetails);

  // Todos
  const [todos, setTodos] = useState<SupplierTodo[]>(initialData?.todos || []);
  const [newTodoText, setNewTodoText] = useState('');

  // Comments
  const [comments, setComments] = useState<SupplierComment[]>(initialData?.comments || []);
  const [newCommentText, setNewCommentText] = useState('');

  // Services
  const [services, setServices] = useState(initialData?.servicesOffered || {
    corporate: false,
    weddings: false,
    celebrations: false,
    other: [],
  });

  // N/A states for fields
  const [naFields, setNaFields] = useState<Record<string, boolean>>({});

  // Save mode
  const [saveMode, setSaveMode] = useState<'local' | 'cloud' | null>(null);
  const [showSaveOptions, setShowSaveOptions] = useState(false);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const toggleVisibility = (field: keyof typeof visibility) => {
    setVisibility(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const toggleNA = (fieldId: string) => {
    setNaFields(prev => ({ ...prev, [fieldId]: !prev[fieldId] }));
  };

  const addContact = () => {
    const newContact: ContactPerson = {
      id: `contact-${Date.now()}`,
      name: '',
      role: '',
      email: '',
      phone: '',
      isPrimary: contacts.length === 0,
    };
    setContacts([...contacts, newContact]);
    setEditingContact(newContact.id);
  };

  const updateContact = (id: string, field: keyof ContactPerson, value: string | boolean) => {
    setContacts(contacts.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const removeContact = (id: string) => {
    setContacts(contacts.filter(c => c.id !== id));
  };

  const addTodo = () => {
    if (!newTodoText.trim()) return;
    const newTodo: SupplierTodo = {
      id: `todo-${Date.now()}`,
      text: newTodoText,
      completed: false,
      priority: 'medium',
      createdAt: new Date().toISOString(),
    };
    setTodos([...todos, newTodo]);
    setNewTodoText('');
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const removeTodo = (id: string) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  const addComment = () => {
    if (!newCommentText.trim() || !user) return;
    const newComment: SupplierComment = {
      id: `comment-${Date.now()}`,
      text: newCommentText,
      author: user.name,
      authorRole: user.role,
      createdAt: new Date().toISOString(),
      isPrivate: false,
    };
    setComments([...comments, newComment]);
    setNewCommentText('');
  };

  const handleSave = (mode: 'local' | 'cloud' | 'export') => {
    const data: SupplierFullDetails = {
      id: supplierId,
      companyDetails,
      contacts,
      bankingDetails,
      todos,
      comments,
      documents: [],
      servicesOffered: services,
      visibilitySettings: visibility,
    };

    if (mode === 'local') {
      localStorage.setItem(`supplier_${supplierId}`, JSON.stringify(data));
      setSaveMode('local');
    } else if (mode === 'cloud') {
      // Would save to Supabase
      setSaveMode('cloud');
      onSave?.(data);
    } else if (mode === 'export') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `supplier_${supplierId}_data.json`;
      a.click();
    }
    setShowSaveOptions(false);
  };

  const renderFieldWithNA = (
    fieldId: string,
    label: string,
    value: string,
    onChange: (val: string) => void,
    placeholder?: string
  ) => {
    const isNA = naFields[fieldId];
    
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-xs text-white/50 uppercase tracking-wider">{label}</label>
          <button
            onClick={() => toggleNA(fieldId)}
            className={`text-xs px-2 py-0.5 rounded ${
              isNA ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-white/40 hover:text-white/60'
            }`}
          >
            {isNA ? 'N/A' : 'Mark N/A'}
          </button>
        </div>
        {isNA ? (
          <div className="px-3 py-2 bg-orange-500/10 border border-orange-500/20 rounded-lg text-orange-400 text-sm flex items-center gap-2">
            <Ban className="w-4 h-4" />
            Not Applicable
          </div>
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={isReadOnly}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-gold disabled:opacity-50"
          />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header with Save Options */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl text-white font-display">{supplierName}</h2>
          <p className="text-white/50 text-sm">Supplier Details & Management</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Hide Pricing Toggle */}
          <button
            onClick={() => setHidePricing(!hidePricing)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
              hidePricing 
                ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' 
                : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
            }`}
          >
            {hidePricing ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="text-sm">{hidePricing ? 'Pricing Hidden' : 'Hide Pricing'}</span>
          </button>

          {/* Save Options */}
          <div className="relative">
            <button
              onClick={() => setShowSaveOptions(!showSaveOptions)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gold-light via-gold to-gold-dark rounded-lg text-navy font-medium text-sm"
            >
              <Save className="w-4 h-4" />
              Save
              <ChevronDown className="w-4 h-4" />
            </button>

            {showSaveOptions && (
              <div className="absolute right-0 mt-2 w-56 bg-navy border border-white/10 rounded-xl shadow-2xl py-2 z-50">
                {saveOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleSave(option.id as 'local' | 'cloud' | 'export')}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors"
                  >
                    {option.id === 'local' && <HardDrive className="w-4 h-4 text-gold" />}
                    {option.id === 'cloud' && <Cloud className="w-4 h-4 text-gold" />}
                    {option.id === 'export' && <Download className="w-4 h-4 text-gold" />}
                    <div className="text-left">
                      <p className="text-sm text-white">{option.label}</p>
                      <p className="text-xs text-white/50">{option.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Company Information Section */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection('company')}
          className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-gold" />
            <span className="text-white font-medium">Company Information</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); toggleVisibility('showRegistrationNumber'); }}
              className="p-1 hover:bg-white/10 rounded"
            >
              {visibility.showRegistrationNumber ? <Eye className="w-4 h-4 text-white/50" /> : <EyeOff className="w-4 h-4 text-white/30" />}
            </button>
            {expandedSections.company ? <ChevronUp className="w-5 h-5 text-white/50" /> : <ChevronDown className="w-5 h-5 text-white/50" />}
          </div>
        </button>

        {expandedSections.company && (
          <div className="p-4 border-t border-white/10 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderFieldWithNA('companyName', 'Company Name', companyDetails.companyName, (val) => setCompanyDetails({ ...companyDetails, companyName: val }), 'Legal company name')}
              {renderFieldWithNA('tradingName', 'Trading Name', companyDetails.tradingName || '', (val) => setCompanyDetails({ ...companyDetails, tradingName: val }), 'Trading as...')}
              
              {visibility.showRegistrationNumber && (
                renderFieldWithNA('registrationNumber', 'Registration Number', companyDetails.registrationNumber || '', (val) => setCompanyDetails({ ...companyDetails, registrationNumber: val }), 'Company registration')
              )}
              
              {visibility.showVatNumber && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-white/50 uppercase tracking-wider">VAT Details</label>
                    <label className="flex items-center gap-2 text-xs text-white/50">
                      <input
                        type="checkbox"
                        checked={companyDetails.vatRegistered}
                        onChange={(e) => setCompanyDetails({ ...companyDetails, vatRegistered: e.target.checked })}
                        className="rounded border-white/20 bg-white/5"
                      />
                      VAT Registered
                    </label>
                  </div>
                  {companyDetails.vatRegistered && (
                    <input
                      type="text"
                      value={companyDetails.vatNumber || ''}
                      onChange={(e) => setCompanyDetails({ ...companyDetails, vatNumber: e.target.value })}
                      placeholder="VAT Number"
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-gold"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Physical Address */}
            {visibility.showPhysicalAddress && (
              <div className="pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-gold" />
                  <span className="text-sm text-white">Physical Address</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={companyDetails.physicalAddress.street}
                    onChange={(e) => setCompanyDetails({ ...companyDetails, physicalAddress: { ...companyDetails.physicalAddress, street: e.target.value } })}
                    placeholder="Street Address"
                    className="col-span-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-gold"
                  />
                  <input
                    type="text"
                    value={companyDetails.physicalAddress.city}
                    onChange={(e) => setCompanyDetails({ ...companyDetails, physicalAddress: { ...companyDetails.physicalAddress, city: e.target.value } })}
                    placeholder="City"
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-gold"
                  />
                  <input
                    type="text"
                    value={companyDetails.physicalAddress.state}
                    onChange={(e) => setCompanyDetails({ ...companyDetails, physicalAddress: { ...companyDetails.physicalAddress, state: e.target.value } })}
                    placeholder="State/Province"
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-gold"
                  />
                  <input
                    type="text"
                    value={companyDetails.physicalAddress.postalCode}
                    onChange={(e) => setCompanyDetails({ ...companyDetails, physicalAddress: { ...companyDetails.physicalAddress, postalCode: e.target.value } })}
                    placeholder="Postal Code"
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-gold"
                  />
                  <input
                    type="text"
                    value={companyDetails.physicalAddress.country}
                    onChange={(e) => setCompanyDetails({ ...companyDetails, physicalAddress: { ...companyDetails.physicalAddress, country: e.target.value } })}
                    placeholder="Country"
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-gold"
                  />
                </div>
              </div>
            )}

            {/* Postal Address */}
            <div className="pt-4 border-t border-white/10">
              <label className="flex items-center gap-2 text-sm text-white/70 mb-3">
                <input
                  type="checkbox"
                  checked={companyDetails.sameAsPhysical}
                  onChange={(e) => setCompanyDetails({ ...companyDetails, sameAsPhysical: e.target.checked })}
                  className="rounded border-white/20 bg-white/5"
                />
                Postal address same as physical
              </label>
              {!companyDetails.sameAsPhysical && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={companyDetails.postalAddress?.street || ''}
                    onChange={(e) => setCompanyDetails({ ...companyDetails, postalAddress: { ...companyDetails.postalAddress!, street: e.target.value } })}
                    placeholder="Postal Street Address"
                    className="col-span-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-gold"
                  />
                  {/* Additional postal fields would go here */}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Contact Persons Section */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection('contacts')}
          className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-gold" />
            <span className="text-white font-medium">Contact Persons</span>
            <span className="px-2 py-0.5 bg-gold/20 rounded text-gold text-xs">{contacts.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); toggleVisibility('showContactDetails'); }}
              className="p-1 hover:bg-white/10 rounded"
            >
              {visibility.showContactDetails ? <Eye className="w-4 h-4 text-white/50" /> : <EyeOff className="w-4 h-4 text-white/30" />}
            </button>
            {expandedSections.contacts ? <ChevronUp className="w-5 h-5 text-white/50" /> : <ChevronDown className="w-5 h-5 text-white/50" />}
          </div>
        </button>

        {expandedSections.contacts && visibility.showContactDetails && (
          <div className="p-4 border-t border-white/10 space-y-4">
            {contacts.map((contact) => (
              <div key={contact.id} className="bg-white/5 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {contact.isPrimary && (
                      <span className="px-2 py-0.5 bg-gold/20 text-gold text-xs rounded">Primary</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingContact(editingContact === contact.id ? null : contact.id)}
                      className="p-1 hover:bg-white/10 rounded text-white/50 hover:text-white"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeContact(contact.id)}
                      className="p-1 hover:bg-red-500/20 rounded text-red-400/50 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {editingContact === contact.id ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={contact.name}
                      onChange={(e) => updateContact(contact.id, 'name', e.target.value)}
                      placeholder="Full Name"
                      className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-gold"
                    />
                    <input
                      type="text"
                      value={contact.role}
                      onChange={(e) => updateContact(contact.id, 'role', e.target.value)}
                      placeholder="Role/Position"
                      className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-gold"
                    />
                    <input
                      type="email"
                      value={contact.email}
                      onChange={(e) => updateContact(contact.id, 'email', e.target.value)}
                      placeholder="Email"
                      className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-gold"
                    />
                    <input
                      type="tel"
                      value={contact.phone}
                      onChange={(e) => updateContact(contact.id, 'phone', e.target.value)}
                      placeholder="Phone"
                      className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-gold"
                    />
                    <input
                      type="tel"
                      value={contact.mobile || ''}
                      onChange={(e) => updateContact(contact.id, 'mobile', e.target.value)}
                      placeholder="Mobile"
                      className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-gold"
                    />
                    <input
                      type="text"
                      value={contact.department || ''}
                      onChange={(e) => updateContact(contact.id, 'department', e.target.value)}
                      placeholder="Department"
                      className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-gold"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-white font-medium">{contact.name || 'Unnamed Contact'}</p>
                    {contact.role && <p className="text-white/50 text-sm">{contact.role}</p>}
                    <div className="flex flex-wrap gap-4 text-sm">
                      {contact.email && (
                        <span className="flex items-center gap-1 text-white/70">
                          <Mail className="w-3 h-3" /> {contact.email}
                        </span>
                      )}
                      {contact.phone && (
                        <span className="flex items-center gap-1 text-white/70">
                          <Phone className="w-3 h-3" /> {contact.phone}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            <button
              onClick={addContact}
              className="w-full p-3 border border-dashed border-white/20 rounded-lg text-white/50 hover:text-white hover:border-white/40 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Contact Person
            </button>
          </div>
        )}
      </div>

      {/* Banking Details Section */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection('banking')}
          className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-gold" />
            <span className="text-white font-medium">Banking Details</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); toggleVisibility('showBankingDetails'); }}
              className="p-1 hover:bg-white/10 rounded"
            >
              {visibility.showBankingDetails ? <Eye className="w-4 h-4 text-white/50" /> : <EyeOff className="w-4 h-4 text-white/30" />}
            </button>
            {expandedSections.banking ? <ChevronUp className="w-5 h-5 text-white/50" /> : <ChevronDown className="w-5 h-5 text-white/50" />}
          </div>
        </button>

        {expandedSections.banking && visibility.showBankingDetails && (
          <div className="p-4 border-t border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderFieldWithNA('bankName', 'Bank Name', bankingDetails?.bankName || '', (val) => setBankingDetails({ ...bankingDetails!, bankName: val }))}
              {renderFieldWithNA('accountName', 'Account Name', bankingDetails?.accountName || '', (val) => setBankingDetails({ ...bankingDetails!, accountName: val }))}
              {renderFieldWithNA('accountNumber', 'Account Number', bankingDetails?.accountNumber || '', (val) => setBankingDetails({ ...bankingDetails!, accountNumber: val }))}
              {renderFieldWithNA('branchCode', 'Branch Code', bankingDetails?.branchCode || '', (val) => setBankingDetails({ ...bankingDetails!, branchCode: val }))}
              {renderFieldWithNA('swiftCode', 'SWIFT/BIC Code', bankingDetails?.swiftCode || '', (val) => setBankingDetails({ ...bankingDetails!, swiftCode: val }))}
              {renderFieldWithNA('iban', 'IBAN', bankingDetails?.iban || '', (val) => setBankingDetails({ ...bankingDetails!, iban: val }))}
            </div>
          </div>
        )}
      </div>

      {/* To-Do List Section */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection('todos')}
          className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <CheckSquare className="w-5 h-5 text-gold" />
            <span className="text-white font-medium">To-Do List</span>
            <span className="px-2 py-0.5 bg-gold/20 rounded text-gold text-xs">
              {todos.filter(t => !t.completed).length} pending
            </span>
          </div>
          {expandedSections.todos ? <ChevronUp className="w-5 h-5 text-white/50" /> : <ChevronDown className="w-5 h-5 text-white/50" />}
        </button>

        {expandedSections.todos && (
          <div className="p-4 border-t border-white/10 space-y-3">
            {/* Add new todo */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTodo()}
                placeholder="Add a new task..."
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-gold"
              />
              <button
                onClick={addTodo}
                className="px-4 py-2 bg-gold/20 text-gold rounded-lg hover:bg-gold/30 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Todo list */}
            <div className="space-y-2">
              {todos.map((todo) => (
                <div
                  key={todo.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    todo.completed ? 'bg-green-500/10' : 'bg-white/5'
                  }`}
                >
                  <button
                    onClick={() => toggleTodo(todo.id)}
                    className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                      todo.completed 
                        ? 'bg-green-500 border-green-500' 
                        : 'border-white/30 hover:border-gold'
                    }`}
                  >
                    {todo.completed && <Check className="w-3 h-3 text-white" />}
                  </button>
                  <span className={`flex-1 text-sm ${todo.completed ? 'text-white/50 line-through' : 'text-white'}`}>
                    {todo.text}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    todo.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                    todo.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {todo.priority}
                  </span>
                  <button
                    onClick={() => removeTodo(todo.id)}
                    className="p-1 text-red-400/50 hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Comments Section */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection('comments')}
          className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-gold" />
            <span className="text-white font-medium">Comments & Notes</span>
            <span className="px-2 py-0.5 bg-gold/20 rounded text-gold text-xs">{comments.length}</span>
          </div>
          {expandedSections.comments ? <ChevronUp className="w-5 h-5 text-white/50" /> : <ChevronDown className="w-5 h-5 text-white/50" />}
        </button>

        {expandedSections.comments && (
          <div className="p-4 border-t border-white/10 space-y-4">
            {/* Add new comment */}
            <div className="flex gap-2">
              <textarea
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Add a comment or note..."
                rows={2}
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-gold resize-none"
              />
              <button
                onClick={addComment}
                className="px-4 py-2 bg-gold/20 text-gold rounded-lg hover:bg-gold/30 transition-colors self-end"
              >
                Post
              </button>
            </div>

            {/* Comments list */}
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-white font-medium text-sm">{comment.author}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      comment.authorRole === 'host' ? 'bg-emerald-500/20 text-emerald-400' :
                      comment.authorRole === 'coordinator' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>
                      {comment.authorRole}
                    </span>
                    <span className="text-white/30 text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-white/70 text-sm">{comment.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Services Offered Section */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection('services')}
          className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Briefcase className="w-5 h-5 text-gold" />
            <span className="text-white font-medium">Services Offered</span>
          </div>
          {expandedSections.services ? <ChevronUp className="w-5 h-5 text-white/50" /> : <ChevronDown className="w-5 h-5 text-white/50" />}
        </button>

        {expandedSections.services && (
          <div className="p-4 border-t border-white/10">
            <div className="flex flex-wrap gap-3">
              <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                services.corporate ? 'bg-gold/20 border-gold text-gold' : 'bg-white/5 border-white/10 text-white/70'
              }`}>
                <input
                  type="checkbox"
                  checked={services.corporate}
                  onChange={(e) => setServices({ ...services, corporate: e.target.checked })}
                  className="sr-only"
                />
                <Check className={`w-4 h-4 ${services.corporate ? 'opacity-100' : 'opacity-0'}`} />
                Corporate Events
              </label>
              <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                services.weddings ? 'bg-gold/20 border-gold text-gold' : 'bg-white/5 border-white/10 text-white/70'
              }`}>
                <input
                  type="checkbox"
                  checked={services.weddings}
                  onChange={(e) => setServices({ ...services, weddings: e.target.checked })}
                  className="sr-only"
                />
                <Check className={`w-4 h-4 ${services.weddings ? 'opacity-100' : 'opacity-0'}`} />
                Weddings
              </label>
              <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                services.celebrations ? 'bg-gold/20 border-gold text-gold' : 'bg-white/5 border-white/10 text-white/70'
              }`}>
                <input
                  type="checkbox"
                  checked={services.celebrations}
                  onChange={(e) => setServices({ ...services, celebrations: e.target.checked })}
                  className="sr-only"
                />
                <Check className={`w-4 h-4 ${services.celebrations ? 'opacity-100' : 'opacity-0'}`} />
                Celebrations
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplierDetailsPanel;
