'use client';

import { useState, useEffect } from 'react';
import styles from './drivers.module.css';

interface Territory {
    id: number;
    name: string;
    driver_name: string | null;
    total_trees: number;
    open_trees: number;
    collected_trees: number;
    color: string;
}

export default function DriversPage() {
    const [territories, setTerritories] = useState<Territory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTerritories();
    }, []);

    const fetchTerritories = async () => {
        try {
            const res = await fetch('/api/territories');
            const data = await res.json();
            setTerritories(data);
        } catch (error) {
            console.error('Failed to fetch territories:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLocalChange = (id: number, name: string) => {
        setTerritories(prev => prev.map(t =>
            t.id === id ? { ...t, driver_name: name } : t
        ));
    };

    const saveDriver = async (id: number, name: string) => {
        try {
            await fetch(`/api/territories/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ driver_name: name }),
            });
        } catch (error) {
            console.error('Failed to update driver:', error);
        }
    };

    if (loading) return (
        <div className={styles.container} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <div style={{ fontSize: '1.5rem', color: '#666' }}>Laden...</div>
        </div>
    );

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Fahrer Zuweisung</h1>
            <div className={styles.grid}>
                {territories.map(territory => {
                    const completed = territory.collected_trees;
                    const percentage = territory.total_trees > 0
                        ? (completed / territory.total_trees) * 100
                        : 0;

                    return (
                        <div key={territory.id} className={styles.card} style={{ borderLeft: `6px solid ${territory.color}` }}>
                            <div className={styles.cardHeader}>
                                <span className={styles.territoryName}>{territory.name}</span>
                            </div>

                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Fahrer Name</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    value={territory.driver_name || ''}
                                    onChange={(e) => handleLocalChange(territory.id, e.target.value)}
                                    onBlur={(e) => saveDriver(territory.id, e.target.value)}
                                    placeholder="Name eingeben..."
                                />
                            </div>

                            <div className={styles.progressContainer}>
                                <div className={styles.progressInfo}>
                                    <span>Fortschritt</span>
                                    <span>{completed} / {territory.total_trees} Bäume</span>
                                </div>
                                <div className={styles.progressBarBg}>
                                    <div
                                        className={styles.progressBarFill}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
