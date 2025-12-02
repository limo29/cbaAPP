'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload, Phone, Check, X, Trash2, RefreshCw, UserPlus, RotateCcw } from 'lucide-react';
import * as XLSX from 'xlsx';
import styles from './campaign.module.css';

interface CampaignEntry {
    id: number;
    name: string;
    address: string;
    phone: string;
    status: 'open' | 'called' | 'registered' | 'not_reached' | 'deleted';
    last_updated: string;
}

export default function CampaignPage() {
    const [entries, setEntries] = useState<CampaignEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [importStats, setImportStats] = useState<{ added: number, skipped: number } | null>(null);
    const [filter, setFilter] = useState<string>('all'); // all, open, called, etc.

    useEffect(() => {
        fetchEntries();
        const interval = setInterval(fetchEntries, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, []);

    const fetchEntries = async () => {
        try {
            const res = await fetch('/api/campaign/entries');
            if (res.ok) {
                const data = await res.json();
                setEntries(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImportFile(e.target.files[0]);
            setImportStats(null);
        }
    };

    const handleImport = async () => {
        if (!importFile) return;
        setImporting(true);
        const formData = new FormData();
        formData.append('file', importFile);

        try {
            const res = await fetch('/api/campaign/import', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (res.ok) {
                setImportStats(data);
                fetchEntries();
                setImportFile(null);
            } else {
                alert('Import failed: ' + data.error);
            }
        } catch (e) {
            console.error(e);
            alert('Import failed');
        } finally {
            setImporting(false);
        }
    };

    const updateStatus = async (id: number, status: string) => {
        // Optimistic update
        setEntries(prev => prev.map(e => e.id === id ? { ...e, status: status as any } : e));

        try {
            await fetch('/api/campaign/entries', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status })
            });
            fetchEntries(); // Refresh to be sure
        } catch (e) {
            console.error(e);
            alert('Update failed');
            fetchEntries(); // Revert on error
        }
    };

    const handleRegister = async (entry: CampaignEntry) => {
        if (!confirm(`Möchtest du "${entry.name}" wirklich anmelden?`)) return;

        // Optimistic update
        setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, status: 'registered' } : e));

        try {
            const res = await fetch('/api/campaign/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: entry.id,
                    name: entry.name,
                    address: entry.address,
                    phone: entry.phone
                })
            });

            if (!res.ok) {
                throw new Error('Registration failed');
            }

            fetchEntries();
        } catch (e) {
            console.error(e);
            alert('Anmeldung fehlgeschlagen');
            fetchEntries();
        }
    };

    const handleReset = async () => {
        if (!confirm('Wirklich den Status ALLER Einträge auf "Offen" zurücksetzen?')) return;
        try {
            await fetch('/api/campaign/actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reset_status' })
            });
            fetchEntries();
        } catch (e) {
            alert('Fehler beim Zurücksetzen');
        }
    };

    const handleDeleteAll = async () => {
        if (!confirm('Wirklich ALLE Einträge löschen? Dies kann nicht rückgängig gemacht werden.')) return;
        try {
            await fetch('/api/campaign/actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete_all' })
            });
            fetchEntries();
        } catch (e) {
            alert('Fehler beim Löschen');
        }
    };

    const filteredEntries = entries.filter(e => {
        if (filter === 'all') return e.status !== 'deleted' && e.status !== 'registered';
        if (filter === 'done') return e.status === 'registered' || e.status === 'deleted';
        return e.status === filter;
    });

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleGroup}>
                    <Link href="/" className={styles.backButton}>
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 className={styles.title}>Telefonaktion</h1>
                </div>
                <div className={styles.actions}>
                    <button onClick={handleReset} className={styles.actionButton} title="Status zurücksetzen (Alle auf Offen)">
                        <RotateCcw size={20} />
                    </button>
                    <button onClick={handleDeleteAll} className={styles.actionButton} title="Alle löschen" style={{ color: 'var(--secondary)' }}>
                        <Trash2 size={20} />
                    </button>
                    <button onClick={fetchEntries} className={styles.actionButton} title="Aktualisieren">
                        <RefreshCw size={20} />
                    </button>
                </div>
            </div>

            {/* Import Section */}
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Daten Importieren (Excel/CSV)</h2>
                <div className={styles.importControls}>
                    <div style={{ flex: 1 }}>
                        <input
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleFileChange}
                            className={styles.fileInput}
                        />
                    </div>
                    <button
                        onClick={handleImport}
                        disabled={!importFile || importing}
                        className={styles.primaryButton}
                    >
                        {importing ? <RefreshCw className="animate-spin" size={16} /> : <Upload size={16} />}
                        Importieren
                    </button>
                </div>
                {importStats && (
                    <div className={styles.successMessage}>
                        Import erfolgreich: {importStats.added} hinzugefügt, {importStats.skipped} übersprungen (Duplikate/Leer).
                    </div>
                )}
            </div>

            {/* Filter */}
            <div className={styles.filterGroup}>
                <button
                    onClick={() => setFilter('all')}
                    className={`${styles.filterButton} ${filter === 'all' ? styles.active : ''}`}
                >
                    Offen & Angerufen
                </button>
                <button
                    onClick={() => setFilter('open')}
                    className={`${styles.filterButton} ${filter === 'open' ? styles.active : ''}`}
                >
                    Nur Offen
                </button>
                <button
                    onClick={() => setFilter('called')}
                    className={`${styles.filterButton} ${filter === 'called' ? styles.active : ''}`}
                >
                    Angerufen
                </button>
                <button
                    onClick={() => setFilter('not_reached')}
                    className={`${styles.filterButton} ${filter === 'not_reached' ? styles.active : ''}`}
                >
                    Nicht erreicht
                </button>
                <button
                    onClick={() => setFilter('done')}
                    className={`${styles.filterButton} ${filter === 'done' ? styles.active : ''}`}
                >
                    Erledigt (Angemeldet/Gelöscht)
                </button>
            </div>

            {/* List */}
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={styles.th}>Name</th>
                            <th className={styles.th}>Adresse</th>
                            <th className={styles.th}>Telefon</th>
                            <th className={styles.th}>Status</th>
                            <th className={styles.th}>Aktionen</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} className={styles.loading}>Lade Daten...</td></tr>
                        ) : filteredEntries.length === 0 ? (
                            <tr><td colSpan={5} className={styles.loading}>Keine Einträge gefunden.</td></tr>
                        ) : (
                            filteredEntries.map(entry => (
                                <tr key={entry.id} className={`${styles.tr} ${entry.status === 'called' ? styles.called : ''}`}>
                                    <td className={styles.td} data-label="Name"><strong>{entry.name}</strong></td>
                                    <td className={styles.td} data-label="Adresse">{entry.address}</td>
                                    <td className={styles.td} data-label="Telefon">
                                        <a
                                            href={`tel:${entry.phone}`}
                                            className={styles.phoneLink}
                                            onClick={() => updateStatus(entry.id, 'called')}
                                        >
                                            <Phone size={14} /> {entry.phone}
                                        </a>
                                    </td>
                                    <td className={styles.td} data-label="Status">
                                        <span className={`${styles.badge} ${styles[entry.status]}`}>
                                            {entry.status === 'open' ? 'Offen' :
                                                entry.status === 'called' ? 'Angerufen' :
                                                    entry.status === 'registered' ? 'Angemeldet' :
                                                        entry.status === 'not_reached' ? 'Nicht erreicht' : 'Gelöscht'}
                                        </span>
                                    </td>
                                    <td className={styles.td}>
                                        <div className={styles.actionGroup}>
                                            <button
                                                onClick={() => updateStatus(entry.id, 'called')}
                                                className={`${styles.iconButton} ${styles.btnYellow}`}
                                                title="Angerufen"
                                            >
                                                <Phone size={18} />
                                            </button>
                                            <button
                                                onClick={() => updateStatus(entry.id, 'not_reached')}
                                                className={`${styles.iconButton} ${styles.btnOrange}`}
                                                title="Nicht erreicht"
                                            >
                                                <X size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleRegister(entry)}
                                                className={`${styles.iconButton} ${styles.btnGreen}`}
                                                title="Anmelden"
                                            >
                                                <UserPlus size={18} />
                                            </button>
                                            <button
                                                onClick={() => updateStatus(entry.id, 'deleted')}
                                                className={`${styles.iconButton} ${styles.btnRed}`}
                                                title="Löschen"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
