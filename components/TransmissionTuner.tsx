import React, { useState, useEffect } from 'react';

interface TransmissionTunerProps {
    data: {
        topSpeed: number;
        manual: number[];
        final: number;
    };
    onChange: (data: any) => void;
    onClose: () => void;
}

const TransmissionTuner: React.FC<TransmissionTunerProps> = ({ data, onChange, onClose }) => {
    // Default to 5 gears if empty
    const [gears, setGears] = useState<number[]>(data.manual.length > 0 ? data.manual : [2.976, 2.100, 1.600, 1.200, 1.000]);
    const [final, setFinal] = useState<number>(data.final || 3.500);
    const [topSpeed, setTopSpeed] = useState<number>(data.topSpeed || 280);

    // Constants for visualization (Approximation)
    const MAX_RPM = 8000;
    const TIRE_DIAMETER_M = 0.65; // Approx tire diameter

    // Calculate Speed (km/h) for a given gear ratio at MAX_RPM
    // Speed = (RPM * 60 * TireCircumference) / (GearRatio * FinalRatio * 1000)
    const calculateSpeed = (ratio: number) => {
        if (ratio === 0 || final === 0) return 0;
        const circumference = Math.PI * TIRE_DIAMETER_M;
        return (MAX_RPM * 60 * circumference) / (ratio * final * 1000);
    };

    useEffect(() => {
        // Notify parent of changes
        onChange({
            topSpeed,
            manual: gears,
            final
        });
    }, [gears, final, topSpeed]);

    const handleGearChange = (index: number, val: string) => {
        const newGears = [...gears];
        newGears[index] = parseFloat(val);
        setGears(newGears);
    };

    const addGear = () => {
        if (gears.length < 10) {
            setGears([...gears, (gears[gears.length - 1] || 1.0) * 0.8]);
        }
    };

    const removeGear = () => {
        if (gears.length > 1) {
            setGears(gears.slice(0, -1));
        }
    };

    // SVG Dimensions
    const W = 350;
    const H = 200;
    const PAD = 20;

    // Find max speed for X scale (either Top Speed setting or calculated max of last gear)
    // We use a fixed reasonable max for the chart to keep it consistent, or dynamic.
    // Let's use 400km/h or dynamic.
    const chartMaxSpeed = Math.max(400, calculateSpeed(gears[gears.length - 1]) * 1.2);

    const getX = (speed: number) => PAD + (speed / chartMaxSpeed) * (W - PAD * 2);
    const getY = (rpm: number) => H - PAD - (rpm / MAX_RPM) * (H - PAD * 2);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-[#1A1A1A] w-full max-w-lg rounded-xl shadow-2xl border border-gray-200 dark:border-white/10 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-white/5">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900 dark:text-white">Transmission Setup</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-red-500">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="overflow-y-auto p-4 space-y-6">

                    {/* Chart */}
                    <div className="bg-gray-100 dark:bg-black/40 rounded-lg p-2 relative">
                        <div className="absolute top-2 right-2 text-[10px] text-gray-400 font-mono">
                            MAX RPM: {MAX_RPM}
                        </div>
                        <svg width="100%" height="200" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
                            {/* Axes */}
                            <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="currentColor" className="text-gray-300 dark:text-gray-700" strokeWidth="1" />
                            <line x1={PAD} y1={H - PAD} x2={PAD} y2={PAD} stroke="currentColor" className="text-gray-300 dark:text-gray-700" strokeWidth="1" />

                            {/* Gears Lines */}
                            {gears.map((ratio, i) => {
                                const speed = calculateSpeed(ratio);
                                const x = getX(speed);
                                return (
                                    <g key={i}>
                                        {/* Line from 0,0 to MaxRPM, Speed */}
                                        <line
                                            x1={PAD} y1={H - PAD}
                                            x2={x} y2={getY(MAX_RPM)}
                                            stroke="#DC2626"
                                            strokeWidth="2"
                                            opacity={0.8}
                                        />
                                        {/* Horizontal line at max RPM for this gear range? No, just the slope. */}
                                        {/* Dot at max speed */}
                                        <circle cx={x} cy={getY(MAX_RPM)} r="3" fill="#DC2626" />
                                        {/* Gear Number Label */}
                                        <text x={x} y={getY(MAX_RPM) - 5} fontSize="10" fill="currentColor" textAnchor="middle" className="text-gray-600 dark:text-gray-300 font-bold">
                                            {i + 1}
                                        </text>
                                        {/* Speed Label at bottom */}
                                        {i === gears.length - 1 && (
                                            <text x={x} y={H - 5} fontSize="9" fill="currentColor" textAnchor="middle" className="text-gray-400 font-mono">
                                                {Math.round(speed)}
                                            </text>
                                        )}
                                    </g>
                                );
                            })}
                        </svg>
                    </div>

                    {/* Controls */}
                    <div className="grid grid-cols-2 gap-6">

                        {/* General Settings */}
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Top Speed (Auto)</label>
                                <input
                                    type="number"
                                    value={topSpeed}
                                    onChange={(e) => setTopSpeed(parseFloat(e.target.value))}
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded px-2 py-1 text-sm font-bold"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Final Drive</label>
                                <input
                                    type="number"
                                    step="0.001"
                                    value={final}
                                    onChange={(e) => setFinal(parseFloat(e.target.value))}
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded px-2 py-1 text-sm font-bold"
                                />
                            </div>

                            <div className="flex gap-2 mt-4">
                                <button onClick={removeGear} className="flex-1 bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 rounded py-1 text-xs font-bold uppercase transition-colors">- Gear</button>
                                <button onClick={addGear} className="flex-1 bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 rounded py-1 text-xs font-bold uppercase transition-colors">+ Gear</button>
                            </div>
                        </div>

                        {/* Individual Gears */}
                        <div className="space-y-1 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                            {gears.map((ratio, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <span className="w-4 text-[10px] font-bold text-gray-400">{i + 1}</span>
                                    <input
                                        type="number"
                                        step="0.001"
                                        value={ratio}
                                        onChange={(e) => handleGearChange(i, e.target.value)}
                                        className="flex-1 bg-transparent border-b border-gray-200 dark:border-white/10 text-sm font-bold text-right py-0.5 focus:border-red-500 focus:outline-none"
                                    />
                                </div>
                            ))}
                        </div>

                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-white/5 flex gap-2">
                    {/* Reset to Default */}
                    <button
                        onClick={() => setGears([2.976, 2.100, 1.600, 1.200, 1.000])}
                        className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-white text-xs font-bold uppercase tracking-wider hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                    >
                        Reset
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 bg-red-600 text-white rounded-lg py-2 text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-colors"
                    >
                        Done
                    </button>
                </div>

            </div>
        </div>
    );
};

export default TransmissionTuner;
