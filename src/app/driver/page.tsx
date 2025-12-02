'use client';

import { useState, useEffect, useRef } from 'react';
import Map from '@/components/MapWrapper';
import styles from './driver.module.css';
import { Navigation, Check, X } from 'lucide-react';

interface Tree {
    id: number;
    name: string;
    first_name?: string;
    address: string;
    zip?: string;
    city?: string;
    phone?: string;
    payment_method?: string;
    lat: number;
    lng: number;
    status: string;
    territory_id: number;
    sequence?: number;
    note?: string;
}

interface Territory {
    id: number;
    name: string;
    color: string;
    polygon: any[];
    route_geometry?: any[];
    driver_name?: string;
}

export default function DriverPage() {
    const [trees, setTrees] = useState<Tree[]>([]);
    const [territories, setTerritories] = useState<Territory[]>([]);
    const [selectedTerritoryId, setSelectedTerritoryId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    const [showCollected, setShowCollected] = useState(false);

    // Map State
    const [mapCenter, setMapCenter] = useState<[number, number]>([49.4432, 11.8566]);
    const [mapZoom, setMapZoom] = useState(13);
    const [highlightedTreeId, setHighlightedTreeId] = useState<number | null>(null);

    // Refs for scrolling
    const cardRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000); // Poll every 5s for live updates
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const [treesRes, terrRes] = await Promise.all([
                fetch('/api/trees'),
                fetch('/api/territories')
            ]);
            const newTrees = await treesRes.json();
            const newTerritories = await terrRes.json();

            setTrees(prev => JSON.stringify(prev) !== JSON.stringify(newTrees) ? newTrees : prev);
            setTerritories(prev => JSON.stringify(prev) !== JSON.stringify(newTerritories) ? newTerritories : prev);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleStatus = async (id: number, status: string) => {
        // Optimistic update
        setTrees(prev => prev.map(t => t.id === id ? { ...t, status } : t));

        await fetch(`/api/trees/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
        fetchData();
    };

    const openNavigation = (lat: number, lng: number) => {
        if (lat && lng) {
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
        } else {
            alert('Keine Koordinaten vorhanden');
        }
    };

    const allTerritoryTrees = selectedTerritoryId
        ? trees.filter(t => t.territory_id === selectedTerritoryId).sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
        : [];

    const displayTrees = showCollected
        ? allTerritoryTrees
        : allTerritoryTrees.filter(t => t.status !== 'collected');

    const selectedTerritory = territories.find(t => t.id === selectedTerritoryId);

    // Update map center when territory changes
    useEffect(() => {
        if (selectedTerritory && selectedTerritory.polygon.length > 0) {
            const lat = selectedTerritory.polygon.reduce((sum: number, p: number[]) => sum + p[0], 0) / selectedTerritory.polygon.length;
            const lng = selectedTerritory.polygon.reduce((sum: number, p: number[]) => sum + p[1], 0) / selectedTerritory.polygon.length;
            setMapCenter([lat, lng]);
            setMapZoom(14);
        }
    }, [selectedTerritory]);

    // Handle Card Click -> Focus Map
    const handleCardClick = (tree: Tree) => {
        if (tree.lat && tree.lng) {
            setMapCenter([tree.lat, tree.lng]);
            setMapZoom(18);
            setHighlightedTreeId(tree.id);
        }
    };

    // Handle Map Tree Click -> Scroll Card
    const handleMapTreeClick = (tree: Tree) => {
        setHighlightedTreeId(tree.id);
        const el = cardRefs.current[tree.id];
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Fahrer Ansicht</h1>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                        onClick={() => setShowCollected(!showCollected)}
                        className={styles.toggleButton}
                        style={{
                            background: showCollected ? 'var(--primary)' : 'transparent',
                            color: showCollected ? 'black' : 'var(--foreground)',
                            border: '1px solid var(--border)',
                            padding: '0.5rem',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        title={showCollected ? "Erledigte ausblenden" : "Erledigte anzeigen"}
                    >
                        <Check size={20} />
                    </button>
                    <select
                        className={styles.select}
                        onChange={(e) => setSelectedTerritoryId(Number(e.target.value))}
                        value={selectedTerritoryId || ''}
                    >
                        <option value="">Gebiet wählen...</option>
                        {territories.map(t => (
                            <option key={t.id} value={t.id}>
                                {t.name} {t.driver_name ? `(${t.driver_name})` : ''}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className={styles.mapContainer}>
                <Map
                    trees={displayTrees}
                    territories={selectedTerritory ? [selectedTerritory] : []}
                    center={mapCenter}
                    zoom={mapZoom}
                    showRoute={true}
                    onTreeClick={handleMapTreeClick}
                />
            </div>

            <div className={styles.list}>
                {displayTrees.map((tree, index) => (
                    <div
                        key={tree.id}
                        ref={(el) => { cardRefs.current[tree.id] = el; }}
                        className={styles.card}
                        style={{
                            borderLeft: `4px solid ${tree.status === 'collected' ? '#22c55e' : tree.status === 'not_found' ? '#ef4444' : 'transparent'}`,
                            outline: highlightedTreeId === tree.id ? '2px solid #3b82f6' : 'none',
                            transform: highlightedTreeId === tree.id ? 'scale(1.02)' : 'scale(1)',
                            transition: 'all 0.2s ease-in-out'
                        }}
                        onClick={() => handleCardClick(tree)}
                    >
                        <div className={styles.cardContent}>
                            <div className={styles.cardHeader}>
                                <span className={styles.sequence}>{index + 1}</span>
                                <span className={styles.name}>
                                    {tree.first_name} {tree.name}
                                </span>
                            </div>

                            <div className={styles.address}>
                                {tree.address}
                                {tree.zip && tree.city && <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>{tree.zip} {tree.city}</div>}
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                                {tree.phone && (
                                    <div style={{ fontSize: '0.85rem', background: '#334155', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                                        📞 {tree.phone}
                                    </div>
                                )}
                                {tree.payment_method && (
                                    <div style={{ fontSize: '0.85rem', background: tree.payment_method === 'Baum' ? '#166534' : '#334155', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                                        💰 {tree.payment_method}
                                    </div>
                                )}
                            </div>

                            {tree.note && (
                                <div className={styles.note} style={{ marginTop: '0.5rem', color: '#facc15' }}>
                                    📝 {tree.note}
                                </div>
                            )}
                        </div>
                        <div className={styles.cardActions}>
                            <button className={styles.actionButton} onClick={(e) => { e.stopPropagation(); openNavigation(tree.lat, tree.lng); }} style={{ background: '#3b82f6' }}>
                                <Navigation size={20} />
                            </button>
                            <button className={styles.actionButton} onClick={(e) => { e.stopPropagation(); handleStatus(tree.id, 'collected'); }} style={{ background: '#22c55e' }}>
                                <Check size={20} />
                            </button>
                            <button className={styles.actionButton} onClick={(e) => { e.stopPropagation(); handleStatus(tree.id, 'not_found'); }} style={{ background: '#ef4444' }}>
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                ))}
                {selectedTerritoryId && displayTrees.length === 0 && (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                        {showCollected ? 'Keine Bäume in diesem Gebiet.' : 'Alle Bäume erledigt! 🎉'}
                    </div>
                )}
            </div>
        </div>
    );
}
