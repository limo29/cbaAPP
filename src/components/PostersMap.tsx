'use client';

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import L from 'leaflet';

interface PostersMapProps {
    posters: any[];
    onPosterClick: (poster: any) => void;
    onMapClick: (latlng: [number, number]) => void;
    onPosterDragEnd?: (id: number, lat: number, lng: number) => void;
    center?: [number, number];
    zoom?: number;
    selectedPosterId?: number | null;
}

function MapEvents({ onMapClick }: { onMapClick: (latlng: [number, number]) => void }) {
    useMapEvents({
        click(e) {
            onMapClick([e.latlng.lat, e.latlng.lng]);
        }
    });
    return null;
}

// Custom icon for posters (Purple for normal)
const posterIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Red for selected
const selectedPosterIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

export default function PostersMap({
    posters,
    onPosterClick,
    onMapClick,
    onPosterDragEnd,
    center = [49.4432, 11.8566], // Amberg
    zoom = 13,
    selectedPosterId
}: PostersMapProps) {

    return (
        <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%', zIndex: 0 }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <MapEvents onMapClick={onMapClick} />

            {posters.map((poster) => (
                <Marker
                    key={poster.id}
                    position={[poster.lat, poster.lng]}
                    icon={poster.id === selectedPosterId ? selectedPosterIcon : posterIcon}
                    draggable={!!onPosterDragEnd && poster.id === selectedPosterId} // Only draggable if selected
                    eventHandlers={{
                        click: (e) => {
                            L.DomEvent.stopPropagation(e); // Prevent map click
                            onPosterClick(poster);
                        },
                        dragend: (e) => {
                            if (onPosterDragEnd) {
                                const marker = e.target;
                                const position = marker.getLatLng();
                                onPosterDragEnd(poster.id, position.lat, position.lng);
                            }
                        }
                    }}
                >
                </Marker>
            ))}
        </MapContainer>
    );
}
