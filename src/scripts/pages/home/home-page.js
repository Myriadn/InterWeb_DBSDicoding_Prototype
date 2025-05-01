// src/scripts/pages/home/home-page.js
import HomePresenter from "./home-presenter";
import NavigationHelper from "../../utils/navigation-helper";
import NotificationHelper from "../../utils/notification-helper";
import IdbHelper from "../../utils/idb/idb-helper";

export default class HomePage {
  constructor() {
    this.presenter = new HomePresenter(this);
    this._isOnline = navigator.onLine;
    this._savedStoryIds = new Set(); // To track saved stories
  }

  async render() {
    // Get username from localStorage
    const userName = localStorage.getItem("userName");

    // Cek apakah notifikasi didukung
    const notificationSupported = NotificationHelper.isPushNotificationSupported();

    return `
      <section class="container" id="main-content">
        <div class="welcome-user">
          <h2><i class="fas fa-user"></i> Selamat datang, ${
            userName || "User"
          }!</h2>
        </div>
        ${notificationSupported ? `
          <div class="notification-container">
            <button id="btnSubscription" class="btn-subscribe">
              <i class="fas fa-bell"></i> <span id="subscriptionStatus">Aktifkan Notifikasi Cerita Baru</span>
            </button>
          </div>
        ` : ''}
        <h1>Daftar Story</h1>
        
        <!-- App Shell untuk menampilkan konten saat loading atau offline -->
        <div id="story-list" class="content-loading">
          <div class="app-shell-skeleton"></div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    // Menggunakan NavigationHelper untuk pengaturan navigasi
    NavigationHelper.setupAuthenticatedNavigation();

    // Setup subscription button
    this._setupSubscriptionButton();
    
    // Setup online/offline handler
    this._setupOnlineOfflineHandler();

    // Get all saved story IDs for displaying save/unsave status
    await this._loadSavedStoryIds();

    // Load stories
    this.presenter.loadStories();
  }

  _setupSubscriptionButton() {
    const btnSubscription = document.getElementById('btnSubscription');
    if (!btnSubscription) return;

    // Pertama, sinkronkan status subscription dengan kondisi browser yang sebenarnya
    NotificationHelper.syncSubscriptionStatus().then(async () => {
      // Perbarui tampilan UI tombol sesuai status
      this._updateSubscriptionButtonUI();

      // Periksa izin notifikasi saat ini dan pesan yang ditampilkan
      const currentPermission = NotificationHelper.getNotificationPermissionStatus();
      if (currentPermission === 'denied') {
        this._showNotification('Izin notifikasi ditolak oleh browser. Ubah pengaturan browser Anda untuk mengizinkan notifikasi');
      }
    });

    // Tambah event listener untuk button
    btnSubscription.addEventListener('click', async () => {
      try {
        btnSubscription.disabled = true; // Nonaktifkan tombol untuk mencegah multiple klik
        
        const isSubscribed = NotificationHelper.isUserSubscribed();
        
        if (isSubscribed) {
          // User ingin unsubscribe
          const result = await NotificationHelper.unsubscribePushNotification();
          this._showNotification(result.message);
        } else {
          // User ingin subscribe
          const registration = await NotificationHelper.registerServiceWorker();
          if (!registration) {
            this._showNotification('Gagal mendaftarkan service worker');
            btnSubscription.disabled = false;
            return;
          }
          
          const result = await NotificationHelper.subscribePushNotification(registration);
          this._showNotification(result.message);
          
          // Jika permintaan izin diabaikan, tampilkan petunjuk
          if (NotificationHelper.getNotificationPermissionStatus() === 'default') {
            this._showNotification('Anda mengabaikan permintaan izin notifikasi. Klik tombol lagi untuk mencoba.');
          }
        }
      } catch (error) {
        console.error("Error in subscription toggle:", error);
        this._showNotification('Terjadi kesalahan: ' + error.message);
      } finally {
        // Perbarui status dan aktifkan tombol kembali
        await NotificationHelper.syncSubscriptionStatus();
        this._updateSubscriptionButtonUI();
        btnSubscription.disabled = false;
      }
    });
  }

  _setupOnlineOfflineHandler() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this._isOnline = true;
      this._showNotification('Anda kembali online. Menyegarkan data...');
      
      // Reload data when back online
      this.presenter.loadStories();
    });
    
    window.addEventListener('offline', () => {
      this._isOnline = false;
      this._showNotification('Anda sedang offline. Data yang ditampilkan mungkin tidak terbaru.');
    });
  }

  _updateSubscriptionButtonUI() {
    const btnSubscription = document.getElementById('btnSubscription');
    const subscriptionStatus = document.getElementById('subscriptionStatus');
    if (!btnSubscription || !subscriptionStatus) return;

    const isSubscribed = NotificationHelper.isUserSubscribed();
    const notificationPermission = NotificationHelper.getNotificationPermissionStatus();
    
    // Reset tombol terlebih dahulu
    btnSubscription.classList.remove('subscribed', 'btn-subscribe', 'btn-unsubscribe', 'disabled');
    
    // Jika browser tidak support notifikasi atau izin ditolak
    if (notificationPermission === 'not-supported') {
      btnSubscription.classList.add('disabled');
      btnSubscription.disabled = true;
      subscriptionStatus.textContent = 'Notifikasi tidak didukung di browser ini';
      return;
    }
    
    if (notificationPermission === 'denied') {
      btnSubscription.classList.add('disabled');
      btnSubscription.disabled = true;
      subscriptionStatus.textContent = 'Notifikasi ditolak (Ubah pengaturan browser)';
      return;
    }
    
    if (isSubscribed) {
      btnSubscription.classList.add('subscribed');
      btnSubscription.classList.add('btn-unsubscribe');
      subscriptionStatus.textContent = 'Notifikasi Aktif (Klik untuk nonaktifkan)';
    } else {
      btnSubscription.classList.add('btn-subscribe');
      subscriptionStatus.textContent = 'Aktifkan Notifikasi Cerita Baru';
    }
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

  displayStories(stories) {
    const container = document.getElementById("story-list");
    if (!container) return;

    // Remove loading skeleton
    container.classList.remove('content-loading');

    if (!stories || stories.length === 0) {
      this.showEmptyState();
      return;
    }

    container.innerHTML = stories
      .map(
        (story) => {
          // Check if this story is already saved
          const isSaved = this._savedStoryIds.has(story.id);
          const saveButtonText = isSaved ? 'Hapus dari Tersimpan' : 'Simpan Story';
          const saveButtonIcon = isSaved ? 'fa-trash' : 'fa-bookmark';
          const saveButtonClass = isSaved ? 'unsave-button' : 'save-button';
          
          return `
            <div class="story-item">
              ${isSaved ? `
                <div class="saved-indicator">
                  <i class="fas fa-bookmark"></i>
                </div>
              ` : ''}
              <img src="${story.photoUrl}" 
                  alt="Foto oleh ${story.name}: ${story.description}"
                  loading="lazy"
                  onerror="this.onerror=null; this.src='/images/icons/icon-192x192.png'; this.alt='Gambar tidak tersedia saat offline';">
              <h2>${story.name}</h2>
              <p>${story.description}</p>
              <p class="created-at"><i class="fas fa-calendar"></i> ${this.formatDate(
                story.createdAt
              )}</p>
              ${
                story.lat && story.lon
                  ? this._isOnline 
                    ? `<div class="mini-map" 
                        data-lat="${story.lat}" 
                        data-lon="${story.lon}"></div>`
                    : `<div class="offline-map-placeholder">
                        <i class="fas fa-map-marker-alt"></i> Lokasi: ${story.lat.toFixed(4)}, ${story.lon.toFixed(4)}
                        <p>Peta tidak tersedia saat offline</p>
                      </div>`
                  : ""
              }
              <div class="story-action">
                <a href="#/story/${story.id}" class="detail-button">Lihat Detail</a>
                <button class="${saveButtonClass}" data-id="${story.id}" data-saved="${isSaved}">
                  <i class="fas ${saveButtonIcon}"></i> ${saveButtonText}
                </button>
              </div>
            </div>
          `;
        }
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
        justify-content: space-between;
        gap: 10px;
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

      .save-button, .unsave-button {
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.3s ease;
        border: none;
      }
      
      .save-button {
        background-color: #27ae60;
        color: white;
      }
      
      .save-button:hover {
        background-color: #219853;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      }
      
      .unsave-button {
        background-color: #e74c3c;
        color: white;
      }
      
      .unsave-button:hover {
        background-color: #c0392b;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      }
      
      .saved-indicator {
        position: absolute;
        top: 12px;
        right: 12px;
        background-color: rgba(52, 152, 219, 0.9);
        color: white;
        padding: 5px 10px;
        border-radius: 20px;
        font-size: 0.8rem;
        display: flex;
        align-items: center;
        gap: 5px;
      }

      .notification-container {
        margin: 20px 0;
        display: flex;
        justify-content: center;
      }

      .btn-subscribe, .btn-unsubscribe {
        padding: 10px 20px;
        border-radius: 50px;
        border: none;
        cursor: pointer;
        font-size: 16px;
        display: flex;
        align-items: center;
        gap: 10px;
        transition: all 0.3s ease;
      }

      .btn-subscribe {
        background-color: #3498db;
        color: white;
        box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
      }

      .btn-subscribe:hover {
        background-color: #2980b9;
        transform: translateY(-2px);
        box-shadow: 0 5px 10px rgba(0, 0, 0, 0.15);
      }

      .btn-unsubscribe {
        background-color: #e74c3c;
        color: white;
      }

      .btn-unsubscribe:hover {
        background-color: #c0392b;
        transform: translateY(-2px);
        box-shadow: 0 5px 10px rgba(0, 0, 0, 0.15);
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
      
      .offline-map-placeholder {
        background-color: #f8f9fa;
        border: 1px dashed #ccc;
        padding: 15px;
        border-radius: 6px;
        text-align: center;
        margin-bottom: 20px;
      }
      
      .offline-map-placeholder i {
        color: #3498db;
        margin-right: 5px;
      }
      
      .offline-map-placeholder p {
        margin-top: 10px;
        font-size: 0.9em;
        color: #666;
      }
    `;
    document.head.appendChild(styleElement);

    // Add event listeners for save/unsave buttons
    this._setupSaveButtons();

    // Inisialisasi peta SETELAH DOM di-update jika online
    if (this._isOnline) {
      this.initMiniMaps();
    }
  }

  // Setup save/unsave buttons functionality
  _setupSaveButtons() {
    try {
      // Tunggu sesaat untuk memastikan DOM telah sepenuhnya dirender
      setTimeout(() => {
        // Add event listeners for save buttons
        document.querySelectorAll('.save-button, .unsave-button').forEach(button => {
          button.addEventListener('click', async (e) => {
            try {
              const storyId = e.currentTarget.dataset.id;
              const isSaved = e.currentTarget.dataset.saved === 'true';
              
              // Get the story information from the API or the DOM
              const storyElement = e.currentTarget.closest('.story-item');
              if (!storyElement) return;
              
              // Dapatkan data dengan cara yang lebih defensif
              let storyName = '';
              let storyDescription = '';
              let storyImage = '';
              let createdAt = '';
              
              const nameElement = storyElement.querySelector('h2');
              if (nameElement) storyName = nameElement.textContent;
              
              const descElement = storyElement.querySelector('p:not(.created-at)');
              if (descElement) storyDescription = descElement.textContent;
              
              const imgElement = storyElement.querySelector('img');
              if (imgElement) storyImage = imgElement.src;
              
              const dateElement = storyElement.querySelector('.created-at');
              if (dateElement) createdAt = dateElement.textContent;
              
              // Get map data if available
              const mapElement = storyElement.querySelector('.mini-map');
              let lat = null;
              let lon = null;
              
              if (mapElement) {
                if (mapElement.dataset.lat) lat = parseFloat(mapElement.dataset.lat);
                if (mapElement.dataset.lon) lon = parseFloat(mapElement.dataset.lon);
              }
              
              if (isSaved) {
                // Delete story from IndexedDB
                await IdbHelper.deleteSavedStory(storyId);
                this._showNotification('Story berhasil dihapus dari tersimpan');
                
                // Update button (dengan handling yang lebih defensif)
                if (e.currentTarget) {
                  e.currentTarget.innerHTML = '<i class="fas fa-bookmark"></i> Simpan Story';
                  e.currentTarget.classList.remove('unsave-button');
                  e.currentTarget.classList.add('save-button');
                  e.currentTarget.dataset.saved = 'false';
                }
                
                // Remove saved indicator
                const savedIndicator = storyElement.querySelector('.saved-indicator');
                if (savedIndicator) {
                  savedIndicator.remove();
                }
                
                // Remove ID from saved IDs set
                this._savedStoryIds.delete(storyId);
                
              } else {
                // Create story object to save
                const story = {
                  id: storyId,
                  name: storyName,
                  description: storyDescription,
                  photoUrl: storyImage,
                  createdAt: new Date().toISOString(), // Since we don't have actual date from DOM
                  lat: lat,
                  lon: lon
                };
                
                // Save story to IndexedDB
                await IdbHelper.saveStory(story);
                this._showNotification('Story berhasil disimpan');
                
                // Update button (dengan handling yang lebih defensif)
                if (e.currentTarget) {
                  e.currentTarget.innerHTML = '<i class="fas fa-trash"></i> Hapus dari Tersimpan';
                  e.currentTarget.classList.remove('save-button');
                  e.currentTarget.classList.add('unsave-button');
                  e.currentTarget.dataset.saved = 'true';
                }
                
                // Add saved indicator
                if (!storyElement.querySelector('.saved-indicator')) {
                  const savedIndicator = document.createElement('div');
                  savedIndicator.className = 'saved-indicator';
                  savedIndicator.innerHTML = '<i class="fas fa-bookmark"></i>';
                  storyElement.prepend(savedIndicator);
                }
                
                // Add ID to saved IDs set
                this._savedStoryIds.add(storyId);
              }
            } catch (error) {
              console.error('Error handling save/unsave action:', error);
              this._showNotification('Terjadi kesalahan saat menyimpan/menghapus story');
            }
          });
        });
      }, 100); // Memberikan sedikit delay untuk DOM rendering
    } catch (error) {
      console.error('Error setting up save buttons:', error);
    }
  }

  showEmptyState() {
    const container = document.getElementById("story-list");
    if (!container) return;

    // Remove loading skeleton
    container.classList.remove('content-loading');

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

          // Ganti marker icon dengan icon map marker dari file
          const marker = L.marker([lat, lon], {
            title: `Location: ${parseFloat(lat).toFixed(4)}, ${parseFloat(lon).toFixed(4)}`,
            alt: 'Story Location',
            icon: L.icon({
              iconUrl: '/images/icons/map_marker_x32.png',
              iconSize: [32, 32],
              iconAnchor: [16, 32],
              popupAnchor: [0, -28],
            })
          }).addTo(miniMap);
          
          // Buat konten popup sederhana
          const popupContent = `
            <div class="location-popup">
              <strong>Lokasi Story</strong><br>
              Koordinat: ${parseFloat(lat).toFixed(4)}, ${parseFloat(lon).toFixed(4)}
            </div>
          `;
          
          // Siapkan popup dengan konten yang sudah disusun
          const popup = L.popup({
            closeButton: false,
            autoClose: false,
            closeOnEscapeKey: false,
            closeOnClick: false,
            className: 'custom-popup'
          }).setContent(popupContent);
          
          // Tambahkan popup ke marker
          marker.bindPopup(popup);

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
                
                // Efek hover
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
              
              // Style untuk simbol + dan -
              const symbols = container.querySelectorAll('.zoom-symbol');
              symbols.forEach(symbol => {
                symbol.style.cssText = `
                  font-size: 22px;
                  font-weight: bold;
                  line-height: 1;
                `;
              });
              
              // Tambahkan event click
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
          
          // Tambahkan kontrol ke peta
          miniMap.addControl(new customZoomControl());

          // Tampilkan popup saat mouse hover
          mapEl.addEventListener('mouseenter', () => {
            marker.openPopup();
          });
          
          // Tutup popup saat mouse leave
          mapEl.addEventListener('mouseleave', () => {
            // Delay popup close untuk animasi yang lebih halus
            setTimeout(() => marker.closePopup(), 300);
          });

          // Invalidate size setelah DOM sepenuhnya dirender
          setTimeout(() => {
            miniMap.invalidateSize();
            // Buka popup sebentar lalu tutup untuk mencegah glitch
            marker.openPopup();
            setTimeout(() => marker.closePopup(), 100);
          }, 500);

          // Add scale
          L.control.scale({ 
            imperial: false, 
            metric: true,
            position: 'bottomleft',
            maxWidth: 100
          }).addTo(miniMap);

          // Tambahkan style untuk marker dan popup
          const mapStyle = document.createElement('style');
          mapStyle.textContent = `
            .custom-div-icon {
              background-color: #2196F3; /* Warna biru yang lebih sesuai dengan gambar */
              border-radius: 50%;
              box-shadow: 0 0 0 2px white; /* Border putih di sekitar marker */
              border: none;
            }

            .marker-pin {
              width: 100%;
              height: 100%;
              border-radius: 50%;
            }

            /* Style untuk popup seperti pada gambar */
            .custom-popup .leaflet-popup-content-wrapper {
              background-color: white;
              border-radius: 4px;
              box-shadow: 0 2px 5px rgba(0,0,0,0.2);
              padding: 0;
              border: none;
            }
            
            .custom-popup .leaflet-popup-tip {
              background-color: white;
            }
            
            .location-popup {
              padding: 8px 10px;
              font-family: Arial, sans-serif;
            }
            
            .location-popup .popup-title {
              color: #673ab7; /* Warna ungu seperti pada gambar */
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 2px;
            }

            .location-popup .popup-subtitle {
              font-size: 13px;
              color: #444;
            }
            
            /* Sembunyikan close button seperti pada gambar */
            .leaflet-popup-close-button {
              display: none;
            }
          `;
          document.head.appendChild(mapStyle);

          // Tambahkan style untuk inisialisasi peta
          mapEl.style.height = "200px";
          mapEl.style.borderRadius = "8px";
          mapEl.style.marginTop = "15px";
          mapEl.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
          mapEl.style.border = "1px solid #e0e0e0";
          mapEl.style.position = "relative";
          mapEl.style.overflow = "hidden";

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

    // Remove loading skeleton
    container.classList.remove('content-loading');
    
    // Show offline message instead of generic error if offline
    if (!this._isOnline) {
      container.innerHTML = `
        <div class="offline-state">
          <i class="fas fa-wifi-slash fa-3x"></i>
          <h3>Anda sedang offline</h3>
          <p>Tidak dapat memuat data baru saat ini. Periksa koneksi internet Anda dan coba lagi.</p>
        </div>
      `;
    } else {
      container.innerHTML = `<p class="error">⛔ ${message}</p>`;
    }
  }

  // New method to load saved story IDs
  async _loadSavedStoryIds() {
    try {
      const savedStories = await IdbHelper.getAllSavedStories();
      this._savedStoryIds = new Set(savedStories.map(story => story.id));
      return this._savedStoryIds;
    } catch (error) {
      console.error('Error loading saved story IDs:', error);
      return new Set();
    }
  }
}
