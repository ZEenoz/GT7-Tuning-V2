import React from 'react';
import { NavLink } from 'react-router-dom';

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 w-full border-t border-gray-200 dark:border-white/5 bg-white/95 dark:bg-background-dark/95 backdrop-blur-lg pb-safe max-w-lg mx-auto transition-colors duration-300">
      <div className="flex h-16 items-center justify-around px-2">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-1 py-1 transition-colors ${isActive ? 'text-red-500' : 'text-gray-400 dark:text-text-secondary hover:text-gray-900 dark:hover:text-white'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span className={`material-symbols-outlined ${isActive ? 'filled' : ''}`}>dashboard</span>
              <span className="text-[10px] font-medium uppercase tracking-wide">Feed</span>
            </>
          )}
        </NavLink>

        <NavLink
          to="/garage"
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-1 py-1 transition-colors ${isActive ? 'text-red-500' : 'text-gray-400 dark:text-text-secondary hover:text-gray-900 dark:hover:text-white'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span className={`material-symbols-outlined ${isActive ? 'filled' : ''}`}>garage_home</span>
              <span className="text-[10px] font-medium uppercase tracking-wide">Garage</span>
            </>
          )}
        </NavLink>

        <NavLink
          to="/add-tune"
          className="flex flex-col items-center justify-center w-16 relative group -top-5"
        >
          <div className="size-14 rounded-full bg-gradient-to-tr from-red-600 to-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/30 border-[4px] border-white dark:border-background-dark active:scale-95 transition-transform group-hover:scale-105">
            <span className="material-symbols-outlined text-[32px]">add</span>
          </div>
        </NavLink>

        <NavLink
          to="/search"
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-1 py-1 transition-colors ${isActive ? 'text-red-500' : 'text-gray-400 dark:text-text-secondary hover:text-gray-900 dark:hover:text-white'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span className={`material-symbols-outlined ${isActive ? 'filled' : ''}`}>search</span>
              <span className="text-[10px] font-medium uppercase tracking-wide">Search</span>
            </>
          )}
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-1 py-1 transition-colors ${isActive ? 'text-red-500' : 'text-gray-400 dark:text-text-secondary hover:text-gray-900 dark:hover:text-white'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span className={`material-symbols-outlined ${isActive ? 'filled' : ''}`}>person</span>
              <span className="text-[10px] font-medium uppercase tracking-wide">Profile</span>
            </>
          )}
        </NavLink>
      </div>
    </nav>
  );
}