import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bell, BellRing, Check, CheckCheck, X, TrendingDown, ArrowDown,
  Trash2, Eye, ExternalLink, ChevronRight, Sparkles, DollarSign,
} from 'lucide-react';
import {
  getAllAlerts,
  getUnreadCount,
  markAlertAsRead,
  markAllAlertsAsRead,
  dismissAlert,
  clearAllAlerts,
  clearReadAlerts,
  getRelativeTime,
  seedDemoAlerts,
  PriceAlert,
} from '@/data/priceAlertStore';

const GOLD = '#C9A24A';

interface PriceAlertBellProps {
  onNavigateToCompare?: (eventId: string) => void;
}

const PriceAlertBell: React.FC<PriceAlertBellProps> = ({ onNavigateToCompare }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prevUnreadRef = useRef(0);

  const refreshAlerts = useCallback(() => {
    const all = getAllAlerts();
    setAlerts(all);
    const count = getUnreadCount();
    setUnreadCount(count);

    // Animate bell when new unread alerts appear
    if (count > prevUnreadRef.current && prevUnreadRef.current >= 0) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 1000);
    }
    prevUnreadRef.current = count;
  }, []);

  // Poll for new alerts every 3 seconds
  useEffect(() => {
    refreshAlerts();
    const interval = setInterval(refreshAlerts, 3000);
    return () => clearInterval(interval);
  }, [refreshAlerts]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowClearConfirm(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    setShowClearConfirm(false);
  };

  const handleMarkAsRead = (alertId: string) => {
    markAlertAsRead(alertId);
    refreshAlerts();
  };

  const handleMarkAllRead = () => {
    markAllAlertsAsRead();
    refreshAlerts();
  };

  const handleDismiss = (alertId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dismissAlert(alertId);
    refreshAlerts();
  };

  const handleClearAll = () => {
    if (showClearConfirm) {
      clearAllAlerts();
      refreshAlerts();
      setShowClearConfirm(false);
    } else {
      setShowClearConfirm(true);
    }
  };

  const handleClearRead = () => {
    clearReadAlerts();
    refreshAlerts();
  };

  const handleAlertClick = (alert: PriceAlert) => {
    if (!alert.isRead) {
      markAlertAsRead(alert.id);
      refreshAlerts();
    }
    if (onNavigateToCompare) {
      onNavigateToCompare(alert.eventId);
      setIsOpen(false);
    }
  };

  const filteredAlerts = filter === 'unread' ? alerts.filter(a => !a.isRead) : alerts;

  const formatPrice = (amount: number, currency: string) => {
    const sym = currency === 'ZAR' ? 'R' : currency === 'USD' ? '$' : currency === 'EUR' ? '\u20AC' : currency === 'GBP' ? '\u00A3' : currency;
    return `${sym}${amount.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className={`relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 ${
          isOpen
            ? 'bg-amber-50 shadow-sm'
            : 'hover:bg-black/5'
        } ${isAnimating ? 'animate-bounce' : ''}`}
        style={{
          border: isOpen ? '1px solid rgba(201,162,74,0.2)' : '1px solid transparent',
        }}
        title="Price Alerts"
      >
        {unreadCount > 0 ? (
          <BellRing className="w-4 h-4" style={{ color: isOpen ? GOLD : '#666' }} />
        ) : (
          <Bell className="w-4 h-4" style={{ color: isOpen ? GOLD : '#999' }} />
        )}

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold text-white shadow-sm"
            style={{ backgroundColor: '#EF4444' }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-[420px] max-h-[520px] rounded-2xl border shadow-xl bg-white overflow-hidden z-50"
          style={{
            borderColor: 'rgba(201,162,74,0.15)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 4px 20px rgba(201,162,74,0.08)',
          }}
        >
          {/* Header */}
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{
              backgroundColor: '#FAFAF7',
              borderBottom: '1px solid rgba(201,162,74,0.1)',
            }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'rgba(201,162,74,0.1)' }}
              >
                <TrendingDown className="w-3.5 h-3.5" style={{ color: GOLD }} />
              </div>
              <div>
                <h3
                  className="text-xs font-semibold"
                  style={{ color: '#1A1A1A', fontFamily: '"Inter", sans-serif' }}
                >
                  Price Alerts
                </h3>
                <p className="text-[9px] text-gray-400">
                  {unreadCount > 0 ? `${unreadCount} new` : 'All caught up'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-medium transition-colors hover:bg-black/5"
                  style={{ color: GOLD }}
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3 h-3" />
                  <span className="hidden sm:inline">Read all</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div
            className="px-4 py-2 flex items-center gap-4"
            style={{ borderBottom: '1px solid rgba(201,162,74,0.06)' }}
          >
            <button
              onClick={() => setFilter('all')}
              className="text-[10px] font-medium pb-1 transition-colors"
              style={{
                color: filter === 'all' ? GOLD : '#999',
                borderBottom: filter === 'all' ? `2px solid ${GOLD}` : '2px solid transparent',
              }}
            >
              All ({alerts.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className="text-[10px] font-medium pb-1 transition-colors"
              style={{
                color: filter === 'unread' ? GOLD : '#999',
                borderBottom: filter === 'unread' ? `2px solid ${GOLD}` : '2px solid transparent',
              }}
            >
              Unread ({alerts.filter(a => !a.isRead).length})
            </button>

            <div className="flex-1" />

            {alerts.length > 0 && (
              <div className="flex items-center gap-1">
                {alerts.some(a => a.isRead) && (
                  <button
                    onClick={handleClearRead}
                    className="text-[9px] text-gray-400 hover:text-gray-600 transition-colors"
                    title="Clear read alerts"
                  >
                    Clear read
                  </button>
                )}
                <span className="text-gray-200 text-[9px]">|</span>
                <button
                  onClick={handleClearAll}
                  className={`text-[9px] transition-colors ${
                    showClearConfirm
                      ? 'text-red-500 font-semibold'
                      : 'text-gray-400 hover:text-red-400'
                  }`}
                  title={showClearConfirm ? 'Click again to confirm' : 'Clear all alerts'}
                >
                  {showClearConfirm ? 'Confirm clear all?' : 'Clear all'}
                </button>
              </div>
            )}
          </div>

          {/* Alert List */}
          <div className="overflow-y-auto" style={{ maxHeight: '380px' }}>
            {filteredAlerts.length === 0 ? (
              <div className="py-12 text-center">
                <div
                  className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(201,162,74,0.06)' }}
                >
                  <Bell className="w-6 h-6" style={{ color: 'rgba(201,162,74,0.25)' }} />
                </div>
                <p className="text-xs text-gray-400 font-medium">
                  {filter === 'unread' ? 'No unread alerts' : 'No price alerts yet'}
                </p>
                <p className="text-[10px] text-gray-300 mt-1 max-w-[240px] mx-auto">
                  {filter === 'unread'
                    ? 'All alerts have been read.'
                    : 'When suppliers submit quotes that beat current prices, alerts will appear here.'
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'rgba(0,0,0,0.04)' }}>
                {filteredAlerts.map(alert => (
                  <AlertItem
                    key={alert.id}
                    alert={alert}
                    onRead={handleMarkAsRead}
                    onDismiss={handleDismiss}
                    onClick={handleAlertClick}
                    formatPrice={formatPrice}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {filteredAlerts.length > 0 && (
            <div
              className="px-4 py-2.5 text-center"
              style={{
                backgroundColor: '#FAFAF7',
                borderTop: '1px solid rgba(201,162,74,0.08)',
              }}
            >
              <p className="text-[9px] text-gray-400">
                Showing {filteredAlerts.length} alert{filteredAlerts.length !== 1 ? 's' : ''}
                {' '}&middot;{' '}
                Total savings potential:{' '}
                <span className="font-semibold text-green-600">
                  {formatPrice(
                    filteredAlerts.reduce((s, a) => s + a.totalSavings, 0),
                    filteredAlerts[0]?.currency || 'ZAR'
                  )}
                </span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Alert Item Component ────────────────────────────────────────────────────

interface AlertItemProps {
  alert: PriceAlert;
  onRead: (id: string) => void;
  onDismiss: (id: string, e: React.MouseEvent) => void;
  onClick: (alert: PriceAlert) => void;
  formatPrice: (amount: number, currency: string) => string;
}

const AlertItem: React.FC<AlertItemProps> = ({ alert, onRead, onDismiss, onClick, formatPrice }) => {
  const savingsPercent = alert.previousBestPrice > 0
    ? ((alert.savingsPerUnit / alert.previousBestPrice) * 100).toFixed(0)
    : '0';

  return (
    <div
      className={`group px-4 py-3 cursor-pointer transition-all duration-150 hover:bg-amber-50/30 ${
        !alert.isRead ? 'bg-amber-50/20' : ''
      }`}
      onClick={() => onClick(alert)}
    >
      <div className="flex items-start gap-3">
        {/* Unread Indicator */}
        <div className="flex-shrink-0 mt-1">
          {!alert.isRead ? (
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: GOLD }}
            />
          ) : (
            <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
          )}
        </div>

        {/* Icon */}
        <div
          className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
          style={{
            backgroundColor: 'rgba(34,197,94,0.08)',
            border: '1px solid rgba(34,197,94,0.15)',
          }}
        >
          <ArrowDown className="w-4 h-4 text-green-500" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] leading-relaxed" style={{ color: '#1A1A1A' }}>
                <span className="font-semibold" style={{ color: GOLD }}>
                  {alert.supplierName}
                </span>
                {' '}quoted{' '}
                <span className="font-semibold text-green-600">
                  {formatPrice(alert.newUnitPrice, alert.currency)}
                </span>
                {' '}for{' '}
                <span className="font-medium">{alert.lineItemName}</span>
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {formatPrice(alert.savingsPerUnit, alert.currency)} less than{' '}
                {alert.previousBestSupplier === 'Current Estimate'
                  ? 'current estimate'
                  : alert.previousBestSupplier
                }
                {' '}({formatPrice(alert.previousBestPrice, alert.currency)})
              </p>
            </div>

            {/* Dismiss Button */}
            <button
              onClick={(e) => onDismiss(alert.id, e)}
              className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-black/5"
              title="Dismiss"
            >
              <X className="w-3 h-3 text-gray-400" />
            </button>
          </div>

          {/* Savings Badge & Meta */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold"
              style={{
                backgroundColor: 'rgba(34,197,94,0.08)',
                color: '#16A34A',
                border: '1px solid rgba(34,197,94,0.15)',
              }}
            >
              <TrendingDown className="w-2.5 h-2.5" />
              Save {formatPrice(alert.totalSavings, alert.currency)} total ({savingsPercent}%)
            </span>
            <span className="text-[9px] text-gray-300">
              {alert.quantity} units &middot; {alert.category}
            </span>
            <span className="text-[9px] text-gray-300">&middot;</span>
            <span className="text-[9px] text-gray-300">{alert.momentName}</span>
            <span className="text-[9px] text-gray-300 ml-auto">
              {getRelativeTime(alert.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceAlertBell;
