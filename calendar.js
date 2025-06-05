// calendar.js
// Generiert einen Monatskalender im angegebenen Container
// events: Array von Event-Objekten
// startDate: Startdatum im Format YYYY-MM-DD
// endDate: Enddatum im Format YYYY-MM-DD
// container: DOM-Element, in das die Tage eingefügt werden
// Hilfsfunktion zur Berechnung der Kalenderwoche (ISO 8601)
function getISOWeek(date) {
  const tempDate = new Date(date.getTime());
  tempDate.setHours(0, 0, 0, 0);
  // Donnerstag in dieser Woche finden
  tempDate.setDate(tempDate.getDate() + 3 - ((tempDate.getDay() + 6) % 7));
  // 1. Januar der Woche
  const week1 = new Date(tempDate.getFullYear(), 0, 4);
  // Kalenderwoche berechnen
  return 1 + Math.round(((tempDate.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

function generateCalendar(events, startDate, endDate, container, showEventInfo) {
  // Start- und Enddatum als Date-Objekte
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  // Ersten Montag vor oder am Startdatum finden
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  // Letzten Sonntag nach oder am Enddatum finden
  end.setDate(end.getDate() + (7 - end.getDay() === 7 ? 0 : 7 - end.getDay()));

  let current = new Date(start);

  // Marker-Referenzen für Zuordnung Woche <-> Marker
  const markerMap = new Map();
  // Marker-Referenzen sammeln (in scripts.js müssen Marker mit eindeutiger ID erzeugt werden)
  // Diese Funktion erwartet, dass window._calendarMarkers existiert und ein Array von {event, marker} ist
  // (siehe Anpassung in scripts.js)
  if (window._calendarMarkers) {
    window._calendarMarkers.forEach(({event, marker}) => {
      markerMap.set(event, marker);
    });
  }

  while (current <= end) {
    // Für jede Woche ein Feld
    const weekStart = new Date(current);
    const weekEnd = new Date(current);
    weekEnd.setDate(weekStart.getDate() + 6);
    const weekNumber = getISOWeek(weekStart);

    const dayDiv = document.createElement('div');
    dayDiv.className = 'day';
    // Datum ohne Jahr für Anzeige
    const weekStartStr = weekStart.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
    const weekEndStr = weekEnd.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
    dayDiv.textContent = `KW ${weekNumber}\n${weekStartStr} - ${weekEndStr}`;
    dayDiv.style.whiteSpace = 'pre-line';

    // Events dieser Woche sammeln
    const weekEvents = events.filter(event => {
      const eventDate = new Date(event.Time);
      return eventDate >= weekStart && eventDate <= weekEnd;
    });

    // Blase für Event-Anzahl
    if (weekEvents.length > 0) {
      const badge = document.createElement('span');
      badge.className = 'event-badge';
      const badgeInner = document.createElement('span');
      badgeInner.className = 'event-badge-inner';
      const badgeCount = document.createElement('span');
      badgeCount.className = 'event-badge-count';
      badgeCount.textContent = weekEvents.length;
      badgeInner.appendChild(badgeCount);
      badge.appendChild(badgeInner);
      dayDiv.appendChild(badge);
    }

    // Prüfen, ob in dieser Woche ein Event ist und Status bestimmen
    let weekStatus = null;
    events.forEach(event => {
      const eventDate = new Date(event.Time);
      if (eventDate >= weekStart && eventDate <= weekEnd) {
        if (event.EventStatus.EventConfirmed) {
          weekStatus = 'green';
        } else if (event.EventStatus.ConfirmedHelpers >= event.EventStatus.HelpersNeededMinimum) {
          weekStatus = weekStatus === 'green' ? 'green' : 'yellow';
        } else {
          weekStatus = weekStatus === 'green' || weekStatus === 'yellow' ? weekStatus : 'red';
        }
      }
    });
    if (weekStatus === 'green') {
      dayDiv.classList.add('legend-green');
    } else if (weekStatus === 'yellow') {
      dayDiv.classList.add('legend-yellow');
    } else if (weekStatus === 'red') {
      dayDiv.classList.add('legend-red');
    }

    if (weekEvents.length > 0) {
      dayDiv.addEventListener('mousemove', (e) => {
        const markers = weekEvents.map(ev => markerMap.get(ev)).filter(Boolean);
        highlightMarkers(markers);
      });
      dayDiv.addEventListener('mouseleave', () => {
        const markers = weekEvents.map(ev => markerMap.get(ev)).filter(Boolean);
        resetMarkers(markers);
      });
      dayDiv.addEventListener('click', () => {
        if (typeof showEventInfo === 'function') {
          showEventInfo(weekEvents);
        }
      });
    }
    container.appendChild(dayDiv);
    // Zur nächsten Woche springen
    current.setDate(current.getDate() + 7);
  }

  // Kachel für Wahltag am Ende einfügen
  const wahltagDiv = document.createElement('div');
  wahltagDiv.className = 'day';
  wahltagDiv.style.background = '#256029';
  wahltagDiv.style.color = '#fff';
  wahltagDiv.style.fontWeight = 'bold';
  wahltagDiv.textContent = 'Wahltag 26. September';
  container.appendChild(wahltagDiv);

  // --- Hilfsfunktionen für Marker-Hover ---
  function highlightMarkers(markers) {
    markers.forEach(marker => {
      if (marker) {
        marker.setZIndexOffset(1000);
        const origIcon = marker.options.icon;
        marker.setIcon(L.icon({
          iconUrl: origIcon.options.iconUrl,
          iconSize: [30, 48],
          iconAnchor: [15, 48],
          popupAnchor: [0, -40],
          shadowUrl: origIcon.options.shadowUrl,
          shadowSize: origIcon.options.shadowSize,
          shadowAnchor: origIcon.options.shadowAnchor
        }));
      }
    });
  }
  function resetMarkers(markers) {
    markers.forEach(marker => {
      if (marker) {
        marker.setZIndexOffset(0);
        const origIcon = marker.options.icon;
        marker.setIcon(L.icon({
          iconUrl: origIcon.options.iconUrl,
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowUrl: origIcon.options.shadowUrl,
          shadowSize: origIcon.options.shadowSize,
          shadowAnchor: origIcon.options.shadowAnchor
        }));
      }
    });
  }
}

// Export für globalen Zugriff
window.generateCalendar = generateCalendar;
