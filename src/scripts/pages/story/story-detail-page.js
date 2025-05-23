import StoryDetailPresenter from "./story-detail-presenter";
import { showFormattedDate } from "../../utils";
import NavigationHelper from "../../utils/navigation-helper";
import IdbHelper from "../../utils/idb/idb-helper";

export default class StoryDetailPage {
  constructor() {
    this.presenter = new StoryDetailPresenter(this);
    this._isStorySaved = false;
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

  async displayStoryDetail(story) {
    const container = document.querySelector('.story-detail');
    if (!container) return;

    // Check if story is already saved
    this._isStorySaved = await IdbHelper.isStorySaved(story.id);
    
    // Prepare save/unsave button text and icon
    const saveButtonText = this._isStorySaved ? 'Hapus dari Tersimpan' : 'Simpan Story';
    const saveButtonIcon = this._isStorySaved ? 'fa-trash' : 'fa-bookmark';
    const saveButtonClass = this._isStorySaved ? 'btn-unsave' : 'btn-save';

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
        <button id="save-story-button" class="${saveButtonClass}">
          <i class="fas ${saveButtonIcon}"></i> ${saveButtonText}
        </button>
      </div>
    `;

    // Add CSS styles for save button
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .story-actions {
        display: flex;
        justify-content: space-between;
        margin-top: 20px;
      }
      
      .btn-save, .btn-unsave {
        padding: 10px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.3s ease;
        border: none;
      }
      
      .btn-save {
        background-color: #3498db;
        color: white;
      }
      
      .btn-save:hover {
        background-color: #2980b9;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      }
      
      .btn-unsave {
        background-color: #e74c3c;
        color: white;
      }
      
      .btn-unsave:hover {
        background-color: #c0392b;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      }
      
      .toast-notification {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #2ecc71;
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        opacity: 1;
        transition: opacity 0.3s ease, transform 0.3s ease;
      }

      .toast-notification.hidden {
        opacity: 0;
        transform: translate(-50%, 20px);
      }
    `;
    document.head.appendChild(styleElement);
    
    // Add event listener for save/unsave button
    this._setupSaveButtonListener(story);

    // Initialize map if coordinates are available
    if (story.lat && story.lon) {
      this.initMap(story);
    }
  }

  _setupSaveButtonListener(story) {
    const saveButton = document.getElementById('save-story-button');
    if (!saveButton) return;
    
    saveButton.addEventListener('click', async () => {
      try {
        if (this._isStorySaved) {
          // If story is already saved, remove it from IndexedDB
          await IdbHelper.deleteSavedStory(story.id);
          this._showNotification('Story berhasil dihapus dari tersimpan');
          
          // Update button to "Save Story"
          saveButton.innerHTML = '<i class="fas fa-bookmark"></i> Simpan Story';
          saveButton.classList.remove('btn-unsave');
          saveButton.classList.add('btn-save');
          
          this._isStorySaved = false;
        } else {
          // If story is not saved, save it to IndexedDB
          await IdbHelper.saveStory(story);
          this._showNotification('Story berhasil disimpan');
          
          // Update button to "Unsave Story"
          saveButton.innerHTML = '<i class="fas fa-trash"></i> Hapus dari Tersimpan';
          saveButton.classList.remove('btn-save');
          saveButton.classList.add('btn-unsave');
          
          this._isStorySaved = true;
        }
      } catch (error) {
        console.error('Error toggling story save state:', error);
        this._showNotification('Terjadi kesalahan saat menyimpan story');
      }
    });
  }

  _showNotification(message) {
    try {
      // Tambahkan elemen notifikasi jika belum ada
      let notificationEl = document.querySelector('.toast-notification');
      if (!notificationEl) {
        notificationEl = document.createElement('div');
        notificationEl.className = 'toast-notification hidden';
        document.body.appendChild(notificationEl);
      }

      // Pastikan elemen sudah di-append ke DOM sebelum dimanipulasi
      setTimeout(() => {
        if (notificationEl) {
          notificationEl.textContent = message;
          notificationEl.classList.remove('hidden');
          
          // Hilangkan setelah 3 detik
          setTimeout(() => {
            if (notificationEl) {
              notificationEl.classList.add('hidden');
            }
          }, 3000);
        }
      }, 0);
    } catch (error) {
      console.error('Error showing notification:', error);
    }
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
