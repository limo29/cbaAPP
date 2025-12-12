'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import styles from './login.module.css'

function LoginContent() {
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password }),
            })

            const data = await res.json()

            if (res.ok && data.success) {
                router.push('/')
                router.refresh()
            } else {
                setError(data.message || 'Falsches Passwort')
            }
        } catch (err) {
            setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <h1 className={styles.title}>Willkommen</h1>
                <p className={styles.subtitle}>Bitte geben Sie das Zugangspasswort ein</p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
                {error && <div className={styles.error}>{error}</div>}

                <div className={styles.inputGroup}>
                    <label htmlFor="password" className={styles.label}>
                        Passwort
                    </label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={styles.input}
                        placeholder="••••••••"
                        autoFocus
                        required
                    />
                </div>

                <button type="submit" className={styles.button} disabled={loading}>
                    {loading ? 'Prüfen...' : 'Anmelden'}
                </button>
            </form>
        </div>
    )
}

export default function LoginPage() {
    return (
        <div className={styles.container}>
            <Suspense fallback={<div>Loading...</div>}>
                <LoginContent />
            </Suspense>
        </div>
    )
}
