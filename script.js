// INITIALIZE MAP
const map = L.map('map').setView([34.05, -118.25], 10);

// BASE LAYER
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// SHOW LOADING MESSAGE
const loadingIndicator = document.getElementById('loading');

// HIDE LOADING MESSAGE
function hideLoading() {
  loadingIndicator.style.display = 'none';
}

// SET TIMEOUT FOR LOADING IMAGE
setTimeout(hideLoading, 3000);

// LA COUNTY BOUNDARY
//Credits: https://gist.github.com/ThomasG77/c38e6b0ecfd014342aad
fetch("gtfs-leaflet-map/County_Boundary.geojson")
  .then(res => res.json())
  .then(data => {
    L.geoJson(data).addTo(map);
  })
  .catch(err => console.error("Error loading county boundary:", err));

// COLOR DICTIONARY
const busTypeColors = {
  "Metro Local and Limited": "#FF6600",
  "Metro Rapid": "#FF0000",
  "Metro Express": "#0000FF",
  "Metro Silver Line": "#9C27B0",
  "Metro Shuttles and Circulators": "#000000",
  "Other": "#000000"
};

// CREATE AGENCY LAYERS
function createAgencyLayers(name, routeColor, stopColor, routeGeoJsonUrl, stopsCsvUrl) {
  const routesLayer = L.layerGroup();
  const stopsLayer = L.layerGroup();

  // LOAD ROUTES
  fetch(routeGeoJsonUrl)
    .then(response => response.json())
    .then(data => {
      const geoJsonLayer = L.geoJSON(data, {
        style: {
          color: routeColor,
          weight: 3,
          opacity: 0.8
        },
        onEachFeature: (feature, layer) => {
          const routeShort = feature.properties.route_short_name || '';
          const routeLong = feature.properties.route_long_name || '';
          const routeUrl = feature.properties.route_url || '';

          let popupContent = `<strong>${name}`;
          if (routeShort) popupContent += ` Route ${routeShort}`;
          if (routeLong) popupContent += ` - ${routeLong}`;
          popupContent += `</strong>`;
          if (routeUrl) popupContent += `<br><a href="${routeUrl}" target="_blank">More info</a>`;

          layer.bindPopup(popupContent);
        }
      });
      routesLayer.addLayer(geoJsonLayer);
    })
    .catch(err => console.error(`Error loading ${name} routes:`, err));

  // LOAD STOPS
  Papa.parse(stopsCsvUrl, {
    download: true,
    header: true,
    complete: function(results) {
      results.data.forEach(stop => {
        if (stop.stop_lat && stop.stop_lon) {
          const marker = L.circleMarker([parseFloat(stop.stop_lat), parseFloat(stop.stop_lon)], {
            radius: 4,
            fillColor: stopColor.fill || "#FFFFFF",
            color: stopColor.stroke || "#000000",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
          });

          let popupContent = `<b>${stop.stop_name || 'Stop'}</b>`;
          if (stop.stop_id) popupContent += `<br>ID: ${stop.stop_id}`;
          if (stop.stop_desc) popupContent += `<br>${stop.stop_desc}`;

          marker.bindPopup(popupContent);
          stopsLayer.addLayer(marker);
        }
      });
    },
    error: function(err) {
      console.error(`Error loading ${name} stops:`, err);
    }
  });

  return {
    routes: routesLayer,
    stops: stopsLayer,
    name: name
  };
}

// CREATE AGENCY LAYERS
const agencies = [
  // Metro (special case due - multiple route types)
  {
    name: "Metro",
    routes: L.layerGroup(),
    stops: L.layerGroup()
  },
  // OTHER AGENCIES
  createAgencyLayers(
    "Big Blue Bus",
    "#007bff",
    { fill: "#daf0ff", stroke: "#007bff" },
    "gtfs-leaflet-map/bbb_data/Big Blue Bus.geojson",
    "gtfs-leaflet-map/bbb_data/stops.txt"
  ),
  createAgencyLayers(
    "Antelope Valley Transit",
    "#008080",
    { fill: "#008080", stroke: "#007BA7" },
    "gtfs-leaflet-map/avta_data/AVTA.geojson",
    "gtfs-leaflet-map/avta_data/AVTA_stops.txt"
  ),
  createAgencyLayers(
    "Long Beach Transit",
    "#800020",
    { fill: "#FF2400", stroke: "#FFA500" },
    "gtfs-leaflet-map/lbt_data/Long Beach Transit.geojson",
    "gtfs-leaflet-map/lbt_data/stops.txt"
  ),
  createAgencyLayers(
    "Foothill Transit",
    "#58ea38",
    { fill: "#008080", stroke: "#007BA7" },
    "gtfs-leaflet-map/fht_data/Foothill Transit.geojson",
    "gtfs-leaflet-map/fht_data/stops.txt"
  ),
  createAgencyLayers(
    "Glendale Beeline",
    "#A52A2A",
    { fill: "#FFC0CB", stroke: "#964B00" },
    "gtfs-leaflet-map/gb_data/Glendale Beeline.geojson",
    "gtfs-leaflet-map/gb_data/stops.txt"
  ),
  createAgencyLayers(
    "Torrance Transit",
    "#A52A2A",
    { fill: "#FFC300", stroke: "#964B00" },
    "gtfs-leaflet-map/tt_data/TORRANCE TRANSIT SYSTEM.geojson",
    "gtfs-leaflet-map/tt_data/stops.txt"
  ),
  createAgencyLayers(
    "Montebello Bus",
    "#00008B",
    { fill: "#FFC300", stroke: "#0000FF" },
    "gtfs-leaflet-map/mb_data/Montebello Bus Lines.geojson",
    "gtfs-leaflet-map/mb_data/stops.txt"
  ),
  createAgencyLayers(
    "Norwalk Transit",
    "#DB7093",
    { fill: "#900C3F", stroke: "#FFFFFF" },
    "gtfs-leaflet-map/nwt_data/Norwalk Transit System.geojson",
    "gtfs-leaflet-map/nwt_data/stops.txt"
  ),
  createAgencyLayers(
    "Santa Clarita Transit",
    "#6C7B8C",
    { fill: "#6C7B8C", stroke: "#4682B4" },
    "gtfs-leaflet-map/sc_data/Santa_Clarita.geojson",
    "gtfs-leaflet-map/sc_data/stops.txt"
  )
];

// METRO STOPS
Papa.parse('gtfs-leaflet-map/metro_data/stops.txt', {
  download: true,
  header: true,
  complete: function(results) {
    results.data.forEach(stop => {
      if (stop.stop_lat && stop.stop_lon) {
        const marker = L.circleMarker([parseFloat(stop.stop_lat), parseFloat(stop.stop_lon)], {
          radius: 4,
          fillColor: "#f0a150",
          color: "#c76706",
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8
        }).bindPopup(`<b>${stop.stop_name}</b><br>ID: ${stop.stop_id}`);
        agencies[0].stops.addLayer(marker);
      }
    });
  },
  error: function(err) {
    console.error("Error loading Metro stops:", err);
  }
});

// METRO ROUTES
fetch('gtfs-leaflet-map/metro_data/Metro_Bus_Lines.geojson')
  .then(response => response.json())
  .then(data => {
    const busLinesLayer = L.geoJSON(data, {
      style: feature => {
        const busType = feature.properties.MetroBusType;
        const color = busTypeColors[busType] || busTypeColors["Other"];
        return { color, weight: 3, opacity: 0.7 };
      },
      onEachFeature: (feature, layer) => {
        const route = feature.properties.RouteName;
        const type = feature.properties.MetroBusType;
        layer.bindPopup(`<strong>${route}</strong><br>Type: ${type}`);
      }
    });
    agencies[0].routes.addLayer(busLinesLayer);
  })
  .catch(err => console.error("Error loading Metro routes:", err));

// CREATE OVERLAY GROUPS PER REGION
const regions = {
  "Metro": {
    "Metro Routes": agencies[0].routes,
    "Metro Stops": agencies[0].stops
  },
  "Western LA": {
    "Big Blue Bus Routes": agencies[1].routes,
    "Big Blue Bus Stops": agencies[1].stops
  },
  "San Gabriel Valley": {
    "Foothill Transit Routes": agencies[4].routes,
    "Foothill Transit Stops": agencies[4].stops,
    "Glendale Beeline Routes": agencies[5].routes,
    "Glendale Beeline Stops": agencies[5].stops,
    "Montebello Bus Routes": agencies[7].routes,
    "Montebello Bus Stops": agencies[7].stops
  },
  "South Bay": {
    "Long Beach Transit Routes": agencies[3].routes,
    "Long Beach Transit Stops": agencies[3].stops,
    "Torrance Transit Routes": agencies[6].routes,
    "Torrance Transit Stops": agencies[6].stops
  },
  "North County": {
    "Santa Clarita Transit Routes": agencies[9].routes,
    "Santa Clarita Transit Stops": agencies[9].stops,
    "Norwalk Transit Routes": agencies[8].routes,
    "Norwalk Transit Stops": agencies[8].stops
  },
  "Antelope Valley": {
    "Antelope Valley Transit Routes": agencies[2].routes,
    "Antelope Valley Transit Stops": agencies[2].stops
  }
};

// CUSTOM LAYER CONTROL WITH COLLAPSE FUNCTIONALITY
const LayerControl = L.Control.extend({
  options: {
    position: 'topright',
    collapsed: true
  },

  onAdd: function(map) {
    this._map = map;

    // Create container
    this._container = L.DomUtil.create('div', 'leaflet-control-layers collapsed');

    // Create toggle button
    this._toggleButton = L.DomUtil.create('a', 'leaflet-control-layers-toggle', this._container);
    this._toggleButton.href = '#';
    this._toggleButton.title = 'Layers';

    // Create expanded section
    this._section = L.DomUtil.create('section', 'leaflet-control-layers-expanded', this._container);

    // Add layers
    this._addLayers();

    // Add event listeners
    L.DomEvent.on(this._toggleButton, 'click', this._toggle, this);

    // Prevent map events when interacting with control
    L.DomEvent.disableClickPropagation(this._container);
    L.DomEvent.disableScrollPropagation(this._container);

    return this._container;
  },

  _addLayers: function() {
    // Add header
    const header = L.DomUtil.create('h4', '', this._section);
    header.innerHTML = 'Bus Routes & Stops';

    // Add overlays container
    const overlays = L.DomUtil.create('div', 'leaflet-control-layers-overlays', this._section);

    // Add regions and their layers
    Object.entries(regions).forEach(([regionName, layers]) => {
      const regionDiv = L.DomUtil.create('div', '', overlays);
      const regionHeader = L.DomUtil.create('strong', '', regionDiv);
      regionHeader.innerHTML = regionName;
      regionHeader.style.cursor = 'pointer';
      regionHeader.onclick = () => this._toggleRegion(regionDiv);

      const regionLayersDiv = L.DomUtil.create('div', '', regionDiv);
      regionLayersDiv.style.marginLeft = '10px';
      regionLayersDiv.style.display = 'none'; // Start collapsed

      Object.entries(layers).forEach(([layerName, layer]) => {
        const label = L.DomUtil.create('label', '', regionLayersDiv);
        const input = L.DomUtil.create('input', '', label);
        input.type = 'checkbox';
        input.checked = false;
        input.onchange = () => {
          if (input.checked) {
            map.addLayer(layer);
          } else {
            map.removeLayer(layer);
          }
        };

        const span = L.DomUtil.create('span', '', label);
        span.innerHTML = layerName;
      });
    });
  },

  _toggle: function() {
    if (this._container.classList.contains('collapsed')) {
      this._container.classList.remove('collapsed');
      // Show layer prompt when expanding
      document.getElementById('layerPrompt').classList.remove('show');
    } else {
      this._container.classList.add('collapsed');
    }
  },

  _toggleRegion: function(regionDiv) {
    const layersDiv = regionDiv.querySelector('div');
    if (layersDiv.style.display === 'none') {
      layersDiv.style.display = 'block';
    } else {
      layersDiv.style.display = 'none';
    }
  }
});

// Add custom layer control to map
const layerControl = new LayerControl();
map.addControl(layerControl);

// LEGEND
const legend = L.control({position: 'topleft'});

legend.onAdd = function(map) {
  const div = L.DomUtil.create('div', 'legend collapsed');

  div.innerHTML = `
    <h3 onclick="toggleLegend()">LA County Transit Agencies</h3>
    <h5>Toggle layers from the control panel</h5>

    <div class="legend-section">
      <h4 onclick="toggleLegendSection(this)">Metro</h4>
      <div class="legend-agency">
        <div><i style="background: #FF6600"></i> Local/Limited</div>
        <div><i style="background: #FF0000"></i> Rapid</div>
        <div><i style="background: #0000FF"></i> Express</div>
        <div><i style="background: #9C27B0"></i> Silver Line</div>
        <div><i style="background: #000000"></i> Shuttles</div>
        <div class="legend-service"><span class="circle" style="background: #f0a150"></span> Stops</div>
      </div>
    </div>

    <div class="legend-section">
      <h4 onclick="toggleLegendSection(this)">Western LA</h4>
      <div class="legend-agency">
        <div><i style="background: #007bff"></i> Big Blue Bus</div>
        <div class="legend-service"><span class="circle" style="background: #daf0ff"></span> Stops</div>
      </div>
    </div>

    <div class="legend-section">
      <h4 onclick="toggleLegendSection(this)">San Gabriel Valley</h4>
      <div class="legend-agency">
        <div><i style="background: #58ea38"></i> Foothill Transit</div>
        <div class="legend-service"><span class="circle" style="background: #008080"></span> Stops</div>
      </div>
      <div class="legend-agency">
        <div><i style="background: #A52A2A"></i> Glendale Beeline</div>
        <div class="legend-service"><span class="circle" style="background: #FFC0CB"></span> Stops</div>
      </div>
      <div class="legend-agency">
        <div><i style="background: #00008B"></i> Montebello Bus</div>
        <div class="legend-service"><span class="circle" style="background: #FFC300"></span> Stops</div>
      </div>
    </div>

    <div class="legend-section">
      <h4 onclick="toggleLegendSection(this)">South Bay</h4>
      <div class="legend-agency">
        <div><i style="background: #800020"></i> Long Beach Transit</div>
        <div class="legend-service"><span class="circle" style="background: #FF2400"></span> Stops</div>
      </div>
      <div class="legend-agency">
        <div><i style="background: #A52A2A"></i> Torrance Transit</div>
        <div class="legend-service"><span class="circle" style="background: #FFC300"></span> Stops</div>
      </div>
    </div>

    <div class="legend-section">
      <h4 onclick="toggleLegendSection(this)">North County</h4>
      <div class="legend-agency">
        <div><i style="background: #6C7B8C"></i> Santa Clarita Transit</div>
        <div class="legend-service"><span class="circle" style="background: #B0C4DE"></span> Stops</div>
      </div>
      <div class="legend-agency">
        <div><i style="background: #DB7093"></i> Norwalk Transit</div>
        <div class="legend-service"><span class="circle" style="background: #900C3F"></span> Stops</div>
      </div>
    </div>

    <div class="legend-section">
      <h4 onclick="toggleLegendSection(this)">Antelope Valley</h4>
      <div class="legend-agency">
        <div><i style="background: #008080"></i> Antelope Valley Transit</div>
        <div class="legend-service"><span class="circle" style="background: #008080"></span> Stops</div>
      </div>
    </div>
  `;

  return div;
};

legend.addTo(map);

// TOGGLE LEGEND
window.toggleLegend = function() {
  const legendDiv = document.querySelector('.legend');
  legendDiv.classList.toggle('collapsed');

  // Show legend prompt when expanding
  if (!legendDiv.classList.contains('collapsed')) {
    document.getElementById('legendPrompt').classList.add('show');
  } else {
    document.getElementById('legendPrompt').classList.remove('show');
  }
};

// TOGGLE LEGEND SECTIONS
window.toggleLegendSection = function(header) {
  header.classList.toggle('collapsed');
  const services = header.parentElement.querySelectorAll('.legend-service');

  services.forEach(service => {
    service.style.display = service.style.display === 'none' ? 'block' : 'none';
  });
};

// SHOW INITIAL PROMPTS
setTimeout(() => {
  document.getElementById('layerPrompt').classList.add('show');
  document.getElementById('legendPrompt').classList.add('show');

  // Auto-collapse all legend sections
  document.querySelectorAll('.legend h4').forEach(header => {
    header.click();
  });
}, 2000);

// HIDE LOADING WHEN ALL LOADED
Promise.all(agencies.map(agency => {
  return new Promise(resolve => {
    agency.routes.on('add', resolve);
    agency.stops.on('add', resolve);
  });
})).then(hideLoading);
