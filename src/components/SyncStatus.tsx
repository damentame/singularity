import React from 'react';
import { Cloud, CloudOff, Loader2, Check } from 'lucide-react';

interface SyncStatusProps {
  isSyncing: boolean;
  lastSyncTime: Date | null;
  isOnline?: boolean;
}

const SyncStatus: React.FC<SyncStatusProps> = ({ 
  isSyncing, 
  lastSyncTime, 
  isOnline = true 
}) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOnline) {
    return (
      <div className="flex items-center gap-2 text-amber-400 text-sm">
        <CloudOff className="w-4 h-4" />
        <span>Offline - Changes saved locally</span>
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className="flex items-center gap-2 text-blue-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Syncing...</span>
      </div>
    );
  }

  if (lastSyncTime) {
    return (
      <div className="flex items-center gap-2 text-green-400 text-sm">
        <Cloud className="w-4 h-4" />
        <span>Synced at {formatTime(lastSyncTime)}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-white/50 text-sm">
      <Cloud className="w-4 h-4" />
      <span>Ready to sync</span>
    </div>
  );
};

export default SyncStatus;
