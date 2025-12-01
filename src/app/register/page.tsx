'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ArrowLeft, MapPin } from 'lucide-react';
import Link from 'next/link';
import styles from './register.module.css';

// Dynamically import Map component to avoid SSR issues
const Map = dynamic(() => import('@/components/Map'), {
    ssr: false,
    loading: () => <div className={styles.mapPreview} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1e293b' }}>Lade Karte...</div>
});

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        name: '',
        first_name: '',
        address: '',
        zip: '92224',
        city: 'Amberg', // Default city
        phone: '',
        email: '',
        payment_method: 'Bar',
        note: ''
    });

    const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
    const [loading, setLoading] = useState(false);
    const [geocoding, setGeocoding] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Debounce geocoding when address fields change
    useEffect(() => {
        const timer = setTimeout(() => {
            if (formData.address && formData.zip && formData.city) {
                geocodeAddress();
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [formData.address, formData.zip, formData.city]);

    const geocodeAddress = async () => {
        setGeocoding(true);
        try {
            const query = `${formData.address}, ${formData.zip} ${formData.city}`;
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
            const data = await res.json();

            if (data && data.length > 0) {
                setCoordinates({
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon)
                });
            }
        } catch (err) {
            console.error('Geocoding failed:', err);
        } finally {
            setGeocoding(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    lat: coordinates?.lat,
                    lng: coordinates?.lng
                })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Registrierung fehlgeschlagen');

            setSuccess(true);
            setFormData({
                name: '',
                first_name: '',
                address: '',
                zip: '92224',
                city: 'Amberg',
                phone: '',
                email: '',
                payment_method: 'Bar',
                note: ''
            });
            setCoordinates(null);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className={styles.container} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: '#1e293b', padding: '2rem', borderRadius: '1rem', textAlign: 'center', border: '1px solid #334155' }}>
                    <h2 style={{ color: '#4ade80', marginBottom: '1rem', fontSize: '1.5rem' }}>Anmeldung erfolgreich!</h2>
                    <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>Vielen Dank für deine Anmeldung. Wir holen den Baum am geplanten Termin ab.</p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <button
                            onClick={() => setSuccess(false)}
                            className={styles.button}
                            style={{ marginTop: 0, background: 'transparent', border: '1px solid #334155', color: 'white' }}
                        >
                            Weitere Anmeldung
                        </button>
                        <Link href="/" className={styles.button} style={{ marginTop: 0, textDecoration: 'none', display: 'inline-block' }}>
                            Zur Startseite
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <main className={styles.container}>
            <div style={{ marginBottom: '2rem' }}>
                <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', textDecoration: 'none' }}>
                    <ArrowLeft size={20} />
                    Zurück
                </Link>
            </div>

            <h1 className={styles.title}>Baum anmelden</h1>

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.row}>
                    <div className={styles.group}>
                        <label className={styles.label}>Vorname</label>
                        <input
                            type="text"
                            className={styles.input}
                            value={formData.first_name}
                            onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                            placeholder="Max"
                        />
                    </div>
                    <div className={styles.group}>
                        <label className={styles.label}>Nachname <span className={styles.required}>*</span></label>
                        <input
                            type="text"
                            className={styles.input}
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Mustermann"
                            required
                        />
                    </div>
                </div>

                <div className={styles.group}>
                    <label className={styles.label}>Straße & Hausnummer <span className={styles.required}>*</span></label>
                    <input
                        type="text"
                        className={styles.input}
                        value={formData.address}
                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Musterstraße 12"
                        required
                    />
                </div>

                <div className={styles.row}>
                    <div className={styles.group} style={{ flex: '0 0 100px' }}>
                        <label className={styles.label}>PLZ <span className={styles.required}>*</span></label>
                        <input
                            type="text"
                            className={styles.input}
                            value={formData.zip}
                            onChange={e => setFormData({ ...formData, zip: e.target.value })}
                            placeholder="92224"
                            required
                        />
                    </div>
                    <div className={styles.group}>
                        <label className={styles.label}>Ort <span className={styles.required}>*</span></label>
                        <input
                            type="text"
                            className={styles.input}
                            value={formData.city}
                            onChange={e => setFormData({ ...formData, city: e.target.value })}
                            placeholder="Amberg"
                            required
                        />
                    </div>
                </div>

                {/* Map Preview */}
                <div className={styles.mapPreview}>
                    {coordinates ? (
                        <Map
                            trees={[{ id: 999, lat: coordinates.lat, lng: coordinates.lng, status: 'open' }]}
                            center={[coordinates.lat, coordinates.lng]}
                            zoom={16}
                        />
                    ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', flexDirection: 'column', gap: '0.5rem' }}>
                            <MapPin size={32} />
                            <span>Adresse eingeben für Vorschau</span>
                        </div>
                    )}
                    {geocoding && (
                        <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(0,0,0,0.7)', padding: '0.5rem', borderRadius: '0.5rem', fontSize: '0.8rem' }}>
                            Suche Position...
                        </div>
                    )}
                </div>

                <div className={styles.row}>
                    <div className={styles.group}>
                        <label className={styles.label}>Telefon</label>
                        <input
                            type="tel"
                            className={styles.input}
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="0123 456789"
                        />
                    </div>
                    <div className={styles.group}>
                        <label className={styles.label}>E-Mail</label>
                        <input
                            type="email"
                            className={styles.input}
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            placeholder="max@beispiel.de"
                        />
                    </div>
                </div>

                <div className={styles.group}>
                    <label className={styles.label}>Bezahlung</label>
                    <select
                        className={styles.select}
                        value={formData.payment_method}
                        onChange={e => setFormData({ ...formData, payment_method: e.target.value })}
                    >
                        <option value="Bar">Bar (bei Abholung)</option>
                        <option value="Vorkasse">Vorkasse</option>
                        <option value="Überweisung">Überweisung</option>
                    </select>
                </div>

                <div className={styles.group}>
                    <label className={styles.label}>Notiz</label>
                    <textarea
                        className={styles.textarea}
                        value={formData.note}
                        onChange={e => setFormData({ ...formData, note: e.target.value })}
                        placeholder="Z.B. Ablageort, Besonderheiten..."
                    />
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <button type="submit" className={styles.button} disabled={loading}>
                    {loading ? 'Wird angemeldet...' : 'Kostenpflichtig anmelden'}
                </button>
            </form>
        </main>
    );
}
