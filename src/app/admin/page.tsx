'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Upload, Plus, Settings, Trash2, Edit2, GripVertical, X, Save, AlertTriangle, Check, RefreshCw, User, RotateCcw, Phone } from 'lucide-react';
import Link from 'next/link';
import Papa from 'papaparse';
import { geocodeAddress } from '@/utils/geocoding';
import { isPointInPolygon, getDistance } from '@/utils/geometry';

import { SortableTreeItem } from '@/components/admin/TreeList';
import { TerritoryManager } from '@/components/admin/TerritoryManager';
import { APP_CONFIG } from '@/lib/config';
import styles from './admin.module.css';

const LeafletMap = dynamic(() => import('../../components/Map'), { ssr: false });

interface Tree {
    id: number;
    name: string;
    address: string;
    lat: number;
    lng: number;
    status: string;
    territory_id: number;
    sequence?: number;
    note?: string;
    phone?: string;
}

interface Territory {
    id: number;
    name: string;
    color: string;
    polygon: any[];
    route_geometry?: any[];
}

function getLevenshteinDistance(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];

    // increment along the first column of each row
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    // increment each column in the first row
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(
                        matrix[i][j - 1] + 1, // insertion
                        matrix[i - 1][j] + 1 // deletion
                    )
                );
            }
        }
    }

    return matrix[b.length][a.length];
}



export default function AdminPage() {
    const [trees, setTrees] = useState<Tree[]>([]);
    const [territories, setTerritories] = useState<Territory[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTerritoryId, setSelectedTerritoryId] = useState<number | 'all' | 'none'>('all');
    const [startAddress, setStartAddress] = useState('Dultplatz, Amberg');

    // Modals & Inputs
    const [showImportModal, setShowImportModal] = useState(false);
    const [importData, setImportData] = useState('');
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState(0);
    const [importStep, setImportStep] = useState<'upload' | 'mapping' | 'processing' | 'preview' | 'importing'>('upload');
    const [importUrl, setImportUrl] = useState('');
    const [parsedImportData, setParsedImportData] = useState<any[]>([]);
    const [importHeaders, setImportHeaders] = useState<string[]>([]);
    const [importPreview, setImportPreview] = useState<any[]>([]);
    const [columnMapping, setColumnMapping] = useState({
        firstName: '',
        lastName: '',
        street: '',
        zip: '',
        city: '',
        note: '',
        payment: '',
        phone: ''
    });

    const [showTerritoryModal, setShowTerritoryModal] = useState(false);
    const [newTerritoryName, setNewTerritoryName] = useState('');
    const [newTerritoryColor, setNewTerritoryColor] = useState('#ff0000');

    const [editingTree, setEditingTree] = useState<Tree | null>(null);
    const [editNote, setEditNote] = useState('');

    // Drawing state
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawPoints, setDrawPoints] = useState<[number, number][]>([]);

    // Map Focus
    const [mapCenter, setMapCenter] = useState<[number, number]>([49.4432, 11.8566]);
    const [mapZoom, setMapZoom] = useState(13);
    const [highlightedTreeId, setHighlightedTreeId] = useState<number | null>(null);

    // Mobile View State
    const [mobileView, setMobileView] = useState<'map' | 'list'>('list');
    const [editingTerritoryId, setEditingTerritoryId] = useState<number | null>(null);

    const handleDrawPointDragEnd = (index: number, lat: number, lng: number) => {
        setDrawPoints(prev => {
            const newPoints = [...prev];
            newPoints[index] = [lat, lng];
            return newPoints;
        });
    };

    const undoLastDrawPoint = () => {
        setDrawPoints(prev => prev.slice(0, -1));
    };

    const editTerritory = (t: Territory) => {
        if (t.polygon && t.polygon.length > 0) {
            setDrawPoints(t.polygon);
            setEditingTerritoryId(t.id);
            setNewTerritoryName(t.name);
            setNewTerritoryColor(t.color);
            setIsDrawing(true);
            setMobileView('map');
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000);
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

    const [searchTerm, setSearchTerm] = useState('');

    // Filtered trees for the list
    const visibleTrees = useMemo(() => {
        let filtered = trees;
        if (selectedTerritoryId === 'all') {
            filtered = trees;
        } else if (selectedTerritoryId === 'none') {
            filtered = trees.filter(t => !t.territory_id);
        } else {
            filtered = trees.filter(t => t.territory_id === selectedTerritoryId);
        }

        // Search Filter
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            filtered = filtered.filter(t =>
                t.name.toLowerCase().includes(lower) ||
                t.address.toLowerCase().includes(lower) ||
                (t.note && t.note.toLowerCase().includes(lower))
            );
        }

        // Sort by sequence
        return filtered.sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
    }, [trees, selectedTerritoryId, searchTerm]);

    const calculateRoute = async (territoryId: number) => {
        setLoading(true);
        try {
            await fetch(`/api/territories/${territoryId}/calculate-route`, {
                method: 'POST'
            });
            fetchData();
        } catch (e) {
            console.error(e);
            alert('Fehler beim Berechnen der Route.');
        } finally {
            setLoading(false);
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (selectedTerritoryId === 'all') {
            alert('Bitte wähle zuerst ein Gebiet aus, um die Reihenfolge zu ändern.');
            return;
        }

        if (active.id !== over?.id) {
            setTrees((items) => {
                const oldIndex = items.findIndex((t) => t.id === active.id);
                const newIndex = items.findIndex((t) => t.id === over?.id);

                const territoryTrees = items.filter(t => t.territory_id === selectedTerritoryId).sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

                const oldLocalIndex = territoryTrees.findIndex(t => t.id === active.id);
                const newLocalIndex = territoryTrees.findIndex(t => t.id === over?.id);

                const newTerritoryOrder = arrayMove(territoryTrees, oldLocalIndex, newLocalIndex);

                const updatedTrees = items.map(t => {
                    const found = newTerritoryOrder.find(nt => nt.id === t.id);
                    if (found) {
                        return { ...t, sequence: newTerritoryOrder.indexOf(found) };
                    }
                    return t;
                });

                Promise.all(newTerritoryOrder.map((t, index) =>
                    fetch(`/api/trees/${t.id}`, {
                        method: 'PUT',
                        body: JSON.stringify({ sequence: index })
                    })
                )).then(() => {
                    calculateRoute(selectedTerritoryId as number);
                });

                return updatedTrees;
            });
        }
    };

    const handleDrawClick = (latlng: [number, number]) => {
        setDrawPoints(prev => [...prev, latlng]);
    };

    const startDrawing = () => {
        setIsDrawing(true);
        setDrawPoints([]);
    };

    const finishDrawing = () => {
        if (drawPoints.length < 3) {
            alert('Ein Gebiet braucht mindestens 3 Punkte.');
            return;
        }
        setIsDrawing(false);
        setShowTerritoryModal(true);
    };

    const saveTerritory = async () => {
        if (editingTerritoryId) {
            // Update existing
            await fetch(`/api/territories/${editingTerritoryId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    name: newTerritoryName,
                    color: newTerritoryColor,
                    polygon: drawPoints
                })
            });

            // Reassign trees logic
            // 1. Find trees that should be in this territory
            const treesInside = trees.filter(t => t.lat && t.lng && isPointInPolygon([t.lat, t.lng], drawPoints));

            // 2. Find trees currently in this territory but NOT in the new polygon (to unassign)
            const treesToUnassign = trees.filter(t =>
                t.territory_id === editingTerritoryId &&
                t.lat && t.lng &&
                !isPointInPolygon([t.lat, t.lng], drawPoints)
            );

            // Execute updates
            const updates = [];

            // Assign new ones
            for (const t of treesInside) {
                if (t.territory_id !== editingTerritoryId) {
                    updates.push(fetch(`/api/trees/${t.id}`, {
                        method: 'PUT',
                        body: JSON.stringify({ territory_id: editingTerritoryId })
                    }));
                }
            }

            // Unassign old ones
            for (const t of treesToUnassign) {
                updates.push(fetch(`/api/trees/${t.id}`, {
                    method: 'PUT',
                    body: JSON.stringify({ territory_id: null })
                }));
            }

            await Promise.all(updates);

            await calculateRoute(editingTerritoryId);
        } else {
            // Create new
            const res = await fetch('/api/territories', {
                method: 'POST',
                body: JSON.stringify({
                    name: newTerritoryName,
                    color: newTerritoryColor,
                    polygon: drawPoints
                })
            });
            const { id } = await res.json();

            const treesToUpdate = trees.filter(t => t.lat && t.lng && isPointInPolygon([t.lat, t.lng], drawPoints));
            await Promise.all(treesToUpdate.map(t =>
                fetch(`/api/trees/${t.id}`, {
                    method: 'PUT',
                    body: JSON.stringify({ territory_id: id })
                })
            ));

            await calculateRoute(id);
        }

        setShowTerritoryModal(false);
        setNewTerritoryName('');
        setNewTerritoryColor('#ff0000');
        setDrawPoints([]);
        setIsDrawing(false);
        setEditingTerritoryId(null);
        fetchData();
    };

    const deleteTerritory = async (id: number) => {
        if (!confirm('Gebiet wirklich löschen? Bäume werden nicht gelöscht.')) return;
        await fetch(`/api/territories/${id}`, { method: 'DELETE' });
        if (selectedTerritoryId === id) setSelectedTerritoryId('all');
        fetchData();
    };

    const handleMarkerDragEnd = async (treeId: number, lat: number, lng: number) => {
        setTrees(prev => prev.map(t => t.id === treeId ? { ...t, lat, lng } : t));

        let territoryId = null;
        for (const t of territories) {
            if (isPointInPolygon([lat, lng], t.polygon)) {
                territoryId = t.id;
                break;
            }
        }

        await fetch(`/api/trees/${treeId}`, {
            method: 'PUT',
            body: JSON.stringify({ lat, lng, territory_id: territoryId })
        });
        fetchData();
    };


    const handleTreeClick = (tree: Tree) => {
        setHighlightedTreeId(tree.id);
        if (tree.lat && tree.lng) {
            setMapCenter([tree.lat, tree.lng]);
            setMapZoom(18);
            setMobileView('map');
        }
    };

    const focusTerritory = (t: Territory) => {
        if (t.polygon.length > 0) {
            const lat = t.polygon.reduce((sum, p) => sum + p[0], 0) / t.polygon.length;
            const lng = t.polygon.reduce((sum, p) => sum + p[1], 0) / t.polygon.length;
            setMapCenter([lat, lng]);
            setMapZoom(14);
        }
    };

    const saveNote = async () => {
        if (!editingTree) return;

        setTrees(prev => prev.map(t => t.id === editingTree.id ? { ...t, note: editNote } : t));

        await fetch(`/api/trees/${editingTree.id}`, {
            method: 'PUT',
            body: JSON.stringify({ note: editNote })
        });

        setEditingTree(null);
        setEditNote('');
    };

    const optimizeTerritory = async (territoryId: number) => {
        setLoading(true);
        try {
            let startPoint = undefined;
            if (startAddress) {
                const coords = await geocodeAddress(startAddress);
                if (coords) {
                    startPoint = coords;
                }
            }

            await fetch(`/api/territories/${territoryId}/optimize/route`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ startPoint })
            });

            fetchData();
        } catch (e) {
            console.error(e);
            alert('Fehler bei der Optimierung.');
        } finally {
            setLoading(false);
        }
    };

    // Import Logic
    const analyzeImport = async () => {
        setImporting(true);
        let data: any[] = [];

        try {
            if (importUrl) {
                // Handle Google Sheets URL
                let url = importUrl;
                if (url.includes('docs.google.com/spreadsheets')) {
                    // Convert to CSV export URL
                    url = url.replace(/\/edit.*$/, '/export?format=csv');
                }

                const res = await fetch(url);
                if (!res.ok) throw new Error('Failed to fetch URL');
                const text = await res.text();
                const result = Papa.parse(text, { header: true, skipEmptyLines: true });
                data = result.data;
            } else if (importData.trim()) {
                // Handle pasted text
                if (importData.trim().startsWith('[')) {
                    data = JSON.parse(importData);
                } else {
                    const result = Papa.parse(importData, { header: true, skipEmptyLines: true });
                    data = result.data;
                }
            } else {
                alert('Bitte URL eingeben oder Daten einfügen.');
                setImporting(false);
                return;
            }

            if (data.length === 0) {
                alert('Keine Daten gefunden.');
                setImporting(false);
                return;
            }

            // Extract headers
            const headers = Object.keys(data[0]);
            setImportHeaders(headers);
            setParsedImportData(data);

            // Auto-detect mapping
            const newMapping = {
                firstName: '', lastName: '',
                street: '', zip: '', city: '',
                note: '', payment: '', phone: ''
            };
            headers.forEach(h => {
                const lower = h.toLowerCase();
                if (lower.includes('vorname')) newMapping.firstName = h;
                if (lower.includes('nachname') || lower.includes('name') || lower.includes('firma')) {
                    if (!lower.includes('vorname')) newMapping.lastName = h;
                }
                if (lower.includes('straße') || lower.includes('adress') || lower.includes('anschrift')) newMapping.street = h;
                if (lower.includes('plz') || lower.includes('postleitzahl')) newMapping.zip = h;
                if (lower.includes('ort') || lower.includes('stadt') || lower.includes('city')) newMapping.city = h;
                if (lower.includes('notiz') || lower.includes('note') || lower.includes('bemerkung')) newMapping.note = h;
                if (lower.includes('bezahl') || lower.includes('payment')) newMapping.payment = h;
                if (lower.includes('tel') || lower.includes('phone') || lower.includes('mobil')) newMapping.phone = h;
            });
            setColumnMapping(newMapping);

            setImportStep('mapping');
        } catch (e) {
            console.error(e);
            alert('Fehler beim Analysieren der Daten. Bitte Format prüfen.');
        } finally {
            setImporting(false);
        }
    };

    const deleteAllTrees = async () => {
        const password = prompt('Bitte Passwort eingeben um ALLE Bäume zu löschen:');
        if (password !== APP_CONFIG.adminPassword) {
            alert('Falsches Passwort!');
            return;
        }

        if (!confirm('Wirklich ALLE Bäume löschen? Dies kann nicht rückgängig gemacht werden.')) return;
        await fetch('/api/trees', { method: 'DELETE' });
        fetchData();
    };

    const executeImport = async () => {
        if (!columnMapping.street && !columnMapping.city) {
            alert('Bitte mindestens eine Spalte für die Adresse (Straße oder Ort) auswählen.');
            return;
        }

        setImportStep('processing');
        setImportProgress(0);

        const previewData = [];
        const coordCounts = new Map<string, number>();

        // First pass: Geocode and basic checks
        for (let i = 0; i < parsedImportData.length; i++) {
            const item = parsedImportData[i];

            // Construct Address
            const street = columnMapping.street ? item[columnMapping.street] : '';
            const zip = columnMapping.zip ? item[columnMapping.zip] : '';
            const city = columnMapping.city ? item[columnMapping.city] : '';
            let address = street;
            if (zip || city) address += `, ${zip} ${city}`.trim();
            if (!address) continue; // Skip empty addresses

            // Construct Name
            const firstName = columnMapping.firstName ? item[columnMapping.firstName] : '';
            const lastName = columnMapping.lastName ? item[columnMapping.lastName] : '';
            const name = `${firstName} ${lastName}`.trim() || 'Unbenannt';

            // Construct Note
            const noteVal = columnMapping.note ? item[columnMapping.note] : '';
            const paymentVal = columnMapping.payment ? item[columnMapping.payment] : '';
            const note = `${paymentVal ? 'Zahlung: ' + paymentVal + ' | ' : ''}${noteVal}`;

            const phone = columnMapping.phone ? item[columnMapping.phone] : '';

            if (!address) continue;

            const warnings: string[] = [];

            // Check for duplicate (Exact)
            const existingTree = trees.find(t =>
                t.address.toLowerCase().trim() === address.toLowerCase().trim()
            );

            // Check for duplicate (Fuzzy)
            let fuzzyMatchId = null;
            if (!existingTree) {
                for (const t of trees) {
                    const dist = getLevenshteinDistance(t.address.toLowerCase(), address.toLowerCase());
                    // Allow 3 typos or 20% difference
                    if (dist <= 3 || dist < address.length * 0.2) {
                        fuzzyMatchId = t.id;
                        warnings.push(`Ähnliche Adresse gefunden: "${t.address}"`);
                        break;
                    }
                }
            }

            let status = existingTree ? 'update' : 'new';
            let coords = existingTree ? { lat: existingTree.lat, lng: existingTree.lng } : null;

            if (!existingTree) {
                coords = await geocodeAddress(address);
                if (!coords) {
                    status = 'error';
                } else {
                    // Check Distance from Amberg (approx center)
                    const ambergCenter = { lat: 49.4432, lng: 11.8566 };
                    const dist = getDistance(coords, ambergCenter);
                    if (dist > 15000) { // > 15km
                        warnings.push(`Weit entfernt (${(dist / 1000).toFixed(1)}km von Amberg)`);
                    }

                    // Track coordinates for duplicates
                    const coordKey = `${coords.lat.toFixed(4)},${coords.lng.toFixed(4)}`;
                    coordCounts.set(coordKey, (coordCounts.get(coordKey) || 0) + 1);
                }
            }

            if (fuzzyMatchId && status === 'new') {
                status = 'warning'; // Flag for review
            }
            if (warnings.length > 0 && status !== 'error' && status !== 'update') {
                status = 'warning';
            }

            previewData.push({
                originalIndex: i,
                name: name,
                address: address,
                phone: phone,
                note: note,
                lat: coords?.lat,
                lng: coords?.lng,
                status: status,
                existingId: existingTree?.id || fuzzyMatchId,
                warnings: warnings
            });

            setImportProgress(Math.round(((i + 1) / parsedImportData.length) * 100));
        }

        // Second pass: Check for coordinate duplicates within import
        previewData.forEach(item => {
            if (item.lat && item.lng) {
                const coordKey = `${item.lat.toFixed(4)},${item.lng.toFixed(4)}`;
                if ((coordCounts.get(coordKey) || 0) > 1) {
                    item.warnings.push('Mehrere Einträge an gleicher Position');
                    if (item.status === 'new') item.status = 'warning';
                }
            }
        });

        setImportPreview(previewData);
        setImportStep('preview');
    };

    const retryGeocoding = async (index: number) => {
        const item = importPreview[index];
        const coords = await geocodeAddress(item.address);

        setImportPreview(prev => {
            const newPreview = [...prev];
            if (coords) {
                newPreview[index] = { ...item, lat: coords.lat, lng: coords.lng, status: 'new' };
            } else {
                newPreview[index] = { ...item, status: 'error' };
            }
            return newPreview;
        });
    };

    const updatePreviewItem = (index: number, field: string, value: string) => {
        setImportPreview(prev => {
            const newPreview = [...prev];
            newPreview[index] = { ...newPreview[index], [field]: value };
            return newPreview;
        });
    };

    const finalizeImport = async () => {
        setImportStep('importing');
        setImportProgress(0);

        const itemsToProcess = importPreview.filter(item => item.status !== 'error');

        for (let i = 0; i < itemsToProcess.length; i++) {
            const item = itemsToProcess[i];

            // Determine territory
            let territoryId = null;
            if (item.lat && item.lng) {
                for (const t of territories) {
                    if (isPointInPolygon([item.lat, item.lng], t.polygon)) {
                        territoryId = t.id;
                        break;
                    }
                }
            }

            if (item.status === 'update' && item.existingId) {
                // Update existing tree
                await fetch(`/api/trees/${item.existingId}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        note: item.note, // Update note
                    })
                });
            } else {
                // Create new tree
                await fetch('/api/trees', {
                    method: 'POST',
                    body: JSON.stringify([{
                        name: item.name,
                        address: item.address,
                        phone: item.phone,
                        note: item.note,
                        lat: item.lat,
                        lng: item.lng,
                        territory_id: territoryId
                    }])
                });
            }

            setImportProgress(Math.round(((i + 1) / itemsToProcess.length) * 100));
        }

        setImportStep('upload');
        setShowImportModal(false);
        setImportData('');
        setImportUrl('');
        setParsedImportData([]);
        setImportPreview([]);
        fetchData();
    };

    const resetImport = () => {
        setImportStep('upload');
        setImportData('');
        setImportUrl('');
        setParsedImportData([]);
        setImportPreview([]);
    };

    const optimizeAll = async () => {
        if (!confirm('Wirklich ALLE Gebiete optimieren? Das kann einen Moment dauern.')) return;
        setLoading(true);
        try {
            await fetch('/api/admin/optimize-all', {
                method: 'POST',
                body: JSON.stringify({ action: 'optimize' })
            });
            fetchData();
        } catch (e) {
            console.error(e);
            alert('Fehler beim Optimieren.');
        } finally {
            setLoading(false);
        }
    };

    const calculateAll = async () => {
        setLoading(true);
        try {
            await fetch('/api/admin/optimize-all', {
                method: 'POST',
                body: JSON.stringify({ action: 'calculate' })
            });
            fetchData();
        } catch (e) {
            console.error(e);
            alert('Fehler beim Berechnen.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`${styles.container} ${mobileView === 'map' ? styles.mapViewActive : ''}`}>
            {/* Mobile View Toggle */}
            <div className={styles.mobileToggle}>
                <button
                    className={`${styles.toggleButton} ${mobileView === 'list' ? styles.active : ''}`}
                    onClick={() => setMobileView('list')}
                >
                    Verwaltung
                </button>
                <button
                    className={`${styles.toggleButton} ${mobileView === 'map' ? styles.active : ''}`}
                    onClick={() => setMobileView('map')}
                >
                    Karte
                </button>
            </div>

            <div className={`${styles.sidebar} ${mobileView === 'map' ? styles.hiddenMobile : ''}`}>
                <h2 className={styles.sidebarTitle}>Filter & Aktionen</h2>

                {/* Territory Selector */}
                <div className={styles.filterSection}>
                    <select
                        className={styles.select}
                        value={selectedTerritoryId}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'all' || val === 'none') setSelectedTerritoryId(val);
                            else setSelectedTerritoryId(Number(val));
                        }}
                    >
                        <option value="all">Alle Gebiete</option>
                        <option value="none">Kein Gebiet</option>
                        {territories.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                        Tipp: Klicke auf ein Gebiet in der Karte um es auszuwählen.
                    </div>
                </div>

                {/* Search Input */}
                <div className={styles.filterSection}>
                    <input
                        type="text"
                        className={styles.input}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Suche (Name, Adresse...)"
                    />
                </div>

                {/* Start Address Input */}
                <div className={styles.filterSection}>
                    <label className={styles.label}>Startpunkt für Route:</label>
                    <input
                        type="text"
                        className={styles.input}
                        value={startAddress}
                        onChange={(e) => setStartAddress(e.target.value)}
                        placeholder="z.B. Dultplatz, Amberg"
                    />
                </div>

                <div className={styles.stats}>
                    <div className={styles.statItem}>
                        <span>Bäume</span>
                        <strong>{visibleTrees.length}</strong>
                    </div>
                    {selectedTerritoryId !== 'all' && typeof selectedTerritoryId === 'number' && (
                        <div className={styles.statItem} style={{ gap: '0.5rem', width: '100%' }}>
                            <button
                                className={styles.button}
                                onClick={() => optimizeTerritory(selectedTerritoryId)}
                                title="Route für dieses Gebiet optimieren"
                                style={{ background: '#3b82f6', width: '100%', fontSize: '0.8rem', padding: '0.5rem' }}
                            >
                                <Settings size={14} /> Optimieren
                            </button>
                            <button
                                className={styles.button}
                                onClick={() => calculateRoute(selectedTerritoryId)}
                                title="Route neu berechnen (ohne Umsortieren)"
                                style={{ background: '#10b981', width: '100%', fontSize: '0.8rem', padding: '0.5rem' }}
                            >
                                <RefreshCw size={14} /> Route
                            </button>
                            <button
                                className={styles.button}
                                onClick={() => {
                                    const t = territories.find(terr => terr.id === selectedTerritoryId);
                                    if (t) editTerritory(t);
                                }}
                                title="Gebiet bearbeiten"
                                style={{ background: '#f59e0b', width: '100%', fontSize: '0.8rem', padding: '0.5rem' }}
                            >
                                <Edit2 size={14} /> Bearbeiten
                            </button>
                            <button
                                className={styles.button}
                                onClick={() => deleteTerritory(selectedTerritoryId)}
                                title="Gebiet löschen"
                                style={{ background: '#ef4444', width: '100%', fontSize: '0.8rem', padding: '0.5rem' }}
                            >
                                <Trash2 size={14} /> Löschen
                            </button>
                        </div>
                    )}
                </div>

                <div className={styles.actions}>
                    <button className={styles.button} onClick={() => setShowImportModal(true)}>
                        <Upload size={16} /> Import
                    </button>
                    <TerritoryManager
                        territories={territories}
                        onSave={saveTerritory}
                        onDelete={deleteTerritory}
                        isDrawing={isDrawing}
                        onStartDrawing={startDrawing}
                        showModal={showTerritoryModal}
                        onCloseModal={() => setShowTerritoryModal(false)}
                    />
                </div>

                <div className={styles.actions} style={{ marginTop: 'auto', borderTop: '1px solid #334155', paddingTop: '1rem' }}>
                    <button className={styles.button} onClick={optimizeAll} style={{ background: '#3b82f6' }}>
                        <Settings size={16} /> Alle Optimieren
                    </button>
                    <button className={styles.button} onClick={calculateAll} style={{ background: '#10b981' }}>
                        <RefreshCw size={16} /> Alle Routen
                    </button>
                </div>

                <div style={{ marginTop: '1rem' }}>
                    <button
                        className={styles.button}
                        style={{ background: '#ef4444', width: '100%' }}
                        onClick={deleteAllTrees}
                    >
                        <Trash2 size={16} /> Alle Bäume löschen
                    </button>
                </div>
            </div>

            {/* Map Area */}
            <div className={`${styles.mapContainer} ${mobileView === 'list' ? styles.hiddenMobile : ''}`}>
                <LeafletMap
                    trees={visibleTrees}
                    territories={territories}
                    onTreeClick={handleTreeClick}
                    isDrawing={isDrawing}
                    drawPoints={drawPoints}
                    onDrawClick={handleDrawClick}
                    onMarkerDragEnd={handleMarkerDragEnd}
                    onDrawPointDragEnd={handleDrawPointDragEnd}
                    onTerritoryClick={(id) => setSelectedTerritoryId(id)}
                    center={mapCenter}
                    zoom={mapZoom}
                />

                {isDrawing && (
                    <div className={styles.drawingControls}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <div style={{ fontWeight: 'bold', color: 'white' }}>
                                {editingTerritoryId ? 'Gebiet bearbeiten' : 'Neues Gebiet'}
                            </div>
                            <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                                {drawPoints.length} Punkte • Punkte verschiebbar
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <button className={styles.button} onClick={undoLastDrawPoint} title="Letzten Punkt entfernen" style={{ padding: '0.5rem' }}>
                                <RotateCcw size={16} />
                            </button>
                            <button className={styles.button} onClick={finishDrawing} style={{ background: '#22c55e', padding: '0.5rem 1rem' }}>
                                Fertig
                            </button>
                            <button className={styles.cancelButton} onClick={() => { setIsDrawing(false); setDrawPoints([]); setEditingTerritoryId(null); }} style={{ padding: '0.5rem 1rem' }}>
                                Abbrechen
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Sidebar: Tree List */}
            <div className={`${styles.rightSidebar} ${mobileView === 'map' ? styles.hiddenMobile : ''}`}>
                <h2 className={styles.sidebarTitle}>Baumliste ({visibleTrees.length})</h2>

                <div className={styles.treeListContainer}>
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={visibleTrees.map(t => t.id)}
                            strategy={verticalListSortingStrategy}
                            disabled={selectedTerritoryId === 'all'}
                        >
                            {visibleTrees.map((tree, index) => (
                                <SortableTreeItem
                                    key={tree.id}
                                    tree={tree}
                                    index={index}
                                    onEdit={(t) => { setEditingTree(t); setEditNote(t.note || ''); }}
                                    onHighlight={handleTreeClick}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>

                    {visibleTrees.length === 0 && (
                        <div className={styles.emptyState}>Keine Bäume gefunden</div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {
                showImportModal && (
                    <div className={styles.modalOverlay}>
                        <div className={styles.modal}>
                            <h3>Daten Importieren</h3>

                            {importStep === 'upload' && (
                                <>
                                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                        Wähle eine Google Sheets URL oder füge CSV/JSON Daten ein.
                                    </p>

                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Google Sheets URL (muss öffentlich sein)</label>
                                        <input
                                            type="text"
                                            className={styles.input}
                                            placeholder="https://docs.google.com/spreadsheets/d/..."
                                            value={importUrl}
                                            onChange={(e) => setImportUrl(e.target.value)}
                                        />
                                    </div>

                                    <div style={{ textAlign: 'center', margin: '0.5rem 0', color: '#64748b' }}>- ODER -</div>

                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>CSV / JSON Text</label>
                                        <textarea
                                            className={styles.textarea}
                                            value={importData}
                                            onChange={(e) => setImportData(e.target.value)}
                                            placeholder="Name, Adresse, Notiz..."
                                            style={{ height: '100px' }}
                                        />
                                    </div>

                                    <div className={styles.modalActions}>
                                        <button className={styles.cancelButton} onClick={() => setShowImportModal(false)}>Abbrechen</button>
                                        <button
                                            className={styles.button}
                                            onClick={analyzeImport}
                                            disabled={importing || (!importUrl && !importData)}
                                        >
                                            {importing ? 'Analysiere...' : 'Weiter'}
                                        </button>
                                    </div>
                                </>
                            )}

                            {importStep === 'mapping' && (
                                <>
                                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                        Ordne die Spalten deiner Datei den Feldern zu.
                                    </p>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '400px', overflowY: 'auto' }}>

                                        {/* Person */}
                                        <div>
                                            <h4 style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '0.5rem', borderBottom: '1px solid #334155', paddingBottom: '0.25rem' }}>Person / Firma</h4>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem' }}>Vorname</label>
                                                    <select
                                                        className={styles.select}
                                                        value={columnMapping.firstName}
                                                        onChange={(e) => setColumnMapping(prev => ({ ...prev, firstName: e.target.value }))}
                                                    >
                                                        <option value="">-- Leer --</option>
                                                        {importHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem' }}>Nachname / Name</label>
                                                    <select
                                                        className={styles.select}
                                                        value={columnMapping.lastName}
                                                        onChange={(e) => setColumnMapping(prev => ({ ...prev, lastName: e.target.value }))}
                                                    >
                                                        <option value="">-- Leer --</option>
                                                        {importHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Address */}
                                        <div>
                                            <h4 style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '0.5rem', borderBottom: '1px solid #334155', paddingBottom: '0.25rem' }}>Adresse</h4>
                                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.5rem' }}>
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem' }}>Straße + Nr.</label>
                                                    <select
                                                        className={styles.select}
                                                        value={columnMapping.street}
                                                        onChange={(e) => setColumnMapping(prev => ({ ...prev, street: e.target.value }))}
                                                    >
                                                        <option value="">-- Leer --</option>
                                                        {importHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem' }}>PLZ</label>
                                                    <select
                                                        className={styles.select}
                                                        value={columnMapping.zip}
                                                        onChange={(e) => setColumnMapping(prev => ({ ...prev, zip: e.target.value }))}
                                                    >
                                                        <option value="">-- Leer --</option>
                                                        {importHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem' }}>Ort</label>
                                                    <select
                                                        className={styles.select}
                                                        value={columnMapping.city}
                                                        onChange={(e) => setColumnMapping(prev => ({ ...prev, city: e.target.value }))}
                                                    >
                                                        <option value="">-- Leer --</option>
                                                        {importHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Details */}
                                        <div>
                                            <h4 style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '0.5rem', borderBottom: '1px solid #334155', paddingBottom: '0.25rem' }}>Details</h4>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem' }}>Telefon</label>
                                                    <select
                                                        className={styles.select}
                                                        value={columnMapping.phone}
                                                        onChange={(e) => setColumnMapping(prev => ({ ...prev, phone: e.target.value }))}
                                                    >
                                                        <option value="">-- Leer --</option>
                                                        {importHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem' }}>Bezahlungsart</label>
                                                    <select
                                                        className={styles.select}
                                                        value={columnMapping.payment}
                                                        onChange={(e) => setColumnMapping(prev => ({ ...prev, payment: e.target.value }))}
                                                    >
                                                        <option value="">-- Leer --</option>
                                                        {importHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <div style={{ marginTop: '0.5rem' }}>
                                                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem' }}>Notiz</label>
                                                <select
                                                    className={styles.select}
                                                    value={columnMapping.note}
                                                    onChange={(e) => setColumnMapping(prev => ({ ...prev, note: e.target.value }))}
                                                >
                                                    <option value="">-- Leer --</option>
                                                    {importHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                    </div>

                                    <div className={styles.modalActions} style={{ marginTop: '1rem' }}>
                                        <button className={styles.cancelButton} onClick={resetImport}>Zurück</button>
                                        <button className={styles.button} onClick={executeImport}>Importieren</button>
                                    </div>
                                </>
                            )}

                            {importStep === 'preview' && (
                                <>
                                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                        Überprüfe die Daten vor dem Import.
                                    </p>

                                    <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '1rem' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '1px solid #334155', textAlign: 'left' }}>
                                                    <th style={{ padding: '0.5rem' }}>Status</th>
                                                    <th style={{ padding: '0.5rem' }}>Name</th>
                                                    <th style={{ padding: '0.5rem' }}>Adresse</th>
                                                    <th style={{ padding: '0.5rem' }}>Warnung</th>
                                                    <th style={{ padding: '0.5rem' }}>Aktion</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {importPreview.map((item, idx) => (
                                                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: item.status === 'warning' ? 'rgba(234, 179, 8, 0.1)' : 'transparent' }}>
                                                        <td style={{ padding: '0.5rem' }}>
                                                            {item.status === 'new' && <span style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Plus size={14} /> Neu</span>}
                                                            {item.status === 'update' && <span style={{ color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><RefreshCw size={14} /> Update</span>}
                                                            {item.status === 'error' && <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><AlertTriangle size={14} /> Fehler</span>}
                                                            {item.status === 'warning' && <span style={{ color: '#eab308', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><AlertTriangle size={14} /> Prüfen</span>}
                                                        </td>
                                                        <td style={{ padding: '0.5rem' }}>{item.name}</td>
                                                        <td style={{ padding: '0.5rem' }}>
                                                            {item.status === 'error' || item.status === 'warning' ? (
                                                                <input
                                                                    type="text"
                                                                    value={item.address}
                                                                    className={styles.input}
                                                                    style={{ padding: '0.25rem', fontSize: '0.8rem' }}
                                                                    onChange={(e) => updatePreviewItem(idx, 'address', e.target.value)}
                                                                />
                                                            ) : (
                                                                item.address
                                                            )}
                                                        </td>
                                                        <td style={{ padding: '0.5rem', color: '#eab308', fontSize: '0.8rem' }}>
                                                            {item.warnings && item.warnings.map((w: string, i: number) => (
                                                                <div key={i}>{w}</div>
                                                            ))}
                                                        </td>
                                                        <td style={{ padding: '0.5rem' }}>
                                                            {(item.status === 'error' || item.status === 'warning') && (
                                                                <button
                                                                    className={styles.iconButton}
                                                                    onClick={() => retryGeocoding(idx)}
                                                                    title="Erneut versuchen"
                                                                >
                                                                    <RefreshCw size={14} />
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className={styles.modalActions}>
                                        <button className={styles.cancelButton} onClick={() => setImportStep('mapping')}>Zurück</button>
                                        <button className={styles.button} onClick={finalizeImport}>
                                            Importieren ({importPreview.filter(i => i.status !== 'error').length})
                                        </button>
                                    </div>
                                </>
                            )}

                            {importStep === 'importing' && (
                                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                                    <div style={{ marginBottom: '1rem' }}>Importiere Daten...</div>
                                    <div className={styles.progressBar}>
                                        <div
                                            className={styles.progressFill}
                                            style={{ width: `${importProgress}%` }}
                                        />
                                    </div>
                                    <div style={{ marginTop: '0.5rem', color: '#94a3b8' }}>{importProgress}%</div>
                                </div>
                            )}

                            {importStep === 'processing' && (
                                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                                    <div style={{ marginBottom: '1rem' }}>Verarbeite Daten (Geocoding)...</div>
                                    <div className={styles.progressBar}>
                                        <div
                                            className={styles.progressFill}
                                            style={{ width: `${importProgress}%` }}
                                        />
                                    </div>
                                    <div style={{ marginTop: '0.5rem', color: '#94a3b8' }}>{importProgress}%</div>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            {
                showTerritoryModal && (
                    <div className={styles.modalOverlay}>
                        <div className={styles.modal}>
                            <h3>Gebiet Speichern</h3>
                            <input
                                type="text"
                                placeholder="Name"
                                className={styles.input}
                                value={newTerritoryName}
                                onChange={(e) => setNewTerritoryName(e.target.value)}
                            />
                            <div className={styles.colorPicker}>
                                <span>Farbe:</span>
                                <input
                                    type="color"
                                    value={newTerritoryColor}
                                    onChange={(e) => setNewTerritoryColor(e.target.value)}
                                />
                            </div>
                            <div className={styles.modalActions}>
                                <button className={styles.cancelButton} onClick={() => setShowTerritoryModal(false)}>Abbrechen</button>
                                <button className={styles.button} onClick={saveTerritory}>Speichern</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                editingTree && (
                    <div className={styles.modalOverlay}>
                        <div className={styles.modal}>
                            <h3>Notiz bearbeiten</h3>
                            <p><strong>{editingTree.name}</strong></p>
                            <textarea
                                className={styles.textarea}
                                value={editNote}
                                onChange={(e) => setEditNote(e.target.value)}
                                placeholder="Notiz eingeben..."
                            />
                            <div className={styles.modalActions}>
                                <button className={styles.cancelButton} onClick={() => setEditingTree(null)}>Abbrechen</button>
                                <button className={styles.button} onClick={saveNote}>
                                    <Save size={16} /> Speichern
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
