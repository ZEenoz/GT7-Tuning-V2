import React, { useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const { login } = useAuth();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();

        try {
            setError("");
            setLoading(true);
            await login(emailRef.current?.value, passwordRef.current?.value);
            navigate("/garage");
        } catch {
            setError("Failed to log in");
        }

        setLoading(false);
    }

    return (
        <div className="min-h-screen bg-background-light dark:bg-black text-gray-900 dark:text-white font-display flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
            {/* Background Ambient */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-red-600/10 dark:from-red-900/20 to-transparent pointer-events-none"></div>

            <div className="w-full max-w-sm z-10">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-500">GT7 Tuner</h1>
                    <p className="text-xs font-bold text-red-600 dark:text-red-500 tracking-[0.2em] uppercase mt-1">Professional Companion</p>
                </div>

                <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-2xl p-8 shadow-xl dark:shadow-2xl backdrop-blur-sm transition-colors duration-300">
                    <h2 className="text-2xl font-bold mb-6 text-center tracking-wide">Sign In</h2>

                    {error && <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/50 text-red-600 dark:text-red-500 text-xs font-bold p-3 rounded mb-4 text-center">{error}</div>}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Email</label>
                            <input type="email" ref={emailRef} required className="w-full bg-gray-100 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded p-3 text-sm focus:border-red-500 focus:outline-none transition-colors text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600" placeholder="racer@example.com" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Password</label>
                            <input type="password" ref={passwordRef} required className="w-full bg-gray-100 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded p-3 text-sm focus:border-red-500 focus:outline-none transition-colors text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600" placeholder="••••••••" />
                        </div>

                        <button disabled={loading} type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded uppercase tracking-wider text-sm transition-all active:scale-95 shadow-lg shadow-red-500/20 dark:shadow-red-900/20 mt-4">
                            {loading ? "Signing In..." : "Sign In"}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
                        Need an account? <Link to="/register" className="text-gray-900 dark:text-white font-bold hover:underline">Sign Up</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
