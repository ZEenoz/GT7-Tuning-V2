import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../contexts/AuthContext';
import imageCompression from 'browser-image-compression';


import { carList } from '../data/cars';
import TransmissionTuner from '../components/TransmissionTuner';
// --- Helper Components ---
const InputField = ({
  value,
  onChange,
  type = 'number',
  disabled = false,
  className = '',
  min,
  max,
  step = "any"
}: {
  value: string | number,
  onChange?: (val: string) => void,
  type?: string,
  disabled?: boolean,
  className?: string,
  min?: string | number,
  max?: string | number,
  step?: string | number
}) => (
  <input
    type={type}
    value={value}
    onChange={(e) => onChange && onChange(e.target.value)}
    disabled={disabled}
    min={min}
    max={max}
    step={step}
    className={`w-full bg-transparent text-center font-bold text-gray-900 dark:text-white p-0 border-none focus:ring-0 focus:bg-black/5 dark:focus:bg-white/10 text-xs py-2 h-full ${disabled ? 'text-gray-400 dark:text-gray-500' : ''} ${className}`}
  />
);



const SectionHeader = ({ title, badge }: { title: string, badge?: string }) => (
  <div className="flex justify-between items-end px-1 pb-1 mt-3">
    <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-widest ml-1">{title}</h3>
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

const Row = ({
  label, unit, front, rear, icon = false,
  onChangeFront, onChangeRear
}: {
  label: string, unit?: string, front: string | number, rear: string | number, icon?: boolean,
  onChangeFront?: (val: string) => void, onChangeRear?: (val: string) => void
}) => (
  <div className="grid grid-cols-[1.8fr_1fr_1fr] items-center text-sm relative group hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-b border-gray-200 dark:border-white/5 last:border-0 h-9">
    <div className="pl-3 text-[11px] text-gray-500 dark:text-gray-300 font-medium leading-tight pr-1 flex items-center">
      {label} {unit && <span className="text-[9px] text-gray-400 dark:text-gray-500 ml-1">{unit}</span>}
    </div>
    <div className="relative h-full border-l border-gray-200 dark:border-white/5">
      {icon && <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[12px] text-gray-400 dark:text-gray-500 material-symbols-outlined scale-75">arrow_outward</span>}
      <InputField value={front} onChange={onChangeFront} />
    </div>
    <div className="relative h-full border-l border-gray-200 dark:border-white/5">
      {icon && <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[12px] text-gray-400 dark:text-gray-500 material-symbols-outlined scale-75 -scale-x-100">arrow_outward</span>}
      <InputField value={rear} onChange={onChangeRear} />
    </div>
  </div>
);

const SingleRow = ({
  label, unit, val, disabled = false, onChange
}: {
  label: string, unit?: string, val: string | number, disabled?: boolean, onChange?: (val: string) => void
}) => (
  <div className="grid grid-cols-[1.8fr_2fr] items-center text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-b border-gray-200 dark:border-white/5 last:border-0 h-9">
    <div className="pl-3 text-[11px] text-gray-500 dark:text-gray-300 font-medium flex items-center">
      {label} {unit && <span className="text-[9px] text-gray-400 dark:text-gray-500 ml-1">{unit}</span>}
    </div>
    <div className="h-full border-l border-gray-200 dark:border-white/5">
      <InputField value={val} disabled={disabled} onChange={onChange} />
    </div>
  </div>
);

const ToeSlider = ({ value, onChange }: { value: number, onChange: (val: string) => void }) => {
  // Parsing value: assuming -1.0 to 1.0 range based on "Left IN, Right OUT"
  // If value < 0 -> IN
  // If value > 0 -> OUT

  const displayValue = Math.abs(value).toFixed(2);
  // const label = value < 0 ? "IN" : value > 0 ? "OUT" : ""; // Unused

  return (
    <div className="flex flex-col items-center justify-center h-full w-full px-2 py-1 relative group/slider">
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
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-1 bg-gray-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-600 hover:[&::-webkit-slider-thumb]:scale-125 transition-all mt-3"
      />
      {/* Center Indicator */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-px h-2 bg-gray-300 dark:bg-white/20 -mt-1 pointer-events-none"></div>
    </div>
  );
};

const ToeRow = ({
  label, front, rear,
  onChangeFront, onChangeRear
}: {
  label: string, front: number, rear: number,
  onChangeFront: (val: string) => void, onChangeRear: (val: string) => void
}) => (
  <div className="grid grid-cols-[1.8fr_1fr_1fr] items-center text-sm relative border-b border-gray-200 dark:border-white/5 last:border-0 h-10">
    <div className="pl-3 text-[11px] text-gray-500 dark:text-gray-300 font-medium leading-tight pr-1 flex items-center">
      {label}
    </div>
    <div className="relative h-full border-l border-gray-200 dark:border-white/5">
      <ToeSlider value={front} onChange={onChangeFront} />
    </div>
    <div className="relative h-full border-l border-gray-200 dark:border-white/5">
      <ToeSlider value={rear} onChange={onChangeRear} />
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

const AddTune = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(""); // "Compressing...", "Uploading...", "Saving..."

  // Image Upload State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- State for Tuning Data ---
  const [carName, setCarName] = useState("Ford GT Race Car '18");
  const [brand, setBrand] = useState("FORD");

  // State for Tuning Data
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');
  const u = (metric: string, imperial: string) => unitSystem === 'metric' ? metric : imperial;



  // Stats
  const [pp, setPp] = useState(734.82);
  const [power, setPower] = useState(527);
  const [torque, setTorque] = useState(62.4);
  const [weight, setWeight] = useState(1200);
  const [balance, setBalance] = useState("43:57");

  // Tyres
  const [tyresFront, setTyresFront] = useState("Racing: Hard");
  const [tyresRear, setTyresRear] = useState("Racing: Hard");

  // Parts / Options
  const [transmissionType, setTransmissionType] = useState("Normal"); // Normal, Manual, Sports, Racing (Fully Customisable)
  const [nitroInstalled, setNitroInstalled] = useState(false);

  // Tuning Values (Example subset - expanding to cover all)
  const [suspension, setSuspension] = useState({
    bodyHeight: { f: 60, r: 70 },
    antiRollBar: { f: 5, r: 5 },
    dampingComp: { f: 30, r: 30 },
    dampingExp: { f: 40, r: 40 },
    natFreq: { f: 3.50, r: 3.50 },
    camber: { f: 3.0, r: 3.0 },
    toe: { f: 0.10, r: 0.20 },
  });

  // New Tuning States
  const [brakeBalance, setBrakeBalance] = useState(0); // -5 (Rear) to +5 (Front)
  const [turboType, setTurboType] = useState("None"); // None, Low, Medium, High, Supercharger

  const [diff, setDiff] = useState({
    initial: { f: 0, r: 15 },
    accel: { f: 0, r: 40 },
    braking: { f: 0, r: 50 },
    torqueVectoring: "None",
    distribution: "0 : 100"
  });

  const [aero, setAero] = useState({ f: 430, r: 590 });
  const [ecu, setEcu] = useState(100);
  const [ballast, setBallast] = useState(0);
  const [ballastPos, setBallastPos] = useState(0);
  const [restrictor, setRestrictor] = useState(100);

  const [transmission, setTransmission] = useState({
    topSpeed: 280,
    manual: [], // [2.5, 2.0, 1.5 ...]
    final: 4.000
  });
  const [isTransmissionTunerOpen, setIsTransmissionTunerOpen] = useState(false);

  const [nitro, setNitro] = useState(30);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!carName || carName.trim() === "") {
      alert("Please, fill all information");
      return;
    }

    if (!currentUser) {
      alert("You must be logged in to save a tune.");
      return;
    }

    setIsSaving(true);
    setSaveStatus("Saving...");

    try {
      let uploadedImageUrl = null;
      if (imageFile) {
        console.log(`Original File Size: ${imageFile.size / 1024 / 1024} MB`);

        setSaveStatus("Compressing...");
        const options = {
          maxSizeMB: 0.2,
          maxWidthOrHeight: 1024,
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
          // Fallback to original file if compression fails
          const storageRef = ref(storage, `tune_images/${currentUser.uid}/${Date.now()}_${imageFile.name}`);
          await uploadBytes(storageRef, imageFile);
          uploadedImageUrl = await getDownloadURL(storageRef);
        }
      }

      const tuneData = {
        userId: currentUser.uid,
        creatorName: currentUser.displayName || 'Unnamed Racer',
        creatorPhoto: currentUser.photoURL || null,
        carName,
        img: uploadedImageUrl, // Save Image URL
        pp,
        stats: { power, torque, weight, balance },
        tyres: { f: tyresFront, r: tyresRear },
        parts: { transmission: transmissionType, nitro: nitroInstalled, turbo: turboType },
        settings: { suspension, brakeBalance, diff, aero, ecu, ballast, ballastPos, restrictor, transmission, nitroVal: nitro },
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, "tunes"), tuneData);
      console.log("Document written with ID: ", tuneData);
      navigate('/garage');
    } catch (e) {
      console.error("Error adding document: ", e);
      alert("Error saving tune. Check console.");
    } finally {
      setIsSaving(false);
      setSaveStatus("");
    }
  };

  const handleReset = () => {
    setCarName("");
    setImageFile(null);
    setImagePreview(null);
    setPp(0);
    setPower(0);
    setTorque(0);
    setWeight(0);
    setBalance("0:0");
    setTyresFront("Racing: Hard");
    setTyresRear("Racing: Hard");
    setTransmissionType("Normal");
    setNitroInstalled(false);
    setBrakeBalance(0);
    setTurboType("None");
    setSuspension({
      bodyHeight: { f: 0, r: 0 },
      antiRollBar: { f: 0, r: 0 },
      dampingComp: { f: 0, r: 0 },
      dampingExp: { f: 0, r: 0 },
      natFreq: { f: 0, r: 0 },
      camber: { f: 0, r: 0 },
      toe: { f: 0, r: 0 },
    });
    setDiff({
      initial: { f: 0, r: 0 },
      accel: { f: 0, r: 0 },
      braking: { f: 0, r: 0 },
      torqueVectoring: "None",
      distribution: "0 : 100"
    });
    setAero({ f: 0, r: 0 });
    setEcu(100);
    setBallast(0);
    setBallastPos(0);
    setRestrictor(100);
    setRestrictor(100);
    setTransmission({ topSpeed: 0, manual: [], final: 0 });
    setNitro(0);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white pb-32 font-display transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 px-3 h-12 flex items-center justify-between shadow-sm dark:shadow-lg transition-colors duration-300">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <span className="material-symbols-outlined text-xl">arrow_back</span>
          <span className="text-xs font-bold uppercase tracking-wider hidden sm:block">Back</span>
        </button>
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-bold tracking-widest uppercase text-gray-900 dark:text-white">Add Tune</h1>
          <button
            onClick={() => setUnitSystem(prev => prev === 'metric' ? 'imperial' : 'metric')}
            className="text-[9px] font-bold uppercase px-2 py-1 rounded bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
          >
            {unitSystem === 'metric' ? 'METRIC' : 'IMPERIAL'}
          </button>
        </div>
        <button onClick={handleReset} className="text-red-500 font-bold text-xs uppercase tracking-widest hover:text-red-400 transition-colors">
          Reset
        </button>
      </header>

      <main className="p-2 max-w-lg mx-auto space-y-3">
        {/* Car Header Info - Editable */}


        // ... render ...

        {/* Car Header Info - Editable */}
        <section className="bg-white dark:bg-[#121212] rounded-md p-3 border border-gray-200 dark:border-white/10 shadow-sm relative overflow-visible group transition-colors duration-300">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-600"></div>

          <div className="flex gap-4">
            {/* Image Upload Area */}
            <div onClick={() => fileInputRef.current?.click()} className="w-24 h-24 bg-gray-100 dark:bg-white/5 rounded-lg border border-dashed border-gray-300 dark:border-white/10 flex items-center justify-center cursor-pointer hover:border-red-500/50 relative overflow-hidden group/img shrink-0">
              <input
                type="file"
                ref={fileInputRef}
                hidden
                onChange={handleImageChange}
                accept="image/*"
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
              {imagePreview && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-white">edit</span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 relative">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0 relative">
                  {/* Car Name Input */}
                  <input
                    type="text"
                    value={carName}
                    onChange={(e) => setCarName(e.target.value)}
                    className="w-[250px] bg-transparent text-lg font-bold leading-none tracking-tight text-gray-900 dark:text-white mb-1 border-b border-transparent focus:border-red-500 focus:outline-none placeholder-gray-400 dark:placeholder-gray-600 truncate"
                    placeholder="Enter Car Name..."
                  />
                </div>
                {/* Editable PP */}
                <div className="text-right pl-4 min-w-[80px]">
                  <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-0.5">PP</div>
                  <input
                    type="number"
                    value={pp}
                    onChange={(e) => setPp(parseFloat(e.target.value))}
                    className="w-[120px] bg-transparent text-2xl font-bold text-gray-900 dark:text-white leading-none tracking-tighter text-right border-none focus:ring-0 p-0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-px bg-gray-200 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded overflow-hidden mt-2">
                <div className="bg-gray-50 dark:bg-[#121212] py-2 flex flex-col items-center justify-center">
                  <span className="text-[7px] text-gray-500 uppercase font-bold tracking-widest mb-0.5">Power ({u('HP', 'HP')})</span>
                  <div className="flex items-baseline gap-0.5">
                    <InputField value={power} onChange={(v) => setPower(parseFloat(v))} min="0" className="!h-auto !py-0 !text-center" />
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-[#121212] py-2 flex flex-col items-center justify-center">
                  <span className="text-[7px] text-gray-500 uppercase font-bold tracking-widest mb-0.5">Torque ({u('kgfm', 'ft-lb')})</span>
                  <InputField value={torque} onChange={(v) => setTorque(parseFloat(v))} min="0" className="!h-auto !py-0" />
                </div>
                <div className="bg-gray-50 dark:bg-[#121212] py-2 flex flex-col items-center justify-center">
                  <span className="text-[7px] text-gray-500 uppercase font-bold tracking-widest mb-0.5">Weight ({u('kg', 'lbs')})</span>
                  <InputField value={weight} onChange={(v) => setWeight(parseFloat(v))} min="0" className="!h-auto !py-0" />
                </div>
                <div className="bg-gray-50 dark:bg-[#121212] py-2 flex flex-col items-center justify-center">
                  <span className="text-[7px] text-gray-500 uppercase font-bold tracking-widest mb-0.5">Balance</span>
                  <InputField type="text" value={balance} onChange={(v) => setBalance(v)} className="!h-auto !py-0" />
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
                    className="bg-transparent text-xs font-bold text-gray-900 dark:text-white border-none focus:ring-0 p-0 cursor-pointer w-full appearance-none pr-8 outline-none [&_optgroup]:bg-white [&_optgroup]:text-gray-900 dark:[&_optgroup]:bg-[#121212] dark:[&_optgroup]:text-white [&_option]:bg-white [&_option]:text-gray-900 dark:[&_option]:bg-[#121212] dark:[&_option]:text-white"
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
                    className="bg-transparent text-xs font-bold text-gray-900 dark:text-white border-none focus:ring-0 p-0 cursor-pointer w-full appearance-none pr-8 outline-none [&_optgroup]:bg-white [&_optgroup]:text-gray-900 dark:[&_optgroup]:bg-[#121212] dark:[&_optgroup]:text-white [&_option]:bg-white [&_option]:text-gray-900 dark:[&_option]:bg-[#121212] dark:[&_option]:text-white"
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
              <Row label="Body Height Adjustment" unit={u('mm', 'in')} front={suspension.bodyHeight.f} rear={suspension.bodyHeight.r}
                onChangeFront={(v) => setSuspension({ ...suspension, bodyHeight: { ...suspension.bodyHeight, f: parseFloat(v) } })}
                onChangeRear={(v) => setSuspension({ ...suspension, bodyHeight: { ...suspension.bodyHeight, r: parseFloat(v) } })}
              />
              <Row label="Anti-Roll Bar" unit="Lv." front={suspension.antiRollBar.f} rear={suspension.antiRollBar.r}
                onChangeFront={(v) => setSuspension({ ...suspension, antiRollBar: { ...suspension.antiRollBar, f: parseFloat(v) } })}
                onChangeRear={(v) => setSuspension({ ...suspension, antiRollBar: { ...suspension.antiRollBar, r: parseFloat(v) } })}
              />
              <Row label="Damping (Compression)" unit="%" front={suspension.dampingComp.f} rear={suspension.dampingComp.r}
                onChangeFront={(v) => setSuspension({ ...suspension, dampingComp: { ...suspension.dampingComp, f: parseFloat(v) } })}
                onChangeRear={(v) => setSuspension({ ...suspension, dampingComp: { ...suspension.dampingComp, r: parseFloat(v) } })}
              />
              <Row label="Damping (Expansion)" unit="%" front={suspension.dampingExp.f} rear={suspension.dampingExp.r}
                onChangeFront={(v) => setSuspension({ ...suspension, dampingExp: { ...suspension.dampingExp, f: parseFloat(v) } })}
                onChangeRear={(v) => setSuspension({ ...suspension, dampingExp: { ...suspension.dampingExp, r: parseFloat(v) } })}
              />
              <Row label="Natural Frequency" unit="Hz" front={suspension.natFreq.f} rear={suspension.natFreq.r}
                onChangeFront={(v) => setSuspension({ ...suspension, natFreq: { ...suspension.natFreq, f: parseFloat(v) } })}
                onChangeRear={(v) => setSuspension({ ...suspension, natFreq: { ...suspension.natFreq, r: parseFloat(v) } })}
              />
              <Row label="Negative Camber Angle" front={suspension.camber.f} rear={suspension.camber.r}
                onChangeFront={(v) => setSuspension({ ...suspension, camber: { ...suspension.camber, f: parseFloat(v) } })}
                onChangeRear={(v) => setSuspension({ ...suspension, camber: { ...suspension.camber, r: parseFloat(v) } })}
              />
              <ToeRow label="Toe Angle" front={suspension.toe.f} rear={suspension.toe.r}
                onChangeFront={(v) => setSuspension({ ...suspension, toe: { ...suspension.toe, f: parseFloat(v) } })}
                onChangeRear={(v) => setSuspension({ ...suspension, toe: { ...suspension.toe, r: parseFloat(v) } })}
              />
            </div>
          </div>
        </div>

        {/* Brake Balance Controller */}
        <div>
          <SectionHeader title="Brake Balance" badge="Controller" />
          <div className="bg-white dark:bg-[#121212] rounded border border-gray-200 dark:border-white/10 overflow-hidden transition-colors duration-300">
            <div className="grid grid-cols-[1.8fr_2fr] items-center border-b border-gray-200 dark:border-white/5 last:border-0 h-10 px-3">
              <div className="text-[11px] text-gray-500 dark:text-gray-300 font-medium flex items-center">
                Front / Rear Balance
              </div>
              <div className="relative h-full flex items-center px-4">
                <input
                  type="range"
                  min="-5" max="5" step="1"
                  value={brakeBalance}
                  onChange={(e) => setBrakeBalance(parseInt(e.target.value))}
                  className="w-full h-1 bg-gray-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-600"
                />
                <div className="absolute top-0 right-4 h-full flex items-center pointer-events-none">
                  <span className={`text-xs font-bold ${brakeBalance > 0 ? 'text-red-500' : brakeBalance < 0 ? 'text-blue-500' : 'text-gray-400'}`}>
                    {brakeBalance > 0 ? `Rear +${brakeBalance}` : brakeBalance < 0 ? `Front +${Math.abs(brakeBalance)}` : '0 (Balanced)'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Differential Gear */}
        <div>
          <SectionHeader title="Differential Gear" badge="Fully Customisable" />
          <div className="bg-white dark:bg-[#121212] rounded border border-gray-200 dark:border-white/10 overflow-hidden transition-colors duration-300">
            <TableHeader />
            <div className="flex flex-col">
              <Row label="Initial Torque" front={diff.initial.f} rear={diff.initial.r}
                onChangeFront={(v) => setDiff({ ...diff, initial: { ...diff.initial, f: parseFloat(v) } })}
                onChangeRear={(v) => setDiff({ ...diff, initial: { ...diff.initial, r: parseFloat(v) } })}
              />
              <Row label="Acceleration Sensitivity" front={diff.accel.f} rear={diff.accel.r}
                onChangeFront={(v) => setDiff({ ...diff, accel: { ...diff.accel, f: parseFloat(v) } })}
                onChangeRear={(v) => setDiff({ ...diff, accel: { ...diff.accel, r: parseFloat(v) } })}
              />
              <Row label="Braking Sensitivity" front={diff.braking.f} rear={diff.braking.r}
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
                  <InputField type="text" value={diff.distribution} onChange={(v) => setDiff({ ...diff, distribution: v })} />
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
              <Row label="Downforce" unit="Lv." front={aero.f} rear={aero.r}
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
            <SingleRow label="Output Adjustment" unit="%" val={ecu} onChange={(v) => setEcu(parseFloat(v))} />
          </div>
        </div>

        {/* Engine Tuning (Turbo/Supercharger) */}
        <div>
          <SectionHeader title="Supercharger / Turbo" />
          <div className="bg-white dark:bg-[#121212] rounded border border-gray-200 dark:border-white/10 overflow-hidden transition-colors duration-300 px-3 py-2">
            <div className="flex flex-wrap gap-2">
              {['None', 'Low RPM Turbo', 'Medium RPM Turbo', 'High RPM Turbo', 'Supercharger', 'Ultra-High RPM'].map(type => (
                <button
                  key={type}
                  onClick={() => setTurboType(type)}
                  className={`px-3 py-1.5 rounded text-[10px] font-bold border transition-all ${turboType === type ? 'bg-red-600 text-white border-red-600' : 'bg-transparent text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:border-gray-300'}`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Adjustment */}
        <div>
          <SectionHeader title="Performance Adjustment" />
          <div className="bg-white dark:bg-[#121212] rounded border border-gray-200 dark:border-white/10 overflow-hidden transition-colors duration-300">
            <SingleRow label="Ballast" unit={u('kg', 'lbs')} val={ballast} onChange={(v) => setBallast(parseFloat(v))} />
            <SingleRow label="Ballast Positioning" val={ballastPos} onChange={(v) => setBallastPos(parseFloat(v))} />
            <SingleRow label="Power Restrictor" unit="%" val={restrictor} onChange={(v) => setRestrictor(parseFloat(v))} />
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
              className="bg-gray-100 dark:bg-[#121212] text-[9px] text-gray-800 dark:text-gray-200 font-bold px-1 py-0.5 rounded border border-gray-200 dark:border-white/10 tracking-tight outline-none cursor-pointer"
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
                <SingleRow label="Top Speed (Auto)" unit={u('km/h', 'mph')} val={transmission.topSpeed} onChange={(v) => setTransmission({ ...transmission, topSpeed: parseFloat(v) })} />
                <div className="grid grid-cols-[1.8fr_2fr] items-center h-9 bg-gray-100 dark:bg-white/5 border-t border-gray-200 dark:border-white/5 cursor-pointer hover:bg-gray-200 dark:hover:bg-white/10 transition-colors" onClick={() => setIsTransmissionTunerOpen(true)}>
                  <div className="pl-3 text-[11px] text-gray-500 dark:text-gray-400 font-medium">Manual Adjustment</div>
                  <div className="flex items-center justify-center border-l border-gray-200 dark:border-white/10 h-full">
                    <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 text-base">tune</span>
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
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={nitroInstalled}
                  onChange={(e) => setNitroInstalled(e.target.checked)}
                  className="w-3 h-3 accent-red-600 rounded-sm bg-gray-200 dark:bg-white/10 border-gray-300 dark:border-white/20"
                />
                <span className="text-[9px] text-gray-500 dark:text-gray-400 font-bold uppercase">{nitroInstalled ? 'Installed' : 'None'}</span>
              </label>
            </div>
          </div>
          <div className="bg-white dark:bg-[#121212] rounded border border-gray-200 dark:border-white/10 overflow-hidden transition-colors duration-300">
            <SingleRow label="Output Adjustment" unit="%" val={nitro} disabled={!nitroInstalled} onChange={(v) => setNitro(parseFloat(v))} />
          </div>
        </div>

      </main>

      {/* Floating Save Button */}
      {/* Floating Save Button with Status */}
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

      {/* Simple Nav for Add Tune Page */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-[#0A0A0A]/95 backdrop-blur-xl border-t border-gray-200 dark:border-white/10 pb-safe z-40 max-w-lg mx-auto transition-colors duration-300">
        <div className="flex justify-around items-center h-16 px-1">
          <button onClick={() => navigate('/')} className="flex flex-col items-center justify-center w-full h-full space-y-1 text-gray-400 dark:text-text-secondary hover:text-gray-900 dark:hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[26px]">home</span>
            <span className="text-[10px] font-medium">Home</span>
          </button>
          <button className="flex flex-col items-center justify-center w-full h-full space-y-1 text-red-500 relative">
            <span className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-1 bg-red-500 rounded-b-full shadow-[0_0_10px_rgba(220,38,38,0.5)]"></span>
            <span className="material-symbols-outlined filled text-[26px]">add_circle</span>
            <span className="text-[10px] font-bold">Add Tune</span>
          </button>
          <button onClick={() => navigate('/garage')} className="flex flex-col items-center justify-center w-full h-full space-y-1 text-gray-400 dark:text-text-secondary hover:text-gray-900 dark:hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[26px]">folder_open</span>
            <span className="text-[10px] font-medium">Garage</span>
          </button>
        </div>
      </nav>
      {/* Modal for Transmission Tuner */}
      {isTransmissionTunerOpen && (
        <TransmissionTuner
          data={transmission}
          onChange={(newData) => setTransmission({ ...transmission, ...newData })}
          onClose={() => setIsTransmissionTunerOpen(false)}
        />
      )}
    </div>
  );
};
export default AddTune;