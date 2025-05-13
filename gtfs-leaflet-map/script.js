//LA COUNTY W/ ZOOM OF 10
const map = L.map('map').setView([34.05, -118.25], 10); 

// OSM LAYER
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// LOAD AND PLOT STOPS
Papa.parse('data/stops.txt', {
  download: true,
  header: true,
  complete: function(results) {
    results.data.forEach(stop => {
      if (stop.stop_lat && stop.stop_lon) {
        L.circleMarker([parseFloat(stop.stop_lat), parseFloat(stop.stop_lon)], {
          radius: 4,
          fillColor: "#007bff",
          color: "#fff",
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8
        }).bindPopup(`<b>${stop.stop_name}</b><br>ID: ${stop.stop_id}`).addTo(map);
      }
    });
  }
});

//COLOR CODE SETUP
const busTypeColors = {
  "Metro Local and Limited": "#FF6600",  // Orange for Local and Limited
  "Metro Rapid": "#FF0000",              // Red for Rapid
  "Metro Express": "#0000FF",            // Blue for Express
  "Metro Silver Line": "#9C27B0",        // Purple for Silver Line
  "Metro Rail": "#4CAF50",              // Green for Rail
  "Other": "#000000"                    // Default color for other bus types
};

//METRO BUS LINE GEOJSON
fetch('data/Metro_Bus_Lines.geojson')
  .then(response => response.json())
  .then(data => {
    console.log(data);  

    const busLinesLayer = L.geoJSON(data, {
      style: feature => {
        const busType = feature.properties.MetroBusType;
        // COLOR CODE
        const color = busTypeColors[busType] || busTypeColors["Other"]; // Default to "Other" if no match
        return {
          color: color,
          weight: 3,
          opacity: 0.7
        };
      },
      onEachFeature: (feature, layer) => {
        const route = feature.properties.RouteName;
        const type = feature.properties.MetroBusType;
        const url = feature.properties.NLA_URL;
        const tooltip = feature.properties.TOOLTIP;

        // Bind the popup to each feature
        layer.bindPopup(`<strong>${route}</strong><br>Type: ${type}<br>`);
      }
    });

    //ADD ROUTES
    busLinesLayer.addTo(map);
  })
  .catch(error => {
    console.error('Error loading GeoJSON:', error);
  });
