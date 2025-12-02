'use client';

import { useState, useEffect } from 'react';
import { Trash2, Plus, Calendar, User, RotateCcw, Check, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import styles from './planning.module.css';

interface ChecklistItem {
    id: number;
    text: string;
    target_date: string | null;
    responsible: string | null;
    is_completed: boolean;
}

export default function PlanningPage() {
    const [items, setItems] = useState<ChecklistItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const res = await fetch('/api/checklist');
            const data = await res.json();
            // Ensure is_completed is treated as boolean
            const formattedData = data.map((item: any) => ({
                ...item,
                is_completed: Boolean(item.is_completed)
            })).sort((a: any, b: any) => {
                if (a.is_completed === b.is_completed) return 0;
                return a.is_completed ? 1 : -1;
            });
            setItems(formattedData);
        } catch (error) {
            console.error('Failed to fetch items:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = async () => {
        try {
            const newItem = {
                text: 'Neue Aufgabe',
                target_date: null,
                responsible: null
            };

            const res = await fetch('/api/checklist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newItem)
            });

            const data = await res.json();
            if (data.success) {
                setItems([...items, { ...newItem, id: data.id, is_completed: false }]);
            }
        } catch (error) {
            console.error('Failed to add item:', error);
        }
    };

    const handleUpdateItem = async (id: number, updates: Partial<ChecklistItem>) => {
        // Optimistic update
        setItems(items.map(item => item.id === id ? { ...item, ...updates } : item));

        try {
            await fetch(`/api/checklist/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
        } catch (error) {
            console.error('Failed to update item:', error);
            fetchItems(); // Revert on error
        }
    };

    const handleDeleteItem = async (id: number) => {
        if (!confirm('Wirklich löschen?')) return;

        // Optimistic update
        setItems(items.filter(item => item.id !== id));

        try {
            await fetch(`/api/checklist/${id}`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error('Failed to delete item:', error);
            fetchItems();
        }
    };

    const handleReset = async () => {
        if (!confirm('Dies wird alle aktuellen Aufgaben löschen und die Standard-Liste wiederherstellen. Fortfahren?')) return;

        setLoading(true);
        try {
            await fetch('/api/checklist/reset', { method: 'POST' });
            await fetchItems();
        } catch (error) {
            console.error('Failed to reset:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className={styles.main}>Laden...</div>;
    }

    return (
        <main className={styles.main}>
            <div className={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link href="/" className={styles.button} style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.1)' }}>
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className={styles.title}>Planung & Checkliste</h1>
                </div>
                <div className={styles.actions}>
                    <button onClick={handleReset} className={`${styles.button} ${styles.dangerButton}`}>
                        <RotateCcw size={18} />
                        Reset für nächstes Jahr
                    </button>
                </div>
            </div>

            <div className={styles.list}>
                {items.map((item) => (
                    <div key={item.id} className={`${styles.item} ${item.is_completed ? styles.completed : ''}`}>
                        <div
                            className={styles.checkbox}
                            onClick={() => handleUpdateItem(item.id, { is_completed: !item.is_completed })}
                        >
                            {item.is_completed && <Check size={16} />}
                        </div>

                        <div className={styles.content}>
                            <div className={styles.mainRow}>
                                <input
                                    type="text"
                                    value={item.text}
                                    onChange={(e) => handleUpdateItem(item.id, { text: e.target.value })}
                                    className={styles.textInput}
                                    placeholder="Aufgabe..."
                                />
                            </div>

                            <div className={styles.detailsRow}>
                                <div className={styles.detailGroup}>
                                    <Calendar size={14} />
                                    <input
                                        type="date"
                                        value={item.target_date || ''}
                                        onChange={(e) => handleUpdateItem(item.id, { target_date: e.target.value })}
                                        className={styles.detailInput}
                                    />
                                </div>

                                <div className={styles.detailGroup}>
                                    <User size={14} />
                                    <input
                                        type="text"
                                        value={item.responsible || ''}
                                        onChange={(e) => handleUpdateItem(item.id, { responsible: e.target.value })}
                                        className={styles.detailInput}
                                        placeholder="Verantwortlich"
                                    />
                                </div>
                            </div>
                        </div>

                        <button onClick={() => handleDeleteItem(item.id)} className={styles.deleteButton}>
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}

                <button onClick={handleAddItem} className={styles.addItem}>
                    <Plus size={20} />
                    <span>Aufgabe hinzufügen</span>
                </button>
            </div>
        </main>
    );
}
