import React, { useState, useMemo } from 'react';
import { 
  FileText, Plus, Trash2, Calculator, Send, Download, Upload, 
  DollarSign, Truck, Clock, AlertCircle, CheckCircle, Building,
  CreditCard, RefreshCw, ChevronDown, ChevronUp, Mail, Printer,
  X, Save, Edit2, Eye
} from 'lucide-react';
import {
  WorkbookData,
  CostItem,
  CostCategory,
  LogisticsItem,
  vatRatesByCountry,
  currencySymbols,
  serviceCategoriesBySupplierType,
  collectionTimingOptions,
  contingencyPercentages,
} from '@/data/supplierWorkbookData';

interface SupplierWorkbookProps {
  eventId: string;
  eventName: string;
  eventDate: string;
  clientName: string;
  clientEmail: string;
  supplierId: string;
  supplierName: string;
  supplierCategory: string;
  country: string;
  city: string;
  guestCount?: number;
  onClose?: () => void;
  onSave?: (data: WorkbookData) => void;
  onSendToSupplier?: (data: WorkbookData) => void;
}

const SupplierWorkbook: React.FC<SupplierWorkbookProps> = ({
  eventId,
  eventName,
  eventDate,
  clientName,
  clientEmail,
  supplierId,
  supplierName,
  supplierCategory,
  country,
  city,
  guestCount = 100,
  onClose,
  onSave,
  onSendToSupplier,
}) => {
  // Get VAT rate for country
  const vatInfo = vatRatesByCountry[country] || { rate: 0, name: 'Tax' };
  const currency = country === 'South Africa' ? 'ZAR' : 
                   country === 'United Kingdom' ? 'GBP' :
                   ['France', 'Italy', 'Germany', 'Spain', 'Portugal', 'Netherlands', 'Belgium', 'Austria', 'Ireland', 'Greece'].includes(country) ? 'EUR' :
                   country === 'United States' ? 'USD' :
                   country === 'Australia' ? 'AUD' :
                   country === 'United Arab Emirates' ? 'AED' : 'USD';
  const currencySymbol = currencySymbols[currency] || '$';

  // Get default contingency percentage based on guest count
  const defaultContingency = contingencyPercentages.find(
    c => guestCount >= c.minGuests && guestCount <= c.maxGuests
  )?.percentage || 10;

  // State
  const [serviceCategories, setServiceCategories] = useState<CostCategory[]>([
    {
      id: 'cat-1',
      name: serviceCategoriesBySupplierType[supplierCategory]?.[0] || 'Services',
      items: [],
      subtotal: 0,
    },
  ]);
  
  const [logistics, setLogistics] = useState<LogisticsItem[]>([
    { id: 'log-1', type: 'delivery', description: 'Delivery to venue', cost: 0 },
    { id: 'log-2', type: 'setup', description: 'Setup and installation', cost: 0 },
    { id: 'log-3', type: 'collection', description: 'Collection/Strike', cost: 0, notes: 'Same day after event' },
  ]);
  
  const [contingencyPercentage, setContingencyPercentage] = useState(defaultContingency);
  const [refundableDeposit, setRefundableDeposit] = useState(0);
  const [additionalItems, setAdditionalItems] = useState<CostItem[]>([]);
  const [damagesDeductions, setDamagesDeductions] = useState(0);
  const [depositPaid, setDepositPaid] = useState(0);
  const [additionalInvoiceUrl, setAdditionalInvoiceUrl] = useState('');
  
  const [clientBanking, setClientBanking] = useState({
    accountHolder: '',
    bankName: '',
    accountNumber: '',
    branchCode: '',
    swiftCode: '',
    iban: '',
  });
  
  const [expandedSections, setExpandedSections] = useState({
    services: true,
    logistics: true,
    totals: true,
    additional: false,
    banking: false,
  });
  
  const [collectionTiming, setCollectionTiming] = useState('same-day');

  // Available service categories for this supplier type
  const availableCategories = serviceCategoriesBySupplierType[supplierCategory] || ['Services'];

  // Calculations
  const subtotal1 = useMemo(() => {
    return serviceCategories.reduce((sum, cat) => {
      return sum + cat.items.reduce((itemSum, item) => itemSum + (item.quantity * item.unitPrice), 0);
    }, 0);
  }, [serviceCategories]);

  const logisticsTotal = useMemo(() => {
    return logistics.reduce((sum, item) => sum + item.cost, 0);
  }, [logistics]);

  const subtotal2 = subtotal1 + logisticsTotal;

  const vatAmount = (subtotal2 * vatInfo.rate) / 100;

  const contingencyFee = (subtotal2 * contingencyPercentage) / 100;

  const subtotal3 = subtotal2 + vatAmount + contingencyFee + refundableDeposit;

  const additionalTotal = useMemo(() => {
    return additionalItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  }, [additionalItems]);

  const grandTotal = subtotal3 + additionalTotal - damagesDeductions;

  const balanceDue = grandTotal - depositPaid;

  const refundDue = refundableDeposit - damagesDeductions;

  // Handlers
  const addServiceCategory = () => {
    const newCat: CostCategory = {
      id: `cat-${Date.now()}`,
      name: availableCategories[serviceCategories.length % availableCategories.length] || 'New Category',
      items: [],
      subtotal: 0,
    };
    setServiceCategories([...serviceCategories, newCat]);
  };

  const removeServiceCategory = (catId: string) => {
    setServiceCategories(serviceCategories.filter(c => c.id !== catId));
  };

  const updateCategoryName = (catId: string, name: string) => {
    setServiceCategories(serviceCategories.map(c => 
      c.id === catId ? { ...c, name } : c
    ));
  };

  const addItemToCategory = (catId: string) => {
    const newItem: CostItem = {
      id: `item-${Date.now()}`,
      name: '',
      quantity: 1,
      unitPrice: 0,
      unit: 'each',
      total: 0,
    };
    setServiceCategories(serviceCategories.map(c =>
      c.id === catId ? { ...c, items: [...c.items, newItem] } : c
    ));
  };

  const updateItem = (catId: string, itemId: string, field: keyof CostItem, value: string | number) => {
    setServiceCategories(serviceCategories.map(c =>
      c.id === catId ? {
        ...c,
        items: c.items.map(item =>
          item.id === itemId ? { ...item, [field]: value } : item
        ),
      } : c
    ));
  };

  const removeItem = (catId: string, itemId: string) => {
    setServiceCategories(serviceCategories.map(c =>
      c.id === catId ? { ...c, items: c.items.filter(item => item.id !== itemId) } : c
    ));
  };

  const updateLogistics = (logId: string, field: keyof LogisticsItem, value: string | number) => {
    setLogistics(logistics.map(l =>
      l.id === logId ? { ...l, [field]: value } : l
    ));
  };

  const addAdditionalItem = () => {
    const newItem: CostItem = {
      id: `add-${Date.now()}`,
      name: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      unit: 'each',
      total: 0,
    };
    setAdditionalItems([...additionalItems, newItem]);
  };

  const updateAdditionalItem = (itemId: string, field: keyof CostItem, value: string | number) => {
    setAdditionalItems(additionalItems.map(item =>
      item.id === itemId ? { ...item, [field]: value } : item
    ));
  };

  const removeAdditionalItem = (itemId: string) => {
    setAdditionalItems(additionalItems.filter(item => item.id !== itemId));
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const formatCurrency = (amount: number) => {
    return `${currencySymbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleSave = () => {
    const workbookData: WorkbookData = {
      eventId,
      eventName,
      eventDate,
      clientName,
      clientEmail,
      supplierId,
      supplierName,
      supplierCategory,
      country,
      city,
      currency,
      vatRate: vatInfo.rate,
      serviceCategories,
      logistics,
      subtotal1,
      subtotal2,
      vatAmount,
      contingencyFee,
      contingencyPercentage,
      refundableDeposit,
      subtotal3,
      additionalItems,
      additionalTotal,
      damagesDeductions,
      grandTotal,
      depositPaid,
      balanceDue,
      refundDue,
      clientBanking: clientBanking.accountNumber ? clientBanking : undefined,
      additionalInvoiceUrl: additionalInvoiceUrl || undefined,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSave?.(workbookData);
  };

  const handleSendToSupplier = () => {
    handleSave();
    // This would trigger an email to the supplier
    onSendToSupplier?.({} as WorkbookData);
  };

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ backgroundColor: '#0B1426' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center">
                <FileText className="w-6 h-6 text-gold" />
              </div>
              <div>
                <h1 className="font-display text-3xl text-white">Supplier Workbook</h1>
                <p className="text-white/60 font-body text-sm">{supplierName} - {supplierCategory}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-body text-sm flex items-center gap-2 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Draft
            </button>
            <button
              onClick={handleSendToSupplier}
              className="px-4 py-2 bg-gradient-to-r from-gold-light via-gold to-gold-dark rounded-lg font-body text-sm flex items-center gap-2 transition-all hover:scale-105"
              style={{ color: '#0B1426' }}
            >
              <Send className="w-4 h-4" />
              Email to Supplier
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Event Info Banner */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-white/50 text-xs font-body uppercase tracking-wider">Event</p>
              <p className="text-white font-body">{eventName}</p>
            </div>
            <div>
              <p className="text-white/50 text-xs font-body uppercase tracking-wider">Date</p>
              <p className="text-white font-body">{eventDate}</p>
            </div>
            <div>
              <p className="text-white/50 text-xs font-body uppercase tracking-wider">Location</p>
              <p className="text-white font-body">{city}, {country}</p>
            </div>
            <div>
              <p className="text-white/50 text-xs font-body uppercase tracking-wider">Client</p>
              <p className="text-white font-body">{clientName}</p>
            </div>
          </div>
        </div>

        {/* Services Section */}
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden mb-6">
          <button
            onClick={() => toggleSection('services')}
            className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-gold" />
              <span className="text-white font-display text-lg">Service Costs</span>
              <span className="px-2 py-0.5 bg-gold/20 rounded text-gold text-xs font-body">
                Sub-total 1: {formatCurrency(subtotal1)}
              </span>
            </div>
            {expandedSections.services ? <ChevronUp className="w-5 h-5 text-white/50" /> : <ChevronDown className="w-5 h-5 text-white/50" />}
          </button>

          {expandedSections.services && (
            <div className="p-4 border-t border-white/10">
              {serviceCategories.map((category, catIndex) => (
                <div key={category.id} className="mb-6 last:mb-0">
                  <div className="flex items-center gap-3 mb-3">
                    <select
                      value={category.name}
                      onChange={(e) => updateCategoryName(category.id, e.target.value)}
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white font-body text-sm focus:outline-none focus:border-gold"
                    >
                      {availableCategories.map(cat => (
                        <option key={cat} value={cat} className="bg-navy">{cat}</option>
                      ))}
                    </select>
                    {serviceCategories.length > 1 && (
                      <button
                        onClick={() => removeServiceCategory(category.id)}
                        className="p-1.5 text-red-400 hover:bg-red-400/20 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Items Table */}
                  <div className="bg-white/5 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left p-3 text-white/50 text-xs font-body uppercase tracking-wider">Item</th>
                          <th className="text-center p-3 text-white/50 text-xs font-body uppercase tracking-wider w-20">Qty</th>
                          <th className="text-center p-3 text-white/50 text-xs font-body uppercase tracking-wider w-24">Unit</th>
                          <th className="text-right p-3 text-white/50 text-xs font-body uppercase tracking-wider w-32">Unit Price</th>
                          <th className="text-right p-3 text-white/50 text-xs font-body uppercase tracking-wider w-32">Total</th>
                          <th className="w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {category.items.map((item) => (
                          <tr key={item.id} className="border-b border-white/5">
                            <td className="p-2">
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => updateItem(category.id, item.id, 'name', e.target.value)}
                                placeholder="Item description"
                                className="w-full px-2 py-1.5 bg-transparent border border-white/10 rounded text-white font-body text-sm focus:outline-none focus:border-gold"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateItem(category.id, item.id, 'quantity', Number(e.target.value))}
                                min="1"
                                className="w-full px-2 py-1.5 bg-transparent border border-white/10 rounded text-white font-body text-sm text-center focus:outline-none focus:border-gold"
                              />
                            </td>
                            <td className="p-2">
                              <select
                                value={item.unit}
                                onChange={(e) => updateItem(category.id, item.id, 'unit', e.target.value)}
                                className="w-full px-2 py-1.5 bg-transparent border border-white/10 rounded text-white font-body text-sm focus:outline-none focus:border-gold"
                              >
                                <option value="each" className="bg-navy">each</option>
                                <option value="per person" className="bg-navy">per person</option>
                                <option value="per hour" className="bg-navy">per hour</option>
                                <option value="per day" className="bg-navy">per day</option>
                                <option value="set" className="bg-navy">set</option>
                                <option value="package" className="bg-navy">package</option>
                              </select>
                            </td>
                            <td className="p-2">
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-white/50 text-sm">{currencySymbol}</span>
                                <input
                                  type="number"
                                  value={item.unitPrice}
                                  onChange={(e) => updateItem(category.id, item.id, 'unitPrice', Number(e.target.value))}
                                  min="0"
                                  step="0.01"
                                  className="w-full pl-6 pr-2 py-1.5 bg-transparent border border-white/10 rounded text-white font-body text-sm text-right focus:outline-none focus:border-gold"
                                />
                              </div>
                            </td>
                            <td className="p-2 text-right">
                              <span className="text-gold font-body text-sm">
                                {formatCurrency(item.quantity * item.unitPrice)}
                              </span>
                            </td>
                            <td className="p-2">
                              <button
                                onClick={() => removeItem(category.id, item.id)}
                                className="p-1 text-red-400/50 hover:text-red-400 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <button
                      onClick={() => addItemToCategory(category.id)}
                      className="w-full p-3 text-white/50 hover:text-white hover:bg-white/5 transition-colors flex items-center justify-center gap-2 font-body text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add Item
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={addServiceCategory}
                className="w-full p-3 border border-dashed border-white/20 rounded-lg text-white/50 hover:text-white hover:border-white/40 transition-colors flex items-center justify-center gap-2 font-body text-sm mt-4"
              >
                <Plus className="w-4 h-4" />
                Add Service Category
              </button>
            </div>
          )}
        </div>

        {/* Logistics Section */}
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden mb-6">
          <button
            onClick={() => toggleSection('logistics')}
            className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Truck className="w-5 h-5 text-gold" />
              <span className="text-white font-display text-lg">Delivery, Setup & Collection</span>
              <span className="px-2 py-0.5 bg-gold/20 rounded text-gold text-xs font-body">
                Sub-total 2: {formatCurrency(subtotal2)}
              </span>
            </div>
            {expandedSections.logistics ? <ChevronUp className="w-5 h-5 text-white/50" /> : <ChevronDown className="w-5 h-5 text-white/50" />}
          </button>

          {expandedSections.logistics && (
            <div className="p-4 border-t border-white/10 space-y-4">
              {logistics.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <div className="w-24">
                    <span className="text-white/50 text-xs font-body uppercase tracking-wider capitalize">{item.type}</span>
                  </div>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateLogistics(item.id, 'description', e.target.value)}
                    placeholder="Description"
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-body text-sm focus:outline-none focus:border-gold"
                  />
                  <div className="relative w-32">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 text-sm">{currencySymbol}</span>
                    <input
                      type="number"
                      value={item.cost}
                      onChange={(e) => updateLogistics(item.id, 'cost', Number(e.target.value))}
                      min="0"
                      className="w-full pl-8 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-body text-sm text-right focus:outline-none focus:border-gold"
                    />
                  </div>
                </div>
              ))}

              {/* Collection Timing */}
              <div className="pt-4 border-t border-white/10">
                <label className="block text-white/50 text-xs font-body uppercase tracking-wider mb-2">Collection Timing</label>
                <select
                  value={collectionTiming}
                  onChange={(e) => setCollectionTiming(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-body text-sm focus:outline-none focus:border-gold"
                >
                  {collectionTimingOptions.map(option => (
                    <option key={option.id} value={option.id} className="bg-navy">
                      {option.label} - {option.description}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Totals Section */}
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden mb-6">
          <button
            onClick={() => toggleSection('totals')}
            className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Calculator className="w-5 h-5 text-gold" />
              <span className="text-white font-display text-lg">Totals & Deposits</span>
              <span className="px-2 py-0.5 bg-gold/20 rounded text-gold text-xs font-body">
                Sub-total 3: {formatCurrency(subtotal3)}
              </span>
            </div>
            {expandedSections.totals ? <ChevronUp className="w-5 h-5 text-white/50" /> : <ChevronDown className="w-5 h-5 text-white/50" />}
          </button>

          {expandedSections.totals && (
            <div className="p-4 border-t border-white/10">
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2">
                  <span className="text-white/70 font-body">Services Sub-total</span>
                  <span className="text-white font-body">{formatCurrency(subtotal1)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-white/70 font-body">Logistics (Delivery, Setup, Collection)</span>
                  <span className="text-white font-body">{formatCurrency(logisticsTotal)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-t border-white/10">
                  <span className="text-white font-body font-medium">Sub-total 2</span>
                  <span className="text-white font-body font-medium">{formatCurrency(subtotal2)}</span>
                </div>
                
                {/* VAT */}
                <div className="flex justify-between items-center py-2">
                  <span className="text-white/70 font-body">{vatInfo.name} ({vatInfo.rate}%)</span>
                  <span className="text-white font-body">{formatCurrency(vatAmount)}</span>
                </div>

                {/* Contingency */}
                <div className="flex justify-between items-center py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-white/70 font-body">Contingency Fee</span>
                    <input
                      type="number"
                      value={contingencyPercentage}
                      onChange={(e) => setContingencyPercentage(Number(e.target.value))}
                      min="0"
                      max="25"
                      step="0.5"
                      className="w-16 px-2 py-1 bg-white/10 border border-white/20 rounded text-white font-body text-sm text-center focus:outline-none focus:border-gold"
                    />
                    <span className="text-white/50 font-body text-sm">%</span>
                  </div>
                  <span className="text-white font-body">{formatCurrency(contingencyFee)}</span>
                </div>

                {/* Refundable Deposit */}
                <div className="flex justify-between items-center py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-white/70 font-body">Refundable Deposit</span>
                    <span className="text-white/40 text-xs">(for props/hire items)</span>
                  </div>
                  <div className="relative w-32">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 text-sm">{currencySymbol}</span>
                    <input
                      type="number"
                      value={refundableDeposit}
                      onChange={(e) => setRefundableDeposit(Number(e.target.value))}
                      min="0"
                      className="w-full pl-8 pr-3 py-1 bg-white/10 border border-white/20 rounded text-white font-body text-sm text-right focus:outline-none focus:border-gold"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center py-3 border-t border-white/10">
                  <span className="text-white font-display text-lg">Sub-total 3</span>
                  <span className="text-gold font-display text-xl">{formatCurrency(subtotal3)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Additional Items Section */}
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden mb-6">
          <button
            onClick={() => toggleSection('additional')}
            className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-gold" />
              <span className="text-white font-display text-lg">Additional Items / Damages</span>
              <span className="text-white/50 text-xs font-body">(Post-event adjustments)</span>
            </div>
            {expandedSections.additional ? <ChevronUp className="w-5 h-5 text-white/50" /> : <ChevronDown className="w-5 h-5 text-white/50" />}
          </button>

          {expandedSections.additional && (
            <div className="p-4 border-t border-white/10">
              <p className="text-white/50 text-sm font-body mb-4">
                Add any unaccounted items, damaged goods, or last-minute additions to the event
              </p>

              {additionalItems.length > 0 && (
                <div className="bg-white/5 rounded-lg overflow-hidden mb-4">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left p-3 text-white/50 text-xs font-body uppercase tracking-wider">Description</th>
                        <th className="text-center p-3 text-white/50 text-xs font-body uppercase tracking-wider w-20">Qty</th>
                        <th className="text-right p-3 text-white/50 text-xs font-body uppercase tracking-wider w-32">Amount</th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {additionalItems.map((item) => (
                        <tr key={item.id} className="border-b border-white/5">
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => updateAdditionalItem(item.id, 'name', e.target.value)}
                              placeholder="Item description"
                              className="w-full px-2 py-1.5 bg-transparent border border-white/10 rounded text-white font-body text-sm focus:outline-none focus:border-gold"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateAdditionalItem(item.id, 'quantity', Number(e.target.value))}
                              min="1"
                              className="w-full px-2 py-1.5 bg-transparent border border-white/10 rounded text-white font-body text-sm text-center focus:outline-none focus:border-gold"
                            />
                          </td>
                          <td className="p-2">
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-white/50 text-sm">{currencySymbol}</span>
                              <input
                                type="number"
                                value={item.unitPrice}
                                onChange={(e) => updateAdditionalItem(item.id, 'unitPrice', Number(e.target.value))}
                                min="0"
                                className="w-full pl-6 pr-2 py-1.5 bg-transparent border border-white/10 rounded text-white font-body text-sm text-right focus:outline-none focus:border-gold"
                              />
                            </div>
                          </td>
                          <td className="p-2">
                            <button
                              onClick={() => removeAdditionalItem(item.id)}
                              className="p-1 text-red-400/50 hover:text-red-400 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <button
                onClick={addAdditionalItem}
                className="w-full p-3 border border-dashed border-white/20 rounded-lg text-white/50 hover:text-white hover:border-white/40 transition-colors flex items-center justify-center gap-2 font-body text-sm mb-4"
              >
                <Plus className="w-4 h-4" />
                Add Additional Item
              </button>

              {/* Damages Deduction */}
              <div className="flex justify-between items-center py-3 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-white/70 font-body">Damages / Deductions from Deposit</span>
                </div>
                <div className="relative w-32">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 text-sm">{currencySymbol}</span>
                  <input
                    type="number"
                    value={damagesDeductions}
                    onChange={(e) => setDamagesDeductions(Number(e.target.value))}
                    min="0"
                    className="w-full pl-8 pr-3 py-1 bg-white/10 border border-white/20 rounded text-white font-body text-sm text-right focus:outline-none focus:border-gold"
                  />
                </div>
              </div>

              {/* Upload Additional Invoice */}
              <div className="pt-4 border-t border-white/10">
                <label className="block text-white/50 text-xs font-body uppercase tracking-wider mb-2">
                  Upload Additional Invoice (from accounting package)
                </label>
                <div className="flex gap-3">
                  <input
                    type="url"
                    value={additionalInvoiceUrl}
                    onChange={(e) => setAdditionalInvoiceUrl(e.target.value)}
                    placeholder="Paste invoice URL or upload"
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-body text-sm focus:outline-none focus:border-gold"
                  />
                  <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-body text-sm flex items-center gap-2 transition-colors">
                    <Upload className="w-4 h-4" />
                    Upload
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Final Totals */}
        <div className="bg-gradient-to-r from-gold/20 to-gold/5 border border-gold/30 rounded-xl p-6 mb-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-white/70 font-body">Sub-total 3</span>
              <span className="text-white font-body">{formatCurrency(subtotal3)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/70 font-body">Additional Items</span>
              <span className="text-white font-body">{formatCurrency(additionalTotal)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/70 font-body">Less: Damages/Deductions</span>
              <span className="text-red-400 font-body">-{formatCurrency(damagesDeductions)}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-t border-gold/30">
              <span className="text-white font-display text-xl">Grand Total</span>
              <span className="text-gold font-display text-2xl">{formatCurrency(grandTotal)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/70 font-body">Deposit Paid</span>
              <div className="relative w-40">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 text-sm">{currencySymbol}</span>
                <input
                  type="number"
                  value={depositPaid}
                  onChange={(e) => setDepositPaid(Number(e.target.value))}
                  min="0"
                  className="w-full pl-8 pr-3 py-1 bg-white/10 border border-white/20 rounded text-white font-body text-sm text-right focus:outline-none focus:border-gold"
                />
              </div>
            </div>
            <div className="flex justify-between items-center py-3 border-t border-gold/30">
              <span className="text-white font-display text-lg">Balance Due</span>
              <span className="text-white font-display text-xl">{formatCurrency(balanceDue)}</span>
            </div>
          </div>
        </div>

        {/* Refundable Deposit Section */}
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <h3 className="text-white font-display text-lg">Refundable Deposit Due to Client</h3>
          </div>
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-white/70 font-body">Original Deposit: {formatCurrency(refundableDeposit)}</p>
              <p className="text-white/70 font-body">Less Damages: -{formatCurrency(damagesDeductions)}</p>
            </div>
            <div className="text-right">
              <p className="text-green-400 font-display text-3xl">{formatCurrency(refundDue)}</p>
              <p className="text-white/50 text-sm font-body">to be refunded</p>
            </div>
          </div>
        </div>

        {/* Client Banking Details */}
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden mb-6">
          <button
            onClick={() => toggleSection('banking')}
            className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-gold" />
              <span className="text-white font-display text-lg">Client Banking Details</span>
              <span className="text-white/50 text-xs font-body">(for refund transfer)</span>
            </div>
            {expandedSections.banking ? <ChevronUp className="w-5 h-5 text-white/50" /> : <ChevronDown className="w-5 h-5 text-white/50" />}
          </button>

          {expandedSections.banking && (
            <div className="p-4 border-t border-white/10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/50 text-xs font-body uppercase tracking-wider mb-1">Account Holder Name</label>
                  <input
                    type="text"
                    value={clientBanking.accountHolder}
                    onChange={(e) => setClientBanking({ ...clientBanking, accountHolder: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-body text-sm focus:outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block text-white/50 text-xs font-body uppercase tracking-wider mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={clientBanking.bankName}
                    onChange={(e) => setClientBanking({ ...clientBanking, bankName: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-body text-sm focus:outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block text-white/50 text-xs font-body uppercase tracking-wider mb-1">Account Number</label>
                  <input
                    type="text"
                    value={clientBanking.accountNumber}
                    onChange={(e) => setClientBanking({ ...clientBanking, accountNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-body text-sm focus:outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block text-white/50 text-xs font-body uppercase tracking-wider mb-1">Branch Code</label>
                  <input
                    type="text"
                    value={clientBanking.branchCode}
                    onChange={(e) => setClientBanking({ ...clientBanking, branchCode: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-body text-sm focus:outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block text-white/50 text-xs font-body uppercase tracking-wider mb-1">SWIFT/BIC Code</label>
                  <input
                    type="text"
                    value={clientBanking.swiftCode}
                    onChange={(e) => setClientBanking({ ...clientBanking, swiftCode: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-body text-sm focus:outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block text-white/50 text-xs font-body uppercase tracking-wider mb-1">IBAN (if applicable)</label>
                  <input
                    type="text"
                    value={clientBanking.iban}
                    onChange={(e) => setClientBanking({ ...clientBanking, iban: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-body text-sm focus:outline-none focus:border-gold"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center">
          <button className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white font-body flex items-center gap-2 transition-colors">
            <Eye className="w-5 h-5" />
            Preview
          </button>
          <button className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white font-body flex items-center gap-2 transition-colors">
            <Download className="w-5 h-5" />
            Download PDF
          </button>
          <button className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white font-body flex items-center gap-2 transition-colors">
            <Printer className="w-5 h-5" />
            Print
          </button>
          <button
            onClick={handleSendToSupplier}
            className="px-6 py-3 bg-gradient-to-r from-gold-light via-gold to-gold-dark rounded-lg font-body flex items-center gap-2 transition-all hover:scale-105"
            style={{ color: '#0B1426' }}
          >
            <Mail className="w-5 h-5" />
            Email Workbook to Supplier
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupplierWorkbook;
