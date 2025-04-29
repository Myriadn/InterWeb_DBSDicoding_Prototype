import StoryDetailPresenter from "./story-detail-presenter";
import { showFormattedDate } from "../../utils";
import NavigationHelper from "../../utils/navigation-helper";

export default class StoryDetailPage {
  constructor() {
    this.presenter = new StoryDetailPresenter(this);
  }
  
  async render() {
    return `
      <section class="story-detail" id="main-content">
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <p>Loading story details...</p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    // Menggunakan NavigationHelper untuk pengaturan navigasi
    NavigationHelper.setupAuthenticatedNavigation();

    // Load story detail via presenter
    await this.presenter.loadStoryDetail();
  }

  displayStoryDetail(story) {
    const container = document.querySelector('.story-detail');
    if (!container) return;

    container.innerHTML = `
      <div class="detail-header">
        <h1>${story.name}'s Story</h1>
        <div class="meta-info">
          <span class="date">${showFormattedDate(story.createdAt)}</span>
          <span class="location">
            <i class="fas fa-map-marker-alt"></i>
            ${
              story.lat && story.lon
                ? `${story.lat}, ${story.lon}`
                : "Lokasi tidak tersedia"
            }
          </span>
        </div>
      </div>
      
      <div class="content-grid">
        <div class="image-container">
          <img src="${story.photoUrl}" alt="${story.description}">
        </div>
        
        <div class="description-card">
          <h2>Story Description</h2>
          <p>${story.description}</p>
        </div>
        
        ${
          story.lat && story.lon
            ? `
        <div class="map-card">
          <h2>Story Location</h2>
          <div id="map"></div>
        </div>
        `
            : ""
        }
      </div>
      
      <div class="story-actions">
        <a href="#/" class="btn-back">
          <i class="fas fa-arrow-left"></i> Back to Stories
        </a>
      </div>
    `;
  }

  initMap(story) {
    const mapElement = document.getElementById("map");
    if (!mapElement) return;

    try {
      const map = L.map("map").setView([story.lat, story.lon], 13);

      // Base layers (Tile layers)
      // OpenStreetMap layer - default
      const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // OpenTopoMap layer
      const topo = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://opentopomap.org">OpenTopoMap</a> contributors',
        maxZoom: 17,
      });

      // ESRI Satellite layer
      const esriSatellite = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
          attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
          maxZoom: 18,
        }
      );

      // Carto Voyager layer
      const cartoVoyager = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
          attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
          maxZoom: 20,
        }
      );

      // Carto Dark layer
      const cartoDark = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
          attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
          maxZoom: 19,
        }
      );
      
      // Overlay layers
      const openSeaMap = L.tileLayer(
        "https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openseamap.org/">OpenSeaMap</a>',
          maxZoom: 18,
        }
      );
      
      const publicTransport = L.tileLayer(
        "https://www.openptmap.org/tiles/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openptmap.org/">OpenPtMap</a>',
          maxZoom: 17,
          opacity: 0.7,
        }
      );

      // Marker with popup
      L.marker([story.lat, story.lon])
        .addTo(map)
        .bindPopup(`<b>${story.name}</b><br>${story.description}`)
        .openPopup();

      // Add circle to highlight the area
      L.circle([story.lat, story.lon], {
        color: '#3498db',
        fillColor: '#3498db',
        fillOpacity: 0.2,
        radius: 500
      }).addTo(map);

      // Layer control
      const baseMaps = {
        "OpenStreetMap": osm,
        "OpenTopoMap": topo,
        "Satellite": esriSatellite,
        "Carto Voyager": cartoVoyager,
        "Carto Dark": cartoDark
      };

      const overlayMaps = {
        "Nautical Information": openSeaMap,
        "Public Transport": publicTransport
      };

      L.control.layers(baseMaps, overlayMaps, { collapsed: true }).addTo(map);
      
      // Add scale
      L.control.scale({ imperial: false, metric: true }).addTo(map);
      
    } catch (error) {
      console.error("Error initializing map:", error);
    }
  }

  showError(message) {
    const container = document.querySelector('.story-detail');
    if (!container) return;

    container.innerHTML = `
      <section class="container" id="error-content">
        <div class="error-container">
          <i class="fas fa-exclamation-triangle"></i>
          <p class="error">Error: ${message}</p>
          <a href="#/" class="btn-primary">Kembali ke Beranda</a>
        </div>
      </section>
    `;
  }
}
