import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, orderBy, limit, onSnapshot, where, getDocs } from 'firebase/firestore';

const Feed = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [tunes, setTunes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('trending'); // trending, newest, following

  useEffect(() => {
    setLoading(true);

    const fetchFeed = async () => {
      let q;

      if (activeTab === 'following') {
        if (!currentUser) {
          setTunes([]);
          setLoading(false);
          return;
        }

        // 1. Get people I follow
        const followingRef = collection(db, 'users', currentUser.uid, 'following');
        const followingSnap = await getDocs(followingRef);
        const followingIds = followingSnap.docs.map(doc => doc.id);

        if (followingIds.length === 0) {
          setTunes([]);
          setLoading(false);
          return;
        }

        // 2. Query tunes from these users (Limit to first 10 followed users for MVP Firestore 'in' limit)
        // In production, you would pagination or 'fan-out' this data on write.
        const slicedIds = followingIds.slice(0, 10);
        q = query(collection(db, 'tunes'), where('userId', 'in', slicedIds), limit(50));
      } else {
        // Default / Trending / Newest
        // For MVP 'trending' = just the list (since we don't have complex sorting indexes yet)
        q = query(collection(db, 'tunes'), limit(50));
      }

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const tunesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTunes(tunesData);
        setLoading(false);
      });
      return unsubscribe;
    };

    // Need to handle async subscription cleaner
    let unsub: any;
    fetchFeed().then(u => unsub = u);

    return () => {
      if (unsub && typeof unsub === 'function') unsub();
    };
  }, [activeTab, currentUser]);

  // Helper to format tire string (e.g., "Racing: Soft" -> "RS")
  const formatTire = (tireString: string) => {
    if (!tireString) return "N/A";

    // Racing
    if (tireString === "Racing: Hard") return "RH";
    if (tireString === "Racing: Medium") return "RM";
    if (tireString === "Racing: Soft") return "RS";

    // Sports
    if (tireString === "Sports: Hard") return "SH";
    if (tireString === "Sports: Medium") return "SM";
    if (tireString === "Sports: Soft") return "SS";

    // Comfort
    if (tireString === "Comfort: Hard") return "CH";
    if (tireString === "Comfort: Medium") return "CM";
    if (tireString === "Comfort: Soft") return "CS";

    // Wet
    if (tireString === "Intermediate") return "IM";
    if (tireString === "Heavy Wet") return "W";

    // Fallback logic if string varies (e.g. from older inputs)
    let prefix = "";
    if (tireString.includes("Racing")) prefix = "R";
    else if (tireString.includes("Sports")) prefix = "S";
    else if (tireString.includes("Comfort")) prefix = "C";

    let suffix = "";
    if (tireString.includes("Hard")) suffix = "H";
    else if (tireString.includes("Medium")) suffix = "M";
    else if (tireString.includes("Soft")) suffix = "S";

    if (prefix && suffix) return prefix + suffix;

    return "N/A";
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-gray-200 dark:border-white/5 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md transition-colors duration-300">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="relative cursor-pointer" onClick={() => navigate('/profile')}>
              <div className="size-10 rounded-full bg-cover bg-center ring-2 ring-gray-200 dark:ring-white/10" style={{ backgroundImage: `url('${currentUser?.photoURL || "https://lh3.googleusercontent.com/aida-public/AB6AXuCV10hEITh2R5gil3fQ0VDuT6N_YI1u40qYjgvCCyaP3jc4IU_pvsFViZpU_qe0Uw9kcri1M--_UlURazwRwG3d5bEh1SSYvYLV_EbhyMLzrZCPu2WZR0vCjAOhZcMcMjH4cBy4tJuCpMYUeDBDF2V5AxzNwKrKBm_x_r2zkkRho4o3rUVm0hFTyxHI4nr9ZwYOHQSTeGFUjmkY6Ke6gc4Yg_l_pWVPVXODUuFTfsvK1_SIEZ5T5_Vi5RVD22JfazvN2z5QxmGE5Q"}')` }}></div>
              <div className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-green-500 ring-2 ring-white dark:ring-[#111318]"></div>
            </div>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Tuning Feed</h1>
          <button onClick={() => navigate('/search')} className="flex size-10 items-center justify-center rounded-full text-gray-500 dark:text-white hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/20 transition-colors">
            <span className="material-symbols-outlined">search</span>
          </button>
        </div>
        <div className="px-4 pb-3">
          <div className="flex h-10 w-full rounded-lg bg-gray-100 dark:bg-surface-dark p-1 transition-colors">
            {['Trending', 'Newest', 'Following'].map((tab) => {
              const val = tab.toLowerCase();
              const isActive = activeTab === val;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(val)}
                  className={`flex-1 rounded-md text-sm font-medium transition-all ${isActive ? 'bg-white dark:bg-background-dark text-gray-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/5' : 'text-gray-500 dark:text-text-secondary hover:text-gray-900 dark:hover:text-white'}`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="flex flex-col gap-6 px-4 pt-4 pb-24">
        {/* Weekly Challenge - Static Placeholder */}
        <section>
          <div className="group relative overflow-hidden rounded-xl bg-white dark:bg-surface-dark shadow-lg ring-1 ring-black/5 dark:ring-white/5 transition-transform active:scale-[0.99]">
            <div className="absolute inset-0 z-0">
              <div className="h-full w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDKjHvM1RUw3MbmOp1U-LtGOIoguXapADErSGfSri39dkrBmdboMlKHX2cPRwxZFnmoa2G2sY3Eg1pOZX_GYSVF374hQBYiGy6R5AX8_B1koS8k_ICQ6Ed-gjX53f1h-1xd-0Kuo4wfpVw2zYI7UB28ygFqMCwE0UgfV8DU_rVZSCmmuiFmSKwjB876H0-aBEL820bPJpzrXK4p4-dF9F9nI_sAEfY0NdwDkoi520fwKKo72UaZbygewE60BFBG7Gew1u9qmlQiJA')` }}></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
            </div>
            <div className="relative z-10 flex flex-col justify-end p-5 pt-32">
              <div className="mb-2 inline-flex w-fit items-center gap-1 rounded bg-red-600/20 px-2 py-0.5 text-xs font-bold text-red-400 backdrop-blur-sm border border-red-500/20">
                <span className="material-symbols-outlined text-[14px]">local_fire_department</span>
                WEEKLY CHALLENGE
              </div>
              <h2 className="text-2xl font-bold leading-tight text-white">Deep Forest Raceway</h2>
              <p className="mt-1 text-sm text-gray-300">Recommended: 650 PP • Gr.3 Cars</p>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex -space-x-2">
                  <div className="size-8 rounded-full ring-2 ring-white dark:ring-[#0A0A0A] bg-gray-700 bg-cover" style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDWqLnSURHGbn_y3Jpd5i3cqrUb_wXDpokjtZZjuuatuu_v0T8z2i3YtnlZjE_Uhu_2hiSFI4UX_GGrZOJJH7xcB92IGDX7DBavCEdcYn0J1H3oQgXXsWG-5uEWmcqeXcsDJSombuQPnsRdvQpYhHPDBc_hVCZG6A97AdQfjMbKP5IeBIkA4No1zaIyRCDGrSvOg88Jm2DN5AGUi9dIyYqpx_wvPVmXsb03U90iuUpTq7gjZOoiqGQUwHLEZoEvsZIQUEAJJdqulQ')` }}></div>
                  <div className="size-8 rounded-full ring-2 ring-white dark:ring-[#0A0A0A] bg-gray-600 bg-cover" style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuBNaQ2rTT7gvbBxbl_6YIjMbvg8IW30jQO9yk4jIA-lEkOPCBKy9WJZRUxV35xHez23n6dYw42T0jDC5Io3qz4K3iMnrBBm77m-jlLQOsQ_CyzXHOlxF8uSssLaiB4LjazjU72cBy2b3k-qiUXTcj1GNrQGgxVLy0n16UNnnsZrYbl0b4tiOIIWzidzZqLm-vT5VU20uWVBBXmp_fqSN1SjZQtbQPBOVjQcpNZvA9tBB8sY6F78wOzrOjGc0X-LAlH1ON4PbdOIXA')` }}></div>
                  <div className="flex size-8 items-center justify-center rounded-full bg-white dark:bg-surface-dark ring-2 ring-white dark:ring-[#0A0A0A] text-xs font-medium text-gray-900 dark:text-white">+42</div>
                </div>
                <button onClick={() => navigate('/search')} className="flex items-center gap-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-red-500/25 transition-colors hover:bg-red-500">
                  View Tunes
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4">
          <button className="flex shrink-0 items-center gap-2 rounded-lg bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/5 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-surface-darker active:bg-gray-100 dark:active:bg-red-600 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[18px] text-red-500">filter_list</span>
            Filters
          </button>
          {['600 PP', '700 PP', 'Drift Setup', 'Rain Master', 'Drag Spec'].map((tag) => (
            <button key={tag} className="flex shrink-0 items-center justify-center rounded-lg bg-white dark:bg-surface-dark px-4 py-2 text-sm font-medium text-gray-600 dark:text-white hover:bg-gray-50 dark:hover:bg-surface-darker border border-transparent hover:border-gray-200 dark:hover:border-transparent transition-colors shadow-sm dark:shadow-none">
              {tag}
            </button>
          ))}
        </section>

        {/* Feed Items */}
        <section className="flex flex-col gap-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
              <span className="material-symbols-outlined text-3xl animate-spin mb-2">refresh</span>
              <p className="text-xs font-medium uppercase tracking-wider">Loading Feed...</p>
            </div>
          ) : tunes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-gray-500">
              <span className="material-symbols-outlined text-4xl mb-2 text-gray-200 dark:text-white/10">feed</span>
              <p className="text-sm font-bold text-gray-900 dark:text-white">No tunes found</p>
              <p className="text-xs">Be the first to share a tune!</p>
            </div>
          ) : (
            tunes.map((item, idx) => (
              <article key={item.id || idx} onClick={() => navigate('/tune-details', { state: { tune: item } })} className="flex flex-col rounded-xl bg-white dark:bg-surface-dark shadow-[0_2px_8px_rgba(0,0,0,0.05)] dark:shadow-md ring-1 ring-black/5 dark:ring-white/5 overflow-hidden cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-all active:scale-[0.99]">

                {/* Image Section */}
                <div className="relative h-48 w-full bg-gray-200 dark:bg-gray-800">
                  <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url('${item.img || (idx % 2 === 0 ? "https://lh3.googleusercontent.com/aida-public/AB6AXuAf7f9e7WfWay4KIrkighsu-NEAi3GuAyIdLcCOrSoUuP--RZAiB1-KnxHlVeaWPtAnztsjlV5rFnsRkOQmuzl-fwJI6vozXE7p6JLSeP8vx3e3Dz6yxyRFM7iRbGu1Opngqp_FVvWgo-Ckp_MkiJb-sRVMMgIqw09Vwm_yVLaRFb0Q01pg3TyFqYE9rX10OLsq0DrGvua1V7hOlWLj4mIzWCas3Tm8hSgSbEhcQNGspQK9P0AygLAXBwx5Hr6cEWjSRO7jhjZS3g" : "https://lh3.googleusercontent.com/aida-public/AB6AXuAS8bDeg_aHAr0mVP_tJg-N98DIpwhfXwIwD0rkA9QzJNBvp43QzmrWQc2Gmklp-tLGQf4IwCp0epxTeb1s3yorg9mpb1ryeAuwR5joULRjkmCu6rxr5Qx_ndv5ujM0CMdFVjpRN__erCS7Bni-K20CLB26c-DL-cBLUMhJCOokWEgq3wy1rLktSGI6DZE_CMOpmZlHMRAu6noADc7LKN0IZD5V_roNHFi_Kq0rYybV1zZzIRXtEIpxDRANTj3TKOQ-EhebAxwklQ")}')` }}></div>

                  {/* PP Badge - Top Right */}
                  <div className="absolute top-3 right-3 bg-[#D92D20] text-white text-xs font-bold px-2 py-1 rounded shadow-md">
                    PP {item.pp || "N/A"}
                  </div>
                </div>

                {/* Content Section */}
                <div className="flex flex-col gap-3 p-4">
                  {/* Title & Subtitle */}
                  <div>
                    <h3 className="text-lg font-bold leading-tight text-gray-900 dark:text-white truncate">{item.carName || "Unknown Car"}</h3>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Community Tune</p>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 bg-gray-50 dark:bg-[#0F0F0F] rounded-lg p-3 border border-gray-100 dark:border-white/5">
                    {/* Power */}
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-gray-500 dark:text-gray-500 uppercase tracking-wider">Power</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{item.stats?.power || "-"}</span>
                    </div>

                    {/* Weight */}
                    <div className="flex flex-col gap-0.5 border-l border-gray-200 dark:border-white/10 pl-3">
                      <span className="text-[10px] font-bold text-gray-500 dark:text-gray-500 uppercase tracking-wider">Weight</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{item.stats?.weight || "-"}</span>
                    </div>

                    {/* Tires */}
                    <div className="flex flex-col gap-0.5 border-l border-gray-200 dark:border-white/10 pl-3">
                      <span className="text-[10px] font-bold text-gray-500 dark:text-gray-500 uppercase tracking-wider">Tires</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{formatTire(item.tyres?.f) || "-"}</span>
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      </main>
    </div>
  );
};

export default Feed;