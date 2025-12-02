'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Printer, Download, Map } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import styles from './page.module.css';

interface Territory {
    id: number;
    name: string;
}

interface Tree {
    id: number;
    name: string;
    address: string;
    note?: string;
    phone?: string;
    payment_method?: string;
    territory_id: number;
    sequence?: number;
}

export default function ExportPage() {
    const [territories, setTerritories] = useState<Territory[]>([]);
    const [trees, setTrees] = useState<Tree[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch('/api/territories').then(res => res.json()),
            fetch('/api/trees').then(res => res.json())
        ]).then(([terrData, treeData]) => {
            setTerritories(terrData);
            setTrees(treeData);
            setLoading(false);
        });
    }, []);

    const generatePDF = (territoryId: number | 'all') => {
        const doc = new jsPDF();
        const today = new Date().toLocaleDateString('de-DE');

        const territoriesToExport = territoryId === 'all'
            ? territories
            : territories.filter(t => t.id === territoryId);

        territoriesToExport.forEach((territory, index) => {
            if (index > 0) doc.addPage();

            const territoryTrees = trees
                .filter(t => t.territory_id === territory.id)
                .sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

            doc.setFontSize(18);
            doc.text(`Sammelliste: ${territory.name}`, 14, 15);

            doc.setFontSize(10);
            doc.text(`Datum: ${today} | Anzahl Bäume: ${territoryTrees.length}`, 14, 22);

            const tableData = territoryTrees.map((t, i) => [
                i + 1,
                t.address,
                t.name,
                t.payment_method || '-',
                t.note || '',
                t.phone || ''
            ]);

            autoTable(doc, {
                head: [['#', 'Adresse', 'Name', 'Bezahlung', 'Notiz', 'Telefon']],
                body: tableData,
                startY: 25,
                styles: { fontSize: 10, cellPadding: 3 },
                columnStyles: {
                    0: { cellWidth: 10 },
                    1: { cellWidth: 50 },
                    2: { cellWidth: 35 },
                    3: { cellWidth: 25 },
                    4: { cellWidth: 40 }
                },
                theme: 'grid'
            });
        });

        const filename = territoryId === 'all'
            ? `Sammellisten_Gesamt_${today}.pdf`
            : `Sammelliste_${territoriesToExport[0]?.name}_${today}.pdf`;

        doc.save(filename);
    };

    if (loading) {
        return (
            <div className={styles.loadingWrapper}>
                <div className="flex flex-col items-center gap-4">
                    <div className={styles.spinner}></div>
                    <div className="text-lg font-medium text-slate-300">Lade Daten...</div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.container}>
                {/* Header */}
                <div className={styles.header}>
                    <Link
                        href="/"
                        className={styles.backButton}
                    >
                        <ArrowLeft size={24} />
                    </Link>
                    <div className={styles.titleWrapper}>
                        <h1 className={styles.title}>
                            <Printer className="text-blue-400" />
                            Papierlisten exportieren
                        </h1>
                        <p className={styles.subtitle}>
                            Erstelle PDF-Listen für deine Sammelgebiete
                        </p>
                    </div>
                </div>

                <div className={styles.grid}>
                    {/* Left Column: Global Actions */}
                    <div className={styles.sidebar}>
                        <div className={styles.card}>
                            <div className={styles.cardIcon}>
                                <Download size={24} />
                            </div>
                            <h2 className={styles.cardTitle}>Gesamtexport</h2>
                            <p className={styles.cardText}>
                                Lade alle Gebiete in einer einzigen PDF-Datei herunter. Jedes Gebiet beginnt automatisch auf einer neuen Seite.
                            </p>
                            <button
                                onClick={() => generatePDF('all')}
                                className={styles.primaryButton}
                            >
                                <Download size={20} />
                                <span>Alle Listen herunterladen</span>
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Territory List */}
                    <div className={styles.mainContent}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>
                                <Map size={20} className="text-emerald-400" />
                                Einzelne Gebiete
                            </h2>
                            <span className={styles.badge}>
                                {territories.length} Gebiete verfügbar
                            </span>
                        </div>

                        <div className={styles.territoryGrid}>
                            {territories.map(t => {
                                const treeCount = trees.filter(tree => tree.territory_id === t.id).length;
                                return (
                                    <div
                                        key={t.id}
                                        className={styles.territoryCard}
                                    >
                                        <div>
                                            <div className={styles.territoryName}>
                                                {t.name}
                                            </div>
                                            <div className={styles.territoryInfo}>
                                                <span className={`${styles.dot} ${treeCount > 0 ? styles.active : ''}`}></span>
                                                {treeCount} {treeCount === 1 ? 'Baum' : 'Bäume'}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => generatePDF(t.id)}
                                            className={styles.downloadButton}
                                            title="PDF herunterladen"
                                        >
                                            <FileText size={20} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
