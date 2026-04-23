import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Users, Move, Save, RotateCcw, X, Grid3X3, Cloud } from 'lucide-react';

interface Table {
  id: string;
  name: string;
  seats: number;
  x: number;
  y: number;
  shape: 'round' | 'rectangle' | 'square';
  guests: string[];
}

interface Guest {
  id: string;
  name: string;
  tableId?: string;
}

interface SeatingData {
  tables: Table[];
  guests: Guest[];
}

const SEATING_STORAGE_KEY = 'theone_seating_data';

const SeatingChart: React.FC = () => {
  const [seatingData, setSeatingData] = useState<SeatingData | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [newTableName, setNewTableName] = useState('');
  const [newTableSeats, setNewTableSeats] = useState(8);
  const [newTableShape, setNewTableShape] = useState<'round' | 'rectangle' | 'square'>('round');
  const [newGuestName, setNewGuestName] = useState('');
  const [draggedGuest, setDraggedGuest] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SEATING_STORAGE_KEY);
      if (saved) {
        setSeatingData(JSON.parse(saved));
      } else {
        const savedTables = localStorage.getItem('theone_seating_tables');
        const savedGuests = localStorage.getItem('theone_seating_guests');
        setSeatingData({
          tables: savedTables ? JSON.parse(savedTables) : [],
          guests: savedGuests ? JSON.parse(savedGuests) : [],
        });
      }
    } catch {
      setSeatingData({ tables: [], guests: [] });
    }
  }, []);

  // Save to localStorage whenever seatingData changes
  useEffect(() => {
    if (seatingData !== null) {
      try {
        localStorage.setItem(SEATING_STORAGE_KEY, JSON.stringify(seatingData));
        setLastSaved(new Date());
      } catch (e) {
        console.error('Failed to save seating data:', e);
      }
    }
  }, [seatingData]);


  const tables = seatingData?.tables || [];
  const guests = seatingData?.guests || [];

  const setTables = (newTables: Table[] | ((prev: Table[]) => Table[])) => {
    if (typeof setSeatingData !== 'function') {
      console.warn('SeatingChart: setSeatingData is not available (setTables)');
      return;
    }
    setSeatingData(prev => ({
      ...prev!,
      tables: typeof newTables === 'function' ? newTables(prev?.tables || []) : newTables,
    }));
  };

  const setGuests = (newGuests: Guest[] | ((prev: Guest[]) => Guest[])) => {
    if (typeof setSeatingData !== 'function') {
      console.warn('SeatingChart: setSeatingData is not available (setGuests)');
      return;
    }
    setSeatingData(prev => ({
      ...prev!,
      guests: typeof newGuests === 'function' ? newGuests(prev?.guests || []) : newGuests,
    }));
  };


  const addTable = () => {
    if (!newTableName.trim()) return;
    const newTable: Table = {
      id: `table-${Date.now()}`,
      name: newTableName,
      seats: newTableSeats,
      x: 50 + Math.random() * 200,
      y: 50 + Math.random() * 200,
      shape: newTableShape,
      guests: [],
    };
    setTables(prev => [...prev, newTable]);
    setNewTableName('');
  };

  const removeTable = (tableId: string) => {
    setTables(prev => prev.filter(t => t.id !== tableId));
    setGuests(prev => prev.map(g => g.tableId === tableId ? { ...g, tableId: undefined } : g));
  };

  const addGuest = (name: string) => {
    if (!name.trim()) return;
    const newGuest: Guest = {
      id: `guest-${Date.now()}`,
      name,
    };
    setGuests(prev => [...prev, newGuest]);
    setNewGuestName('');
  };

  const removeGuest = (guestId: string) => {
    setGuests(prev => prev.filter(g => g.id !== guestId));
  };

  const assignGuestToTable = (guestId: string, tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    
    const currentGuests = guests.filter(g => g.tableId === tableId).length;
    if (currentGuests >= table.seats) return;

    setGuests(prev => prev.map(g => 
      g.id === guestId ? { ...g, tableId } : g
    ));
  };

  const removeGuestFromTable = (guestId: string) => {
    setGuests(prev => prev.map(g => 
      g.id === guestId ? { ...g, tableId: undefined } : g
    ));
  };

  const unassignedGuests = guests.filter(g => !g.tableId);
  const totalSeats = tables.reduce((sum, t) => sum + t.seats, 0);
  const assignedGuests = guests.filter(g => g.tableId).length;

  // Null guard: show loading skeleton while seatingData is initializing
  if (!seatingData) {
    return (
      <div className="min-h-screen pt-24 pb-16" style={{ backgroundColor: '#0B1426' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <div className="h-12 w-64 bg-white/[0.05] rounded-lg animate-pulse mb-4" />
            <div className="h-6 w-80 bg-white/[0.05] rounded-lg animate-pulse" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
                <div className="h-4 w-16 bg-white/[0.05] rounded animate-pulse mb-2" />
                <div className="h-8 w-12 bg-white/[0.05] rounded-lg animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ backgroundColor: '#0B1426' }}>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-display text-4xl md:text-5xl font-normal tracking-[0.04em]" style={{ color: '#FFFFFF' }}>
              Seating Chart
            </h1>
            {lastSaved && (
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <Cloud className="w-4 h-4" />
                <span>Saved</span>
              </div>
            )}
          </div>
          <p className="font-body text-lg" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Design your perfect seating arrangement
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
            <p className="font-body text-caption uppercase mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Tables</p>
            <p className="font-display text-3xl" style={{ color: '#FFFFFF' }}>{tables.length}</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
            <p className="font-body text-caption uppercase mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Total Seats</p>
            <p className="font-display text-3xl" style={{ color: '#FFFFFF' }}>{totalSeats}</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
            <p className="font-body text-caption uppercase mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Assigned</p>
            <p className="font-display text-3xl text-gold">{assignedGuests}</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
            <p className="font-body text-caption uppercase mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Unassigned</p>
            <p className="font-display text-3xl" style={{ color: unassignedGuests.length > 0 ? '#ef4444' : '#22c55e' }}>{unassignedGuests.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Add Tables & Guests */}
          <div className="space-y-6">
            {/* Add Table */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
              <h3 className="font-display text-xl mb-4" style={{ color: '#FFFFFF' }}>Add Table</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  id="table-name"
                  name="table-name"
                  placeholder="Table name (e.g., Table 1)"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-lg font-body text-white placeholder-white/40 focus:outline-none focus:border-gold/50"
                  autoComplete="off"
                />
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label htmlFor="table-seats" className="font-body text-xs uppercase tracking-wider mb-2 block" style={{ color: 'rgba(255,255,255,0.5)' }}>Seats</label>
                    <select
                      id="table-seats"
                      name="table-seats"
                      value={newTableSeats}
                      onChange={(e) => setNewTableSeats(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-lg font-body text-white focus:outline-none focus:border-gold/50"
                    >
                      {[4, 6, 8, 10, 12].map(n => (
                        <option key={n} value={n} className="bg-navy">{n}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label htmlFor="table-shape" className="font-body text-xs uppercase tracking-wider mb-2 block" style={{ color: 'rgba(255,255,255,0.5)' }}>Shape</label>
                    <select
                      id="table-shape"
                      name="table-shape"
                      value={newTableShape}
                      onChange={(e) => setNewTableShape(e.target.value as any)}
                      className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-lg font-body text-white focus:outline-none focus:border-gold/50"
                    >
                      <option value="round" className="bg-navy">Round</option>
                      <option value="rectangle" className="bg-navy">Rectangle</option>
                      <option value="square" className="bg-navy">Square</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={addTable}
                  className="w-full py-3 bg-gradient-to-r from-gold-light via-gold to-gold-dark rounded-lg font-body font-medium text-nav uppercase flex items-center justify-center gap-2"
                  style={{ color: '#0B1426' }}
                >
                  <Plus className="w-4 h-4" />
                  Add Table
                </button>
              </div>
            </div>

            {/* Add Guest */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
              <h3 className="font-display text-xl mb-4" style={{ color: '#FFFFFF' }}>Add Guest</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                addGuest(newGuestName);
              }} className="flex gap-3">
                <input
                  type="text"
                  id="guest-name-seating"
                  name="guest-name-seating"
                  placeholder="Guest name"
                  value={newGuestName}
                  onChange={(e) => setNewGuestName(e.target.value)}
                  className="flex-1 px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-lg font-body text-white placeholder-white/40 focus:outline-none focus:border-gold/50"
                  autoComplete="name"
                />
                <button
                  type="submit"
                  className="px-4 py-3 bg-gold/20 border border-gold/30 rounded-lg text-gold hover:bg-gold/30 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </form>
            </div>

            {/* Unassigned Guests */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
              <h3 className="font-display text-xl mb-4 flex items-center gap-2" style={{ color: '#FFFFFF' }}>
                <Users className="w-5 h-5 text-gold" />
                Unassigned ({unassignedGuests.length})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                {unassignedGuests.map(guest => (
                  <div
                    key={guest.id}
                    draggable
                    onDragStart={() => setDraggedGuest(guest.id)}
                    onDragEnd={() => setDraggedGuest(null)}
                    className="px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-lg font-body text-white cursor-move hover:border-gold/30 transition-colors flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <Move className="w-4 h-4 text-white/40" />
                      {guest.name}
                    </div>
                    <button
                      onClick={() => removeGuest(guest.id)}
                      className="p-1 text-red-400 hover:text-red-300 opacity-50 hover:opacity-100"
                      aria-label="Remove guest"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {unassignedGuests.length === 0 && (
                  <p className="text-center py-4 font-body" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    All guests assigned
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Seating Chart */}
          <div className="lg:col-span-2">
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 min-h-[600px]">
              <h3 className="font-display text-xl mb-6" style={{ color: '#FFFFFF' }}>Floor Plan</h3>
              
              {tables.length === 0 ? (
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
                      <Grid3X3 className="w-10 h-10 text-gold" />
                    </div>
                    <p className="font-body text-lg mb-2" style={{ color: '#FFFFFF' }}>No tables yet</p>
                    <p className="font-body" style={{ color: 'rgba(255,255,255,0.5)' }}>Add tables to start planning your seating</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {tables.map(table => {
                    const tableGuests = guests.filter(g => g.tableId === table.id);
                    const isFull = tableGuests.length >= table.seats;
                    
                    return (
                      <div
                        key={table.id}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                          if (draggedGuest) {
                            assignGuestToTable(draggedGuest, table.id);
                          }
                        }}
                        className={`relative p-5 border rounded-2xl transition-all group ${
                          selectedTable === table.id 
                            ? 'border-gold bg-gold/10' 
                            : 'border-white/[0.1] bg-white/[0.02] hover:border-gold/30'
                        } ${isFull ? 'opacity-75' : ''}`}
                        onClick={() => setSelectedTable(selectedTable === table.id ? null : table.id)}
                      >
                        {/* Table Shape Visual */}
                        <div className={`w-16 h-16 mx-auto mb-4 border-2 border-gold/50 flex items-center justify-center ${
                          table.shape === 'round' ? 'rounded-full' : table.shape === 'square' ? 'rounded-lg' : 'rounded-lg w-24'
                        }`}>
                          <span className="font-display text-lg text-gold">{tableGuests.length}/{table.seats}</span>
                        </div>
                        
                        <h4 className="font-display text-lg text-center mb-3" style={{ color: '#FFFFFF' }}>{table.name}</h4>
                        
                        {/* Guests at table */}
                        <div className="space-y-1">
                          {tableGuests.map(guest => (
                            <div key={guest.id} className="flex items-center justify-between px-2 py-1 bg-white/[0.05] rounded text-sm">
                              <span className="font-body" style={{ color: 'rgba(255,255,255,0.8)' }}>{guest.name}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeGuestFromTable(guest.id);
                                }}
                                className="text-red-400 hover:text-red-300"
                                aria-label="Remove from table"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                        
                        {/* Delete Table */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeTable(table.id);
                          }}
                          className="absolute top-2 right-2 p-1 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Delete table"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatingChart;
