'use client';

import { useState } from 'react';
import { Plus, Trash2, X, Save } from 'lucide-react';
import styles from '@/app/admin/admin.module.css';

interface Territory {
    id: number;
    name: string;
    color: string;
    polygon: any[];
    route_geometry?: any[];
}

interface TerritoryManagerProps {
    territories: Territory[];
    onSave: (name: string, color: string) => void;
    onDelete: (id: number) => void;
    isDrawing: boolean;
    onStartDrawing: () => void;
    showModal: boolean;
    onCloseModal: () => void;
}

export function TerritoryManager({
    territories,
    onSave,
    onDelete,
    isDrawing,
    onStartDrawing,
    showModal,
    onCloseModal
}: TerritoryManagerProps) {
    const [newTerritoryName, setNewTerritoryName] = useState('');
    const [newTerritoryColor, setNewTerritoryColor] = useState('#ff0000');

    const handleSave = () => {
        onSave(newTerritoryName, newTerritoryColor);
        setNewTerritoryName('');
        setNewTerritoryColor('#ff0000');
    };

    if (showModal) {
        return (
            <div className={styles.modalOverlay}>
                <div className={styles.modal}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white' }}>Neues Gebiet speichern</h2>
                        <button onClick={onCloseModal} className={styles.iconButton}><X size={20} /></button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className={styles.formGroup}>
                            <label className={styles.label} style={{ marginBottom: '0.5rem', display: 'block' }}>Name des Gebiets</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={newTerritoryName}
                                onChange={(e) => setNewTerritoryName(e.target.value)}
                                placeholder="z.B. Innenstadt Nord"
                                autoFocus
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label} style={{ marginBottom: '0.5rem', display: 'block' }}>Farbe auf der Karte</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <input
                                    type="color"
                                    value={newTerritoryColor}
                                    onChange={(e) => setNewTerritoryColor(e.target.value)}
                                    style={{
                                        width: '50px',
                                        height: '50px',
                                        padding: '0',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        background: 'none'
                                    }}
                                />
                                <span style={{ color: '#94a3b8', fontFamily: 'monospace' }}>{newTerritoryColor}</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.modalActions}>
                        <button onClick={onCloseModal} className={styles.cancelButton}>
                            Abbrechen
                        </button>
                        <button onClick={handleSave} className={styles.button} style={{ background: '#22c55e', padding: '0.75rem 1.5rem' }}>
                            <Save size={18} /> Speichern
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.actions}>
            <button className={styles.button} onClick={onStartDrawing} disabled={isDrawing}>
                <Plus size={16} /> Gebiet
            </button>
        </div>
    );
}
