'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './flyer.module.css';
import { Printer, Move, Type, RotateCw } from 'lucide-react';

interface TextElement {
    id: string;
    label: string;
    value: string;
    x: number; // %
    y: number; // %
    fontSize: number; // pt
    rotation: number; // deg
    color: string;
    fontFamily: string;
}

export default function FlyerGenerator() {
    const [elements, setElements] = useState<Record<string, TextElement>>({
        price: {
            id: 'price',
            label: 'Preis',
            value: '5€',
            x: 82,
            y: 20,
            fontSize: 60,
            rotation: 15,
            color: 'white',
            fontFamily: 'Impact, sans-serif'
        },
        registrationDate: {
            id: 'registrationDate',
            label: 'Anmeldeschluss',
            value: 'Bis 08.01.26 anmelden',
            x: 50,
            y: 35,
            fontSize: 40,
            rotation: 0,
            color: 'white',
            fontFamily: 'Impact, sans-serif'
        },
        pickupDate: {
            id: 'pickupDate',
            label: 'Abholdatum',
            value: 'Abholung am 10.01.26',
            x: 50,
            y: 78,
            fontSize: 40,
            rotation: 0,
            color: 'white',
            fontFamily: 'Impact, sans-serif'
        },
        phone: {
            id: 'phone',
            label: 'Telefon',
            value: '0151 28713586',
            x: 50,
            y: 62,
            fontSize: 60,
            rotation: 0,
            color: 'black',
            fontFamily: 'Impact, sans-serif'
        },
        email: {
            id: 'email',
            label: 'E-Mail',
            value: 'baum@kjg-st-martin.de',
            x: 50,
            y: 70,
            fontSize: 24,
            rotation: 0,
            color: 'black',
            fontFamily: 'Arial, sans-serif'
        }
    });

    const [selectedId, setSelectedId] = useState<string>('price');
    const [scale, setScale] = useState(0.5);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                const containerWidth = containerRef.current.offsetWidth;
                const targetWidth = 800;
                const newScale = Math.min(containerWidth / targetWidth, 1) * 0.9;
                setScale(newScale < 0.3 ? 0.3 : newScale);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const updateElement = (id: string, updates: Partial<TextElement>) => {
        setElements(prev => ({
            ...prev,
            [id]: { ...prev[id], ...updates }
        }));
    };

    const handleDownload = async (format: 'png' | 'pdf') => {
        const element = document.querySelector(`.${styles.flyer}`) as HTMLElement;
        if (!element) return;

        // Temporarily remove transform to capture correctly
        const originalTransform = element.style.transform;
        const originalMargin = element.style.marginBottom;
        const originalBoxShadow = element.style.boxShadow;

        element.style.transform = 'none';
        element.style.marginBottom = '0';
        element.style.boxShadow = 'none';

        try {
            // Dynamically import html2canvas and jspdf to avoid SSR issues
            const html2canvas = (await import('html2canvas')).default;
            const jsPDF = (await import('jspdf')).default;

            const canvas = await html2canvas(element, {
                scale: 2, // Higher quality
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            if (format === 'png') {
                const link = document.createElement('a');
                link.download = 'flyer.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
            } else {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save('flyer.pdf');
            }
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export fehlgeschlagen');
        } finally {
            // Restore styles
            element.style.transform = originalTransform;
            element.style.marginBottom = originalMargin;
            element.style.boxShadow = originalBoxShadow;
        }
    };

    const selectedElement = elements[selectedId];

    return (
        <div className={styles.container}>
            <div className={styles.controls}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'white' }}>Flyer Generator</h1>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Element bearbeiten</label>
                    <select
                        className={styles.input}
                        value={selectedId}
                        onChange={(e) => setSelectedId(e.target.value)}
                    >
                        {Object.values(elements).map(el => (
                            <option key={el.id} value={el.id}>{el.label}</option>
                        ))}
                    </select>
                </div>

                <div className={styles.sectionTitle}>Inhalt</div>
                <div className={styles.formGroup}>
                    <input
                        type="text"
                        value={selectedElement.value}
                        onChange={(e) => updateElement(selectedId, { value: e.target.value })}
                        className={styles.input}
                    />
                </div>

                <div className={styles.sectionTitle}>Position & Stil</div>

                <div className={styles.formGroup}>
                    <label className={styles.label}><Move size={14} style={{ display: 'inline' }} /> Position X ({selectedElement.x}%)</label>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={selectedElement.x}
                        onChange={(e) => updateElement(selectedId, { x: Number(e.target.value) })}
                        className={styles.rangeInput}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}><Move size={14} style={{ display: 'inline' }} /> Position Y ({selectedElement.y}%)</label>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={selectedElement.y}
                        onChange={(e) => updateElement(selectedId, { y: Number(e.target.value) })}
                        className={styles.rangeInput}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}><Type size={14} style={{ display: 'inline' }} /> Größe ({selectedElement.fontSize}pt)</label>
                    <input
                        type="range"
                        min="10"
                        max="200"
                        value={selectedElement.fontSize}
                        onChange={(e) => updateElement(selectedId, { fontSize: Number(e.target.value) })}
                        className={styles.rangeInput}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}><RotateCw size={14} style={{ display: 'inline' }} /> Rotation ({selectedElement.rotation}°)</label>
                    <input
                        type="range"
                        min="-180"
                        max="180"
                        value={selectedElement.rotation}
                        onChange={(e) => updateElement(selectedId, { rotation: Number(e.target.value) })}
                        className={styles.rangeInput}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Farbe</label>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            onClick={() => updateElement(selectedId, { color: 'white' })}
                            style={{
                                width: '30px', height: '30px', borderRadius: '50%', border: '2px solid #ccc', background: 'white',
                                cursor: 'pointer'
                            }}
                        />
                        <button
                            onClick={() => updateElement(selectedId, { color: 'black' })}
                            style={{
                                width: '30px', height: '30px', borderRadius: '50%', border: '2px solid #ccc', background: 'black',
                                cursor: 'pointer'
                            }}
                        />
                        <button
                            onClick={() => updateElement(selectedId, { color: '#4CFF00' })}
                            style={{
                                width: '30px', height: '30px', borderRadius: '50%', border: '2px solid #ccc', background: '#4CFF00',
                                cursor: 'pointer'
                            }}
                        />
                    </div>
                </div>


                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                    <button onClick={() => handleDownload('pdf')} className={styles.button} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#ef4444' }}>
                        <Printer size={20} />
                        PDF
                    </button>
                    <button onClick={() => handleDownload('png')} className={styles.button} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#3b82f6' }}>
                        <Printer size={20} />
                        PNG
                    </button>
                </div>
            </div>

            <div className={styles.previewContainer} ref={containerRef}>
                <div
                    className={styles.flyer}
                    style={{
                        transform: `scale(${scale})`,
                        marginBottom: `-${(1 - scale) * 100}%`
                    }}
                >
                    {/* Background SVG */}
                    <img
                        src="/flyer-template.svg"
                        alt="Flyer Template"
                        className={styles.flyerImage}
                    />

                    {/* Dynamic Text Elements */}
                    {Object.values(elements).map(el => (
                        <div
                            key={el.id}
                            className={styles.draggableText}
                            style={{
                                left: `${el.x}%`,
                                top: `${el.y}%`,
                                fontSize: `${el.fontSize}pt`,
                                transform: `translate(-50%, -50%) rotate(${el.rotation}deg)`,
                                color: el.color,
                                fontFamily: el.fontFamily,
                                border: selectedId === el.id ? '2px dashed rgba(59, 130, 246, 0.5)' : 'none',
                                padding: '5px'
                            }}
                            onClick={() => setSelectedId(el.id)}
                        >
                            {el.value}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
