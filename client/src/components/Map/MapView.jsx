import React, { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

const MapView = ({ location = { lat: 51.505, lng: -0.09 }, markers = [] }) => {
    const [center, setCenter] = useState(location);

    useEffect(() => {
        if (location && location.lat && location.lng) {
            setCenter(location);
        }
    }, [location]);

    return (
        <div className="h-full w-full">
            <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
                <Map
                    defaultCenter={center}
                    center={center}
                    defaultZoom={13}
                    mapId="DEMO_MAP_ID" // Required for AdvancedMarker
                    options={{
                        disableDefaultUI: true,
                        zoomControl: true,
                        streetViewControl: false,
                        mapTypeControl: false,
                    }}
                >
                    {markers.map((marker, index) => (
                        <AdvancedMarker key={index} position={marker.position}>
                            <Pin
                                background={marker.color || '#3B82F6'}
                                borderColor={'#ffffff'}
                                glyphColor={'#ffffff'}
                            />
                        </AdvancedMarker>
                    ))}
                </Map>
            </APIProvider>
        </div>
    );
};

export default MapView;
