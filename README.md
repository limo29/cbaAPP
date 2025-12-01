# Christbaum Abhol-Aktion App

Eine Web-Applikation zur Verwaltung und Durchführung der Christbaum-Abholaktion.

## Features
- **Import**: CSV/JSON Import von Google Forms (mit automatischer Geocodierung).
- **Verwaltung**: Einzeichnen von Gebieten auf der Karte.
- **Routen**: Automatische Sortierung der Bäume (Route Optimieren).
- **Fahrer-Ansicht**: Liste der Bäume, Navigation (Google Maps), Status (Erledigt/Nicht gefunden).
- **Mobile First**: Optimiert für Smartphones.

## Installation & Start

### Lokal (Entwicklung)
1. `npm install`
2. `npm run dev`
3. Öffne `http://localhost:3000`

### Docker (Produktion)
1. Image bauen:
   ```bash
   docker build -t cba-app .
   ```
2. Container starten (mit Volume für Datenbank):
   ```bash
   docker run -d -p 3000:3000 -v cba-data:/app/data --name cba-app cba-app
   ```
3. Öffne `http://localhost:3000`

## Daten Import
Das Import-Format sollte folgende Spalten enthalten (CSV oder JSON):
- `Name`
- `Adresse` (oder `Address`)
- `Telefon` (oder `Phone`)
- `Notiz` (oder `Note`)

Die Geocodierung erfolgt automatisch über OpenStreetMap (Nominatim). Bitte bei großen Datenmengen Geduld haben (Rate Limiting).
