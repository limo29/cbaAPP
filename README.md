# Christbaum Abhol-Aktion App

Eine moderne Web-Applikation zur Organisation, Verwaltung und Durchführung von Christbaum-Sammelaktionen.

## Überblick

Diese Anwendung wurde entwickelt, um den gesamten Prozess der Christbaumabholung zu digitalisieren und zu optimieren. Von der Anmeldung der Bäume durch die Bürger über die Gebietsplanung durch die Organisatoren bis hin zur Navigation für die Sammel-Teams am Aktionstag.

## Features

### 🌍 Für Bürger
- **Einfache Anmeldung**: Online-Formular zur Registrierung von Abholungen.
- **Mobile Optimierung**: Funktioniert auf allen Smartphones und Tablets.

### 🛠 Für Organisatoren (Admin)
- **Dashboard**: Zentrale Übersicht über alle Anmeldungen und Gebiete.
- **Daten-Import**: Flexibler Import von CSV/JSON Daten (z.B. aus Google Forms) mit intelligenter Spaltenerkennung.
- **Geocoding**: Automatische Umwandlung von Adressen in GPS-Koordinaten.
- **Gebietsverwaltung**: Zeichnen von Sammelgebieten direkt auf der Karte.
- **Routenoptimierung**: Automatische Berechnung der effizientesten Route für jedes Gebiet.
- **Telefonaktion**: Integriertes Tool zur Verwaltung von Telefonkampagnen.

### 🚛 Für Fahrer & Sammler
- **Digitale Liste**: Keine Zettelwirtschaft mehr – alle Abholungen auf dem Smartphone.
- **Navigation**: Direkte Integration mit Karten-Apps (Google Maps, Apple Maps).
- **Live-Status**: Markieren von erledigten oder nicht gefundenen Bäumen in Echtzeit.

## Dokumentation

Eine detaillierte Anleitung zur Benutzung der App finden Sie im **[Benutzerhandbuch](BENUTZERHANDBUCH.md)**.

## Technologie Stack

- **Framework**: [Next.js](https://nextjs.org/) (React)
- **Datenbank**: SQLite (via `better-sqlite3`)
- **Karte**: Leaflet / React-Leaflet
- **Styling**: CSS Modules
- **Deployment**: Docker Support inklusive

## Installation & Start

### Voraussetzungen
- Node.js (v18 oder neuer)
- npm

### Lokal (Entwicklung)

1. Repository klonen und Abhängigkeiten installieren:
   ```bash
   npm install
   ```

2. Entwicklungsserver starten:
   ```bash
   npm run dev
   ```

3. App öffnen: `http://localhost:3000`

### Docker (Produktion)

1. Docker Image bauen:
   ```bash
   docker build -t cba-app .
   ```

2. Container starten (mit persistentem Volume für die Datenbank):
   ```bash
   docker run -d -p 3000:3000 -v cba-data:/app/data --name cba-app cba-app
   ```

## Lizenz

[MIT](LICENSE)
