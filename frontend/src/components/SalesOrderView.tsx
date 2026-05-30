import React, { useState } from 'react';
import {
  FileText, ShoppingCart, Package, ChevronDown, ChevronRight, Layers,
  CheckCircle2, Clock, Truck, Receipt, X
} from 'lucide-react';
import {
  useEventContext,
  PlannerEvent,
  SalesOrder,
  SalesOrderStatus,
  SALES_ORDER_STATUS_LABELS,
  CATEGORY_LABELS,
  ItemCategory,
} from '@/contexts/EventContext';
import { toast } from '@/components/ui/use-toast';

const GOLD = '#C9A24A';
const fmt = (n: number) => 'R ' + n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const SO_STATUS_COLORS: Record<SalesOrderStatus, string> = {
  DRAFT: '#9CA3AF',
  CONFIRMED: '#3B82F6',
  IN_PROGRESS: '#F59E0B',
  DELIVERED: '#8B5CF6',
  INVOICED: '#059669',
  CLOSED: '#6B7280',
};

const SO_STATUS_ICONS: Record<SalesOrderStatus, React.ReactNode> = {
  DRAFT: <FileText className="w-3.5 h-3.5" />,
  CONFIRMED: <CheckCircle2 className="w-3.5 h-3.5" />,
  IN_PROGRESS: <Clock className="w-3.5 h-3.5" />,
  DELIVERED: <Truck className="w-3.5 h-3.5" />,
  INVOICED: <Receipt className="w-3.5 h-3.5" />,
  CLOSED: <Package className="w-3.5 h-3.5" />,
};

interface SalesOrderViewProps {
  event: PlannerEvent;
}

const SalesOrderView: React.FC<SalesOrderViewProps> = ({ event }) => {
  const { acceptProposal, updateSalesOrder, generateShoppingListFromSO } = useEventContext();
  const salesOrders = event.salesOrders || [];
  const [expandedSO, setExpandedSO] = useState<string | null>(salesOrders.length > 0 ? salesOrders[0].id : null);

  const handleAcceptProposal = () => {
    const soId = acceptProposal(event.id);
    if (soId) {
      setExpandedSO(soId);
      toast({ title: 'Sales Order Created', description: 'Proposal accepted and sales order generated with snapshot pricing.' });
    }
  };

  const handleGenerateShoppingList = (soId: string) => {
    const listId = generateShoppingListFromSO(event.id, soId);
    if (listId) {
      toast({ title: 'Shopping List Generated', description: 'A procurement list has been created from this sales order.' });
    }
  };

  return (
    <div className="bg-white rounded-2xl border p-6" style={{ borderColor: 'rgba(201,162,74,0.15)' }}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: GOLD }}>
          <Receipt className="w-3.5 h-3.5 inline mr-1.5" />
          Sales Orders
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400">{salesOrders.length} order{salesOrders.length !== 1 ? 's' : ''}</span>
          <button
            onClick={handleAcceptProposal}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all hover:shadow-md"
            style={{ backgroundColor: GOLD, color: '#FFF' }}
          >
            <CheckCircle2 className="w-3 h-3" /> Accept Proposal
          </button>
        </div>
      </div>
      <div className="h-px mb-4" style={{ backgroundColor: 'rgba(201,162,74,0.1)' }} />

      {/* Workflow Pipeline */}
      <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
        {(['DRAFT', 'CONFIRMED', 'IN_PROGRESS', 'DELIVERED', 'INVOICED', 'CLOSED'] as SalesOrderStatus[]).map((status, i) => {
          const color = SO_STATUS_COLORS[status];
          const count = salesOrders.filter(so => so.status === status).length;
          return (
            <React.Fragment key={status}>
              {i > 0 && <div className="w-4 h-px bg-gray-200 flex-shrink-0" />}
              <div
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-medium flex-shrink-0"
                style={{ backgroundColor: count > 0 ? `${color}15` : 'rgba(0,0,0,0.03)', color: count > 0 ? color : '#CCC' }}
              >
                {SO_STATUS_ICONS[status]}
                {SALES_ORDER_STATUS_LABELS[status]}
                {count > 0 && <span className="ml-0.5">({count})</span>}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Orders */}
      {salesOrders.length === 0 ? (
        <div className="text-center py-8">
          <Receipt className="w-8 h-8 mx-auto mb-2" style={{ color: 'rgba(201,162,74,0.2)' }} />
          <p className="text-xs text-gray-400">No sales orders yet.</p>
          <p className="text-[10px] text-gray-300 mt-1">Accept a proposal to create a sales order with snapshot pricing.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {salesOrders.map(so => {
            const isExpanded = expandedSO === so.id;
            const statusColor = SO_STATUS_COLORS[so.status];

            // Group items by category
            const grouped: Partial<Record<ItemCategory, typeof so.items>> = {};
            so.items.forEach(item => {
              if (!grouped[item.category]) grouped[item.category] = [];
              grouped[item.category]!.push(item);
            });

            return (
              <div key={so.id} className="rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(201,162,74,0.1)' }}>
                {/* SO Header */}
                <button
                  onClick={() => setExpandedSO(isExpanded ? null : so.id)}
                  className="w-full flex items-center justify-between px-4 py-3 transition-colors hover:bg-black/[0.02]"
                  style={{ backgroundColor: isExpanded ? '#FAFAF7' : '#FFF' }}
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5" style={{ color: GOLD }} /> : <ChevronRight className="w-3.5 h-3.5" style={{ color: GOLD }} />}
                    <span className="text-xs font-mono font-medium" style={{ color: '#1A1A1A' }}>{so.orderNumber}</span>
                    <span className="text-[9px] text-gray-400">v{so.snapshotVersion} · {so.items.length} items</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium" style={{ color: '#1A1A1A' }}>{fmt(so.totalAmount)}</span>
                    <select
                      value={so.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => { e.stopPropagation(); updateSalesOrder(event.id, so.id, { status: e.target.value as SalesOrderStatus }); }}
                      className="text-[9px] px-2 py-0.5 rounded-full font-medium border-0 outline-none cursor-pointer"
                      style={{ backgroundColor: `${statusColor}15`, color: statusColor }}
                    >
                      {Object.entries(SALES_ORDER_STATUS_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                </button>

                {/* SO Body */}
                {isExpanded && (
                  <div className="bg-white border-t px-4 py-3" style={{ borderColor: 'rgba(201,162,74,0.08)' }}>
                    {/* Actions */}
                    <div className="flex items-center gap-2 mb-3">
                      <button
                        onClick={() => handleGenerateShoppingList(so.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium border transition-all hover:shadow-sm"
                        style={{ borderColor: 'rgba(201,162,74,0.2)', color: GOLD }}
                      >
                        <ShoppingCart className="w-3 h-3" /> Generate Shopping List
                      </button>
                      <span className="text-[9px] text-gray-400">
                        Created {new Date(so.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    {/* Items by Category */}
                    {Object.entries(grouped).map(([cat, items]) => (
                      <div key={cat} className="mb-3">
                        <div className="flex items-center justify-between mb-1.5 pb-1 border-b" style={{ borderColor: 'rgba(201,162,74,0.08)' }}>
                          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#888' }}>
                            {CATEGORY_LABELS[cat as ItemCategory] || cat}
                          </span>
                          <span className="text-[10px]" style={{ color: GOLD }}>
                            {fmt(items!.reduce((s, i) => s + i.snapshotClientPrice, 0))}
                          </span>
                        </div>
                        {items!.map(item => (
                          <div key={item.id} className="flex items-center gap-3 py-1.5">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" style={{ border: '1px solid rgba(201,162,74,0.15)' }} />
                            ) : (
                              <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(201,162,74,0.06)' }}>
                                <Package className="w-3 h-3" style={{ color: 'rgba(201,162,74,0.3)' }} />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <span className="text-xs" style={{ color: '#1A1A1A' }}>{item.name}</span>
                              <div className="flex items-center gap-2 text-[9px] text-gray-400">
                                <span>Qty: {item.quantity}</span>
                                <span>Unit: {fmt(item.snapshotUnitPrice)}</span>
                                {item.specIds.length > 0 && (
                                  <span className="px-1 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(139,92,246,0.08)', color: '#8B5CF6' }}>
                                    {item.specIds.length} spec{item.specIds.length !== 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-xs font-medium flex-shrink-0" style={{ color: '#1A1A1A' }}>{fmt(item.snapshotClientPrice)}</span>
                          </div>
                        ))}
                      </div>
                    ))}

                    {/* Total */}
                    <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'rgba(201,162,74,0.12)' }}>
                      <span className="text-xs text-gray-500">Total (snapshot)</span>
                      <span className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>{fmt(so.totalAmount)}</span>
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

export default SalesOrderView;
