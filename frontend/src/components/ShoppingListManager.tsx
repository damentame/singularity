import React, { useState } from 'react';
import {
  Plus, Trash2, ChevronDown, ChevronRight, ShoppingCart, Package,
  Store, Calendar, DollarSign, X, FileText
} from 'lucide-react';
import {
  useEventContext,
  PlannerEvent,
  ShoppingList,
  ShoppingListItem,
  ShoppingListStatus,
  ShoppingItemStatus,
  PurchaseType,
  SHOPPING_LIST_STATUS_LABELS,
  SHOPPING_ITEM_STATUS_LABELS,
  PURCHASE_TYPE_LABELS,
} from '@/contexts/EventContext';

const GOLD = '#C9A24A';
const fmt = (n: number) => 'R ' + n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const LIST_STATUS_COLORS: Record<ShoppingListStatus, string> = {
  DRAFT: '#9CA3AF',
  APPROVED: '#3B82F6',
  ORDERED: '#F59E0B',
  RECEIVED: '#22C55E',
  CLOSED: '#6B7280',
};

const ITEM_STATUS_COLORS: Record<ShoppingItemStatus, string> = {
  NEEDED: '#F59E0B',
  ORDERED: '#3B82F6',
  RECEIVED: '#22C55E',
  CANCELLED: '#EF4444',
};

interface ShoppingListManagerProps {
  event: PlannerEvent;
}

const ShoppingListManager: React.FC<ShoppingListManagerProps> = ({ event }) => {
  const {
    addShoppingList, updateShoppingList, removeShoppingList,
    addShoppingListItem, updateShoppingListItem, removeShoppingListItem,
  } = useEventContext();

  const lists = event.shoppingLists || [];
  const [expandedList, setExpandedList] = useState<string | null>(lists.length > 0 ? lists[0].id : null);
  const [showAddList, setShowAddList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [addingItemTo, setAddingItemTo] = useState<string | null>(null);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemCost, setNewItemCost] = useState(0);
  const [newItemType, setNewItemType] = useState<PurchaseType>('BUY');

  const handleAddList = () => {
    if (!newListName.trim()) return;
    const id = addShoppingList(event.id, {
      eventId: event.id,
      programId: '',
      listName: newListName.trim(),
      status: 'DRAFT',
      supplierName: '',
      currency: 'ZAR',
      totalEstimate: 0,
      notes: '',
    });
    setNewListName('');
    setShowAddList(false);
    setExpandedList(id);
  };

  const handleAddItem = (listId: string) => {
    if (!newItemTitle.trim()) return;
    addShoppingListItem(event.id, listId, {
      shoppingListId: listId,
      sourceLineItemId: '',
      productId: '',
      titleSnapshot: newItemTitle.trim(),
      quantity: newItemQty,
      unitTypeSnapshot: 'EACH',
      estimatedUnitCost: newItemCost,
      estimatedTotalCost: newItemCost * newItemQty,
      purchaseType: newItemType,
      storeOrVendor: '',
      requiredByDate: event.date || '',
      specLinkIds: [],
      notes: '',
      status: 'NEEDED',
    });
    setNewItemTitle('');
    setNewItemQty(1);
    setNewItemCost(0);
    setNewItemType('BUY');
    setAddingItemTo(null);
  };

  return (
    <div className="bg-white rounded-2xl border p-6" style={{ borderColor: 'rgba(201,162,74,0.15)' }}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: GOLD }}>
          <ShoppingCart className="w-3.5 h-3.5 inline mr-1.5" />
          Shopping Lists
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400">{lists.length} list{lists.length !== 1 ? 's' : ''}</span>
          <button
            onClick={() => setShowAddList(!showAddList)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium border transition-all hover:shadow-sm"
            style={{ borderColor: 'rgba(201,162,74,0.2)', color: GOLD }}
          >
            <Plus className="w-3 h-3" /> New List
          </button>
        </div>
      </div>
      <div className="h-px mb-4" style={{ backgroundColor: 'rgba(201,162,74,0.1)' }} />

      {/* Add List Form */}
      {showAddList && (
        <div className="mb-4 p-3 rounded-xl border flex items-center gap-2" style={{ borderColor: 'rgba(201,162,74,0.15)', backgroundColor: '#FAFAF7' }}>
          <input
            type="text"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="List name (e.g. Day 1 – Florals)..."
            className="flex-1 px-3 py-2 rounded-lg border text-xs outline-none"
            style={{ borderColor: '#EFEFEF', color: '#1A1A1A' }}
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddList(); }}
          />
          <button onClick={handleAddList} className="px-3 py-2 rounded-lg text-[10px] font-medium" style={{ backgroundColor: GOLD, color: '#FFF' }}>
            Create
          </button>
          <button onClick={() => setShowAddList(false)} className="px-2 py-2 text-[10px] text-gray-400">Cancel</button>
        </div>
      )}

      {/* Lists */}
      {lists.length === 0 ? (
        <div className="text-center py-8">
          <ShoppingCart className="w-8 h-8 mx-auto mb-2" style={{ color: 'rgba(201,162,74,0.2)' }} />
          <p className="text-xs text-gray-400">No shopping lists yet.</p>
          <p className="text-[10px] text-gray-300 mt-1">Create a list or generate one from a Sales Order.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {lists.map(list => {
            const isExpanded = expandedList === list.id;
            const statusColor = LIST_STATUS_COLORS[list.status];
            const itemCount = list.items.length;
            const receivedCount = list.items.filter(i => i.status === 'RECEIVED').length;

            return (
              <div key={list.id} className="rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(201,162,74,0.1)' }}>
                {/* List Header */}
                <button
                  onClick={() => setExpandedList(isExpanded ? null : list.id)}
                  className="w-full flex items-center justify-between px-4 py-3 transition-colors hover:bg-black/[0.02]"
                  style={{ backgroundColor: isExpanded ? '#FAFAF7' : '#FFF' }}
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5" style={{ color: GOLD }} /> : <ChevronRight className="w-3.5 h-3.5" style={{ color: GOLD }} />}
                    <span className="text-xs font-medium" style={{ color: '#1A1A1A' }}>{list.listName}</span>
                    <span className="text-[9px] text-gray-400">({receivedCount}/{itemCount})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">{fmt(list.totalEstimate)}</span>
                    <select
                      value={list.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => { e.stopPropagation(); updateShoppingList(event.id, list.id, { status: e.target.value as ShoppingListStatus }); }}
                      className="text-[9px] px-2 py-0.5 rounded-full font-medium border-0 outline-none cursor-pointer"
                      style={{ backgroundColor: `${statusColor}15`, color: statusColor }}
                    >
                      {Object.entries(SHOPPING_LIST_STATUS_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeShoppingList(event.id, list.id); }}
                      className="p-1 rounded hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3 h-3 text-gray-300 hover:text-red-400" />
                    </button>
                  </div>
                </button>

                {/* List Items */}
                {isExpanded && (
                  <div className="bg-white border-t" style={{ borderColor: 'rgba(201,162,74,0.08)' }}>
                    {/* Items Header */}
                    <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[9px] uppercase tracking-wider text-gray-400 border-b" style={{ borderColor: 'rgba(0,0,0,0.04)' }}>
                      <div className="col-span-3">Item</div>
                      <div className="col-span-1 text-center">Qty</div>
                      <div className="col-span-1 text-right">Unit</div>
                      <div className="col-span-2 text-right">Total</div>
                      <div className="col-span-2">Type</div>
                      <div className="col-span-2">Status</div>
                      <div className="col-span-1"></div>
                    </div>

                    {list.items.map(item => {
                      const isc = ITEM_STATUS_COLORS[item.status];
                      return (
                        <div key={item.id} className="grid grid-cols-12 gap-2 px-4 py-2 items-center border-b hover:bg-gray-50/50" style={{ borderColor: 'rgba(0,0,0,0.03)' }}>
                          <div className="col-span-3 text-xs truncate" style={{ color: '#1A1A1A' }}>{item.titleSnapshot}</div>
                          <div className="col-span-1 text-center">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => {
                                const qty = Math.max(0, Number(e.target.value));
                                updateShoppingListItem(event.id, list.id, item.id, { quantity: qty, estimatedTotalCost: qty * item.estimatedUnitCost });
                              }}
                              className="w-12 h-6 text-[10px] text-center rounded border px-1 outline-none"
                              style={{ borderColor: '#EFEFEF' }}
                            />
                          </div>
                          <div className="col-span-1 text-right text-[10px] text-gray-500">{fmt(item.estimatedUnitCost)}</div>
                          <div className="col-span-2 text-right text-[10px] font-medium" style={{ color: '#1A1A1A' }}>{fmt(item.estimatedTotalCost)}</div>
                          <div className="col-span-2">
                            <select
                              value={item.purchaseType}
                              onChange={(e) => updateShoppingListItem(event.id, list.id, item.id, { purchaseType: e.target.value as PurchaseType })}
                              className="h-6 text-[10px] rounded border px-1 outline-none w-full"
                              style={{ borderColor: '#EFEFEF' }}
                            >
                              {Object.entries(PURCHASE_TYPE_LABELS).map(([k, v]) => (
                                <option key={k} value={k}>{v}</option>
                              ))}
                            </select>
                          </div>
                          <div className="col-span-2">
                            <select
                              value={item.status}
                              onChange={(e) => updateShoppingListItem(event.id, list.id, item.id, { status: e.target.value as ShoppingItemStatus })}
                              className="h-6 text-[9px] rounded-full px-2 outline-none font-medium border-0 cursor-pointer w-full"
                              style={{ backgroundColor: `${isc}15`, color: isc }}
                            >
                              {Object.entries(SHOPPING_ITEM_STATUS_LABELS).map(([k, v]) => (
                                <option key={k} value={k}>{v}</option>
                              ))}
                            </select>
                          </div>
                          <div className="col-span-1 flex justify-end">
                            <button
                              onClick={() => removeShoppingListItem(event.id, list.id, item.id)}
                              className="p-1 rounded hover:bg-red-50"
                            >
                              <Trash2 className="w-3 h-3 text-gray-300 hover:text-red-400" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Add Item */}
                    <div className="px-4 py-2">
                      {addingItemTo === list.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={newItemTitle}
                            onChange={(e) => setNewItemTitle(e.target.value)}
                            placeholder="Item name..."
                            className="flex-1 h-7 text-xs rounded-md border px-2 outline-none"
                            style={{ borderColor: GOLD }}
                            autoFocus
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddItem(list.id); }}
                          />
                          <input
                            type="number"
                            value={newItemQty}
                            onChange={(e) => setNewItemQty(Math.max(1, Number(e.target.value)))}
                            className="w-14 h-7 text-xs text-center rounded-md border px-1 outline-none"
                            style={{ borderColor: '#EFEFEF' }}
                            placeholder="Qty"
                          />
                          <input
                            type="number"
                            value={newItemCost}
                            onChange={(e) => setNewItemCost(Math.max(0, Number(e.target.value)))}
                            className="w-20 h-7 text-xs text-right rounded-md border px-1 outline-none"
                            style={{ borderColor: '#EFEFEF' }}
                            placeholder="Unit cost"
                          />
                          <button onClick={() => handleAddItem(list.id)} className="px-3 h-7 rounded-md text-xs font-medium" style={{ backgroundColor: GOLD, color: '#FFF' }}>
                            Add
                          </button>
                          <button onClick={() => setAddingItemTo(null)} className="px-2 h-7 text-xs text-gray-400">Cancel</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAddingItemTo(list.id)}
                          className="flex items-center gap-1.5 text-xs transition-colors hover:opacity-70"
                          style={{ color: GOLD }}
                        >
                          <Plus className="w-3 h-3" /> Add item
                        </button>
                      )}
                    </div>

                    {/* List Notes */}
                    <div className="px-4 py-2 border-t" style={{ borderColor: 'rgba(0,0,0,0.04)' }}>
                      <input
                        type="text"
                        value={list.notes}
                        onChange={(e) => updateShoppingList(event.id, list.id, { notes: e.target.value })}
                        placeholder="List notes..."
                        className="w-full text-[10px] text-gray-400 outline-none bg-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ShoppingListManager;
