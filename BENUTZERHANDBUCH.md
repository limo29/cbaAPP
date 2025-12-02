# Benutzerhandbuch - Christbaum Abhol-Aktion App

Willkommen im Benutzerhandbuch der Christbaum Abhol-Aktion App. Diese Anwendung unterstützt bei der Organisation, Verwaltung und Durchführung der jährlichen Christbaum-Sammelaktion.

## Inhaltsverzeichnis

1. [Einführung](#einführung)
2. [Rollen & Zugriffsrechte](#rollen--zugriffsrechte)
3. [Öffentliche Anmeldung (Baum anmelden)](#öffentliche-anmeldung-baum-anmelden)
4. [Admin-Bereich](#admin-bereich)
    - [Dashboard Übersicht](#dashboard-übersicht)
    - [Daten Import](#daten-import)
    - [Gebietsverwaltung](#gebietsverwaltung)
    - [Baumverwaltung](#baumverwaltung)
    - [Routenplanung & Optimierung](#routenplanung--optimierung)
    - [Telefonaktion](#telefonaktion)
    - [Fahrer-Verwaltung](#fahrer-verwaltung)
5. [Fahrer-Ansicht](#fahrer-ansicht)
6. [Häufige Fragen & Fehlerbehebung](#häufige-fragen--fehlerbehebung)

---

## Einführung

Diese App digitalisiert den Prozess der Christbaumabholung. Sie ermöglicht:
- Die Online-Anmeldung von Bäumen durch Gruppenleiter.
- Den Import von Daten aus anderen Quellen (z.B. Google Forms).
- Die Einteilung von Sammelgebieten auf einer Karte.
- Die automatische Optimierung von Abholrouten.
- Eine digitale Liste und Karte für die Fahrer/Sammler.

## Rollen & Zugriffsrechte

Es gibt drei Hauptbereiche in der App:

1.  **Öffentlich (`/register`)**: Für Bürger, um ihre Bäume anzumelden.
2.  **Admin (`/admin`)**: Für das Orga-Team. Hier werden Daten verwaltet, Gebiete gezeichnet und Routen geplant.
3.  **Fahrer (`/driver`)**: Für die Sammel-Teams am Tag der Aktion. Zeigt die Route und ermöglicht das Abhaken von Bäumen.

## Öffentliche Anmeldung (Baum anmelden)

Unter der URL `/register` finden GLs ein Formular zur Anmeldung.
- **Pflichtfelder**: Name, Straße, Hausnummer, PLZ, Ort.
- **Optional**: Telefonnummer, E-Mail, Ablageort/Bemerkung.
- Nach erfolgreicher Anmeldung erscheint eine Bestätigung.

## Admin-Bereich

Der Admin-Bereich ist unter `/admin` erreichbar. Er ist die Schaltzentrale der Aktion.

### Dashboard Übersicht
Das Dashboard ist zweigeteilt (auf Desktop):
- **Links**: Liste der Bäume und Steuerungsmenü.
- **Rechts**: Interaktive Karte.
- **Mobil**: Umschalter zwischen "Verwaltung" (Liste) und "Karte".

### Daten Import
Über den Button **"Import"** (oben links) können Daten massenhaft eingespielt werden.
1.  **Quelle wählen**:
    - **Datei**: Text aus einer CSV oder JSON Datei einfügen.
    - **URL**: Link zu einem Google Sheet (muss öffentlich oder freigegeben sein).
2.  **Spalten zuordnen**: Die App versucht automatisch, Spalten wie "Vorname", "Nachname", "Straße" etc. zu erkennen. Diese können manuell korrigiert werden.
3.  **Vorschau & Geocoding**: Die Adressen werden automatisch in Koordinaten umgewandelt.
    - **Warnungen**: Die App warnt bei Duplikaten, unklaren Adressen oder Zielen, die weit entfernt liegen.
    - **Korrektur**: Einzelne Einträge können in der Vorschau noch bearbeitet werden.
4.  **Import abschließen**: Die Daten werden in die Datenbank übernommen. Neue Bäume werden automatisch Gebieten zugeordnet, wenn sie innerhalb eines gezeichneten Polygons liegen.

### Gebietsverwaltung
Gebiete definieren, welches Team für welche Straßen zuständig ist.
- **Neues Gebiet**: Button **"Neues Gebiet"** (Plus-Icon).
    - Klicken Sie auf die Karte, um die Eckpunkte des Gebiets zu setzen (mindestens 3 Punkte).
    - Geben Sie dem Gebiet einen Namen und eine Farbe.
    - Klicken Sie auf "Speichern".
- **Gebiet bearbeiten**: Wählen Sie ein Gebiet aus der Liste und klicken Sie auf das **Stift-Icon**. Sie können die Eckpunkte verschieben und Namen/Farbe ändern.
- **Gebiet löschen**: Klick auf das **Mülleimer-Icon**. (Achtung: Die Bäume darin werden nicht gelöscht, sondern "heimatlos").

### Baumverwaltung
- **Liste filtern**: Nutzen Sie das Dropdown-Menü, um nur Bäume eines bestimmten Gebiets oder "Kein Gebiet" anzuzeigen.
- **Suche**: Über das Suchfeld kann nach Namen oder Adressen gesucht werden.
- **Bearbeiten**: Klick auf einen Baum in der Liste öffnet Details. Hier können Notizen hinzugefügt werden.
- **Verschieben**:
    - **Drag & Drop (Liste)**: Ändert die Reihenfolge in der Route.
    - **Karte**: Marker können verschoben werden, falls die Geocodierung ungenau war. Der Baum wird automatisch dem neuen Gebiet zugeordnet, in dem er landet.

### Routenplanung & Optimierung
Für jedes Gebiet kann eine optimale Route berechnet werden.
- **Route berechnen**: Verbindet die Punkte in der aktuellen Reihenfolge.
- **Route optimieren**: Berechnet die *kürzeste* Route (Traveling Salesman Problem). Dies sortiert die Liste automatisch um.
- **Alles optimieren**: Im Menü "Aktionen" gibt es Funktionen, um alle Gebiete auf einmal zu berechnen oder zu optimieren.

### Telefonaktion
Unter `/admin/campaign` befindet sich das Tool für die Telefonaktion (z.B. um Spenden zu sammeln oder Abholungen zu bestätigen).
- Zeigt eine Liste aller Kontakte mit Telefonnummer.
- Status-Tracking: "Angerufen", "Nicht erreicht", "Falsche Nummer".

### Fahrer-Verwaltung
Unter `/admin/drivers` können Fahrer-Accounts oder Teams angelegt und Gebieten zugewiesen werden (Funktionalität im Aufbau).

## Fahrer-Ansicht

Die Fahrer-Ansicht unter `/driver` ist für die Nutzung auf dem Smartphone optimiert.
- **Übersicht**: Zeigt die Liste der Bäume in der geplanten Reihenfolge.
- **Navigation**: Ein Klick auf die Adresse öffnet die Navigation (z.B. Google Maps).
- **Status setzen**:
    - **Grüner Haken**: Baum abgeholt / erledigt.
    - **Rotes X**: Baum nicht gefunden.
- **Karte**: Zeigt den eigenen Standort und die verbleibenden Bäume.

## Häufige Fragen & Fehlerbehebung

**Frage: Ein Baum wird auf der Karte nicht angezeigt.**
*Antwort: Wahrscheinlich konnte die Adresse nicht gefunden werden. Prüfen Sie die Schreibweise im Admin-Bereich und korrigieren Sie sie, oder setzen Sie den Marker manuell auf die Karte.*

**Frage: Wie lösche ich alle Testdaten?**
*Antwort: Im Admin-Bereich gibt es unten links einen Button (Mülleimer), um alle Bäume zu löschen. Dies ist passwortgeschützt.*

**Frage: Die Route sieht chaotisch aus.**
*Antwort: Klicken Sie für das betroffene Gebiet auf "Route optimieren". Falls das nicht hilft, prüfen Sie, ob Marker falsch auf der Karte platziert sind.*
