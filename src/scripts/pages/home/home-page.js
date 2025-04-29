// src/scripts/pages/home/home-page.js
import HomePresenter from "./home-presenter";
import NavigationHelper from "../../utils/navigation-helper";

export default class HomePage {
  constructor() {
    this.presenter = new HomePresenter(this);
  }

  async render() {
    // Get username from localStorage
    const userName = localStorage.getItem("userName");

    return `
      <section class="container" id="main-content">
        <div class="welcome-user">
          <h2><i class="fas fa-user"></i> Selamat datang, ${
            userName || "User"
          }!</h2>
        </div>
        <h1>Daftar Story</h1>
        <div id="story-list"></div>
      </section>
    `;
  }

  async afterRender() {
    // Menggunakan NavigationHelper untuk pengaturan navigasi
    NavigationHelper.setupAuthenticatedNavigation();

    // Load stories
    this.presenter.loadStories();
  }

  displayStories(stories) {
    const container = document.getElementById("story-list");
    if (!container) return;

    container.innerHTML = stories
      .map(
        (story) => `
      <div class="story-item">
        <img src="${story.photoUrl}" 
             alt="Foto oleh ${story.name}: ${story.description}"
             loading="lazy">
        <h2>${story.name}</h2>
        <p>${story.description}</p>
        <p class="created-at"><i class="fas fa-calendar"></i> ${this.formatDate(
          story.createdAt
        )}</p>
        ${
          story.lat && story.lon
            ? `<div class="mini-map" 
                   data-lat="${story.lat}" 
                   data-lon="${story.lon}"></div>`
            : ""
        }
        <div class="story-action">
          <a href="#/story/${story.id}" class="detail-button">Lihat Detail</a>
        </div>
      </div>
    `
      )
      .join("");

    // Tambahkan style untuk komponen story
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .story-item {
        display: flex;
        flex-direction: column;
        margin-bottom: 30px;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        position: relative;
      }
      
      .story-item img {
        width: 100%;
        border-radius: 6px;
        margin-bottom: 15px;
        max-height: 300px;
        object-fit: cover;
      }
      
      .story-item h2 {
        margin-bottom: 10px;
      }
      
      .story-item p {
        margin-bottom: 12px;
      }
      
      .created-at {
        color: #777;
        font-size: 0.9em;
        margin-bottom: 15px;
      }
      
      .mini-map {
        margin-bottom: 20px;
      }
      
      .story-action {
        margin-top: 16px;
        display: flex;
        justify-content: flex-end;
      }
      
      .detail-button {
        display: inline-block;
        background-color: #3498db;
        color: white;
        padding: 8px 16px;
        border-radius: 4px;
        text-decoration: none;
        font-weight: 500;
        transition: background-color 0.3s, transform 0.2s;
      }
      
      .detail-button:hover {
        background-color: #2980b9;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      }
    `;
    document.head.appendChild(styleElement);

    // Inisialisasi peta SETELAH DOM di-update
    this.initMiniMaps();
  }

  showEmptyState() {
    const container = document.getElementById("story-list");
    if (!container) return;

    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-scroll fa-3x"></i>
        <h3>Belum ada story</h3>
        <p>Jadilah yang pertama menambahkan story!</p>
        <a href="#/add-story" class="btn-primary">
          <i class="fas fa-plus"></i> Tambah Story Baru
        </a>
      </div>
    `;
  }

  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  initMiniMaps() {
    document.querySelectorAll(".mini-map").forEach((mapEl) => {
      const lat = mapEl.dataset.lat;
      const lon = mapEl.dataset.lon;

      if (lat && lon) {
        try {
          const miniMap = L.map(mapEl, {
            zoomControl: false, 
            attributionControl: false,
          }).setView([lat, lon], 13);

          // Base layers
          const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            minZoom: 5,
          }).addTo(miniMap);

          const esriSatellite = L.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
              maxZoom: 18,
              minZoom: 5,
            }
          );

          const cartoVoyager = L.tileLayer(
            "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
              maxZoom: 20,
              minZoom: 5,
            }
          );

          const baseMaps = {
            "OpenStreetMap": osm,
            "Satellite": esriSatellite,
            "Carto": cartoVoyager
          };

          // Add a marker with popup
          const marker = L.marker([lat, lon]).addTo(miniMap);
          
          // Custom compact layer control
          const layerControl = L.control.layers(baseMaps, {}, {
            collapsed: true,
            position: 'topright'
          }).addTo(miniMap);

          const customZoomControl = L.Control.extend({
            options: {
              position: 'topleft'
            },
            
            onAdd: function(map) {
              const container = L.DomUtil.create('div', 'custom-zoom-control');
              container.innerHTML = `
                <div class="zoom-button zoom-in" title="Zoom In">
                  <span class="zoom-symbol">+</span>
                </div>
                <div class="zoom-button zoom-out" title="Zoom Out">
                  <span class="zoom-symbol">−</span>
                </div>
              `;
              
              container.style.cssText = `
                background: white;
                padding: 5px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.15);
                margin-top: 10px;
                margin-left: 10px;
              `;
              
              const buttons = container.querySelectorAll('.zoom-button');
              buttons.forEach(button => {
                button.style.cssText = `
                  width: 32px;
                  height: 32px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  cursor: pointer;
                  margin: 5px 0;
                  border-radius: 4px;
                  transition: all 0.2s ease;
                  background-color: white;
                  color: #3498db;
                  font-size: 20px;
                  font-weight: bold;
                `;
                
                // Efectos hover
                button.addEventListener('mouseover', function() {
                  this.style.backgroundColor = '#3498db';
                  this.style.color = 'white';
                  this.style.transform = 'translateY(-2px)';
                  this.style.boxShadow = '0 3px 5px rgba(0,0,0,0.2)';
                });
                
                button.addEventListener('mouseout', function() {
                  this.style.backgroundColor = 'white';
                  this.style.color = '#3498db';
                  this.style.transform = 'translateY(0)';
                  this.style.boxShadow = 'none';
                });
              });
              
              // Estilo específico para los símbolos + y -
              const symbols = container.querySelectorAll('.zoom-symbol');
              symbols.forEach(symbol => {
                symbol.style.cssText = `
                  font-size: 22px;
                  font-weight: bold;
                  line-height: 1;
                `;
              });
              
              // Agregar eventos de clic
              const zoomIn = container.querySelector('.zoom-in');
              const zoomOut = container.querySelector('.zoom-out');
              
              L.DomEvent.on(zoomIn, 'click', L.DomEvent.stopPropagation)
                .on(zoomIn, 'click', L.DomEvent.preventDefault)
                .on(zoomIn, 'click', function() {
                  map.zoomIn(1);
                  zoomIn.style.transform = 'scale(0.9)';
                  setTimeout(() => { zoomIn.style.transform = ''; }, 100);
                });
                
              L.DomEvent.on(zoomOut, 'click', L.DomEvent.stopPropagation)
                .on(zoomOut, 'click', L.DomEvent.preventDefault)
                .on(zoomOut, 'click', function() {
                  map.zoomOut(1);
                  zoomOut.style.transform = 'scale(0.9)';
                  setTimeout(() => { zoomOut.style.transform = ''; }, 100);
                });
                
              return container;
            }
          });
          
          // Agregar los controles personalizados al mapa
          miniMap.addControl(new customZoomControl());

          // Add hover effect to show popup
          mapEl.addEventListener('mouseenter', () => {
            marker.bindPopup(`Location: ${lat.substring(0, 6)}, ${lon.substring(0, 6)}`).openPopup();
          });

          // Invalidate size to ensure proper rendering
          setTimeout(() => {
            miniMap.invalidateSize();
          }, 100);

          // Add scale
          L.control.scale({ 
            imperial: false, 
            metric: true,
            position: 'bottomleft',
            maxWidth: 100
          }).addTo(miniMap);

          // Tambahkan style untuk inisialisasi peta
          mapEl.style.height = "200px";
          mapEl.style.borderRadius = "8px";
          mapEl.style.marginTop = "15px";
          mapEl.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
          mapEl.style.border = "1px solid #e0e0e0";

        } catch (error) {
          console.error("Error initializing mini map:", error);
          mapEl.innerHTML = '<div class="map-error">Failed to load map</div>';
          mapEl.style.height = "50px";
          mapEl.style.display = "flex";
          mapEl.style.alignItems = "center";
          mapEl.style.justifyContent = "center";
          mapEl.style.background = "#ffdddd";
          mapEl.style.color = "#ff5555";
          mapEl.style.fontWeight = "bold";
        }
      }
    });
  }

  showError(message) {
    const container = document.getElementById("story-list");
    if (!container) return;

    container.innerHTML = `<p class="error">⛔ ${message}</p>`;
  }
}
