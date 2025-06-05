// Events direkt per fetch laden
fetch('events.json')
  .then(response => response.json())
  .then(events => {
    if (events.length === 0)
      throw new Error('Keine Events gefunden');
    // Initialize map
    const map = L.map('map').setView([52.520008, 13.404954], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Infobox-Logik
    const eventInfoBox = document.getElementById('event-info');
    function showEventInfo(eventsToShow) {
      if (!eventsToShow || eventsToShow.length === 0) {
        eventInfoBox.style.display = 'none';
        eventInfoBox.innerHTML = '';
        return;
      }
      eventInfoBox.style.display = 'block';
      eventInfoBox.innerHTML = eventsToShow.map(ev => `
        <div style="margin-bottom:18px;">
          <h3 style='margin:0 0 6px 0; color:#256029;'>${ev.EventType} in ${ev.Location}</h3>
          <div style='font-size:0.98em; color:#444;'>
            <b>Zeit:</b> ${new Date(ev.Time).toLocaleString('de-DE', {dateStyle:'full', timeStyle:'short'})}<br>
            <b>Veranstalter:</b> ${ev.Organizer.Name}<br>
            <b>Beschreibung:</b> ${ev.Description}<br>
            <b>Helfer:innen:</b> ${ev.EventStatus.ConfirmedHelpers} / ${ev.EventStatus.HelpersNeededMinimum}<br>
            <b>Material:</b> ${ev.EventStatus.SpecialRequirements}<br>
            <b>Status:</b> ${ev.EventStatus.EventConfirmed ? 'Bestätigt' : (ev.EventStatus.ConfirmedHelpers >= ev.EventStatus.HelpersNeededMinimum ? 'Helfer:innen ok, Material fehlt' : 'Weitere Helfer:innen benötigt')}<br>
            <b>Links:</b> <a href='${ev.Wolke}' target='_blank'>Wolke</a> | <a href='${ev.Chatbegruenung}' target='_blank'>Chat</a>
          </div>
          <button class="help-btn" onclick="window.open('${ev.Wolke}', '_blank')">Jetzt helfen</button>
        </div>
      `).join('<hr style="margin:8px 0;">');
    }

    // Marker-Referenzen für Kalender-Highlighting bereitstellen
    window._calendarMarkers = [];
    events.forEach(event => {
      const { Latitude, Longitude } = event.Geolocation;
      // Markerfarbe je nach Status bestimmen
      let iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
      if (event.EventStatus.EventConfirmed) {
        iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png';
      } else if (event.EventStatus.ConfirmedHelpers >= event.EventStatus.HelpersNeededMinimum) {
        iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png';
      } else {
        iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png';
      }
      const marker = L.marker([Latitude, Longitude], {
        icon: L.icon({
          iconUrl,
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          shadowSize: [41, 41],
          shadowAnchor: [13, 41]
        })
      })
        .addTo(map)
        .bindPopup(`<b>${event.Location}</b><br>${event.Description}`);
      window._calendarMarkers.push({ event, marker });
      // Marker-Klick öffnet Infobox für dieses Event
      marker.on('click', () => {
        showEventInfo([event]);
      });
    });

    // Kalender für gewünschten Zeitraum generieren (z.B. ab heute bis Wahltag 2026)
    const calendar = document.getElementById('calendar');
    const today = new Date();
    const startDate = today;
    const endDate = new Date(2026, 8, 26); // 26. September 2026
    window.generateCalendar(events, startDate, endDate, calendar, showEventInfo);
  });