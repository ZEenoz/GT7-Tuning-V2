import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';

const Garage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [filter, setFilter] = useState('all');
  const [tunes, setTunes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'pp_high' | 'pp_low'>('newest');
  const [isSortOpen, setIsSortOpen] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    // Fix: Query tunes specifically for the current user
    const q = query(
      collection(db, "tunes"),
      where("userId", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tunesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTunes(tunesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching tunes:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Filter & Sort Logic
  const filteredTunes = tunes
    .filter(tune => {
      // 1. Category Filter
      if (filter !== 'all') return true; // TODO: Implement actual category logic if needed
      return true;
    })
    .filter(tune => {
      // 2. Search Filter
      if (!searchTerm) return true;
      return tune.carName?.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      // 3. Sorting
      if (sortOrder === 'pp_high') {
        const ppA = parseFloat(a.pp || a.stats?.pp || 0);
        const ppB = parseFloat(b.pp || b.stats?.pp || 0);
        return ppB - ppA;
      }
      if (sortOrder === 'pp_low') {
        const ppA = parseFloat(a.pp || a.stats?.pp || 0);
        const ppB = parseFloat(b.pp || b.stats?.pp || 0);
        return ppA - ppB;
      }
      // Default: Newest (using string comparison for ISO dates works)
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });

  return (
    <div className="relative flex h-full w-full flex-col min-h-screen bg-background-light dark:bg-black text-gray-900 dark:text-white font-display transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between bg-white/95 dark:bg-[#0A0A0A]/95 px-4 py-3 backdrop-blur-md border-b border-gray-200 dark:border-white/5 transition-colors duration-300">

        {isSearchOpen ? (
          <div className="flex-1 flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="flex-1 relative">
              <input
                autoFocus
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search cars..."
                className="w-full bg-gray-100 dark:bg-white/10 rounded-full px-4 py-2 pl-9 text-sm font-bold outline-none focus:ring-2 focus:ring-red-500 transition-all"
              />
              <span className="material-symbols-outlined absolute left-2.5 top-1.5 text-gray-400 text-[20px]">search</span>
            </div>
            <button onClick={() => { setIsSearchOpen(false); setSearchTerm(''); }} className="size-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10">
              <span className="material-symbols-outlined text-gray-500">close</span>
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold leading-tight tracking-tight">Garage</h1>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsSearchOpen(true)} className="flex items-center justify-center rounded-full w-10 h-10 hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                <span className="material-symbols-outlined text-2xl text-gray-600 dark:text-white">search</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setIsSortOpen(!isSortOpen)}
                  className={`flex items-center justify-center rounded-full w-10 h-10 transition-colors ${isSortOpen ? 'bg-red-50 dark:bg-red-500/20 text-red-500' : 'hover:bg-black/5 dark:hover:bg-white/10 text-gray-600 dark:text-white'}`}
                >
                  <span className="material-symbols-outlined text-2xl">sort</span>
                </button>

                {/* Sort Dropdown */}
                {isSortOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsSortOpen(false)}></div>
                    <div className="absolute right-0 top-12 z-50 w-48 bg-white dark:bg-[#1A1A1A] rounded-xl shadow-xl border border-gray-100 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-200">
                      <div className="p-2 space-y-1">
                        {[
                          { label: 'Newest First', val: 'newest', icon: 'schedule' },
                          { label: 'PP High to Low', val: 'pp_high', icon: 'north_east' },
                          { label: 'PP Low to High', val: 'pp_low', icon: 'south_east' },
                        ].map((opt) => (
                          <button
                            key={opt.val}
                            onClick={() => { setSortOrder(opt.val as any); setIsSortOpen(false); }}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${sortOrder === opt.val ? 'bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400' : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'}`}
                          >
                            <span className="material-symbols-outlined text-[18px]">{opt.icon}</span>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </header>

      {/* Tabs */}
      <div className="px-4 py-3 sticky top-[64px] z-30 bg-background-light dark:bg-black transition-colors duration-300">
        <div className="flex h-10 w-full items-center rounded-lg bg-gray-200 dark:bg-white/5 p-1 transition-colors">
          {['All Cars', 'Favorites', 'Recent', 'By Make'].map((item) => {
            const value = item.toLowerCase().replace(' ', '-');
            const isActive = filter === value || (filter === 'all' && item === 'All Cars');

            return (
              <button
                key={item}
                onClick={() => setFilter(value)}
                className={`flex-1 h-full rounded-md text-xs font-bold transition-all ${isActive ? 'bg-white dark:bg-[#121212] text-gray-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/5' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                  }`}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex flex-col gap-4 px-4 pb-24 flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
            <span className="material-symbols-outlined text-4xl animate-spin mb-2">refresh</span>
            <p className="text-xs font-medium uppercase tracking-wider">Loading Garage...</p>
          </div>
        ) : tunes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500 text-center">
            <span className="material-symbols-outlined text-4xl mb-2 text-gray-300 dark:text-white/20">garage_home</span>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Your Garage is Empty</h3>
            <p className="text-xs">Add your first tune to get started.</p>
            <button
              onClick={() => navigate('/add-tune')}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-red-700 transition-colors"
            >
              Add Tune
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {/* Filter Feedback */}
            {searchTerm && (
              <div className="text-xs font-bold text-gray-500 dark:text-gray-400 pb-1">
                Searching for "{searchTerm}" ({filteredTunes.length} found)
              </div>
            )}

            {/* List of Tunes */}
            {filteredTunes.map((tune) => (
              <div key={tune.id} onClick={() => navigate('/tune-details', { state: { tune } })} className="group relative flex overflow-hidden rounded-xl bg-white dark:bg-[#121212] p-3 shadow-sm ring-1 ring-gray-200 dark:ring-white/10 active:scale-[0.99] transition-transform cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
                <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-lg bg-cover bg-center bg-gray-200 dark:bg-gray-800 flex items-center justify-center" style={{ backgroundImage: tune.img ? `url('${tune.img}')` : undefined }}>
                  {!tune.img && <span className="material-symbols-outlined text-3xl text-gray-400 dark:text-white/10">directions_car</span>}
                  <div className="absolute top-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm border border-white/10">{tune.pp} PP</div>
                </div>
                <div className="flex flex-1 flex-col justify-center px-3 min-w-0">
                  <h4 className="font-bold text-gray-900 dark:text-white truncate">{tune.carName}</h4>
                  {/* Subdata (e.g. Tyres and Power) */}
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1 rounded bg-gray-100 dark:bg-white/5 px-1.5 py-0.5">
                      <span className="material-symbols-outlined text-[10px]">speed</span> {tune.stats?.power || 'N/A'} HP
                    </span>
                    <span className="flex items-center gap-1 rounded bg-gray-100 dark:bg-white/5 px-1.5 py-0.5 truncate max-w-[100px]">
                      <span className="material-symbols-outlined text-[10px]">tire_repair</span> {typeof tune.tyres?.f === 'string' ? tune.tyres.f.split(':')[1]?.trim() : (tune.tyres?.f || 'Tyres')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-center pr-1 text-gray-400 dark:text-gray-500 group-hover:text-red-500 transition-colors">
                  <span className="material-symbols-outlined">chevron_right</span>
                </div>
              </div>
            ))}

            {filteredTunes.length === 0 && searchTerm && (
              <div className="text-center py-10 text-gray-400">
                <span className="material-symbols-outlined text-3xl mb-2">search_off</span>
                <p className="text-sm">No cars found matching "{searchTerm}"</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Garage;