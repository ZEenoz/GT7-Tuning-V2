import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit, startAt, endAt } from 'firebase/firestore';

const Search = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchMode, setSearchMode] = useState<'tunes' | 'users'>('tunes');
  const searchTimeoutRef = useRef<any>(null);

  const handleSearch = async (term: string) => {
    if (!term.trim()) {
      setResults([]);
      return;
    }

    setSearching(true);
    setLoading(true);

    try {
      const collectionName = searchMode === 'tunes' ? 'tunes' : 'users';
      const fieldName = searchMode === 'tunes' ? 'carName' : 'displayName';

      const ref = collection(db, collectionName);
      // Basic prefix search
      const q = query(
        ref,
        where(fieldName, '>=', term),
        where(fieldName, '<=', term + '\uf8ff'),
        limit(20)
      );

      const snapshot = await getDocs(q);
      const hits = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setResults(hits);
    } catch (error) {
      console.error("Search error", error);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (val.length > 1) {
      setLoading(true);
      searchTimeoutRef.current = setTimeout(() => {
        handleSearch(val);
      }, 600);
    } else {
      setResults([]);
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    setResults([]);
    setLoading(false);
  };

  const getTyreBadgeColor = (tyreStr) => {
    if (!tyreStr) return "bg-gray-100 text-gray-500";
    if (tyreStr.includes("Racing")) return "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400";
    if (tyreStr.includes("Sports")) return "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400";
    return "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400";
  };

  const formatTire = (t) => {
    if (!t) return "-";
    return t.replace("Racing: ", "").replace("Sports: ", "").replace("Comfort: ", "");
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-black pb-24 text-gray-900 dark:text-white transition-colors duration-300">
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 px-4 pt-4 pb-2 shadow-sm transition-colors duration-300">
        <h1 className="text-2xl font-black italic uppercase tracking-tighter mb-4 text-gray-900 dark:text-white">Find</h1>

        {/* Search Mode Tabs */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => { setSearchMode('tunes'); setResults([]); setSearchTerm(""); }}
            className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all ${searchMode === 'tunes' ? 'bg-red-600 border-red-600 text-white shadow-md' : 'bg-transparent border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400'}`}
          >
            Tunes
          </button>
          <button
            onClick={() => { setSearchMode('users'); setResults([]); setSearchTerm(""); }}
            className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all ${searchMode === 'users' ? 'bg-red-600 border-red-600 text-white shadow-md' : 'bg-transparent border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400'}`}
          >
            Racers
          </button>
        </div>

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-xl">search</span>
          <input
            value={searchTerm}
            onChange={onInputChange}
            className="block w-full p-3 pl-10 text-sm rounded-xl border-none bg-gray-100 dark:bg-[#121212] focus:ring-2 focus:ring-red-500 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white shadow-sm transition-all"
            placeholder={searchMode === 'tunes' ? "Search by car name..." : "Search racers by name..."}
            type="text"
            autoFocus
          />
          {searchTerm && (
            <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          )}
          {loading && (
            <div className="absolute right-10 top-1/2 -translate-y-1/2">
              <span className="material-symbols-outlined animate-spin text-gray-400 text-lg">refresh</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {results.length > 0 ? (
          searchMode === 'tunes' ? (
            // Tunes List
            results.map((tune) => (
              <div key={tune.id} onClick={() => navigate('/tune-details', { state: { tune } })} className="bg-white dark:bg-[#121212] rounded-xl p-3 border border-gray-200 dark:border-white/10 shadow-sm flex gap-3 active:scale-[0.98] transition-all cursor-pointer hover:border-red-500/30 group">
                <div className="w-24 h-24 bg-gray-200 dark:bg-[#1a1a1a] rounded-lg bg-cover bg-center shrink-0 border border-gray-100 dark:border-white/5 relative overflow-hidden" style={{ backgroundImage: tune.img ? `url('${tune.img}')` : undefined }}>
                  {!tune.img && <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-600"><span className="material-symbols-outlined text-3xl">directions_car</span></div>}
                  <div className="absolute top-1 left-1 bg-black/60 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">{tune.tag || "N/A"}</div>
                </div>
                <div className="flex flex-col justify-between flex-1 min-w-0 py-1">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-sm leading-tight text-gray-900 dark:text-white truncate pr-1 group-hover:text-red-500 transition-colors">{tune.carName}</h3>
                      <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-white/5 px-1.5 py-0.5 rounded shrink-0">{tune.pp || tune.stats?.pp} PP</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded border border-transparent ${getTyreBadgeColor(tune.tyres?.f)}`}>
                        {formatTire(tune.tyres?.f)}
                      </div>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{tune.stats?.power} HP</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-100 dark:border-white/5">
                    <div className="size-4 rounded-full bg-gray-200 dark:bg-gray-700 bg-cover bg-center" style={{ backgroundImage: tune.creatorPhoto ? `url('${tune.creatorPhoto}')` : undefined }}></div>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium truncate">{tune.creatorName || "Unknown"}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            // Users List
            results.map((user) => (
              <div key={user.id} onClick={() => navigate(`/user/${user.id}`)} className="bg-white dark:bg-[#121212] rounded-xl p-4 border border-gray-200 dark:border-white/10 shadow-sm flex items-center gap-4 active:scale-[0.98] transition-all cursor-pointer hover:border-red-500/30 group">
                <div className="relative">
                  <div className="size-14 rounded-full bg-gray-200 dark:bg-[#1a1a1a] bg-cover bg-center border-2 border-gray-100 dark:border-white/10" style={{ backgroundImage: user.photoURL ? `url('${user.photoURL}')` : undefined }}>
                    {!user.photoURL && <div className="flex items-center justify-center h-full text-gray-400"><span className="material-symbols-outlined text-2xl">person</span></div>}
                  </div>
                  {/* Fake Level Badge for now or real if stored */}
                  <div className="absolute -bottom-1 -right-1 bg-red-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-white dark:border-black">
                    Lvl {Math.min(50, Math.floor(user.stats?.tunesCreated || 0) + 1)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base text-gray-900 dark:text-white truncate group-hover:text-red-500 transition-colors">{user.displayName || "Racer"}</h3>
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">tune</span>
                      <span>{user.stats?.tunesCreated || 0} Tunes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">favorite</span>
                      <span>{user.stats?.likesReceived || 0} Likes</span>
                    </div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-gray-300 dark:text-gray-600">chevron_right</span>
              </div>
            ))
          )
        ) : (
          !searching && searchTerm && (
            <div className="text-center py-10">
              <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">search_off</span>
              <p className="text-gray-500 text-sm">No {searchMode} found.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Search;