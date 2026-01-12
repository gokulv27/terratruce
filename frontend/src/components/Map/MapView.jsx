import React, { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { MapPin, Maximize2, Minimize2, RotateCw, Move } from 'lucide-react';

const MapView = ({ location, markers = [], onLocationClick }) => {
  const [mapCenter, setMapCenter] = useState({ lat: 40.7128, lng: -74.006 });
  const [zoom, setZoom] = useState(13);
  const [tilt, setTilt] = useState(0);
  const [heading, setHeading] = useState(0);
  const [is3DMode, setIs3DMode] = useState(false);
  const [clickPosition, setClickPosition] = useState(null);

  const [apiKey, setApiKey] = useState(import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '');
  const [keyError, setKeyError] = useState(false);
  const [loadingKey, setLoadingKey] = useState(!import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
  
  // Ref for the 3D map element
  const map3DRef = React.useRef(null);

  useEffect(() => {
    if (is3DMode && map3DRef.current && mapCenter) {
      const map3d = map3DRef.current;
      map3d.center = { lat: mapCenter.lat, lng: mapCenter.lng, altitude: 0 };
      map3d.tilt = tilt || 60;
      map3d.heading = heading;
      map3d.range = 1000; // Default range/zoom equivalent
    }
  }, [is3DMode, mapCenter, tilt, heading]);

  useEffect(() => {
    const fetchKey = async () => {
      // If we already have the key from env, don't fetch
      if (apiKey) {
        setLoadingKey(false);
        return;
      }

      try {
        const res = await fetch('/api/maps/config');
        if (!res.ok) throw new Error('Failed to load map config');
        const data = await res.json();
        if (data.apiKey) {
          setApiKey(data.apiKey);
        } else {
          throw new Error('No API key in config');
        }
      } catch (err) {
        console.error('Error loading Google Maps key:', err);
        setKeyError(true);
      } finally {
        setLoadingKey(false);
      }
    };

    fetchKey();
  }, []);

  // Handle Google Maps Auth Failure (global)
  useEffect(() => {
    window.gm_authFailure = () => {
      console.error('Google Maps Authentication Failed');
      setKeyError(true);
    };
    return () => {
      window.gm_authFailure = null; // Cleanup
    };
  }, []);

  // Sync map center with location prop
  useEffect(() => {
    if (location && location.lat && location.lng) {
      // Use a ref or schedule update to avoid synchronous setState
      const timer = setTimeout(() => {
        if (location.lat !== mapCenter.lat || location.lng !== mapCenter.lng) {
          setMapCenter(location);
          setZoom(16);
          if (is3DMode) {
            setTilt(45);
          }
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [location, is3DMode, mapCenter]);

  const handleMapClick = (e) => {
    if (e.detail.latLng) {
      const newPos = { lat: e.detail.latLng.lat, lng: e.detail.latLng.lng };
      setClickPosition(newPos);
      if (onLocationClick) {
        onLocationClick(newPos);
      }
    }
  };

  const toggle3DMode = () => {
    if (is3DMode) {
      setTilt(0);
      setHeading(0);
      setIs3DMode(false);
    } else {
      setTilt(45);
      setIs3DMode(true);
    }
  };

  const rotateMap = () => {
    setHeading((prev) => (prev + 90) % 360);
  };

  const resetView = () => {
    setTilt(0);
    setHeading(0);
    setZoom(13);
  };

  if (loadingKey) {
    return (
      <div className="w-full h-full bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl flex items-center justify-center">
        <span className="text-gray-400 text-sm">Loading map...</span>
      </div>
    );
  }

  if (keyError || !apiKey) {
    console.error('Google Maps API Key is missing!');
    return (
      <div className="w-full h-full min-h-[300px] bg-surface-elevated flex items-center justify-center rounded-2xl border border-border">
        <div className="text-center p-6 bg-red-500/10 rounded-xl">
          <p className="text-red-500 font-bold mb-2">Google Maps Config Error</p>
          <p className="text-text-secondary text-sm">Could not load API Key from Env or Backend</p>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey} libraries={['marker', 'maps3d']}>
      <div className="w-full h-full rounded-2xl overflow-hidden relative group">
        
        {is3DMode ? (
          // @ts-ignore - Web Component
          <gmp-map-3d
            ref={map3DRef}
            style={{ width: '100%', height: '100%', display: 'block' }}
          >
             {/* 3D Markers can be added here using <gmp-marker-3d> if needed */}
             {markers.map((marker, index) => (
                <gmp-marker-3d
                  key={index}
                  position={`${marker.position.lat},${marker.position.lng}`}
                  src={marker.type === 'risk' ? 'https://maps.google.com/mapfiles/ms/icons/red-dot.png' : 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'}
                />
             ))}
          </gmp-map-3d>
        ) : (
          <Map
            defaultCenter={mapCenter}
            center={mapCenter}
            defaultZoom={zoom}
            zoom={zoom}
            tilt={tilt}
            heading={heading}
            onCameraChanged={(ev) => {
              setZoom(ev.detail.zoom);
              if (ev.detail.tilt !== undefined) setTilt(ev.detail.tilt);
              if (ev.detail.heading !== undefined) setHeading(ev.detail.heading);
            }}
            mapId="DEMO_MAP_ID"
            onClick={handleMapClick}
            className="w-full h-full"
            style={{ width: '100%', height: '100%' }}
            options={{
              disableDefaultUI: true,
              zoomControl: true,
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: false,
              rotateControl: false,
              tiltControl: false,
            }}
            mapTypeId={'roadmap'}
          >
            {/* Render Prop Markers */}
            {markers.map((marker, index) => (
              <AdvancedMarker key={index} position={marker.position}>
                <div
                  className={`p-2 rounded-full shadow-lg transform transition-transform hover:scale-110 ${
                    marker.type === 'risk' ? 'bg-red-500' : 'bg-brand-primary'
                  }`}
                >
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
              </AdvancedMarker>
            ))}

            {/* Click Marker */}
            {clickPosition && (
              <AdvancedMarker position={clickPosition}>
                <Pin background={'#ef4444'} borderColor={'#b91c1c'} glyphColor={'#ffffff'} />
              </AdvancedMarker>
            )}
          </Map>
        )}

        {/* 3D Controls & Geolocation - Left Side */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
          <button
            onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    const pos = {
                      lat: position.coords.latitude,
                      lng: position.coords.longitude,
                    };
                    setMapCenter(pos);
                    setZoom(16);
                    if (onLocationClick) onLocationClick(pos);
                  },
                  () => {
                    alert('Error: The Geolocation service failed.');
                  }
                );
              } else {
                alert("Error: Your browser doesn't support geolocation.");
              }
            }}
            className="bg-surface/90 backdrop-blur-md border border-border rounded-lg p-3 shadow-lg hover:bg-surface transition-all"
            title="Pan to Current Location"
          >
            <MapPin className="h-5 w-5 text-brand-primary" />
          </button>

          <button
            onClick={toggle3DMode}
            className={`bg-surface/90 backdrop-blur-md border border-border rounded-lg p-3 shadow-lg hover:bg-surface transition-all ${
              is3DMode ? 'ring-2 ring-brand-primary' : ''
            }`}
            title={is3DMode ? 'Switch to 2D' : 'Switch to 3D'}
          >
            {is3DMode ? (
              <Minimize2 className="h-5 w-5 text-brand-primary" />
            ) : (
              <Maximize2 className="h-5 w-5 text-text-secondary" />
            )}
          </button>

          {is3DMode && (
            <>
              <button
                onClick={rotateMap}
                className="bg-surface/90 backdrop-blur-md border border-border rounded-lg p-3 shadow-lg hover:bg-surface transition-all"
                title="Rotate 90°"
              >
                <RotateCw className="h-5 w-5 text-text-secondary" />
              </button>

              <button
                onClick={resetView}
                className="bg-surface/90 backdrop-blur-md border border-border rounded-lg p-3 shadow-lg hover:bg-surface transition-all"
                title="Reset View"
              >
                <Move className="h-5 w-5 text-text-secondary" />
              </button>
            </>
          )}
        </div>

        {/* Info overlay */}
        <div className="absolute bottom-4 left-4 bg-surface/90 backdrop-blur-md border border-border rounded-lg px-4 py-2 shadow-lg z-10">
          <p className="text-xs text-text-secondary flex items-center gap-2">
            <MapPin className="h-3 w-3 text-brand-primary" />
            {is3DMode ? '3D View Active - Click to analyze' : 'Click anywhere to analyze'}
          </p>
        </div>

        {/* 3D Mode Badge - Top Right */}
        {is3DMode && (
          <div className="absolute top-4 right-4 bg-brand-primary/90 backdrop-blur-md rounded-lg px-3 py-1 shadow-lg z-10">
            <p className="text-xs font-bold text-white">3D PHOTOREALISTIC</p>
          </div>
        )}
      </div>
    </APIProvider>
  );
};

export default MapView;
