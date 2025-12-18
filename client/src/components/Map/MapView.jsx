import React, { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { MapPin, Navigation, Locate } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { darkMapStyle } from '../../styles/mapStyles';

const MapView = ({ location, markers = [], onLocationClick }) => {
    const [mapCenter, setMapCenter] = useState({ lat: 40.7128, lng: -74.0060 });
    const [zoom, setZoom] = useState(13);
    const [clickPosition, setClickPosition] = useState(null);
    const { theme } = useTheme();

    const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    // Sync map center with location prop
    useEffect(() => {
        if (location && location.lat && location.lng) {
            setMapCenter(location);
            setZoom(14);
        }
    }, [location]);

    const handleMapClick = (e) => {
        if (e.detail.latLng) {
            const newPos = { lat: e.detail.latLng.lat, lng: e.detail.latLng.lng };
            setClickPosition(newPos);
            // Notify parent if handler provided
            if (onLocationClick) {
                onLocationClick(newPos);
            }
        }
    };

    if (!GOOGLE_MAPS_API_KEY) {
        return (
            <div className="w-full h-full bg-surface-elevated flex items-center justify-center rounded-2xl border border-border">
                <div className="text-center p-6">
                    <p className="text-red-500 font-bold mb-2">Google Maps API Key Missing</p>
                    <p className="text-text-secondary text-sm">Please add VITE_GOOGLE_MAPS_API_KEY to your .env file</p>
                </div>
            </div>
        );
    }

    return (
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
            <div className="w-full h-full rounded-2xl overflow-hidden relative group">
                <Map
                    defaultCenter={mapCenter}
                    center={mapCenter}
                    defaultZoom={zoom}
                    zoom={zoom}
                    onCameraChanged={(ev) => setZoom(ev.detail.zoom)}
                    mapId="DEMO_MAP_ID"
                    onClick={handleMapClick}
                    className="w-full h-full"
                    options={{
                        disableDefaultUI: true,
                        zoomControl: true,
                        mapTypeControl: false,
                        streetViewControl: false,
                        fullscreenControl: false,
                        styles: theme === 'dark' ? darkMapStyle : [],
                    }}
                >
                    {/* Render Prop Markers */}
                    {markers.map((marker, index) => (
                        <AdvancedMarker
                            key={index}
                            position={marker.position}
                        >
                            <div
                                className="relative"
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    backgroundColor: marker.color,
                                    border: '3px solid white',
                                    boxShadow: `0 0 20px ${marker.color}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <MapPin className="h-4 w-4 text-white" />
                            </div>
                        </AdvancedMarker>
                    ))}

                    {/* Click position marker */}
                    {clickPosition && (
                        <AdvancedMarker position={clickPosition}>
                            <div className="relative animate-pulse">
                                <div
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        backgroundColor: '#A855F7',
                                        border: '4px solid white',
                                        boxShadow: '0 0 30px #A855F7',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <MapPin className="h-5 w-5 text-white" />
                                </div>
                            </div>
                        </AdvancedMarker>
                    )}
                </Map>

                {/* Click instruction overlay */}
                <div className="absolute bottom-4 left-4 bg-surface/90 backdrop-blur-md border border-border rounded-lg px-4 py-2 shadow-lg z-10">
                    <p className="text-xs text-text-secondary flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-brand-primary" />
                        Click anywhere on the map to analyze that location
                    </p>
                </div>
            </div>
        </APIProvider>
    );
};

export default MapView;
