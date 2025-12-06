'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Plus, Trash2, ArrowLeft, X, Save } from 'lucide-react';
import styles from './posters.module.css';
import Link from 'next/link';

// Dynamically import map to avoid SSR issues
const PostersMap = dynamic(() => import('@/components/PostersMap'), {
    ssr: false,
    loading: () => <div style={{ height: '100%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Karte wird geladen...</div>
});

interface Poster {
    id: number;
    lat: number;
    lng: number;
    note?: string;
}

export default function PostersPage() {
    const [posters, setPosters] = useState<Poster[]>([]);
    const [selectedPoster, setSelectedPoster] = useState<Poster | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch posters
    const fetchPosters = useCallback(async () => {
        try {
            const res = await fetch('/api/posters');
            if (res.ok) {
                const data = await res.json();
                setPosters(data);
            }
        } catch (error) {
            console.error('Failed to fetch posters:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPosters();
    }, [fetchPosters]);

    // Add current location
    const handleAddCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                // Add poster
                const res = await fetch('/api/posters', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ lat: latitude, lng: longitude, note: '' })
                });
                if (res.ok) {
                    const newPoster = await res.json();
                    setPosters(prev => [newPoster, ...prev]);
                    setSelectedPoster(newPoster);
                } else {
                    alert('Fehler beim Speichern.');
                }
            }, (error) => {
                console.error(error);
                let msg = 'Standort konnte nicht ermittelt werden.';

                if (error.code === 1) {
                    msg = 'Standortzugriff verweigert (Fehlercode 1).';
                    msg += '\n\nDa der Browser nicht mehr fragt, wurde der Zugriff wahrscheinlich dauerhaft blockiert oder die Verbindung ist unsicher (kein HTTPS).';
                    msg += '\n\nLösung: Tippen Sie auf das Schloss-Symbol in der Adressleiste und setzen Sie die Berechtigung zurück, oder tippen Sie einfach auf die Karte.';
                } else if (error.code === 2) {
                    msg += ' GPS-Signal nicht verfügbar (Fehlercode 2).';
                } else if (error.code === 3) {
                    msg += ' Zeitüberschreitung (Fehlercode 3).';
                }

                alert(`${msg} \n\nTipp: Sie können auch auf die Karte tippen, um ein Plakat hinzuzufügen.`);
            }, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            });
        } else {
            alert('Geolocation wird von diesem Browser nicht unterstützt.');
        }
    };

    // Add Poster at Clicked Location (Map tap fallback)
    const handleMapClick = async (latlng: [number, number]) => {
        // If a poster is selected, deselect it
        if (selectedPoster) {
            setSelectedPoster(null);
            return;
        }

        // If nothing selected, add new poster at clicked location
        if (confirm('Neues Plakat an dieser Stelle hinzufügen?')) {
            const res = await fetch('/api/posters', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lat: latlng[0], lng: latlng[1], note: '' })
            });

            if (res.ok) {
                const newPoster = await res.json();
                setPosters(prev => [newPoster, ...prev]);
                setSelectedPoster(newPoster);
            }
        }
    };

    const handleUpdatePoster = async () => {
        if (!selectedPoster) return;

        const res = await fetch(`/api/posters/${selectedPoster.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                lat: selectedPoster.lat,
                lng: selectedPoster.lng,
                note: selectedPoster.note
            })
        });

        if (res.ok) {
            setPosters(prev => prev.map(p => p.id === selectedPoster.id ? selectedPoster : p));
            setSelectedPoster(null);
        } else {
            alert('Fehler beim Aktualisieren.');
        }
    };

    const handleDeletePoster = async () => {
        if (!selectedPoster) return;
        if (!confirm('Dieses Plakat wirklich löschen?')) return;

        const res = await fetch(`/api/posters/${selectedPoster.id}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            setPosters(prev => prev.filter(p => p.id !== selectedPoster.id));
            setSelectedPoster(null);
        } else {
            alert('Fehler beim Löschen.');
        }
    };

    const handleDeleteAll = async () => {
        if (!confirm('ACHTUNG: Alle Plakate endgültig löschen? Dies kann nicht rückgängig gemacht werden.')) return;

        const res = await fetch('/api/posters', { method: 'DELETE' });
        if (res.ok) {
            setPosters([]);
            setSelectedPoster(null);
        } else {
            alert('Fehler beim Löschen.');
        }
    };

    // Optimistic drag update
    const onPosterDragEnd = async (id: number, lat: number, lng: number) => {
        // Update local state immediately
        setPosters(prev => prev.map(p => p.id === id ? { ...p, lat, lng } : p));

        const poster = posters.find(p => p.id === id);
        if (selectedPoster && selectedPoster.id === id) {
            setSelectedPoster({ ...selectedPoster, lat, lng });
        }

        // Sync with server
        await fetch(`/api/posters/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat, lng, note: poster?.note })
        });
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link href="/" className={styles.buttonIcon}>
                        <ArrowLeft />
                    </Link>
                    <h1 className={styles.title}>Plakate ({posters.length})</h1>
                </div>
                <button className={styles.buttonIcon} onClick={handleDeleteAll} title="Alle löschen" style={{ color: '#ef4444' }}>
                    <Trash2 />
                </button>
            </header>

            <div className={styles.mapWrapper}>
                {!loading && (
                    <PostersMap
                        posters={posters}
                        onPosterClick={setSelectedPoster}
                        onMapClick={handleMapClick}
                        onPosterDragEnd={onPosterDragEnd}
                        selectedPosterId={selectedPoster?.id}
                    />
                )}

                <button className={styles.fab} onClick={handleAddCurrentLocation} title="Aktuellen Standort hinzufügen">
                    <Plus size={32} />
                </button>
            </div>

            <div className={`${styles.overlay} ${selectedPoster ? styles.visible : ''}`}>
                {selectedPoster && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Standort bearbeiten</h3>
                            <button onClick={() => setSelectedPoster(null)} className={styles.buttonIcon}>
                                <X />
                            </button>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label className="block text-sm font-medium mb-1" style={{ color: '#94a3b8' }}>Notiz / Standort</label>
                            <input
                                className={styles.input}
                                value={selectedPoster.note || ''}
                                onChange={(e) => setSelectedPoster({ ...selectedPoster, note: e.target.value })}
                                placeholder="z.B. Marktplatz Laterne..."
                                autoFocus
                            />
                        </div>

                        <div className="text-xs text-gray-400 mb-4 font-mono">
                            {selectedPoster.lat.toFixed(6)}, {selectedPoster.lng.toFixed(6)}
                        </div>

                        <div className={styles.controls}>
                            <button className={`${styles.button} ${styles.buttonDanger}`} onClick={handleDeletePoster}>
                                <Trash2 size={18} /> Löschen
                            </button>
                            <button className={`${styles.button} ${styles.buttonPrimary}`} onClick={handleUpdatePoster}>
                                <Save size={18} /> Speichern
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

