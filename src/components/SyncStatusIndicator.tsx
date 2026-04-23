import React, { useState, useEffect, useRef } from 'react';
import {
  Cloud, CloudOff, Loader2, Check, AlertTriangle, RefreshCw,
  Wifi, WifiOff, ChevronDown, Trash2, X,
} from 'lucide-react';
import { useAutoSaveStatus } from './EventAutoSaver';
import { SyncState } from '@/hooks/useEventPersistence';

const GOLD = '#C9A24A';

const SyncStatusIndicator: React.FC = () => {
  const {
    isSaving,
    lastSaveTime,
    saveError,
    syncState,
    pendingSaveCount,
    isOnline,
    forceSync,
    getQueueInfo,
    clearQueue,
  } = useAutoSaveStatus();

  const [showDropdown, setShowDropdown] = useState(false);
  const [isForceSyncing, setIsForceSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ flushed: number; failed: number; remaining: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  // Clear sync result after 5 seconds
  useEffect(() => {
    if (syncResult) {
      const timer = setTimeout(() => setSyncResult(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [syncResult]);

  const handleForceSync = async () => {
    setIsForceSyncing(true);
    setSyncResult(null);
    try {
      const result = await forceSync();
      setSyncResult(result);
    } catch (e) {
      console.error('Force sync failed:', e);
    } finally {
      setIsForceSyncing(false);
    }
  };

  const formatTime = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const formatRelativeTime = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return 'just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      return d.toLocaleDateString();
    } catch {
      return '';
    }
  };

  // Determine effective display state
  const effectiveState: SyncState = isSaving || isForceSyncing
    ? 'syncing'
    : !isOnline
    ? 'offline'
    : syncState;

  const stateConfig: Record<SyncState, { icon: React.ReactNode; label: string; color: string; bg: string; pulse?: boolean }> = {
    synced: {
      icon: <Check className="w-3 h-3" />,
      label: 'Synced',
      color: '#22C55E',
      bg: 'rgba(34,197,94,0.08)',
    },
    pending: {
      icon: <Cloud className="w-3 h-3" />,
      label: `${pendingSaveCount} pending`,
      color: '#F59E0B',
      bg: 'rgba(245,158,11,0.08)',
      pulse: true,
    },
    syncing: {
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
      label: 'Syncing...',
      color: '#3B82F6',
      bg: 'rgba(59,130,246,0.08)',
    },
    error: {
      icon: <AlertTriangle className="w-3 h-3" />,
      label: 'Sync error',
      color: '#EF4444',
      bg: 'rgba(239,68,68,0.08)',
    },
    offline: {
      icon: <WifiOff className="w-3 h-3" />,
      label: 'Offline',
      color: '#F59E0B',
      bg: 'rgba(245,158,11,0.08)',
    },
  };

  const config = stateConfig[effectiveState];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Compact Status Pill */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all hover:shadow-sm"
        style={{
          backgroundColor: config.bg,
          color: config.color,
          border: `1px solid ${config.color}20`,
        }}
      >
        {/* Pulse dot for pending */}
        {config.pulse && (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: config.color }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: config.color }} />
          </span>
        )}
        {!config.pulse && config.icon}
        <span className="hidden sm:inline">{config.label}</span>
        <ChevronDown className="w-2.5 h-2.5 opacity-50" />
      </button>

      {/* Dropdown Panel */}
      {showDropdown && (
        <div
          className="absolute right-0 top-full mt-2 z-50 bg-white rounded-xl shadow-xl border w-72"
          style={{ borderColor: 'rgba(201,162,74,0.15)' }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(201,162,74,0.1)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: config.bg }}>
                  {config.icon}
                </div>
                <div>
                  <span className="text-xs font-semibold" style={{ color: '#1A1A1A' }}>
                    {effectiveState === 'synced' ? 'All changes synced' :
                     effectiveState === 'syncing' ? 'Syncing changes...' :
                     effectiveState === 'offline' ? 'Working offline' :
                     effectiveState === 'error' ? 'Sync error' :
                     `${pendingSaveCount} change${pendingSaveCount !== 1 ? 's' : ''} pending`}
                  </span>
                </div>
              </div>
              <button onClick={() => setShowDropdown(false)} className="p-1 rounded hover:bg-gray-100">
                <X className="w-3 h-3 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Status Details */}
          <div className="px-4 py-3 space-y-2.5">
            {/* Connection Status */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-gray-400">Connection</span>
              <div className="flex items-center gap-1.5">
                {isOnline ? (
                  <>
                    <Wifi className="w-3 h-3 text-green-500" />
                    <span className="text-[10px] text-green-600 font-medium">Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 text-amber-500" />
                    <span className="text-[10px] text-amber-600 font-medium">Offline</span>
                  </>
                )}
              </div>
            </div>

            {/* Last Sync */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-gray-400">Last Sync</span>
              <span className="text-[10px] font-medium" style={{ color: '#1A1A1A' }}>
                {lastSaveTime ? formatRelativeTime(lastSaveTime) : 'Never'}
              </span>
            </div>

            {/* Pending Saves */}
            {pendingSaveCount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-gray-400">Queued Saves</span>
                <span className="text-[10px] font-bold" style={{ color: '#F59E0B' }}>
                  {pendingSaveCount}
                </span>
              </div>
            )}

            {/* Error Message */}
            {saveError && (
              <div className="rounded-lg p-2.5" style={{ backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-red-600 font-medium block">Sync Error</span>
                    <span className="text-[9px] text-red-400">{saveError}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Sync Result */}
            {syncResult && (
              <div className="rounded-lg p-2.5" style={{
                backgroundColor: syncResult.remaining === 0 ? 'rgba(34,197,94,0.06)' : 'rgba(245,158,11,0.06)',
                border: `1px solid ${syncResult.remaining === 0 ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)'}`,
              }}>
                <span className="text-[10px] font-medium" style={{ color: syncResult.remaining === 0 ? '#22C55E' : '#F59E0B' }}>
                  {syncResult.flushed > 0 && `${syncResult.flushed} synced`}
                  {syncResult.failed > 0 && ` · ${syncResult.failed} failed`}
                  {syncResult.remaining > 0 && ` · ${syncResult.remaining} remaining`}
                  {syncResult.remaining === 0 && syncResult.flushed > 0 && ' — All caught up!'}
                </span>
              </div>
            )}

            {/* Offline notice */}
            {!isOnline && pendingSaveCount > 0 && (
              <div className="rounded-lg p-2.5" style={{ backgroundColor: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
                <div className="flex items-start gap-2">
                  <CloudOff className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-amber-600 font-medium block">Changes saved locally</span>
                    <span className="text-[9px] text-amber-500">
                      {pendingSaveCount} change{pendingSaveCount !== 1 ? 's' : ''} will sync when you're back online
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-4 py-3 border-t space-y-2" style={{ borderColor: 'rgba(201,162,74,0.1)' }}>
            {/* Force Sync Button */}
            <button
              onClick={handleForceSync}
              disabled={isForceSyncing || !isOnline || pendingSaveCount === 0}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all disabled:opacity-40"
              style={{
                backgroundColor: pendingSaveCount > 0 ? GOLD : 'rgba(201,162,74,0.08)',
                color: pendingSaveCount > 0 ? '#FFF' : GOLD,
              }}
            >
              <RefreshCw className={`w-3 h-3 ${isForceSyncing ? 'animate-spin' : ''}`} />
              {isForceSyncing ? 'Syncing...' : pendingSaveCount > 0 ? `Force Sync (${pendingSaveCount})` : 'Nothing to Sync'}
            </button>

            {/* Clear Queue (only if errors) */}
            {pendingSaveCount > 0 && (
              <button
                onClick={() => {
                  if (window.confirm('Clear all pending saves? This cannot be undone. Your local data is still safe.')) {
                    clearQueue();
                    setSyncResult(null);
                  }
                }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Clear Queue
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SyncStatusIndicator;
