import React, { useState, useRef } from 'react';
import MapView from '../components/Map/MapView';
import InsightsPanel from '../components/Insights/InsightsPanel';
import { Search, FileText, Loader2, Sparkles } from 'lucide-react';
import { analyzePropertyRisk, extractAddressFromOCR } from '../services/api';
import { extractTextFromFile, redactPII } from '../services/ocrService';

const Analyze = () => {
    const [showInsights, setShowInsights] = useState(true);
    const [location, setLocation] = useState('');
    const [loading, setLoading] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [mapLocation, setMapLocation] = useState({ lat: 40.7128, lng: -74.0060 }); // Default NYC
    const [riskData, setRiskData] = useState(null);
    const fileInputRef = useRef(null);

    const handleAnalyze = async (searchLocation = location) => {
        if (!searchLocation) return;
        setLoading(true);
        setShowInsights(true);
        const data = await analyzePropertyRisk(searchLocation);
        if (data) {
            setRiskData(data);
            if (data.coordinates) {
                setMapLocation(data.coordinates);
            }
        }
        setLoading(false);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setScanning(true);
        try {
            // Step 1: OCR
            const text = await extractTextFromFile(file);

            // Step 2: Redact PII (Privacy Measure)
            const safeText = redactPII(text); // Use the imported redactPII function

            // Step 3: Address Extraction via Perplexity
            const extractedAddress = await extractAddressFromOCR(safeText);

            if (extractedAddress && extractedAddress !== "No address found") {
                setLocation(extractedAddress);
                handleAnalyze(extractedAddress);
            } else {
                alert("Could not identify a property address in this document.");
            }
        } catch (err) {
            console.error(err);
            alert("Error processing document: " + err.message);
        } finally {
            setScanning(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleAnalyze();
    };

    // Prepare markers: Property, Hospitals, Schools, Listings
    const getMarkers = () => {
        if (!riskData) return [];

        const markers = [];

        // Main property marker
        markers.push({
            position: mapLocation,
            color: riskData.overall_score > 70 ? '#EF4444' : riskData.overall_score > 40 ? '#FACC15' : '#22C55E'
        });

        // Listings (Blue)
        riskData.recent_listings?.forEach(item => {
            markers.push({ position: item.coordinates, color: '#3B82F6' });
        });

        // Hospitals (Red/Siren)
        riskData.nearby_hospitals?.forEach(h => {
            markers.push({ position: h.coordinates, color: '#DC2626' });
        });

        // Schools (Green)
        riskData.nearby_schools?.forEach(s => {
            markers.push({ position: s.coordinates, color: '#16A34A' });
        });

        return markers;
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50">
            {/* Top Input Bar */}
            <div className="h-20 bg-white/95 backdrop-blur-md border-b border-slate-200 flex items-center px-4 md:px-6 shadow-sm z-10 sticky top-0">
                <div className="flex items-center flex-1 max-w-5xl mx-auto gap-4">
                    <div className="relative w-full">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                            <Search className="h-5 w-5" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-12 pr-12 py-3.5 border-2 border-slate-100 rounded-2xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 sm:text-sm transition-all shadow-inner"
                            placeholder="Enter Location or Scan Document..."
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            onKeyDown={handleKeyPress}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-primary hover:scale-110 transition-transform"
                            title="Scan Property Document"
                        >
                            {scanning ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            className="hidden"
                            accept=".pdf,.png,.jpg,.jpeg"
                        />
                    </div>
                    <button
                        onClick={() => handleAnalyze()}
                        disabled={loading || !location}
                        className="bg-primary text-white px-8 py-3.5 rounded-2xl text-sm font-bold hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        Analyze
                    </button>
                </div>
            </div>

            {/* Main Content - Split Screen */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Map View */}
                <div className="w-full md:w-[65%] h-full relative z-0">
                    <MapView
                        location={mapLocation}
                        markers={getMarkers()}
                    />
                </div>

                {/* Property Insights Panel */}
                <div className={`
                    fixed inset-x-0 bottom-0 h-[65%] md:h-auto md:top-0 md:relative md:inset-auto md:w-[35%] 
                    bg-white md:shadow-none border-l border-slate-200 overflow-y-auto 
                    transition-transform duration-300 ease-in-out z-20 rounded-t-3xl md:rounded-none shadow-2xl
                    ${showInsights ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
                `}>
                    <InsightsPanel data={riskData} loading={loading} />

                    {/* Safety Disclaimer */}
                    <div className="mt-8 p-4 bg-slate-100 rounded-xl border border-slate-200 flex items-start gap-3">
                        <AlertTriangle className="h-4 w-4 text-slate-500 mt-0.5" />
                        <p className="text-[10px] text-slate-500 leading-normal">
                            <strong>Disclaimer:</strong> This risk audit is AI-generated and uses crowdsourced data points. It is not a legally binding guarantee of safety or value. We strongly recommend physically visiting the location and consulting a legal professional before finalizing any property transaction.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analyze;
