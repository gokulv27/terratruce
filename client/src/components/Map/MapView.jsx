import React, { useState } from 'react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { MapPin } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

/**
 * Enhanced MapView with Click-to-Select Location
 * Automatically adapts styles based on app theme
 */
const MapView = ({ location, markers = [], onLocationClick }) => {
    const [clickPosition, setClickPosition] = useState(null);
    const { theme } = useTheme();

    const handleMapClick = (event) => {
        const lat = event.detail.latLng.lat;
        const lng = event.detail.latLng.lng;

        setClickPosition({ lat, lng });

        // Notify parent component
        if (onLocationClick) {
            onLocationClick({ lat, lng });
        }
    };

    // Dark Mode Map Styles (Cyberpunk/Night)
    const darkMapStyles = [
        { elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#0f0f1e" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
        {
            featureType: "administrative.locality",
            elementType: "labels.text.fill",
            stylers: [{ color: "#d59563" }],
        },
        {
            featureType: "poi",
            elementType: "labels.text.fill",
            stylers: [{ color: "#d59563" }],
        },
        {
            featureType: "poi.park",
            elementType: "geometry",
            stylers: [{ color: "#263c3f" }],
        },
        {
            featureType: "poi.park",
            elementType: "labels.text.fill",
            stylers: [{ color: "#6b9a76" }],
        },
        {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#2a2a4a" }],
        },
        {
            featureType: "road",
            elementType: "geometry.stroke",
            stylers: [{ color: "#1f1f3a" }],
        },
        {
            featureType: "road",
            elementType: "labels.text.fill",
            stylers: [{ color: "#9ca5b3" }],
        },
        {
            featureType: "road.highway",
            elementType: "geometry",
            stylers: [{ color: "#4a4a6a" }],
        },
        {
            featureType: "road.highway",
            elementType: "geometry.stroke",
            stylers: [{ color: "#1f1f3a" }],
        },
        {
            featureType: "road.highway",
            elementType: "labels.text.fill",
            stylers: [{ color: "#f3d19c" }],
        },
        {
            featureType: "transit",
            elementType: "geometry",
            stylers: [{ color: "#2f3948" }],
        },
        {
            featureType: "transit.station",
            elementType: "labels.text.fill",
            stylers: [{ color: "#d59563" }],
        },
        {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#17263c" }],
        },
        {
            featureType: "water",
            elementType: "labels.text.fill",
            stylers: [{ color: "#515c6d" }],
        },
        {
            featureType: "water",
            elementType: "labels.text.stroke",
            stylers: [{ color: "#17263c" }],
        },
    ];

    // Light Mode Map Styles (Clean/Standard)
    const lightMapStyles = [
        {
            featureType: "poi.business",
            stylers: [{ visibility: "off" }],
        },
        {
            featureType: "transit",
            elementType: "labels.icon",
            stylers: [{ visibility: "off" }],
        },
    ];

    return (
        <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
            <div className="w-full h-full relative">
                <Map
                    defaultCenter={location}
                    center={location}
                    defaultZoom={12}
                    mapId="terra-truce-map"
                    onClick={handleMapClick}
                    options={{
                        styles: theme === 'dark' ? darkMapStyles : lightMapStyles,
                        disableDefaultUI: false,
                        zoomControl: true,
                        mapTypeControl: false,
                        streetViewControl: false,
                        fullscreenControl: true,
                    }}
                >
                    {/* Render markers */}
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
                <div className="absolute bottom-4 left-4 bg-surface/90 backdrop-blur-md border border-border rounded-lg px-4 py-2 shadow-lg">
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
