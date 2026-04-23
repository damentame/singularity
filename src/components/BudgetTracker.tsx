import React, { useState, useEffect } from 'react';
import { Plus, Trash2, DollarSign, TrendingUp, TrendingDown, PieChart, Download, Upload, Cloud } from 'lucide-react';

interface BudgetItem {
  id: string;
  category: string;
  description: string;
  estimatedCost: number;
  actualCost: number;
  paid: boolean;
  supplierId?: string;
  supplierName?: string;
}

interface BudgetData {
  items: BudgetItem[];
  totalBudget: number;
  currencyCode: string;
}

const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
];

const defaultCategories = [
  'Venue',
  'Catering',
  'Photography',
  'Videography',
  'Music & Entertainment',
  'Flowers & Decor',
  'Wedding Dress',
  'Suits & Attire',
  'Hair & Makeup',
  'Transportation',
  'Invitations',
  'Cake',
  'Favors',
  'Accommodation',
  'Honeymoon',
  'Miscellaneous',
];

const STORAGE_KEY = 'theone_budget_data';

const BudgetTracker: React.FC = () => {
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    category: 'Venue',
    description: '',
    estimatedCost: 0,
    actualCost: 0,
  });

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setBudgetData(JSON.parse(saved));
      } else {
        // Try to migrate from old localStorage format
        const savedItems = localStorage.getItem('theone_budget');
        const savedCurrency = localStorage.getItem('theone_currency');
        const savedTotalBudget = localStorage.getItem('theone_total_budget');
        
        setBudgetData({
          items: savedItems ? JSON.parse(savedItems) : [],
          totalBudget: savedTotalBudget ? Number(savedTotalBudget) : 50000,
          currencyCode: savedCurrency || 'USD',
        });
      }
    } catch {
      setBudgetData({ items: [], totalBudget: 50000, currencyCode: 'USD' });
    }
  }, []);

  // Save to localStorage whenever budgetData changes
  useEffect(() => {
    if (budgetData !== null) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(budgetData));
        setLastSaved(new Date());
      } catch (e) {
        console.error('Failed to save budget data:', e);
      }
    }
  }, [budgetData]);


  const items = budgetData?.items || [];
  const totalBudget = budgetData?.totalBudget || 50000;
  const currencyCode = budgetData?.currencyCode || 'USD';
  const currency = currencies.find(c => c.code === currencyCode) || currencies[0];

  const setItems = (newItems: BudgetItem[] | ((prev: BudgetItem[]) => BudgetItem[])) => {
    if (typeof setBudgetData !== 'function') {
      console.warn('BudgetTracker: setBudgetData is not available (setItems)');
      return;
    }
    setBudgetData(prev => ({
      ...prev!,
      items: typeof newItems === 'function' ? newItems(prev?.items || []) : newItems,
    }));
  };

  const setTotalBudget = (newBudget: number) => {
    if (typeof setBudgetData !== 'function') {
      console.warn('BudgetTracker: setBudgetData is not available (setTotalBudget)');
      return;
    }
    setBudgetData(prev => ({
      ...prev!,
      totalBudget: newBudget,
    }));
  };

  const setCurrency = (newCurrency: typeof currencies[0]) => {
    if (typeof setBudgetData !== 'function') {
      console.warn('BudgetTracker: setBudgetData is not available (setCurrency)');
      return;
    }
    setBudgetData(prev => ({
      ...prev!,
      currencyCode: newCurrency.code,
    }));
  };


  const addItem = () => {
    if (!newItem.description.trim()) return;
    const item: BudgetItem = {
      id: `budget-${Date.now()}`,
      ...newItem,
      paid: false,
    };
    setItems(prev => [...prev, item]);
    setNewItem({ category: 'Venue', description: '', estimatedCost: 0, actualCost: 0 });
    setShowAddForm(false);
  };

  const updateItem = (id: string, updates: Partial<BudgetItem>) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const totalEstimated = items.reduce((sum, item) => sum + item.estimatedCost, 0);
  const totalActual = items.reduce((sum, item) => sum + item.actualCost, 0);
  const totalPaid = items.filter(i => i.paid).reduce((sum, item) => sum + item.actualCost, 0);
  const remaining = totalBudget - totalActual;

  const categoryTotals = defaultCategories.map(category => ({
    category,
    estimated: items.filter(i => i.category === category).reduce((sum, i) => sum + i.estimatedCost, 0),
    actual: items.filter(i => i.category === category).reduce((sum, i) => sum + i.actualCost, 0),
  })).filter(c => c.estimated > 0 || c.actual > 0);

  const formatCurrency = (amount: number) => {
    return `${currency.symbol}${amount.toLocaleString()}`;
  };

  const exportBudget = () => {
    const data = {
      currency: currency.code,
      totalBudget,
      items,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wedding-budget.json';
    a.click();
  };

  // Null guard: show loading skeleton while budgetData is initializing
  if (!budgetData) {
    return (
      <div className="min-h-screen pt-24 pb-16" style={{ backgroundColor: '#0B1426' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <div className="h-12 w-64 bg-white/[0.05] rounded-lg animate-pulse mb-4" />
            <div className="h-6 w-96 bg-white/[0.05] rounded-lg animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
                <div className="h-10 w-10 rounded-full bg-white/[0.05] animate-pulse mb-3" />
                <div className="h-8 w-32 bg-white/[0.05] rounded-lg animate-pulse mb-2" />
                <div className="h-4 w-20 bg-white/[0.05] rounded animate-pulse" />
              </div>
            ))}
          </div>
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
            <div className="h-4 bg-white/[0.05] rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (

    <div className="min-h-screen pt-24 pb-16" style={{ backgroundColor: '#0B1426' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-10">
          <div>
            <h1 className="font-display text-4xl md:text-5xl font-normal tracking-[0.04em] mb-4" style={{ color: '#FFFFFF' }}>
              Budget Tracker
            </h1>
            <p className="font-body text-lg" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Track every expense and stay within budget
            </p>
          </div>
          <div className="flex gap-3 items-center">
            {lastSaved && (
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <Cloud className="w-4 h-4" />
                <span>Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            )}
            <select
              id="currency-select"
              name="currency-select"
              value={currency.code}
              onChange={(e) => {
                const curr = currencies.find(c => c.code === e.target.value);
                if (curr) setCurrency(curr);
              }}
              className="px-4 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg font-body text-white focus:outline-none focus:border-gold/50"
            >
              {currencies.map(c => (
                <option key={c.code} value={c.code} className="bg-navy">{c.code} - {c.name}</option>
              ))}
            </select>
            <button
              onClick={exportBudget}
              className="px-4 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg font-body text-white hover:bg-white/[0.1] transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Budget Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-gold" />
              </div>
              <span className="font-body text-caption uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>Total Budget</span>
            </div>
            <input
              type="number"
              id="total-budget"
              name="total-budget"
              value={totalBudget}
              onChange={(e) => setTotalBudget(Number(e.target.value))}
              className="font-display text-3xl bg-transparent border-none outline-none w-full focus:outline-none"
              style={{ color: '#FFFFFF' }}
            />
            <p className="font-body text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Click to edit</p>
          </div>
          
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <PieChart className="w-5 h-5 text-blue-400" />
              </div>
              <span className="font-body text-caption uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>Spent</span>
            </div>
            <p className="font-display text-3xl" style={{ color: '#FFFFFF' }}>{formatCurrency(totalActual)}</p>
            <p className="font-body text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {Math.round((totalActual / totalBudget) * 100)}% of budget
            </p>
          </div>
          
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${remaining >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                {remaining >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-green-400" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-400" />
                )}
              </div>
              <span className="font-body text-caption uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>Remaining</span>
            </div>
            <p className="font-display text-3xl" style={{ color: remaining >= 0 ? '#22c55e' : '#ef4444' }}>
              {formatCurrency(Math.abs(remaining))}
            </p>
            <p className="font-body text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {remaining >= 0 ? 'Under budget' : 'Over budget'}
            </p>
          </div>
          
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-purple-400" />
              </div>
              <span className="font-body text-caption uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>Paid</span>
            </div>
            <p className="font-display text-3xl text-gold">{formatCurrency(totalPaid)}</p>
            <p className="font-body text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {formatCurrency(totalActual - totalPaid)} outstanding
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 mb-10">
          <div className="flex justify-between mb-3">
            <span className="font-body" style={{ color: 'rgba(255,255,255,0.7)' }}>Budget Usage</span>
            <span className="font-body text-gold">{Math.round((totalActual / totalBudget) * 100)}%</span>
          </div>
          <div className="h-4 bg-white/[0.1] rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                totalActual / totalBudget > 1 ? 'bg-red-500' : 
                totalActual / totalBudget > 0.9 ? 'bg-yellow-500' : 
                'bg-gradient-to-r from-gold-light via-gold to-gold-dark'
              }`}
              style={{ width: `${Math.min((totalActual / totalBudget) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Add Item Button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display text-2xl" style={{ color: '#FFFFFF' }}>Expenses</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-5 py-2.5 bg-gradient-to-r from-gold-light via-gold to-gold-dark rounded-lg font-body font-medium text-nav uppercase flex items-center gap-2"
            style={{ color: '#0B1426' }}
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="bg-white/[0.03] border border-gold/20 rounded-2xl p-6 mb-8 animate-fadeIn">
            <h3 className="font-display text-xl mb-4" style={{ color: '#FFFFFF' }}>Add New Expense</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <select
                id="expense-category"
                name="expense-category"
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                className="px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-lg font-body text-white focus:outline-none focus:border-gold/50"
              >
                {defaultCategories.map(cat => (
                  <option key={cat} value={cat} className="bg-navy">{cat}</option>
                ))}
              </select>
              <input
                type="text"
                id="expense-description"
                name="expense-description"
                placeholder="Description"
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                className="px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-lg font-body text-white placeholder-white/40 focus:outline-none focus:border-gold/50"
                autoComplete="off"
              />
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">{currency.symbol}</span>
                <input
                  type="number"
                  id="expense-estimated"
                  name="expense-estimated"
                  placeholder="Estimated Cost"
                  value={newItem.estimatedCost || ''}
                  onChange={(e) => setNewItem({ ...newItem, estimatedCost: Number(e.target.value) })}
                  className="w-full pl-10 pr-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-lg font-body text-white placeholder-white/40 focus:outline-none focus:border-gold/50"
                />
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">{currency.symbol}</span>
                <input
                  type="number"
                  id="expense-actual"
                  name="expense-actual"
                  placeholder="Actual Cost"
                  value={newItem.actualCost || ''}
                  onChange={(e) => setNewItem({ ...newItem, actualCost: Number(e.target.value) })}
                  className="w-full pl-10 pr-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-lg font-body text-white placeholder-white/40 focus:outline-none focus:border-gold/50"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={addItem} className="px-6 py-3 bg-gold text-navy rounded-lg font-body font-medium">
                Add Expense
              </button>
              <button onClick={() => setShowAddForm(false)} className="px-6 py-3 bg-white/[0.05] text-white rounded-lg font-body">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Expenses Table */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  <th className="px-6 py-4 text-left font-body text-caption uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>Category</th>
                  <th className="px-6 py-4 text-left font-body text-caption uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>Description</th>
                  <th className="px-6 py-4 text-right font-body text-caption uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>Estimated</th>
                  <th className="px-6 py-4 text-right font-body text-caption uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>Actual</th>
                  <th className="px-6 py-4 text-center font-body text-caption uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>Paid</th>
                  <th className="px-6 py-4 text-right font-body text-caption uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className="border-b border-white/[0.05] hover:bg-white/[0.02]">
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-xs font-body bg-gold/20 text-gold">{item.category}</span>
                    </td>
                    <td className="px-6 py-4 font-body" style={{ color: '#FFFFFF' }}>{item.description}</td>
                    <td className="px-6 py-4 text-right font-body" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      {formatCurrency(item.estimatedCost)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <input
                        type="number"
                        id={`actual-cost-${item.id}`}
                        name={`actual-cost-${item.id}`}
                        value={item.actualCost}
                        onChange={(e) => updateItem(item.id, { actualCost: Number(e.target.value) })}
                        className="w-24 px-2 py-1 bg-white/[0.05] border border-white/[0.1] rounded text-right font-body text-white focus:outline-none focus:border-gold/50"
                      />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => updateItem(item.id, { paid: !item.paid })}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mx-auto transition-colors ${
                          item.paid ? 'bg-green-500 border-green-500' : 'border-white/30 hover:border-gold'
                        }`}
                        aria-label={item.paid ? 'Mark as unpaid' : 'Mark as paid'}
                      >
                        {item.paid && <span className="text-white text-xs">✓</span>}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-red-400 hover:text-red-300"
                        aria-label="Delete expense"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <p className="font-body" style={{ color: 'rgba(255,255,255,0.4)' }}>No expenses added yet</p>
                    </td>
                  </tr>
                )}
              </tbody>
              {items.length > 0 && (
                <tfoot className="border-t border-white/[0.1]">
                  <tr>
                    <td colSpan={2} className="px-6 py-4 font-display text-lg" style={{ color: '#FFFFFF' }}>Total</td>
                    <td className="px-6 py-4 text-right font-display text-lg" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      {formatCurrency(totalEstimated)}
                    </td>
                    <td className="px-6 py-4 text-right font-display text-lg text-gold">
                      {formatCurrency(totalActual)}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Category Breakdown */}
        {categoryTotals.length > 0 && (
          <div className="mt-10">
            <h2 className="font-display text-2xl mb-6" style={{ color: '#FFFFFF' }}>Category Breakdown</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryTotals.map(cat => (
                <div key={cat.category} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
                  <p className="font-body text-sm mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>{cat.category}</p>
                  <div className="flex justify-between items-end">
                    <p className="font-display text-xl" style={{ color: '#FFFFFF' }}>{formatCurrency(cat.actual)}</p>
                    <p className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      of {formatCurrency(cat.estimated)}
                    </p>
                  </div>
                  <div className="h-2 bg-white/[0.1] rounded-full mt-3 overflow-hidden">
                    <div 
                      className="h-full bg-gold rounded-full"
                      style={{ width: `${Math.min((cat.actual / cat.estimated) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetTracker;
