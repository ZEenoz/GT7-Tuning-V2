import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const Onboarding = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [displayName, setDisplayName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        if (!displayName.trim()) {
            setError('Display Name is required');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // 1. Update Auth Profile
            await updateProfile(currentUser, {
                displayName: displayName
            });

            // 2. Create/Update Firestore User Doc
            await setDoc(doc(db, "users", currentUser.uid), {
                displayName: displayName,
                email: currentUser.email,
                photoURL: currentUser.photoURL,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                onboardingCompleted: true
            }, { merge: true });

            // 3. Redirect to Feed
            navigate('/');
        } catch (err) {
            console.error("Onboarding Error:", err);
            setError('Failed to save profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark text-gray-900 dark:text-white flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-300">
            <div className="absolute inset-0 bg-grid-slate-200/[0.04] bg-[bottom_1px_center] dark:bg-grid-slate-400/[0.05] [mask-image:linear-gradient(to_bottom,transparent,black)] pointer-events-none"></div>

            <div className="w-full max-w-md space-y-8 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl xl:text-5xl/none bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-500 dark:to-orange-400 mb-2">
                        Welcome, Racer!
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Before we hit the track, what should we call you?
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white dark:bg-surface-dark p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800/60 backdrop-blur-xl space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="displayName" className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            Display Name
                        </label>
                        <input
                            id="displayName"
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-lg font-bold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all"
                            placeholder="e.g. SpeedDemon99"
                            autoFocus
                            required
                        />
                        {error && <p className="text-red-500 text-xs font-bold mt-1">{error}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-500/25 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <span className="material-symbols-outlined animate-spin text-xl">refresh</span>
                        ) : (
                            <>
                                <span>Start Your Engine</span>
                                <span className="material-symbols-outlined text-xl">arrow_forward</span>
                            </>
                        )}
                    </button>
                </form>

                <p className="text-center text-xs text-gray-400 dark:text-gray-500">
                    You can change this anytime in your profile settings.
                </p>
            </div>
        </div>
    );
};

export default Onboarding;
