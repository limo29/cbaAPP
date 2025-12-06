import Link from 'next/link';
import { Truck, Settings, User, Printer, ClipboardList, TreePine, Phone, FileText, MapPin } from 'lucide-react';
import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>
        Christbaum Abhol-Aktion
      </h1>

      <div className={styles.grid}>
        <Link href="/driver" className={`${styles.card} ${styles.prominentCard} ${styles.prominentCardPrimary}`}>
          <Truck className={styles.icon} />
          <h2 className={styles.cardTitle}>Fahrer / Beifahrer</h2>
          <p className={styles.cardText}>Route starten, Bäume abhaken, Navigation.</p>
        </Link>
        <Link href="/register" className={`${styles.card} ${styles.prominentCard} ${styles.prominentCardSecondary}`}>
          <TreePine className={styles.icon} />
          <h2 className={styles.cardTitle}>Baum anmelden</h2>
          <p className={styles.cardText}>Neue Abholung registrieren.</p>
        </Link>
        <Link href="/admin/drivers" className={styles.card}>
          <User className={styles.icon} />
          <h2 className={styles.cardTitle}>Fahrer Zuweisung</h2>
          <p className={styles.cardText}>Gebiete zuweisen und Fortschritt einsehen.</p>
        </Link>

        <Link href="/admin" className={styles.card}>
          <Settings className={styles.icon} />
          <h2 className={styles.cardTitle}>Zentrale / Admin</h2>
          <p className={styles.cardText}>Import, Gebiete einteilen, Fortschritt überwachen.</p>
        </Link>

        <Link href="/flyer" className={styles.card}>
          <Printer className={styles.icon} />
          <h2 className={styles.cardTitle}>Flyer Generator</h2>
          <p className={styles.cardText}>Flyer erstellen und drucken.</p>
        </Link>

        <Link href="/export" className={styles.card}>
          <FileText className={styles.icon} />
          <h2 className={styles.cardTitle}>Papierlisten</h2>
          <p className={styles.cardText}>Listen für Fahrer drucken.</p>
        </Link>

        <Link href="/planning" className={styles.card}>
          <ClipboardList className={styles.icon} />
          <h2 className={styles.cardTitle}>Planung</h2>
          <p className={styles.cardText}>Checkliste und Aufgabenverwaltung.</p>
        </Link>



        <Link href="/admin/campaign" className={styles.card}>
          <Phone className={styles.icon} />
          <h2 className={styles.cardTitle}>Telefonaktion</h2>
          <p className={styles.cardText}>Alte Listen abtelefonieren.</p>
        </Link>

        <Link href="/posters" className={styles.card}>
          <MapPin className={styles.icon} />
          <h2 className={styles.cardTitle}>Plakate</h2>
          <p className={styles.cardText}>Standorte erfassen und verwalten.</p>
        </Link>
      </div>
    </main>
  );
}
