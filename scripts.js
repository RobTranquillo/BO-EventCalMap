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

// Generate calendar
const calendar = document.getElementById('calendar');
const today = new Date();
const startMonth = today.getMonth();
const startYear = today.getFullYear();

function generateCalendar(month, year) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayDiv = document.createElement('div');
    dayDiv.className = 'day';
    dayDiv.textContent = day;

    // Check if the day has an event
    const hasEvent = events.some(event => {
      const eventDate = new Date(event.Time);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });

    if (hasEvent) {
      dayDiv.classList.add('event');
    }

    calendar.appendChild(dayDiv);
  }
}

// Generate two months
generateCalendar(startMonth, startYear);
generateCalendar(startMonth + 1, startYear);