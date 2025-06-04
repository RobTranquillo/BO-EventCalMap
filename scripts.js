// Events direkt per fetch laden
fetch('events.json')
  .then(response => response.json())
  .then(events => {
    console.log('Geladene Events:', events);
    // Hier können Sie die Events weiterverarbeiten, z.B. für Map oder Kalender

    // Initialize map
    const map = L.map('map').setView([52.520008, 13.404954], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Add markers from events
    events.forEach(event => {
      const { Latitude, Longitude } = event.Geolocation;
      L.marker([Latitude, Longitude])
        .addTo(map)
        .bindPopup(`<b>${event.Location}</b><br>${event.Description}`);
    });

    // Kalender-Logik ausgelagert nach calendar.js
    const calendar = document.getElementById('calendar');
    const today = new Date();
    const startMonth = today.getMonth();
    const startYear = today.getFullYear();

    // Kalender für zwei Monate generieren
    window.generateCalendar(events, startMonth, startYear, calendar);
    window.generateCalendar(events, startMonth + 1, startYear, calendar);
  });