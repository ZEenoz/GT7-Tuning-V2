import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../firebase';
import { collection, query, where, getDocs, limit, doc, setDoc, getDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';

const Profile = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [tunes, setTunes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ tunesCreated: 0, likesReceived: 0 });

  // Edit Profile State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhoto, setEditPhoto] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Following System
  const [followingCount, setFollowingCount] = useState(0);
  const [followingList, setFollowingList] = useState<any[]>([]);
  const [showFollowingModal, setShowFollowingModal] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;

      // Init edit fields
      setEditName(currentUser.displayName || "");
      setEditPhoto(currentUser.photoURL || "");

      try {
        // 1. Fetch User Stats (Likes) from Firestore Profile
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userDocRef);
        let userLikes = 0;
        if (userSnap.exists()) {
          const userData = userSnap.data();
          userLikes = userData.stats?.likesReceived || 0;
        }

        // 2. Fetch User Tunes (for list & count)
        const tunesRef = collection(db, 'tunes');
        const q = query(tunesRef, where('userId', '==', currentUser.uid), limit(10));

        const snapshot = await getDocs(q);
        const userTunes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // 3. Fetch Following Count
        const followingRef = collection(db, 'users', currentUser.uid, 'following');
        const followingSnap = await getDocs(followingRef);
        const fList = followingSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setFollowingList(fList);
        setFollowingCount(followingSnap.size);

        setTunes(userTunes);
        setStats({
          tunesCreated: snapshot.size,
          likesReceived: userLikes
        });

      } catch (error) {
        console.error("Error fetching profile data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setEditPhoto(URL.createObjectURL(file)); // Immediate preview
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    setIsSaving(true);
    setSaveStatus("Saving...");
    try {
      let photoURL = editPhoto;

      // Upload Image if selected
      if (imageFile) {
        console.log(`Original Profile Image Size: ${imageFile.size / 1024 / 1024} MB`);

        setSaveStatus("Compressing...");
        const options = {
          maxSizeMB: 0.1, // Aggressive: 100KB for avatars
          maxWidthOrHeight: 512, // Aggressive: 512px
          useWebWorker: true,
        };

        try {
          const compressedFile = await imageCompression(imageFile, options);
          console.log(`Compressed Profile Image Size: ${compressedFile.size / 1024 / 1024} MB`);

          setSaveStatus("Uploading...");
          const storageRef = ref(storage, `profile_images/${currentUser.uid}_${Date.now()}`);
          await uploadBytes(storageRef, compressedFile);
          photoURL = await getDownloadURL(storageRef);
        } catch (error) {
          console.error("Error compressing profile image:", error);
          setSaveStatus("Uploading (Raw)...");
          const storageRef = ref(storage, `profile_images/${currentUser.uid}_${Date.now()}`);
          await uploadBytes(storageRef, imageFile);
          photoURL = await getDownloadURL(storageRef);
        }
      }

      await updateProfile(currentUser, {
        displayName: editName,
        photoURL: photoURL
      });

      // Sync to Firestore for Search Visibility
      await setDoc(doc(db, "users", currentUser.uid), {
        displayName: editName,
        photoURL: photoURL,
        email: currentUser.email,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setIsEditing(false);
      setImageFile(null); // Reset
      window.location.reload();
    } catch (error) {
      console.error("Error updating profile", error);
      alert("Failed to update profile.");
    } finally {
      setIsSaving(false);
      setSaveStatus("");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  if (!currentUser) return null;

  const userLevel = Math.min(50, Math.floor(stats.tunesCreated) + 1);

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen pb-28 text-gray-900 dark:text-white transition-colors duration-300 relative">

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121212] w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-white/10 animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
              <h3 className="font-bold text-lg dark:text-white">Edit Profile</h3>
              <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Photo Preview & Upload */}
              <div className="flex flex-col items-center mb-4 gap-3">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="size-24 rounded-full bg-cover bg-center ring-4 ring-gray-100 dark:ring-white/10 bg-gray-100 dark:bg-gray-800 shadow-xl" style={{ backgroundImage: `url('${editPhoto || "https://lh3.googleusercontent.com/aida-public/AB6AXuCV10hEITh2R5gil3fQ0VDuT6N_YI1u40qYjgvCCyaP3jc4IU_pvsFViZpU_qe0Uw9kcri1M--_UlURazwRwG3d5bEh1SSYvYLV_EbhyMLzrZCPu2WZR0vCjAOhZcMcMjH4cBy4tJuCpMYUeDBDF2V5AxzNwKrKBm_x_r2zkkRho4o3rUVm0hFTyxHI4nr9ZwYOHQSTeGFUjmkY6Ke6gc4Yg_l_pWVPVXODUuFTfsvK1_SIEZ5T5_Vi5RVD22JfazvN2z5QxmGE5Q"}')` }}></div>
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-white text-3xl">upload</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    hidden
                    onChange={handleImageChange}
                    accept="image/*"
                  />
                  <button
                    onClick={() => {
                      const randomSeed = Math.random().toString(36).substring(7);
                      const randomAvatar = `https://api.dicebear.com/9.x/avataaars/svg?seed=${randomSeed}`;
                      setEditPhoto(randomAvatar);
                      setImageFile(null);
                    }}
                    className="text-xs bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-full font-bold flex items-center gap-1 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">shuffle</span>
                    Random Avatar
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Display Name</label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg p-2.5 text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                  placeholder="Enter your name"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Photo URL</label>
                <input
                  value={editPhoto}
                  onChange={(e) => {
                    setEditPhoto(e.target.value);
                    setImageFile(null); // Clear file choice if they type URL manually
                  }}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg p-2.5 text-xs text-gray-600 dark:text-gray-300 focus:ring-2 focus:ring-red-500 outline-none transition-all font-mono"
                  placeholder="https://..."
                />
                <p className="text-[10px] text-gray-400">Click avatar to upload, or paste URL above.</p>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
              >
                {isSaving ? <span className="material-symbols-outlined animate-spin text-xl">refresh</span> : <>
                  <span className="material-symbols-outlined text-xl">save</span>
                  Save Changes
                </>}
                {isSaving && <span className="text-xs font-normal opacity-80 ml-1">({saveStatus})</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div className="sticky top-0 z-50 flex items-center bg-white/95 dark:bg-background-dark/95 backdrop-blur-md p-4 justify-between border-b border-gray-200 dark:border-gray-800/60 transition-colors duration-300">
        <button onClick={() => navigate('/settings')} className="flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors rounded-full p-1 hover:bg-gray-100 dark:hover:bg-white/5">
          <span className="material-symbols-outlined">settings</span>
        </button>
        <h2 className="text-lg font-bold leading-tight tracking-wide uppercase">Profile</h2>
        <button className="flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors rounded-full p-1 hover:bg-gray-100 dark:hover:bg-white/5">
        </button>
      </div>

      {/* Hero */}
      <div className="flex flex-col items-center p-6 gap-6 relative overflow-hidden bg-gray-50 dark:bg-transparent transition-colors duration-300">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-red-600/5 to-transparent pointer-events-none"></div>
        <div className="relative group z-10">
          <div className="w-32 h-32 rounded-full p-[3px] bg-gradient-to-tr from-red-600 to-orange-500 shadow-2xl shadow-red-500/30">
            <div className="w-full h-full rounded-full bg-cover bg-center border-4 border-white dark:border-background-dark relative overflow-hidden" style={{ backgroundImage: `url('${currentUser.photoURL || "https://lh3.googleusercontent.com/aida-public/AB6AXuCV10hEITh2R5gil3fQ0VDuT6N_YI1u40qYjgvCCyaP3jc4IU_pvsFViZpU_qe0Uw9kcri1M--_UlURazwRwG3d5bEh1SSYvYLV_EbhyMLzrZCPu2WZR0vCjAOhZcMcMjH4cBy4tJuCpMYUeDBDF2V5AxzNwKrKBm_x_r2zkkRho4o3rUVm0hFTyxHI4nr9ZwYOHQSTeGFUjmkY6Ke6gc4Yg_l_pWVPVXODUuFTfsvK1_SIEZ5T5_Vi5RVD22JfazvN2z5QxmGE5Q"}')` }}>
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 z-10">
            <div className="bg-white dark:bg-background-dark rounded-full p-1">
              <div className="bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full border-2 border-white dark:border-background-dark uppercase tracking-wider shadow-lg">
                Lvl {userLevel}
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1 z-10">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{currentUser.displayName || "Racer"}</h1>
        </div>
        <div className="flex gap-3 w-full max-w-[320px] justify-center z-10">
          <button onClick={() => setIsEditing(true)} className="flex-1 h-10 bg-red-600 hover:bg-red-500 active:scale-100 text-white text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/10">
            <span className="material-symbols-outlined text-[18px]">edit_square</span>
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* Activity Summary */}
      <div className="px-4 pb-2">
        <div className="flex items-center justify-between px-1 mb-3">
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-[0.15em]">Activity Summary</h3>
          <button className="text-red-500 text-xs font-bold hover:text-red-400 transition-colors flex items-center">
            Details <span className="material-symbols-outlined text-sm ml-0.5">chevron_right</span>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Tunes Created", val: stats.tunesCreated, icon: "tune" },
            { label: "Likes Received", val: stats.likesReceived, icon: "favorite" },
            { label: "Following", val: followingCount, icon: "group", action: () => setShowFollowingModal(true) },
          ].map((stat: any, i) => (
            <div key={i} onClick={stat.action} className={`bg-white dark:bg-surface-dark rounded-xl p-4 border border-gray-200 dark:border-gray-800 flex flex-col justify-between h-24 relative overflow-hidden group hover:border-red-500/30 transition-colors shadow-sm ${stat.action ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5' : ''}`}>
              <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-4xl text-red-500">{stat.icon}</span>
              </div>
              <div className="flex items-center gap-2 text-red-500/80 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">{stat.label}</span>
              </div>
              <p className={`font-bold tracking-tight text-gray-900 dark:text-white ${stat.textClass || "text-3xl"}`}>{stat.val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Following List Modal */}
      {showFollowingModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121212] w-full max-w-sm h-[400px] flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-white/10 animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-white/50 dark:bg-white/5 backdrop-blur-md">
              <h3 className="font-bold text-lg dark:text-white">Following ({followingCount})</h3>
              <button onClick={() => setShowFollowingModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {followingList.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <span className="material-symbols-outlined text-3xl mb-2">group_off</span>
                  <p className="text-xs">You are not following anyone yet.</p>
                </div>
              ) : (
                followingList.map(user => (
                  <button
                    key={user.id}
                    onClick={() => { setShowFollowingModal(false); navigate(`/user/${user.id}`); }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left"
                  >
                    <div className="size-10 rounded-full bg-cover bg-center bg-gray-200 dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-white/10" style={{ backgroundImage: `url('${user.photoURL || "https://lh3.googleusercontent.com/aida-public/AB6AXuCV10hEITh2R5gil3fQ0VDuT6N_YI1u40qYjgvCCyaP3jc4IU_pvsFViZpU_qe0Uw9kcri1M--_UlURazwRwG3d5bEh1SSYvYLV_EbhyMLzrZCPu2WZR0vCjAOhZcMcMjH4cBy4tJuCpMYUeDBDF2V5AxzNwKrKBm_x_r2zkkRho4o3rUVm0hFTyxHI4nr9ZwYOHQSTeGFUjmkY6Ke6gc4Yg_l_pWVPVXODUuFTfsvK1_SIEZ5T5_Vi5RVD22JfazvN2z5QxmGE5Q"}')` }}></div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{user.displayName || "Unknown Racer"}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">Tap to view profile</p>
                    </div>
                    <div className="ml-auto">
                      <span className="material-symbols-outlined text-gray-300 dark:text-gray-600">chevron_right</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* My Garage */}
      <div className="pt-6">
        <div className="flex items-center justify-between px-5 mb-3">
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-[0.15em]">My Garage</h3>
          <button onClick={() => navigate('/garage')} className="text-red-500 text-xs font-bold hover:text-red-400 transition-colors flex items-center">
            View All <span className="material-symbols-outlined text-sm ml-0.5">chevron_right</span>
          </button>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><span className="material-symbols-outlined animate-spin text-gray-400">refresh</span></div>
        ) : tunes.length === 0 ? (
          <div className="text-center py-6 text-gray-500 text-xs">No tunes yet. Go add one!</div>
        ) : (
          <div className="flex overflow-x-auto no-scrollbar px-4 pb-4 gap-4 snap-x snap-mandatory">
            {tunes.map((item, i) => (
              <div key={item.id || i} onClick={() => navigate('/tune-details', { state: { tune: item } })} className="snap-center shrink-0 w-64 bg-white dark:bg-surface-dark rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col shadow-sm group cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
                <div className="h-36 bg-cover bg-center relative bg-gray-200 dark:bg-gray-800" style={{ backgroundImage: item.img ? `url('${item.img}')` : undefined }}>
                  {!item.img && <div className="absolute inset-0 flex items-center justify-center text-gray-400"><span className="material-symbols-outlined text-4xl">directions_car</span></div>}
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/10 dark:from-black/90 dark:via-black/20 to-transparent"></div>
                  <div className="absolute bottom-3 left-3 flex gap-2">
                    <span className="bg-red-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">{item.stats?.pp || item.pp || "0"} PP</span>
                  </div>
                </div>
                <div className="p-3">
                  <div className="flex justify-between items-start">
                    <p className="text-base font-bold truncate pr-2 text-gray-900 dark:text-white">{item.carName}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="material-symbols-outlined text-[16px] text-gray-500 dark:text-gray-400">speed</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {item.stats?.power ? `${item.stats.power} HP` : 'Custom Tune'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Settings Links */}
      <div className="px-4 py-6">
        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-[0.15em] mb-3 px-1">Settings</h3>
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden shadow-sm">
          {[
            { label: "Settings", icon: "settings" },
            { label: "Log Out", icon: "logout", danger: true }
          ].map((item, i) => (
            <button key={i} onClick={() => {
              if (item.label === 'Log Out') {
                handleLogout();
              } else if (item.label === 'Settings') {
                navigate('/settings');
              }
            }} className={`w-full flex items-center justify-between p-4 transition-colors ${item.danger ? 'hover:bg-red-50 dark:hover:bg-red-900/10 group' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}>
              <div className="flex items-center gap-3">
                <div className={`size-9 rounded-lg flex items-center justify-center border ${item.danger ? 'bg-red-50 dark:bg-red-900/10 text-red-500 border-red-100 dark:border-red-900/30' : 'bg-gray-100 dark:bg-background-dark text-red-500 border-gray-200 dark:border-gray-700'}`}>
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                </div>
                <span className={`font-medium text-sm ${item.danger ? 'text-red-500' : 'text-gray-900 dark:text-gray-200'}`}>{item.label}</span>
              </div>
              {!item.danger && (
                <span className="material-symbols-outlined text-gray-400 dark:text-gray-400 text-[20px]">chevron_right</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
export default Profile;