import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { AnimatePresence, motion } from 'framer-motion';

const Settings = () => {
  const navigate = useNavigate();
  const { logout, currentUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [syncing, setSyncing] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const handleSync = () => {
    setSyncing(true);
    // Simulate sync
    setTimeout(() => {
      setSyncing(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 2000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark text-gray-900 dark:text-white transition-colors duration-300">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-between border-b border-gray-200 dark:border-gray-800/50 backdrop-blur-md bg-opacity-95 dark:bg-opacity-95 transition-colors duration-300">
        <button onClick={() => navigate(-1)} className="text-gray-900 dark:text-white flex size-12 shrink-0 items-center justify-start cursor-pointer transition-opacity hover:opacity-70">
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </button>
        <h2 className="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">Settings</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Profile Header */}
        <div className="flex p-4 pb-6">
          <div className="flex w-full flex-col gap-4">
            <div className="flex gap-4 items-center">
              <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-20 w-20 ring-2 ring-red-500/50" style={{ backgroundImage: `url('${currentUser?.photoURL || "https://lh3.googleusercontent.com/aida-public/AB6AXuCV10hEITh2R5gil3fQ0VDuT6N_YI1u40qYjgvCCyaP3jc4IU_pvsFViZpU_qe0Uw9kcri1M--_UlURazwRwG3d5bEh1SSYvYLV_EbhyMLzrZCPu2WZR0vCjAOhZcMcMjH4cBy4tJuCpMYUeDBDF2V5AxzNwKrKBm_x_r2zkkRho4o3rUVm0hFTyxHI4nr9ZwYOHQSTeGFUjmkY6Ke6gc4Yg_l_pWVPVXODUuFTfsvK1_SIEZ5T5_Vi5RVD22JfazvN2z5QxmGE5Q"}')` }}></div>
              <div className="flex flex-col justify-center gap-1">
                <p className="text-gray-900 dark:text-white text-xl font-bold leading-tight tracking-[-0.015em]">{currentUser?.email?.split('@')[0] || "GT_Racer_99"}</p>
                <div className="flex items-center gap-2">
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="h-px bg-gray-200 dark:bg-gray-800 mx-4 mb-4"></div>

        {/* Preferences */}
        <div>
          <h3 className="text-gray-500 dark:text-[#92a4c9] text-xs font-bold uppercase tracking-wider px-4 pb-2 pt-2">Preferences</h3>

          <div onClick={toggleTheme} className="flex items-center gap-4 px-4 py-3 justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer rounded-lg mx-2">
            <div className="flex items-center gap-4">
              <div className="text-gray-400 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined">palette</span>
              </div>
              <p className="text-gray-900 dark:text-white text-base font-medium leading-normal flex-1 truncate">App Theme</p>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-gray-500 dark:text-[#92a4c9] text-sm font-normal capitalize">{theme} Mode</p>
              <span className="material-symbols-outlined text-gray-400 dark:text-gray-600 text-lg">chevron_right</span>
            </div>
          </div>
        </div>

        <div className="h-4"></div>

        {/* Notifications */}
        <div>
          <h3 className="text-gray-500 dark:text-[#92a4c9] text-xs font-bold uppercase tracking-wider px-4 pb-2">Notifications</h3>
          {[
            { label: "Push Notifications", checked: true, icon: "notifications" },
            { label: "New Community Tunes", checked: false, icon: "group" }
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 justify-between rounded-lg mx-2">
              <div className="flex items-center gap-4">
                <div className="text-gray-400 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined">{item.icon}</span>
                </div>
                <p className="text-gray-900 dark:text-white text-base font-medium leading-normal flex-1 truncate">{item.label}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked={item.checked} />
                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>
          ))}
        </div>

        <div className="h-4"></div>

        {/* Data Management */}
        <div>
          <h3 className="text-gray-500 dark:text-[#92a4c9] text-xs font-bold uppercase tracking-wider px-4 pb-2">Data Management</h3>
          <div onClick={handleSync} className="flex items-center gap-4 px-4 py-3 justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer rounded-lg mx-2 group">
            <div className="flex items-center gap-4">
              <div className={`text-red-500 flex items-center justify-center shrink-0 transition-transform ${syncing ? 'animate-spin' : 'group-hover:scale-110'}`}>
                <span className="material-symbols-outlined">sync</span>
              </div>
              <p className="text-red-500 text-base font-medium leading-normal flex-1 truncate">
                {syncing ? 'Syncing...' : 'Sync Now'}
              </p>
            </div>
            <div className="shrink-0 text-gray-500 dark:text-gray-600 text-xs">Last: Just now</div>
          </div>
        </div>

        <div className="h-4"></div>

        {/* Footer */}
        <div className="px-4 pb-8 flex flex-col gap-6 mt-6">
          <button onClick={handleLogout} className="w-full py-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 font-bold hover:bg-red-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            <span className="material-symbols-outlined">logout</span>
            Log Out
          </button>
          <div className="flex flex-col items-center justify-center gap-1">
            <p className="text-gray-500 dark:text-gray-600 text-xs font-mono">v1.0.0 (Build 2025.12.21)</p>
            <p className="text-gray-500 dark:text-gray-700 text-[10px]">© 2025 GT7 Tuning Companion</p>
          </div>
        </div>
      </div>

      {/* Sync Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-50 text-sm font-bold"
          >
            <span className="justify-center material-symbols-outlined text-lg">check_circle</span>
            Data Synced Successfully!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Settings;