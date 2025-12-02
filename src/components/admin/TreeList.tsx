'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit2 } from 'lucide-react';
import styles from '@/app/admin/admin.module.css';

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

interface SortableTreeItemProps {
    tree: Tree;
    index: number;
    onEdit: (t: Tree) => void;
    onHighlight: (t: Tree) => void;
}

export function SortableTreeItem({ tree, index, onEdit, onHighlight }: SortableTreeItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: tree.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1000 : 'auto',
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={styles.treeItem}
            onClick={() => onHighlight(tree)}
        >
            <div {...attributes} {...listeners} className={styles.dragHandle}>
                <GripVertical size={16} color="#64748b" />
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className={styles.sequenceBadge}>{index + 1}</span>
                    <strong>{tree.name}</strong>
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginLeft: '1.8rem' }}>
                    {tree.address}
                </div>
                {tree.note && (
                    <div style={{ color: '#eab308', fontSize: '0.8rem', marginLeft: '1.8rem', fontStyle: 'italic' }}>
                        Note: {tree.note}
                    </div>
                )}
            </div>
            <button
                className={styles.iconButton}
                onClick={(e) => { e.stopPropagation(); onEdit(tree); }}
            >
                <Edit2 size={16} />
            </button>
        </div>
    );
}
