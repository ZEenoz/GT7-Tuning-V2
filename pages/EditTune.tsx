import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { db, storage } from '../firebase';
import { doc, deleteDoc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { useAuth } from '../contexts/AuthContext';


// --- Helper Components ---
const InputField = ({ value, onChange, type = 'number', className = '', disabled }: any) => (
  <input
    type={type}
    value={value}
    onChange={(e) => onChange && onChange(e.target.value)}
    disabled={disabled}
    className={`w-full bg-transparent text-center font-bold text-gray-900 dark:text-white p-0 border-none focus:ring-0 focus:bg-black/5 dark:focus:bg-white/10 text-xs py-2 h-full ${disabled ? 'text-gray-400 dark:text-gray-300' : ''} ${className}`}
  />
);

const SectionHeader = ({ title, badge }: { title: string, badge?: string }) => (
  <div className="flex justify-between items-end px-1 pb-1 mt-3">
    <h3 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">{title}</h3>
    {badge && <span className="text-[9px] text-gray-500 dark:text-gray-300 font-bold uppercase bg-gray-100 dark:bg-white/5 px-1.5 py-0.5 rounded border border-gray-200 dark:border-white/10 tracking-tight">{badge}</span>}
  </div>
);

const TableHeader = () => (
  <div className="grid grid-cols-[1.8fr_1fr_1fr] bg-gray-100 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 text-[9px] font-bold text-gray-500 uppercase tracking-wider text-center py-1.5 transition-colors duration-300">
    <div className="text-left pl-3"></div>
    <div>Front</div>
    <div>Rear</div>
  </div>
);

const Row = ({ label, unit, front, rear, icon = false, onChangeFront, onChangeRear, disabled }: any) => (
  <div className="grid grid-cols-[1.8fr_1fr_1fr] items-center text-sm relative group hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-b border-gray-200 dark:border-white/5 last:border-0 h-9">
    <div className="pl-3 text-[11px] text-gray-500 dark:text-gray-300 font-medium leading-tight pr-1 flex items-center">
      {label} {unit && <span className="text-[9px] text-gray-400 dark:text-gray-500 ml-1">{unit}</span>}
    </div>
    <div className="relative h-full border-l border-gray-200 dark:border-white/5">
      {icon && <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[12px] text-gray-400 dark:text-gray-500 material-symbols-outlined scale-75">arrow_outward</span>}
      <InputField value={front} onChange={onChangeFront} disabled={disabled} />
    </div>
    <div className="relative h-full border-l border-gray-200 dark:border-white/5">
      {icon && <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[12px] text-gray-400 dark:text-gray-500 material-symbols-outlined scale-75 -scale-x-100">arrow_outward</span>}
      <InputField value={rear} onChange={onChangeRear} disabled={disabled} />
    </div>
  </div>
);

const SingleRow = ({ label, unit, val, disabled = false, onChange }: any) => (
  <div className="grid grid-cols-[1.8fr_2fr] items-center text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-b border-gray-200 dark:border-white/5 last:border-0 h-9">
    <div className="pl-3 text-[11px] text-gray-500 dark:text-gray-300 font-medium flex items-center">
      {label} {unit && <span className="text-[9px] text-gray-400 dark:text-gray-500 ml-1">{unit}</span>}
    </div>
    <div className="h-full border-l border-gray-200 dark:border-white/5">
      <InputField value={val} disabled={disabled} onChange={onChange} />
    </div>
  </div>
);

const tyreOptions = (
  <>
    <optgroup label="Comfort">
      <option value="Comfort: Hard">Comfort: Hard</option>
      <option value="Comfort: Medium">Comfort: Medium</option>
      <option value="Comfort: Soft">Comfort: Soft</option>
    </optgroup>
    <optgroup label="Sports">
      <option value="Sports: Hard">Sports: Hard</option>
      <option value="Sports: Medium">Sports: Medium</option>
      <option value="Sports: Soft">Sports: Soft</option>
    </optgroup>
    <optgroup label="Racing">
      <option value="Racing: Hard">Racing: Hard</option>
      <option value="Racing: Medium">Racing: Medium</option>
      <option value="Racing: Soft">Racing: Soft</option>
    </optgroup>
    <optgroup label="Wet">
      <option value="Intermediate">Intermediate</option>
      <option value="Heavy Wet">Heavy Wet</option>
    </optgroup>
  </>
);

const ToeSlider = ({ value, onChange, disabled }: { value: number, onChange?: (val: string) => void, disabled?: boolean }) => {
  const displayValue = Math.abs(value).toFixed(2);

  return (
    <div className={`flex flex-col items-center justify-center h-full w-full px-2 py-1 relative group/slider ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex items-center gap-1 absolute top-0.5 inset-x-0 justify-center pointer-events-none">
        <span className={`text-[10px] font-bold ${value < 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
          {value < 0 ? `${displayValue} IN` : value === 0 ? "0.00" : ""}
        </span>
        {value > 0 && (
          <span className="text-[10px] font-bold text-blue-500">
            {displayValue} OUT
          </span>
        )}
      </div>

      <input
        type="range"
        min="-1.00"
        max="1.00"
        step="0.01"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange && onChange(e.target.value)}
        className="w-full h-1 bg-gray-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-600 hover:[&::-webkit-slider-thumb]:scale-125 transition-all mt-3 disabled:cursor-not-allowed disabled:[&::-webkit-slider-thumb]:bg-gray-400"
      />
      {/* Center Indicator */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-px h-2 bg-gray-300 dark:bg-white/20 -mt-1 pointer-events-none"></div>
    </div>
  );
};

const ToeRow = ({
  label, front, rear,
  onChangeFront, onChangeRear, disabled
}: {
  label: string, front: number, rear: number,
  onChangeFront?: (val: string) => void, onChangeRear?: (val: string) => void, disabled?: boolean
}) => (
  <div className="grid grid-cols-[1.8fr_1fr_1fr] items-center text-sm relative border-b border-gray-200 dark:border-white/5 last:border-0 h-10">
    <div className="pl-3 text-[11px] text-gray-500 dark:text-gray-300 font-medium leading-tight pr-1 flex items-center">
      {label}
    </div>
    <div className="relative h-full border-l border-gray-200 dark:border-white/5">
      <ToeSlider value={front} onChange={onChangeFront} disabled={disabled} />
    </div>
    <div className="relative h-full border-l border-gray-200 dark:border-white/5">
      <ToeSlider value={rear} onChange={onChangeRear} disabled={disabled} />
    </div>
  </div>
);

const EditTune = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [tuneData, setTuneData] = useState<any>(null); // Original tune object
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  // Image Upload State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ownership check
  const isOwner = currentUser && tuneData && currentUser.uid === tuneData.userId;

  // --- State for Tuning Data (Initialized empty, then populated) ---
  const [carName, setCarName] = useState("");
  const [pp, setPp] = useState<number>(0);
  const [power, setPower] = useState<number>(0);
  const [torque, setTorque] = useState<number>(0);
  const [weight, setWeight] = useState<number>(0);
  const [balance, setBalance] = useState("");

  const [tyresFront, setTyresFront] = useState("Racing: Hard");
  const [tyresRear, setTyresRear] = useState("Racing: Hard");

  const [transmissionType, setTransmissionType] = useState("Normal");
  const [nitroInstalled, setNitroInstalled] = useState(false);

  const [suspension, setSuspension] = useState<any>({
    bodyHeight: { f: 0, r: 0 },
    antiRollBar: { f: 0, r: 0 },
    dampingComp: { f: 0, r: 0 },
    dampingExp: { f: 0, r: 0 },
    natFreq: { f: 0, r: 0 },
    camber: { f: 0, r: 0 },
    toe: { f: 0, r: 0 },
  });

  const [diff, setDiff] = useState<any>({
    initial: { f: 0, r: 0 },
    accel: { f: 0, r: 0 },
    braking: { f: 0, r: 0 },
    torqueVectoring: "None",
    distribution: "0 : 100"
  });

  const [aero, setAero] = useState<any>({ f: 0, r: 0 });
  const [ecu, setEcu] = useState<number>(100);
  const [ballast, setBallast] = useState<number>(0);
  const [ballastPos, setBallastPos] = useState<number>(0);
  const [restrictor, setRestrictor] = useState<number>(100);
  const [transmission, setTransmission] = useState<any>({ topSpeed: 0, manual: [] });
  const [nitro, setNitro] = useState<number>(0);

  // Load data on mount
  useEffect(() => {
    if (location.state?.tune) {
      const t = location.state.tune;
      setTuneData(t);

      // Populate state
      setCarName(t.carName || "");
      setImagePreview(t.img || null); // Load existing image
      setPp(t.pp || 0);
      setPower(t.stats?.power || 0);
      setTorque(t.stats?.torque || 0);
      setWeight(t.stats?.weight || 0);
      setBalance(t.stats?.balance || "0:0");

      setTyresFront(t.tyres?.f || "Racing: Hard");
      setTyresRear(t.tyres?.r || "Racing: Hard");

      setTransmissionType(t.parts?.transmission || "Normal");
      setNitroInstalled(t.parts?.nitro || false);

      if (t.settings) {
        setSuspension(t.settings.suspension || suspension);
        setDiff(t.settings.diff || diff);
        setAero(t.settings.aero || aero);
        setEcu(t.settings.ecu ?? 100);
        setBallast(t.settings.ballast ?? 0);
        setBallastPos(t.settings.ballastPos ?? 0);
        setRestrictor(t.settings.restrictor ?? 100);
        setTransmission(t.settings.transmission || transmission);
        setNitro(t.settings.nitroVal ?? 0);
      }
    } else {
      navigate('/garage');
    }
  }, [location, navigate]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this tune?")) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "tunes", tuneData.id));
      navigate('/garage');
    } catch (e) {
      console.error("Error deleting: ", e);
      setDeleting(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!carName || carName.trim() === "") {
      alert("Please, fill information");
      return;
    }

    setIsSaving(true);
    setSaveStatus("Saving...");

    try {
      let uploadedImageUrl = tuneData.img; // Default to existing image

      // Upload new image if selected
      if (imageFile) {
        setSaveStatus("Compressing...");
        console.log(`Original File Size: ${imageFile.size / 1024 / 1024} MB`);

        const options = {
          maxSizeMB: 0.2, // Aggressive: 200KB
          maxWidthOrHeight: 1024, // Aggressive: 1024px
          useWebWorker: true,
        };

        try {
          const compressedFile = await imageCompression(imageFile, options);
          console.log(`Compressed File Size: ${compressedFile.size / 1024 / 1024} MB`);

          setSaveStatus("Uploading...");
          const storageRef = ref(storage, `tune_images/${currentUser.uid}/${Date.now()}_${imageFile.name}`);
          await uploadBytes(storageRef, compressedFile);
          uploadedImageUrl = await getDownloadURL(storageRef);
        } catch (error) {
          console.error("Error compressing image:", error);
          setSaveStatus("Uploading (Raw)...");
          // Fallback
          const storageRef = ref(storage, `tune_images/${currentUser.uid}/${Date.now()}_${imageFile.name}`);
          await uploadBytes(storageRef, imageFile);
          uploadedImageUrl = await getDownloadURL(storageRef);
        }
      }

      setSaveStatus("Finalizing...");
      const updatedTune = {
        carName,
        img: uploadedImageUrl,
        pp,
        stats: { power, torque, weight, balance },
        tyres: { f: tyresFront, r: tyresRear },
        parts: { transmission: transmissionType, nitro: nitroInstalled },
        settings: { suspension, diff, aero, ecu, ballast, ballastPos, restrictor, transmission, nitroVal: nitro },
        updatedAt: new Date().toISOString()
      };

      await updateDoc(doc(db, "tunes", tuneData.id), updatedTune);
      setIsEditing(false); // Exit edit mode
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (e) {
      console.error("Error updating: ", e);
      alert("Failed to update tune.");
    } finally {
      setIsSaving(false);
      setSaveStatus("");
    }
  };

  const handleClone = async () => {
    if (!currentUser) {
      alert("Please login to save this tune to your garage.");
      return;
    }

    if (!window.confirm("Copy this tune to your Garage?")) return;

    setIsSaving(true);
    const cloneData = {
      userId: currentUser.uid,
      creatorName: currentUser.displayName || 'Unnamed Racer',
      creatorPhoto: currentUser.photoURL || null,
      carName, pp,
      stats: { power, torque, weight, balance },
      tyres: { f: tyresFront, r: tyresRear },
      parts: { transmission: transmissionType, nitro: nitroInstalled },
      settings: { suspension, diff, aero, ecu, ballast, ballastPos, restrictor, transmission, nitroVal: nitro },
      originalCreatorId: tuneData.userId || null, // Track lineage
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, "tunes"), cloneData);
      alert("Tune copied to your Garage!");
      navigate('/garage');
    } catch (e) {
      console.error("Error cloning: ", e);
      alert("Failed to copy tune.");
    } finally {
      setIsSaving(false);
    }
  };


  if (!tuneData) return null;

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white pb-32 font-display transition-colors duration-300">
      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 dark:bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 400 }}
              className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4 min-w-[200px]"
            >
              <div className="size-16 rounded-full bg-green-100 dark:bg-green-500/10 flex items-center justify-center border border-green-200 dark:border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                <span className="material-symbols-outlined text-green-600 dark:text-green-500 text-3xl">check</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-wider text-center">Edit Successful!</h3>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 px-3 h-12 flex items-center justify-between shadow-sm dark:shadow-lg transition-colors duration-300">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <span className="material-symbols-outlined text-xl">arrow_back</span>
          <span className="text-xs font-bold uppercase tracking-wider hidden sm:block">Back</span>
        </button>
        <h1 className="text-sm font-bold tracking-widest uppercase text-gray-900 dark:text-white">{isOwner ? "Tune Details" : "Community Tune"}</h1>
        <div className="flex gap-2">
          {/* Only show Edit/Delete if Owner */}
          {isOwner ? (
            <>
              {!isEditing && (
                <button onClick={() => setIsEditing(true)} className="text-gray-600 dark:text-white hover:text-red-500 transition-colors">
                  <span className="material-symbols-outlined text-xl">edit</span>
                </button>
              )}
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-red-500 hover:text-red-400 transition-colors disabled:opacity-50"
              >
                {deleting ? <span className="material-symbols-outlined text-base animate-spin">refresh</span> : <span className="material-symbols-outlined text-xl">delete</span>}
              </button>
            </>
          ) : (
            // If not owner, show Share/Save icons or nothing
            <button className="text-gray-600 dark:text-white hover:text-red-500 transition-colors">
              <span className="material-symbols-outlined text-xl">share</span>
            </button>
          )}
        </div>
      </header>

      <main className={`p-2 max-w-lg mx-auto space-y-3 ${!isOwner ? 'pointer-events-none opacity-90' : ''}`}> {/* Disable interaction if not owner generally, though input disabled props handle specifics */}
        {/* Car Header */}
        <section className="bg-white dark:bg-[#121212] rounded-md p-3 border border-gray-200 dark:border-white/10 shadow-sm relative overflow-hidden group transition-colors duration-300">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-600"></div>
          <div className="flex gap-4">
            {/* Image Upload Area */}
            <div
              onClick={() => isEditing && fileInputRef.current?.click()}
              className={`w-24 h-24 bg-gray-100 dark:bg-white/5 rounded-lg border border-dashed border-gray-300 dark:border-white/10 flex items-center justify-center relative overflow-hidden shrink-0 ${isEditing ? 'cursor-pointer hover:border-red-500/50 group/img' : ''}`}
            >
              <input
                type="file"
                ref={fileInputRef}
                hidden
                onChange={handleImageChange}
                accept="image/*"
                disabled={!isEditing}
              />
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-gray-400">
                  <span className="material-symbols-outlined text-2xl">add_a_photo</span>
                  <span className="text-[9px] font-bold uppercase mt-1">Add Photo</span>
                </div>
              )}
              {/* Overlay for hover */}
              {isEditing && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-white">edit</span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  {/* Editable Car Name */}
                  <input
                    type="text"
                    value={carName}
                    onChange={(e) => setCarName(e.target.value)}
                    disabled={!isEditing}
                    className={`w-[250px] bg-transparent text-lg font-bold leading-none tracking-tight text-gray-900 dark:text-white mb-1 border-b border-transparent focus:outline-none placeholder-gray-400 dark:placeholder-gray-600 truncate ${isEditing ? 'focus:border-gray-300 dark:focus:border-white/20' : ''}`}
                    placeholder="Enter Car Name"
                  />
                </div>
                {/* Editable PP */}
                <div className="text-right pl-4 min-w-[80px]">
                  <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-0.5">PP</div>
                  <input
                    type="number"
                    value={pp}
                    onChange={(e) => setPp(parseFloat(e.target.value))}
                    disabled={!isEditing}
                    className="w-[120px] bg-transparent text-2xl font-bold text-gray-900 dark:text-white leading-none tracking-tighter text-right border-none focus:ring-0 p-0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-px bg-gray-200 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded overflow-hidden mt-4 ml-3">
                <div className="bg-gray-50 dark:bg-[#121212] py-2 flex flex-col items-center justify-center hover:bg-white dark:hover:bg-[#1a1a1a] transition-colors relative">
                  <span className="text-[7px] text-gray-500 uppercase font-bold tracking-widest mb-0.5">Power</span>
                  <div className="flex items-baseline gap-0.5">
                    <InputField value={power} onChange={(v) => setPower(parseFloat(v))} disabled={!isEditing} className="!h-auto !py-0 !text-center" />
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-[#121212] py-2 flex flex-col items-center justify-center hover:bg-white dark:hover:bg-[#1a1a1a] transition-colors">
                  <span className="text-[7px] text-gray-500 uppercase font-bold tracking-widest mb-0.5">Torque</span>
                  <InputField value={torque} onChange={(v) => setTorque(parseFloat(v))} disabled={!isEditing} className="!h-auto !py-0" />
                </div>
                <div className="bg-gray-50 dark:bg-[#121212] py-2 flex flex-col items-center justify-center hover:bg-white dark:hover:bg-[#1a1a1a] transition-colors">
                  <span className="text-[7px] text-gray-500 uppercase font-bold tracking-widest mb-0.5">Weight</span>
                  <InputField value={weight} onChange={(v) => setWeight(parseFloat(v))} disabled={!isEditing} className="!h-auto !py-0" />
                </div>
                <div className="bg-gray-50 dark:bg-[#121212] py-2 flex flex-col items-center justify-center hover:bg-white dark:hover:bg-[#1a1a1a] transition-colors">
                  <span className="text-[7px] text-gray-500 uppercase font-bold tracking-widest mb-0.5">Balance</span>
                  <InputField type="text" value={balance} onChange={(v) => setBalance(v)} disabled={!isEditing} className="!h-auto !py-0" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tyres */}
        <div>
          <SectionHeader title="Tyres" />
          <div className="bg-white dark:bg-[#121212] rounded border border-gray-200 dark:border-white/10 overflow-hidden transition-colors duration-300">
            <div className="grid grid-cols-[auto_1fr] divide-y divide-gray-100 dark:divide-white/5">
              <div className="flex items-center p-2 gap-3 border-r border-gray-100 dark:border-white/5 h-12">
                <div className="flex flex-col items-center w-10 shrink-0">
                  <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Front</span>
                </div>
                <div className="relative w-full">
                  <select
                    value={tyresFront}
                    onChange={(e) => setTyresFront(e.target.value)}
                    disabled={!isEditing}
                    className="bg-transparent text-xs font-bold text-gray-900 dark:text-white border-none focus:ring-0 p-0 cursor-pointer w-full pr-8 outline-none [&_optgroup]:bg-white [&_optgroup]:text-gray-900 dark:[&_optgroup]:bg-[#121212] dark:[&_optgroup]:text-white [&_option]:bg-white [&_option]:text-gray-900 dark:[&_option]:bg-[#121212] dark:[&_option]:text-white disabled:opacity-80 disabled:cursor-default"
                  >
                    {tyreOptions}
                  </select>
                </div>
              </div>
              <div className="flex items-center p-2 gap-3 border-r border-gray-100 dark:border-white/5 h-12">
                <div className="flex flex-col items-center w-10 shrink-0">
                  <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Rear</span>
                </div>
                <div className="relative w-full">
                  <select
                    value={tyresRear}
                    onChange={(e) => setTyresRear(e.target.value)}
                    disabled={!isEditing}
                    className="bg-transparent text-xs font-bold text-gray-900 dark:text-white border-none focus:ring-0 p-0 cursor-pointer w-full appearance-none pr-8 outline-none [&_optgroup]:bg-white [&_optgroup]:text-gray-900 dark:[&_optgroup]:bg-[#121212] dark:[&_optgroup]:text-white [&_option]:bg-white [&_option]:text-gray-900 dark:[&_option]:bg-[#121212] dark:[&_option]:text-white disabled:opacity-80 disabled:cursor-default"
                  >
                    {tyreOptions}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Suspension */}
        <div>
          <SectionHeader title="Suspension" badge="Fully Customisable" />
          <div className="bg-white dark:bg-[#121212] rounded border border-gray-200 dark:border-white/10 overflow-hidden transition-colors duration-300">
            <TableHeader />
            <div className="flex flex-col">
              <Row disabled={!isEditing} label="Body Height Adjustment" unit="mm" front={suspension.bodyHeight.f} rear={suspension.bodyHeight.r}
                onChangeFront={(v) => setSuspension({ ...suspension, bodyHeight: { ...suspension.bodyHeight, f: parseFloat(v) } })}
                onChangeRear={(v) => setSuspension({ ...suspension, bodyHeight: { ...suspension.bodyHeight, r: parseFloat(v) } })}
              />
              <Row disabled={!isEditing} label="Anti-Roll Bar" unit="Lv." front={suspension.antiRollBar.f} rear={suspension.antiRollBar.r}
                onChangeFront={(v) => setSuspension({ ...suspension, antiRollBar: { ...suspension.antiRollBar, f: parseFloat(v) } })}
                onChangeRear={(v) => setSuspension({ ...suspension, antiRollBar: { ...suspension.antiRollBar, r: parseFloat(v) } })}
              />
              <Row disabled={!isEditing} label="Damping (Compression)" unit="%" front={suspension.dampingComp.f} rear={suspension.dampingComp.r}
                onChangeFront={(v) => setSuspension({ ...suspension, dampingComp: { ...suspension.dampingComp, f: parseFloat(v) } })}
                onChangeRear={(v) => setSuspension({ ...suspension, dampingComp: { ...suspension.dampingComp, r: parseFloat(v) } })}
              />
              <Row disabled={!isEditing} label="Damping (Expansion)" unit="%" front={suspension.dampingExp.f} rear={suspension.dampingExp.r}
                onChangeFront={(v) => setSuspension({ ...suspension, dampingExp: { ...suspension.dampingExp, f: parseFloat(v) } })}
                onChangeRear={(v) => setSuspension({ ...suspension, dampingExp: { ...suspension.dampingExp, r: parseFloat(v) } })}
              />
              <Row disabled={!isEditing} label="Natural Frequency" unit="Hz" front={suspension.natFreq.f} rear={suspension.natFreq.r}
                onChangeFront={(v) => setSuspension({ ...suspension, natFreq: { ...suspension.natFreq, f: parseFloat(v) } })}
                onChangeRear={(v) => setSuspension({ ...suspension, natFreq: { ...suspension.natFreq, r: parseFloat(v) } })}
              />
              <Row disabled={!isEditing} label="Negative Camber Angle" front={suspension.camber.f} rear={suspension.camber.r}
                onChangeFront={(v) => setSuspension({ ...suspension, camber: { ...suspension.camber, f: parseFloat(v) } })}
                onChangeRear={(v) => setSuspension({ ...suspension, camber: { ...suspension.camber, r: parseFloat(v) } })}
              />
              <ToeRow disabled={!isEditing} label="Toe Angle" front={suspension.toe.f} rear={suspension.toe.r}
                onChangeFront={(v) => setSuspension({ ...suspension, toe: { ...suspension.toe, f: parseFloat(v) } })}
                onChangeRear={(v) => setSuspension({ ...suspension, toe: { ...suspension.toe, r: parseFloat(v) } })}
              />
            </div>
          </div>
        </div>

        {/* Differential Gear */}
        <div>
          <SectionHeader title="Differential Gear" badge="Fully Customisable" />
          <div className="bg-white dark:bg-[#121212] rounded border border-gray-200 dark:border-white/10 overflow-hidden transition-colors duration-300">
            <TableHeader />
            <div className="flex flex-col">
              <Row disabled={!isEditing} label="Initial Torque" front={diff.initial.f} rear={diff.initial.r}
                onChangeFront={(v) => setDiff({ ...diff, initial: { ...diff.initial, f: parseFloat(v) } })}
                onChangeRear={(v) => setDiff({ ...diff, initial: { ...diff.initial, r: parseFloat(v) } })}
              />
              <Row disabled={!isEditing} label="Acceleration Sensitivity" front={diff.accel.f} rear={diff.accel.r}
                onChangeFront={(v) => setDiff({ ...diff, accel: { ...diff.accel, f: parseFloat(v) } })}
                onChangeRear={(v) => setDiff({ ...diff, accel: { ...diff.accel, r: parseFloat(v) } })}
              />
              <Row disabled={!isEditing} label="Braking Sensitivity" front={diff.braking.f} rear={diff.braking.r}
                onChangeFront={(v) => setDiff({ ...diff, braking: { ...diff.braking, f: parseFloat(v) } })}
                onChangeRear={(v) => setDiff({ ...diff, braking: { ...diff.braking, r: parseFloat(v) } })}
              />


              <div className="grid grid-cols-[1.8fr_2fr] items-center border-t border-gray-200 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors h-9">
                <div className="pl-3 text-[11px] text-gray-500 dark:text-gray-300 font-medium leading-tight">Torque-Vectoring Centre Differential</div>
                <div className="border-l border-gray-200 dark:border-white/5 h-full flex items-center justify-center text-xs font-bold text-gray-400 dark:text-gray-500">None</div>
              </div>
              <div className="grid grid-cols-[1.8fr_2fr] items-center border-t border-gray-200 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors h-9">
                <div className="pl-3 text-[11px] text-gray-500 dark:text-gray-300 font-medium leading-tight">Front/Rear Torque Distribution</div>
                <div className="border-l border-gray-200 dark:border-white/5 h-full flex items-center justify-center text-xs font-bold text-gray-900 dark:text-white tracking-widest">
                  <InputField type="text" value={diff.distribution} disabled={!isEditing} onChange={(v) => setDiff({ ...diff, distribution: v })} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Aerodynamics */}
        <div>
          <SectionHeader title="Aerodynamics" />
          <div className="bg-white dark:bg-[#121212] rounded border border-gray-200 dark:border-white/10 overflow-hidden transition-colors duration-300">
            <TableHeader />
            <div className="flex flex-col">
              <Row disabled={!isEditing} label="Downforce" unit="Lv." front={aero.f} rear={aero.r}
                onChangeFront={(v) => setAero({ ...aero, f: parseFloat(v) })}
                onChangeRear={(v) => setAero({ ...aero, r: parseFloat(v) })}
              />
            </div>
          </div>
        </div>

        {/* ECU */}
        <div>
          <SectionHeader title="ECU" badge="Fully Customisable" />
          <div className="bg-white dark:bg-[#121212] rounded border border-gray-200 dark:border-white/10 overflow-hidden transition-colors duration-300">
            <SingleRow label="Output Adjustment" unit="%" val={ecu} disabled={!isEditing} onChange={(v) => setEcu(parseFloat(v))} />
          </div>
        </div>

        {/* Performance Adjustment */}
        <div>
          <SectionHeader title="Performance Adjustment" />
          <div className="bg-white dark:bg-[#121212] rounded border border-gray-200 dark:border-white/10 overflow-hidden transition-colors duration-300">
            <SingleRow label="Ballast" unit="kg" val={ballast} disabled={!isEditing} onChange={(v) => setBallast(parseFloat(v))} />
            <SingleRow label="Ballast Positioning" val={ballastPos} disabled={!isEditing} onChange={(v) => setBallastPos(parseFloat(v))} />
            <SingleRow label="Power Restrictor" unit="%" val={restrictor} disabled={!isEditing} onChange={(v) => setRestrictor(parseFloat(v))} />
          </div>
        </div>

        {/* Transmission */}
        <div>
          <div className="flex justify-between items-end px-1 pb-1 mt-3">
            <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-widest ml-1">Transmission</h3>
            {/* Transmission Type Selector */}
            <select
              value={transmissionType}
              onChange={(e) => setTransmissionType(e.target.value)}
              disabled={!isEditing}
              className="bg-gray-100 dark:bg-[#121212] text-[9px] text-gray-800 dark:text-gray-200 font-bold px-1 py-0.5 rounded border border-gray-200 dark:border-white/10 tracking-tight outline-none cursor-pointer disabled:cursor-default"
            >
              <option value="Normal">Normal</option>
              <option value="Manual">Manual</option>
              <option value="Sport">Sport</option>
              <option value="Racing">Racing (Fully Custom) </option>
            </select>
          </div>

          <div className="bg-white dark:bg-[#121212] rounded border border-gray-200 dark:border-white/10 overflow-hidden transition-colors duration-300">
            {transmissionType === 'Racing' ? (
              <>
                <SingleRow label="Top Speed (Auto)" unit="km/h" val={transmission.topSpeed} disabled={!isEditing} onChange={(v) => setTransmission({ ...transmission, topSpeed: parseFloat(v) })} />
                <div className="grid grid-cols-[1.8fr_2fr] items-center h-9 bg-gray-100 dark:bg-white/5 border-t border-gray-200 dark:border-white/5">
                  <div className="pl-3 text-[11px] text-gray-500 dark:text-gray-400 font-medium">Manual Adjustment</div>
                  <div className="flex items-center justify-center border-l border-gray-200 dark:border-white/10 h-full">
                    <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 text-base">more_horiz</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-3 text-center text-[10px] text-gray-500">
                {transmissionType} Transmission Selected
              </div>
            )}
          </div>
        </div>

        {/* Nitro / Overtake */}
        <div>
          <div className="flex justify-between items-end px-1 pb-1 mt-3">
            <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-widest ml-1">Nitro / Overtake</h3>
            <div className="flex items-center gap-2">
              <label className={`flex items-center gap-1 ${isEditing ? 'cursor-pointer' : 'cursor-default'}`}>
                <input
                  type="checkbox"
                  checked={nitroInstalled}
                  onChange={(e) => setNitroInstalled(e.target.checked)}
                  disabled={!isEditing}
                  className="w-3 h-3 accent-red-600 rounded-sm bg-gray-200 dark:bg-white/10 border-gray-300 dark:border-white/20"
                />
                <span className="text-[9px] text-gray-500 dark:text-gray-400 font-bold uppercase">{nitroInstalled ? 'Installed' : 'None'}</span>
              </label>
            </div>
          </div>
          <div className="bg-white dark:bg-[#121212] rounded border border-gray-200 dark:border-white/10 overflow-hidden transition-colors duration-300">
            <SingleRow label="Output Adjustment" unit="%" val={nitro} disabled={!nitroInstalled || !isEditing} onChange={(v) => setNitro(parseFloat(v))} />
          </div>
        </div>

      </main>

      {/* Floating Save Button - Only show when editing OR show Clone button if Not Owner */}
      {isOwner ? (
        isEditing && (
          <div className="fixed bottom-24 right-5 z-30 flex flex-col items-end gap-2">
            {isSaving && (
              <div className="bg-black/75 dark:bg-white/10 text-white text-[10px] font-bold px-3 py-1 rounded-full backdrop-blur-md animate-pulse">
                {saveStatus}
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`size-14 bg-red-600 text-white rounded-full shadow-glow flex items-center justify-center hover:bg-red-700 active:scale-95 transition-all ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSaving ? <span className="material-symbols-outlined text-xl animate-spin">refresh</span> : <span className="material-symbols-outlined text-2xl">save</span>}
            </button>
          </div>
        )
      ) : (
        // Copy/Clone Button for Non-Owners
        <div className="fixed bottom-24 right-5 z-30">
          <button
            onClick={handleClone}
            disabled={isSaving}
            className={`size-14 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 text-red-500 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-white/5 active:scale-95 transition-all ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Save to My Garage"
          >
            <span className="material-symbols-outlined text-2xl">content_copy</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default EditTune;