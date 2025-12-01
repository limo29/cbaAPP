'use client';

import { MapContainer, TileLayer, Marker, Popup, Polygon, Polyline, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import L from 'leaflet';
import { useEffect, useState, useRef } from 'react';

interface MapProps {
    trees?: any[];
    territories?: any[];
    onTreeClick?: (tree: any) => void;
    center?: [number, number];
    zoom?: number;
    isDrawing?: boolean;
    onDrawClick?: (latlng: [number, number]) => void;
    drawPoints?: [number, number][];
    draggable?: boolean;
    onMarkerDragEnd?: (treeId: number, lat: number, lng: number) => void;
    showRoute?: boolean;
}

function MapEvents({ isDrawing, onDrawClick }: { isDrawing: boolean, onDrawClick?: (latlng: [number, number]) => void }) {
    useMapEvents({
        click(e) {
            if (isDrawing && onDrawClick) {
                onDrawClick([e.latlng.lat, e.latlng.lng]);
            }
        }
    });
    return null;
}

function MapController({ center, zoom }: { center?: [number, number], zoom?: number }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, zoom || map.getZoom());
        }
    }, [center, zoom, map]);
    return null;
}

const createNumberedIcon = (number: number, color: string) => {
    return L.divIcon({
        className: 'custom-icon',
        html: `<div style="
            background-color: ${color};
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 12px;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">${number}</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12]
    });
};

export default function Map({
    trees = [],
    territories = [],
    onTreeClick,
    center = [49.4432, 11.8566], // Amberg
    zoom = 13,
    isDrawing = false,
    onDrawClick,
    drawPoints = [],
    draggable = false,
    onMarkerDragEnd,
    showRoute = false
}: MapProps) {

    const [treeDisplayInfo, setTreeDisplayInfo] = useState<Record<number, { number: number, color: string }>>({});

    useEffect(() => {
        // Group trees by territory
        const treesByTerritory = trees.reduce((acc, tree) => {
            const tid = tree.territory_id || 0; // 0 for unassigned
            if (!acc[tid]) acc[tid] = [];
            acc[tid].push(tree);
            return acc;
        }, {} as Record<number, any[]>);

        // Calculate display info (numbering)
        const newTreeDisplayInfo: Record<number, { number: number, color: string }> = {};

        Object.keys(treesByTerritory).forEach(tid => {
            const id = Number(tid);
            // Sort by sequence
            treesByTerritory[id].sort((a: any, b: any) => (a.sequence || 0) - (b.sequence || 0));

            treesByTerritory[id].forEach((tree: any, index: number) => {
                newTreeDisplayInfo[tree.id] = {
                    number: index + 1,
                    color: tree.status === 'collected' ? '#22c55e' : tree.status === 'not_found' ? '#ef4444' : '#3b82f6'
                };
            });
        });
        setTreeDisplayInfo(newTreeDisplayInfo);
    }, [trees]);

    return (
        <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%', zIndex: 0 }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            <MapController center={center} zoom={zoom} />
            <MapEvents isDrawing={isDrawing} onDrawClick={onDrawClick} />

            {territories.map((t) => (
                <Polygon
                    key={t.id}
                    positions={t.polygon}
                    pathOptions={{ color: t.color, fillOpacity: 0.2 }}
                >
                    <Popup>
                        <div style={{ color: 'black' }}>
                            <strong>{t.name}</strong><br />
                            {trees.filter(tree => tree.territory_id === t.id).length} Bäume
                        </div>
                    </Popup>
                </Polygon>
            ))}

            {/* Drawing Polygon */}
            {drawPoints.length > 0 && (
                <Polygon positions={drawPoints} pathOptions={{ color: 'orange', dashArray: '5, 5' }} />
            )}
            {drawPoints.map((p, i) => (
                <Marker key={`draw-${i}`} position={p} opacity={0.6} />
            ))}

            {/* Routes per Territory */}
            {showRoute && territories.map((territory) => {
                if (!territory.route_geometry || territory.route_geometry.length === 0) return null;

                return (
                    <Polyline
                        key={`route-${territory.id}`}
                        positions={territory.route_geometry}
                        pathOptions={{ color: territory.color, weight: 4, opacity: 0.7 }}
                    />
                );
            })}

            {trees.map((tree) => {
                const displayInfo = treeDisplayInfo[tree.id];
                if (!displayInfo || !tree.lat || !tree.lng) return null;

                return (
                    <Marker
                        key={tree.id}
                        position={[tree.lat, tree.lng]}
                        icon={createNumberedIcon(
                            displayInfo.number,
                            displayInfo.color
                        )}
                        draggable={draggable}
                        eventHandlers={{
                            click: () => onTreeClick && onTreeClick(tree),
                            dragend: (e) => {
                                if (onMarkerDragEnd) {
                                    const marker = e.target;
                                    const position = marker.getLatLng();
                                    onMarkerDragEnd(tree.id, position.lat, position.lng);
                                }
                            }
                        }}
                    >
                    </Marker>
                );
            })}
        </MapContainer>
    );
}
