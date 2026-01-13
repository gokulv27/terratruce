import React, { useState, useRef } from 'react';

import { useNavigate } from 'react-router-dom';
import MapView from '../components/Map/MapView';
import LocationSearch from '../components/Search/LocationSearch';
import RiskGauge from '../components/Insights/RiskGauge';
import HistoricalCharts from '../components/Charts/HistoricalCharts';
import EconomicDashboard from '../components/Analytics/EconomicDashboard';
import VisualMetrics from '../components/Analytics/VisualMetrics';
import FacilitiesDisplay from '../components/Insights/FacilitiesDisplay';
import AnalysisLoader from '../components/UI/AnalysisLoader';
import ComparisonView from '../components/Analytics/ComparisonView';
import InsightsPanel from '../components/Insights/InsightsPanel';
import {
  analyzePropertyRisk,
  extractAddressFromOCR,
  sendRiskReportEmail,
  searchPropertyListings,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useComparison } from '../context/ComparisonContext';
import { useAnalysis } from '../context/AnalysisContext';
import {
  Calculator,
  ArrowRightLeft,
  FileText,
  Loader2,
  PlusCircle,
  Sparkles,
  AlertTriangle,
  MapIcon,
  Maximize2,
  ArrowRight,
} from 'lucide-react';
import Tesseract from 'tesseract.js';
import { supabase } from '../services/supabase';

const Analyze = () => {
  const { user } = useAuth();
  const { addToCompare, comparedProperties, toggleCompareVisibility } = useComparison();
  const { history, addToHistory, triggerChat } = useAnalysis();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // State
  const [location, setLocation] = useState('');
  const [mapLocation, setMapLocation] = useState({ lat: 40.7128, lng: -74.006 });
  const [riskData, setRiskData] = useState(null);
  const [propertyListings, setPropertyListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [showInsights, setShowInsights] = useState(false);

  // Property filter state
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [propertyType, setPropertyType] = useState('land');

  // Save search to history
  const saveSearchHistory = async (locationName, riskScore = null) => {
    if (!user) return;
    try {
      await supabase.from('search_history').insert({
        user_id: user.id,
        location_name: locationName,
        risk_score: riskScore,
      });
      addToHistory({ location_name: locationName, risk_score: riskScore });
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  };

  // OCR Text Extraction
  const extractTextFromFile = async (file) => {
    const {
      data: { text },
    } = await Tesseract.recognize(file, 'eng', {
      logger: (m) => console.log(m),
    });
    return text;
  };

  // PII Redaction
  const redactPII = (text) => {
    return text
      .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN REDACTED]')
      .replace(/\b\d{10,16}\b/g, '[CARD REDACTED]')
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL REDACTED]');
  };

  const handleLocationSelect = async (locationName, coordinates) => {
    setLoading(true);
    if (locationName) setLocation(locationName);

    // Map Update
    if (coordinates) {
      setMapLocation(coordinates);
    }

    // Fetch both risk analysis and property listings in parallel
    const [data, listingsData] = await Promise.all([
      analyzePropertyRisk(locationName),
      searchPropertyListings(locationName, propertyType, 10, minBudget, maxBudget),
    ]);

    if (data) {
      setRiskData(data);
      setShowInsights(true);
      if (data.location_info?.coordinates) {
        setMapLocation(data.location_info.coordinates);
      }
      // Save History with Risk Score
      await saveSearchHistory(locationName, data.risk_analysis?.overall_score);

      // Send Email Report
      if (user?.email) sendRiskReportEmail(user.email, locationName, data);
    }

    // Set property listings
    if (listingsData?.listings) {
      setPropertyListings(listingsData.listings);
    }

    setLoading(false);
  };

  const handleAnalyze = async (searchLocation = location) => {
    if (!searchLocation) return;
    setLoading(true);
    setShowInsights(true);
    // Force update location state if triggered via hot search
    setLocation(searchLocation);

    const data = await analyzePropertyRisk(searchLocation);
    if (data) {
      setRiskData(data);
      if (data.location_info?.coordinates) {
        setMapLocation(data.location_info.coordinates);
      }
      // Save History with Risk Score
      await saveSearchHistory(searchLocation, data.risk_analysis?.overall_score);

      // Send Email Report
      if (user?.email) sendRiskReportEmail(user.email, searchLocation, data);
    }
    setLoading(false);
  };

  const handleMapClick = async (coords) => {
    setLoading(true);
    const locationString = `${coords.lat}, ${coords.lng}`;

    // Save History logic for map clicks too? Maybe optional.
    // Let's add it for consistency.
    await saveSearchHistory(locationString);

    const data = await analyzePropertyRisk(locationString);
    if (data) {
      setRiskData(data);
      setMapLocation(coords);
      setShowInsights(true);

      // Send Email Report
      if (user?.email) sendRiskReportEmail(user.email, locationString, data);
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
      const safeText = redactPII(text);

      // Step 3: Address Extraction via Perplexity
      const extractedAddress = await extractAddressFromOCR(safeText);

      if (extractedAddress && extractedAddress !== 'No address found') {
        setLocation(extractedAddress);
        // handleAnalyze handles saving history now
        handleAnalyze(extractedAddress);
      } else {
        alert('Could not identify a property address in this document.');
      }
    } catch (err) {
      console.error(err);
      alert('Error processing document: ' + err.message);
    } finally {
      setScanning(false);
    }
  };

  // Prepare markers: Property, Hospitals, Schools, Listings
  const getMarkers = () => {
    if (!riskData) return [];

    const markers = [];

    // Main property marker
    markers.push({
      position: mapLocation,
      color:
        riskData.risk_analysis?.overall_score > 70
          ? '#EF4444'
          : riskData.risk_analysis?.overall_score > 40
            ? '#FACC15'
            : '#22C55E',
    });

    // Listings (Blue)
    riskData.market_intelligence?.recent_listings?.forEach((item) => {
      if (item.coordinates) {
        markers.push({ position: item.coordinates, color: '#3B82F6' });
      }
    });

    return markers;
  };

  // Show Loader when analyzing
  if (loading) {
    return <AnalysisLoader />;
  }

  return (
    <div className="flex flex-col h-full gap-4 pb-4 relative">
      {/* Top Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="w-full md:w-2/3 lg:w-1/2 relative z-30">
          <LocationSearch
            onSearch={(data) => handleLocationSelect(data.name, { lat: data.lat, lng: data.lng })}
            loading={loading}
            history={history}
          />
        </div>
        <div className="flex items-center gap-3">
          {/* ROI Calculator Button */}
          <button
            onClick={() =>
              navigate('/market', {
                state: { location: location, riskScore: riskData?.overall_risk_score },
              })
            }
            disabled={!riskData}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all shadow-sm ${
              riskData
                ? 'bg-brand-secondary text-white hover:bg-brand-secondary/90 shadow-brand-secondary/20'
                : 'bg-surface border border-border text-text-secondary opacity-50 cursor-not-allowed'
            }`}
          >
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">Calculate ROI</span>
          </button>

          {/* View Comparison Button */}
          <button
            onClick={toggleCompareVisibility}
            className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-border rounded-xl font-semibold text-text-primary hover:bg-surface-elevated transition-colors shadow-sm relative"
          >
            <ArrowRightLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Compare</span>
            {comparedProperties.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-primary text-[10px] text-white font-bold ring-2 ring-background">
                {comparedProperties.length}
              </span>
            )}
          </button>

          {/* Scan Button (Mobile/Desktop) */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-border rounded-xl font-semibold text-brand-primary hover:bg-surface-elevated transition-colors shadow-sm"
            title="Scan Property Document"
          >
            {scanning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Scan Doc</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg"
          />
        </div>
      </div>

      {/* Main Content - Always Visible */}
      <div className="flex-1 flex overflow-hidden relative min-h-[600px]">
        {/* Map View - Width adjusts based on data */}
        <div
          className={`relative z-0 bg-gray-200 dark:bg-gray-800 ${riskData ? 'w-full md:w-[55%]' : 'w-full'}`}
          style={{ height: '100%' }}
        >
          <MapView location={mapLocation} markers={getMarkers()} onLocationClick={handleMapClick} />

          {/* Empty State Overlay */}
          {!riskData && !loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/5 dark:bg-white/5 backdrop-blur-[2px] z-10 p-4 pointer-events-none">
              <div className="bg-white/90 dark:bg-slate-900/90 border border-border p-8 rounded-3xl shadow-2xl max-w-md text-center backdrop-blur-md pointer-events-auto">
                <div className="h-16 w-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MapIcon className="h-8 w-8 text-brand-primary" />
                </div>
                <h2 className="text-xl font-bold text-text-primary mb-2">Explore the Map</h2>
                <p className="text-sm text-text-secondary">
                  Click anywhere on the map or use the search bar to generate a{' '}
                  <span className="text-brand-primary font-bold">Risk Analysis Report</span>.
                </p>
              </div>
            </div>
          )}

          {/* Map Overlay Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 pointer-events-auto z-20">
            <button className="p-2 bg-surface/90 text-text-primary rounded-lg hover:bg-brand-primary hover:text-white transition-colors shadow-lg">
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Property Insights Panel - Only if Data exists */}
        {riskData && (
          <div
            className={`
                        fixed inset-x-0 bottom-0 h-[65%] md:h-auto md:top-0 md:relative md:inset-auto md:w-[45%] 
                        bg-surface md:shadow-none border-l border-border overflow-y-auto custom-scrollbar
                        transition-transform duration-300 ease-in-out z-20 rounded-t-3xl md:rounded-none shadow-2xl
                        ${showInsights ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
                    `}
          >
            <div className="p-4 md:hidden flex justify-center sticky top-0 bg-surface/95 backdrop-blur z-30 border-b border-border">
              <div className="w-12 h-1.5 bg-border rounded-full" />
            </div>

            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-text-primary">Risk Report</h2>
                {riskData && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        triggerChat(
                          `Find top 5 plots for sale in ${location} and rate them based on the risk data.`
                        )
                      }
                      className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg text-xs font-bold hover:shadow-lg hover:scale-105 transition-all shadow-md"
                    >
                      <Sparkles className="h-3 w-3" />
                      Give Suggestions
                    </button>
                    <button
                      onClick={() => addToCompare(riskData)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-brand-primary/10 text-brand-primary rounded-lg text-xs font-bold hover:bg-brand-primary hover:text-white transition-all"
                    >
                      <PlusCircle className="h-3 w-3" />
                      Compare
                    </button>
                  </div>
                )}
              </div>

              <InsightsPanel data={riskData} loading={loading} />

              <div className="mt-8 p-4 bg-surface-elevated rounded-xl border border-border flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-text-secondary mt-0.5" />
                <p className="text-[10px] text-text-secondary leading-normal">
                  <strong>Disclaimer:</strong> This risk audit is AI-generated and uses crowdsourced
                  data points. It is not a legally binding guarantee of safety or value. We strongly
                  recommend physically visiting the location and consulting a legal professional
                  before finalizing any property transaction.
                </p>
              </div>

              {/* Property Listings Section */}
              {propertyListings.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                      <MapIcon className="h-5 w-5 text-brand-primary" />
                      Available Properties in {location}
                    </h3>
                  </div>

                  {/* Filters */}
                  <div className="mb-4 p-4 bg-surface-elevated rounded-xl border border-border">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <label className="text-xs font-bold text-text-secondary mb-1 block">
                          Property Type
                        </label>
                        <select
                          value={propertyType}
                          onChange={(e) => setPropertyType(e.target.value)}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary focus:border-brand-primary focus:outline-none"
                        >
                          <option value="land">Land</option>
                          <option value="house">House</option>
                          <option value="apartment">Apartment</option>
                          <option value="commercial">Commercial</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-text-secondary mb-1 block">
                          Min Budget
                        </label>
                        <input
                          type="text"
                          value={minBudget}
                          onChange={(e) => setMinBudget(e.target.value)}
                          placeholder="e.g., ₹50L, $100K"
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-brand-primary focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-text-secondary mb-1 block">
                          Max Budget
                        </label>
                        <input
                          type="text"
                          value={maxBudget}
                          onChange={(e) => setMaxBudget(e.target.value)}
                          placeholder="e.g., ₹2Cr, $500K"
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-brand-primary focus:outline-none"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={() => handleLocationSelect(location)}
                          className="w-full px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-bold hover:bg-brand-primary/90 transition-all"
                        >
                          Apply Filters
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                    {propertyListings.map((listing, index) => (
                      <div
                        key={index}
                        className="bg-surface-elevated border border-border rounded-xl overflow-hidden hover:border-brand-primary/40 transition-all group"
                      >
                        <div className="flex gap-3 p-3">
                          {/* Image */}
                          <div className="w-24 h-24 shrink-0 bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10 rounded-lg overflow-hidden">
                            {listing.image_url ? (
                              <img
                                src={listing.image_url}
                                alt={listing.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <MapIcon className="h-8 w-8 text-text-secondary/30" />
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm text-text-primary truncate mb-1">
                              {listing.title}
                            </h4>
                            <p className="text-xs text-text-secondary mb-2 line-clamp-2">
                              {listing.description}
                            </p>
                            <div className="flex items-center gap-3 text-xs">
                              <span className="font-bold text-green-600">{listing.price}</span>
                              {listing.area && (
                                <span className="text-text-secondary">{listing.area}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-text-secondary">{listing.source}</span>
                              <a
                                href={listing.listing_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-auto text-xs font-bold text-brand-primary hover:underline flex items-center gap-1"
                              >
                                View Listing
                                <ArrowRight className="h-3 w-3" />
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ComparisonView />
    </div>
  );
};

export default Analyze;
