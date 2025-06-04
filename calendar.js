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
    container.appendChild(dayDiv);
    // Zur nächsten Woche springen
    current.setDate(current.getDate() + 7);
  }
}

// Export für globalen Zugriff
window.generateCalendar = generateCalendar;
