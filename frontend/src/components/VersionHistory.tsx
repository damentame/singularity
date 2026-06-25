import React from 'react';
import { Clock, RotateCcw } from 'lucide-react';
import { EventVersion } from '@/contexts/EventContext';

const GOLD = '#C9A24A';

interface VersionHistoryProps {
  versions: EventVersion[];
  currentVersion: number;
  onRestore: (versionId: string) => void;
}

const VersionHistory: React.FC<VersionHistoryProps> = ({ versions, currentVersion, onRestore }) => {
  const sorted = [...versions].sort((a, b) => b.versionNumber - a.versionNumber);

  return (
    <div className="rounded-2xl border p-6" style={{ backgroundColor: '#FFF', borderColor: 'rgba(201,162,74,0.2)' }}>
      <h3
        className="text-sm font-medium uppercase tracking-widest mb-4"
        style={{ color: GOLD, fontFamily: '"Inter", sans-serif' }}
      >
        Version History
      </h3>
      <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
        {sorted.map((v) => {
          const isCurrent = v.versionNumber === currentVersion;
          const date = new Date(v.timestamp);
          return (
            <div
              key={v.id}
              className="flex items-start gap-3 p-3 rounded-xl transition-colors"
              style={{
                backgroundColor: isCurrent ? 'rgba(201,162,74,0.06)' : 'transparent',
                border: isCurrent ? '1px solid rgba(201,162,74,0.15)' : '1px solid transparent',
              }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ backgroundColor: isCurrent ? 'rgba(201,162,74,0.12)' : 'rgba(0,0,0,0.04)' }}
              >
                <Clock className="w-3.5 h-3.5" style={{ color: isCurrent ? GOLD : '#BBB' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold" style={{ color: '#1A1A1A' }}>
                    v{v.versionNumber}
                  </span>
                  {isCurrent && (
                    <span
                      className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: 'rgba(201,162,74,0.15)', color: GOLD }}
                    >
                      Current
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{v.changeDescription}</p>
                <p className="text-[10px] text-gray-400 mt-1">
                  {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {' · '}{v.guestCount} guests · {v.lineItems.length} items
                </p>
              </div>
              {!isCurrent && (
                <button
                  onClick={() => onRestore(v.id)}
                  className="p-1.5 rounded-lg hover:bg-black/5 transition-colors flex-shrink-0"
                  title="Restore this version"
                >
                  <RotateCcw className="w-3.5 h-3.5" style={{ color: GOLD }} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VersionHistory;
