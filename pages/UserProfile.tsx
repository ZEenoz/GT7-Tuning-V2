import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, increment, setDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const UserProfile = () => {
    const { uid } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const [userProfile, setUserProfile] = useState<any>(null);
    const [tunes, setTunes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Independent States
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [isFollowing, setIsFollowing] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!uid) return;
            setLoading(true);
            try {
                // 1. Fetch User Profile
                const userDocRef = doc(db, 'users', uid);
                const userSnap = await getDoc(userDocRef);

                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    setUserProfile(userData);
                    setLikeCount(userData.stats?.likesReceived || 0);

                    // 2. Check Statuses
                    if (currentUser) {
                        // Check Follow Status
                        const followRef = doc(db, 'users', uid, 'followers', currentUser.uid);
                        const followSnap = await getDoc(followRef);
                        setIsFollowing(followSnap.exists());

                        // Check Like Status
                        const likeRef = doc(db, 'users', uid, 'profile_likes', currentUser.uid);
                        const likeSnap = await getDoc(likeRef);
                        setIsLiked(likeSnap.exists());
                    }

                    // 3. Fetch User's Tunes
                    const tunesRef = collection(db, 'tunes');
                    const q = query(tunesRef, where('userId', '==', uid));
                    const tunesSnap = await getDocs(q);
                    setTunes(tunesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                } else {
                    console.log("No such user!");
                }
            } catch (error) {
                console.error("Error fetching user profile:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [uid, currentUser]);

    const handleFollow = async () => {
        if (!currentUser) return alert("Please login to follow users.");
        if (currentUser.uid === uid) return;

        const newFollowing = !isFollowing;
        setIsFollowing(newFollowing); // Optimistic

        try {
            const followerRef = doc(db, 'users', uid!, 'followers', currentUser.uid);
            const followingRef = doc(db, 'users', currentUser.uid, 'following', uid!);

            if (newFollowing) {
                await setDoc(followerRef, {
                    val: true,
                    displayName: currentUser.displayName,
                    photoURL: currentUser.photoURL,
                    timestamp: new Date().toISOString()
                });
                await setDoc(followingRef, {
                    val: true,
                    displayName: userProfile.displayName,
                    photoURL: userProfile.photoURL,
                    timestamp: new Date().toISOString()
                });
            } else {
                await deleteDoc(followerRef);
                await deleteDoc(followingRef);
            }
        } catch (error) {
            console.error("Error toggling follow:", error);
            setIsFollowing(!newFollowing);
        }
    };

    const handleLike = async () => {
        if (!currentUser) return alert("Please login to like users.");
        if (currentUser.uid === uid) return; // Cannot like self

        const newLiked = !isLiked;
        setIsLiked(newLiked);
        setLikeCount(prev => newLiked ? prev + 1 : prev - 1);

        try {
            const userRef = doc(db, 'users', uid!);
            const likeRef = doc(db, 'users', uid!, 'profile_likes', currentUser.uid);

            if (newLiked) {
                await setDoc(likeRef, { val: true, timestamp: new Date().toISOString() });
                await updateDoc(userRef, { 'stats.likesReceived': increment(1) });
            } else {
                await deleteDoc(likeRef);
                await updateDoc(userRef, { 'stats.likesReceived': increment(-1) });
            }
        } catch (error) {
            console.error("Error toggling like:", error);
            setIsLiked(!newLiked);
            setLikeCount(prev => !newLiked ? prev + 1 : prev - 1);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-background-light dark:bg-black flex items-center justify-center transition-colors duration-300">
            <span className="material-symbols-outlined animate-spin text-gray-400 text-3xl">refresh</span>
        </div>
    );

    if (!userProfile) return (
        <div className="min-h-screen bg-background-light dark:bg-black text-white p-10 text-center transition-colors duration-300">
            User not found.
            <button onClick={() => navigate(-1)} className="block mx-auto mt-4 text-red-500 font-bold">Go Back</button>
        </div>
    );

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen pb-28 text-gray-900 dark:text-white transition-colors duration-300 relative">
            {/* Top Bar */}
            <div className="sticky top-0 z-50 flex items-center bg-white/95 dark:bg-background-dark/95 backdrop-blur-md p-4 justify-between border-b border-gray-200 dark:border-gray-800/60 transition-colors duration-300">
                <button onClick={() => navigate(-1)} className="flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors rounded-full p-1 hover:bg-gray-100 dark:hover:bg-white/5">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h2 className="text-lg font-bold leading-tight tracking-wide uppercase">Racer Profile</h2>
                <div className="w-8"></div>
            </div>

            {/* Hero */}
            <div className="flex flex-col items-center p-6 gap-6 relative overflow-hidden bg-gray-50 dark:bg-transparent transition-colors duration-300">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-600/5 to-transparent pointer-events-none"></div>
                <div className="relative group z-10">
                    <div className="w-32 h-32 rounded-full p-[3px] bg-gradient-to-tr from-blue-600 to-cyan-500 shadow-2xl shadow-blue-500/30">
                        <div className="w-full h-full rounded-full bg-cover bg-center border-4 border-white dark:border-background-dark relative overflow-hidden" style={{ backgroundImage: `url('${userProfile.photoURL || "https://lh3.googleusercontent.com/aida-public/AB6AXuCV10hEITh2R5gil3fQ0VDuT6N_YI1u40qYjgvCCyaP3jc4IU_pvsFViZpU_qe0Uw9kcri1M--_UlURazwRwG3d5bEh1SSYvYLV_EbhyMLzrZCPu2WZR0vCjAOhZcMcMjH4cBy4tJuCpMYUeDBDF2V5AxzNwKrKBm_x_r2zkkRho4o3rUVm0hFTyxHI4nr9ZwYOHQSTeGFUjmkY6Ke6gc4Yg_l_pWVPVXODUuFTfsvK1_SIEZ5T5_Vi5RVD22JfazvN2z5QxmGE5Q"}')` }}></div>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-1 z-10">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{userProfile.displayName || "Racer"}</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <button
                            onClick={handleLike}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${isLiked
                                ? 'bg-red-600 text-white shadow-lg shadow-red-500/30'
                                : 'bg-white dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/20'
                                }`}
                        >
                            <span className={`material-symbols-outlined text-[18px] ${isLiked ? 'fill-current' : ''}`}>{isLiked ? 'favorite' : 'favorite'}</span>
                            {isLiked ? 'Liked' : 'Like'}
                        </button>

                        <button
                            onClick={handleFollow}
                            className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${isFollowing
                                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent shadow-lg'
                                : 'bg-transparent border-gray-300 dark:border-white/30 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10'
                                }`}
                        >
                            <span className="material-symbols-outlined text-[18px]">{isFollowing ? 'check' : 'add'}</span>
                            {isFollowing ? 'Following' : 'Follow'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="px-4 pb-2">
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white dark:bg-surface-dark rounded-xl p-4 border border-gray-200 dark:border-gray-800 flex flex-col justify-between h-20 shadow-sm">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Tunes</span>
                        <p className="font-bold text-2xl text-gray-900 dark:text-white">{tunes.length}</p>
                    </div>
                    <div className="bg-white dark:bg-surface-dark rounded-xl p-4 border border-gray-200 dark:border-gray-800 flex flex-col justify-between h-20 shadow-sm">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Likes</span>
                        <p className="font-bold text-2xl text-gray-900 dark:text-white">{likeCount}</p>
                    </div>
                </div>
            </div>

            {/* User's Garage */}
            <div className="pt-6 px-4">
                <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-[0.15em] mb-3 px-1">{userProfile.displayName}'s Garage</h3>
                <div className="space-y-3">
                    {tunes.map((tune) => (
                        <div key={tune.id} onClick={() => navigate('/tune-details', { state: { tune } })} className="bg-white dark:bg-surface-dark rounded-xl p-3 border border-gray-200 dark:border-gray-800 flex gap-3 shadow-sm cursor-pointer hover:border-blue-500/30 transition-colors">
                            <div className="w-20 h-20 bg-gray-200 dark:bg-black rounded-lg bg-cover bg-center shrink-0" style={{ backgroundImage: tune.img ? `url('${tune.img}')` : undefined }}>
                                {!tune.img && <div className="h-full flex items-center justify-center text-gray-400"><span className="material-symbols-outlined">directions_car</span></div>}
                            </div>
                            <div className="flex-1 min-w-0 py-1">
                                <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">{tune.carName}</h4>
                                <div className="flex gap-2 mt-1">
                                    <span className="text-[10px] bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400 font-bold">{tune.pp || tune.stats?.pp} PP</span>
                                    <span className="text-[10px] text-gray-400 mt-0.5">{tune.stats?.power} HP</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {tunes.length === 0 && (
                        <div className="text-center py-8 text-gray-500 text-xs">No public tunes shared.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
