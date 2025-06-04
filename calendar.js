// calendar.js
// Generiert einen Monatskalender im angegebenen Container
// events: Array von Event-Objekten
// month: 0-basierter Monat (0=Januar)
// year: Jahr (z.B. 2025)
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

function generateCalendar(events, month, year, container) {
  // Ersten Tag des Monats finden
  const firstDay = new Date(year, month, 1);
  // Letzten Tag des Monats finden
  const lastDay = new Date(year, month + 1, 0);

  // Ersten Montag vor oder am Monatsanfang finden
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - ((firstDay.getDay() + 6) % 7));
  // Letzten Sonntag nach oder am Monatsende finden
  const end = new Date(lastDay);
  end.setDate(lastDay.getDate() + (7 - end.getDay() === 7 ? 0 : 7 - end.getDay()));

  let current = new Date(start);
  // Tooltip-Element erstellen (einmalig)
  let tooltip = document.getElementById('calendar-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = 'calendar-tooltip';
    tooltip.style.position = 'fixed';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.zIndex = '1000';
    tooltip.style.display = 'none';
    tooltip.style.background = '#fff';
    tooltip.style.border = '1px solid #bbb';
    tooltip.style.borderRadius = '6px';
    tooltip.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    tooltip.style.padding = '8px 12px';
    tooltip.style.fontSize = '0.95em';
    tooltip.style.maxWidth = '260px';
    document.body.appendChild(tooltip);
  }

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

    // Prüfen, ob in dieser Woche ein Event ist und Status bestimmen
    let weekStatus = null;
    events.forEach(event => {
      const eventDate = new Date(event.Time);
      if (eventDate >= weekStart && eventDate <= weekEnd) {
        if (event.EventStatus.EventConfirmed) {
          weekStatus = 'green';
        } else if (event.EventStatus.ConfirmedHelpers >= event.EventStatus.HelpersNeededMinimum) {
          // Mindestpersonen erreicht, aber Event nicht bestätigt => gelb
          weekStatus = weekStatus === 'green' ? 'green' : 'yellow';
        } else {
          // Noch Helfer benötigt => rot
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

    // Events dieser Woche sammeln
    const weekEvents = events.filter(event => {
      const eventDate = new Date(event.Time);
      return eventDate >= weekStart && eventDate <= weekEnd;
    });

    // Tooltip-Logik für Wochenfeld
    if (weekEvents.length > 0) {
      dayDiv.addEventListener('mousemove', (e) => {
        const infos = weekEvents.map(ev =>
          `${ev.Location}: <b>${ev.Organizer.Name}</b><br>Noch Hilfe benötigt: ${ev.EventStatus.HelpersNeededMinimum - ev.EventStatus.ConfirmedHelpers}<br><i>${ev.EventType}</i><br>${ev.Description}`
        ).join('<hr style="margin:4px 0;">');
        tooltip.innerHTML = infos;
        tooltip.style.display = 'block';
        tooltip.style.left = (e.clientX + 16) + 'px';
        tooltip.style.top = (e.clientY + 8) + 'px';

        // Marker hervorheben (Farbe ändern)
        weekEvents.forEach(ev => {
          const marker = markerMap.get(ev);
          if (marker) {
            marker.setZIndexOffset(1000);
            marker.setIcon(L.icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
              iconSize: [30, 48],
              iconAnchor: [15, 48],
              popupAnchor: [0, -40],
              shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
              shadowSize: [41, 41],
              shadowAnchor: [13, 41]
            }));
          }
        });
      });
      dayDiv.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
        // Marker zurücksetzen (Standardfarbe)
        weekEvents.forEach(ev => {
          const marker = markerMap.get(ev);
          if (marker) {
            marker.setZIndexOffset(0);
            marker.setIcon(L.icon({
              iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
              shadowSize: [41, 41],
              shadowAnchor: [13, 41]
            }));
          }
        });
      });
    }
    container.appendChild(dayDiv);
    // Zur nächsten Woche springen
    current.setDate(current.getDate() + 7);
  }
}

// Export für globalen Zugriff
window.generateCalendar = generateCalendar;
