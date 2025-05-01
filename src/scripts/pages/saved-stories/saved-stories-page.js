// src/scripts/pages/saved-stories/saved-stories-page.js
import SavedStoriesPresenter from "./saved-stories-presenter";
import NavigationHelper from "../../utils/navigation-helper";
import NotificationHelper from "../../utils/notification-helper";

export default class SavedStoriesPage {
  constructor() {
    this.presenter = new SavedStoriesPresenter(this);
    this._isOnline = navigator.onLine;
  }

  async render() {
    return `
      <section class="container saved-stories-container" id="main-content">
        <div class="page-header">
          <h1><i class="fas fa-bookmark"></i> Story Tersimpan</h1>
          <p class="subtitle">Daftar story yang Anda simpan untuk dibaca nanti</p>
        </div>
        
        <div id="saved-stories-controls" class="saved-stories-controls">
          <div class="sorting-options">
            <label for="sorting">Urutkan berdasarkan:</label>
            <select id="sorting" class="sort-select">
              <option value="savedAt-desc">Terbaru Disimpan</option>
              <option value="savedAt-asc">Terlama Disimpan</option>
              <option value="createdAt-desc">Terbaru Dibuat</option>
              <option value="createdAt-asc">Terlama Dibuat</option>
              <option value="name-asc">Nama (A-Z)</option>
              <option value="name-desc">Nama (Z-A)</option>
            </select>
          </div>
          <button id="clearAllSaved" class="btn btn-danger">
            <i class="fas fa-trash"></i> Hapus Semua
          </button>
        </div>
        
        <!-- App Shell untuk menampilkan konten saat loading atau offline -->
        <div id="saved-story-list" class="content-loading">
          <div class="app-shell-skeleton"></div>
          <div class="app-shell-skeleton"></div>
          <div class="app-shell-skeleton"></div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    // Menggunakan NavigationHelper untuk pengaturan navigasi
    NavigationHelper.setupAuthenticatedNavigation();
    
    // Setup online/offline handler
    this._setupOnlineOfflineHandler();

    // Setup sort handler
    this._setupSortingHandler();
    
    // Setup clear all button
    this._setupClearAllButton();

    // Load saved stories
    this.presenter.loadSavedStories();
  }

  _setupOnlineOfflineHandler() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this._isOnline = true;
      this._showNotification('Anda kembali online');
    });
    
    window.addEventListener('offline', () => {
      this._isOnline = false;
      this._showNotification('Anda sedang offline. Anda masih dapat melihat story tersimpan.');
    });
  }

  _setupSortingHandler() {
    const sortingSelect = document.getElementById('sorting');
    if (!sortingSelect) return;
    
    sortingSelect.addEventListener('change', () => {
      const [field, direction] = sortingSelect.value.split('-');
      const ascending = direction === 'asc';
      
      this.presenter.loadSavedStories(field, ascending);
    });
  }

  _setupClearAllButton() {
    const clearAllButton = document.getElementById('clearAllSaved');
    if (!clearAllButton) return;
    
    clearAllButton.addEventListener('click', () => {
      // Konfirmasi hapus semua
      if (confirm('Apakah Anda yakin ingin menghapus semua story tersimpan?')) {
        this.presenter.clearAllSavedStories();
        
        // Setelah menghapus semua story, tampilkan pesan notifikasi dan update UI
        this._showNotification('Semua story berhasil dihapus dari tersimpan');
        
        // Tampilkan empty state dengan animasi yang menarik
        this.showEmptyState('deleted');
      }
    });
  }

  displaySavedStories(stories) {
    const container = document.getElementById("saved-story-list");
    if (!container) return;

    // Remove loading skeleton
    container.classList.remove('content-loading');

    // Menampilkan atau menyembunyikan controls berdasarkan jumlah stories
    this._toggleControlsVisibility(stories && stories.length > 0);

    if (!stories || stories.length === 0) {
      this.showEmptyState('empty');
      return;
    }

    container.innerHTML = stories
      .map(
        (story, index) => `
      <div class="story-item saved-story-item" style="animation-delay: ${index * 0.1}s">
        <div class="saved-indicator">
          <i class="fas fa-bookmark"></i>
          <span class="saved-date">Disimpan pada: ${this.formatDate(story.savedAt)}</span>
        </div>
        <div class="story-image-container">
          <img src="${story.photoUrl}" 
               alt="Foto oleh ${story.name}: ${story.description}"
               loading="lazy"
               onerror="this.onerror=null; this.src='/images/icons/icon-192x192.png'; this.alt='Gambar tidak tersedia saat offline';">
        </div>
        <div class="story-content">
          <h2 class="story-title">${story.name}</h2>
          <p class="story-description">${story.description}</p>
          <p class="created-at"><i class="fas fa-calendar"></i> Dibuat pada: ${this.formatDate(
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
            <a href="#/story/${story.id}" class="detail-button">
              <i class="fas fa-eye"></i> Lihat Detail
            </a>
            <button class="unsave-button" data-id="${story.id}">
              <i class="fas fa-trash"></i> Hapus dari Tersimpan
            </button>
          </div>
        </div>
      </div>
    `
      )
      .join("");

    // Tambahkan style untuk tampilan saved story
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .saved-stories-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
      }
      
      .page-header {
        margin-bottom: 40px;
        text-align: center;
        position: relative;
        padding-bottom: 20px;
      }
      
      .page-header::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 100px;
        height: 4px;
        background: linear-gradient(to right, var(--secondary-color), var(--primary-color));
        border-radius: 2px;
      }
      
      .page-header h1 {
        color: var(--primary-color);
        margin-bottom: 15px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        font-size: 2.2rem;
      }
      
      .page-header h1 i {
        color: var(--secondary-color);
      }
      
      .page-header .subtitle {
        color: var(--text-color-medium);
        font-size: 1.15rem;
        max-width: 600px;
        margin: 0 auto;
      }
      
      .saved-stories-controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
        flex-wrap: wrap;
        gap: 15px;
        background-color: var(--bg-light);
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: var(--shadow-small);
      }
      
      .sorting-options {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .sorting-options label {
        font-weight: 600;
        color: var(--text-color-dark);
      }
      
      .sort-select {
        padding: 10px 15px;
        border-radius: 8px;
        border: 1px solid var(--border-color);
        background-color: white;
        font-family: inherit;
        font-size: 0.95rem;
        box-shadow: var(--shadow-small);
        transition: all 0.3s ease;
        cursor: pointer;
        min-width: 200px;
      }
      
      .sort-select:hover, .sort-select:focus {
        border-color: var(--primary-color);
        box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
        outline: none;
      }
      
      .btn-danger {
        background-color: #e74c3c;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.3s ease;
        font-weight: 600;
        box-shadow: var(--shadow-small);
      }
      
      .btn-danger:hover {
        background-color: #c0392b;
        transform: translateY(-2px);
        box-shadow: 0 6px 12px rgba(0,0,0,0.15);
      }
      
      /* App shell skeletons */
      .content-loading {
        display: grid;
        gap: 30px;
      }
      
      .app-shell-skeleton {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: skeleton-loading 1.5s infinite;
        border-radius: 10px;
        height: 250px;
      }
      
      @keyframes skeleton-loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      
      /* Story items */
      #saved-story-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 30px;
      }
      
      .saved-story-item {
        background-color: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: var(--shadow-medium);
        border: 1px solid var(--border-color);
        position: relative;
        transition: all 0.3s ease;
        animation: fade-in 0.5s ease forwards;
        opacity: 0;
        transform: translateY(20px);
        display: flex;
        flex-direction: column;
      }
      
      @keyframes fade-in {
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .saved-story-item:hover {
        transform: translateY(-5px);
        box-shadow: var(--shadow-large);
        border-color: var(--secondary-color);
      }
      
      .story-image-container {
        height: 200px;
        overflow: hidden;
      }
      
      .saved-story-item img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.5s ease;
      }
      
      .saved-story-item:hover img {
        transform: scale(1.05);
      }
      
      .story-content {
        padding: 20px;
        display: flex;
        flex-direction: column;
        flex-grow: 1;
      }
      
      .story-title {
        font-size: 1.4rem;
        color: var(--primary-color);
        margin-bottom: 10px;
        line-height: 1.3;
      }
      
      .story-description {
        color: var(--text-color-medium);
        margin-bottom: 15px;
        line-height: 1.5;
        flex-grow: 1;
      }
      
      .created-at {
        font-size: 0.9rem;
        color: var(--text-color-light);
        margin-bottom: 15px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .saved-indicator {
        position: absolute;
        top: 15px;
        right: 15px;
        background-color: rgba(52, 152, 219, 0.9);
        color: white;
        padding: 8px 12px;
        border-radius: 30px;
        font-size: 0.85rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 6px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 10;
        transition: all 0.3s ease;
      }
      
      .saved-indicator i {
        color: #ffeb3b;
        font-size: 1rem;
      }
      
      .saved-date {
        display: none;
        white-space: nowrap;
        font-weight: 400;
      }
      
      .saved-indicator:hover {
        padding-right: 20px;
      }
      
      .saved-indicator:hover .saved-date {
        display: inline;
        animation: fade-in 0.3s ease;
      }
      
      /* Mini map styles */
      .mini-map {
        width: 100%;
        height: 150px;
        border-radius: 8px;
        margin-bottom: 15px;
        box-shadow: var(--shadow-small);
        border: 1px solid var(--border-color);
      }
      
      .offline-map-placeholder {
        background-color: #f8f9fa;
        padding: 15px;
        border-radius: 8px;
        text-align: center;
        border: 1px dashed #ccc;
        margin-bottom: 15px;
        color: var(--text-color-medium);
      }
      
      .offline-map-placeholder i {
        color: var(--primary-color);
        margin-right: 6px;
      }
      
      .offline-map-placeholder p {
        font-size: 0.9rem;
        margin-top: 8px;
        color: var(--text-color-light);
      }
      
      /* Story actions */
      .story-action {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        margin-top: 10px;
      }
      
      .detail-button {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        background-color: var(--primary-color);
        color: white;
        padding: 10px 15px;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 600;
        transition: all 0.3s ease;
        box-shadow: var(--shadow-small);
      }
      
      .detail-button:hover {
        background-color: var(--primary-dark);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }
      
      .unsave-button {
        flex: 1;
        background-color: #e74c3c;
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: all 0.3s ease;
        font-weight: 600;
        box-shadow: var(--shadow-small);
      }
      
      .unsave-button:hover {
        background-color: #c0392b;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }
      
      /* Notification styles */
      .toast-notification {
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #2ecc71;
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        box-shadow: 0 6px 16px rgba(0,0,0,0.2);
        z-index: 1000;
        opacity: 1;
        transition: opacity 0.3s ease, transform 0.3s ease;
        font-weight: 600;
      }

      .toast-notification.hidden {
        opacity: 0;
        transform: translate(-50%, 30px);
      }
      
      /* Empty state styles */
      .empty-state {
        text-align: center;
        padding: 60px 30px;
        background-color: white;
        border-radius: 16px;
        box-shadow: var(--shadow-medium);
        margin: 30px auto;
        max-width: 600px;
        animation: fade-in 0.5s ease;
      }
      
      .empty-icon-container {
        width: 120px;
        height: 120px;
        margin: 0 auto 30px;
        background: linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 10px 20px rgba(0, 188, 212, 0.2);
      }
      
      .empty-icon-container i {
        font-size: 4rem;
        color: #00acc1;
      }
      
      .empty-state h3 {
        font-size: 1.8rem;
        color: var(--primary-color);
        margin-bottom: 15px;
        font-weight: 700;
      }
      
      .empty-state p {
        color: var(--text-color-medium);
        margin-bottom: 30px;
        font-size: 1.1rem;
        line-height: 1.6;
        max-width: 450px;
        margin-left: auto;
        margin-right: auto;
      }
      
      .empty-state-actions {
        display: flex;
        justify-content: center;
      }
      
      .empty-state .btn-primary {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        background-color: var(--primary-color);
        color: white;
        padding: 14px 28px;
        border-radius: 50px;
        text-decoration: none;
        font-weight: 600;
        transition: all 0.3s ease;
        box-shadow: var(--shadow-medium);
      }
      
      .empty-state .btn-primary:hover {
        background-color: var(--primary-dark);
        transform: translateY(-3px);
        box-shadow: 0 8px 15px rgba(0,0,0,0.15);
      }
      
      /* Error state */
      .error {
        background-color: #ffebee;
        border-left: 4px solid #e74c3c;
        padding: 15px 20px;
        border-radius: 8px;
        color: #c0392b;
        font-weight: 600;
        margin: 20px 0;
        box-shadow: var(--shadow-small);
      }
      
      /* Responsive styles */
      @media (max-width: 992px) {
        #saved-story-list {
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        }
      }
      
      @media (max-width: 768px) {
        .page-header h1 {
          font-size: 1.8rem;
        }
        
        .page-header .subtitle {
          font-size: 1rem;
        }
        
        .saved-stories-controls {
          padding: 12px 15px;
        }
        
        #saved-story-list {
          grid-template-columns: 1fr;
        }
      }
      
      @media (max-width: 600px) {
        .saved-stories-controls {
          flex-direction: column;
          align-items: stretch;
        }
        
        .sorting-options {
          width: 100%;
          flex-direction: column;
          align-items: flex-start;
        }
        
        .sort-select {
          width: 100%;
        }
        
        .btn-danger {
          width: 100%;
          justify-content: center;
        }
        
        .story-action {
          flex-direction: column;
        }
      }
    `;
    document.head.appendChild(styleElement);

    // Add event listeners for unsave buttons
    document.querySelectorAll('.unsave-button').forEach(button => {
      button.addEventListener('click', (e) => {
        const storyId = e.currentTarget.dataset.id;
        if (storyId) {
          this.presenter.deleteSavedStory(storyId);
        }
      });
    });

    // Inisialisasi peta jika online
    if (this._isOnline) {
      this.initMiniMaps();
    }
  }

  /**
   * Toggle visibility of controls based on whether there are stories
   * @param {boolean} hasStories - Whether there are stories to display
   */
  _toggleControlsVisibility(hasStories) {
    const controlsContainer = document.getElementById('saved-stories-controls');
    if (controlsContainer) {
      if (hasStories) {
        controlsContainer.style.display = 'flex';
        // Tambahkan animasi muncul
        controlsContainer.style.animation = 'fade-in 0.5s ease forwards';
      } else {
        // Sembunyikan controls dengan animasi
        controlsContainer.style.animation = 'fade-out 0.3s ease forwards';
        setTimeout(() => {
          controlsContainer.style.display = 'none';
        }, 300);
      }
    }
  }

  /**
   * Show empty state with different messages based on context
   * @param {string} reason - Reason for empty state ('empty' or 'deleted')
   */
  showEmptyState(reason = 'empty') {
    const container = document.getElementById("saved-story-list");
    if (!container) return;

    // Remove loading skeleton
    container.classList.remove('content-loading');
    
    // Hide controls when showing empty state
    this._toggleControlsVisibility(false);

    // Different message based on whether user just deleted all stories or there were none to begin with
    const emptyStateTitle = reason === 'deleted' 
      ? 'Semua Story Telah Dihapus' 
      : 'Belum Ada Story Tersimpan';
    
    const emptyStateDescription = reason === 'deleted'
      ? 'Anda telah menghapus semua story tersimpan. Jelajahi story di beranda dan simpan yang baru untuk dibaca nanti!'
      : 'Anda belum menyimpan story favorit. Jelajahi story di beranda dan simpan untuk dibaca nanti!';
    
    const iconClass = reason === 'deleted' ? 'fa-trash-restore' : 'fa-bookmark';
    
    const animationClass = reason === 'deleted' ? 'bounce-in' : 'fade-in';

    container.innerHTML = `
      <div class="empty-state ${animationClass}">
        <div class="empty-icon-container">
          <i class="fas ${iconClass}"></i>
        </div>
        <h3>${emptyStateTitle}</h3>
        <p>${emptyStateDescription}</p>
        <div class="empty-state-actions">
          <a href="#/" class="btn-primary">
            <i class="fas fa-home"></i> Kembali ke Beranda
          </a>
        </div>
      </div>
    `;

    // Add specific empty state styles with added animation
    const emptyStyle = document.createElement('style');
    emptyStyle.textContent = `
      .empty-state {
        text-align: center;
        padding: 60px 30px;
        background-color: white;
        border-radius: 16px;
        box-shadow: var(--shadow-medium);
        margin: 30px auto;
        max-width: 600px;
      }
      
      .empty-state.fade-in {
        animation: fade-in 0.8s ease forwards;
      }
      
      .empty-state.bounce-in {
        animation: bounce-in 0.8s cubic-bezier(0.19, 1.0, 0.22, 1.0) forwards;
      }
      
      @keyframes bounce-in {
        0% {
          opacity: 0;
          transform: scale(0.8) translateY(30px);
        }
        60% {
          opacity: 1;
          transform: scale(1.05) translateY(-10px);
        }
        100% {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
      
      @keyframes fade-out {
        from {
          opacity: 1;
          transform: translateY(0);
        }
        to {
          opacity: 0;
          transform: translateY(-20px);
        }
      }
      
      .empty-icon-container {
        width: 120px;
        height: 120px;
        margin: 0 auto 30px;
        background: linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 10px 20px rgba(0, 188, 212, 0.2);
        animation: pulse 2s infinite;
      }
      
      @keyframes pulse {
        0% {
          box-shadow: 0 10px 20px rgba(0, 188, 212, 0.2);
        }
        50% {
          box-shadow: 0 10px 30px rgba(0, 188, 212, 0.4);
        }
        100% {
          box-shadow: 0 10px 20px rgba(0, 188, 212, 0.2);
        }
      }
      
      .empty-icon-container i {
        font-size: 4rem;
        color: #00acc1;
      }
      
      .empty-state h3 {
        font-size: 1.8rem;
        color: var(--primary-color);
        margin-bottom: 15px;
        font-weight: 700;
      }
      
      .empty-state p {
        color: var(--text-color-medium);
        margin-bottom: 30px;
        font-size: 1.1rem;
        line-height: 1.6;
        max-width: 450px;
        margin-left: auto;
        margin-right: auto;
      }
      
      .empty-state-actions {
        display: flex;
        justify-content: center;
      }
      
      .empty-state .btn-primary {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        background-color: var(--primary-color);
        color: white;
        padding: 14px 28px;
        border-radius: 50px;
        text-decoration: none;
        font-weight: 600;
        transition: all 0.3s ease;
        box-shadow: var(--shadow-medium);
      }
      
      .empty-state .btn-primary:hover {
        background-color: var(--primary-dark);
        transform: translateY(-3px);
        box-shadow: 0 8px 15px rgba(0,0,0,0.15);
      }
    `;
    document.head.appendChild(emptyStyle);
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
          
          // Invalidate size setelah DOM sepenuhnya dirender
          setTimeout(() => {
            miniMap.invalidateSize();
          }, 500);

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

  _showNotification(message) {
    // Tambahkan elemen notifikasi jika belum ada
    let notificationEl = document.querySelector('.toast-notification');
    if (!notificationEl) {
      notificationEl = document.createElement('div');
      notificationEl.className = 'toast-notification hidden';
      document.body.appendChild(notificationEl);
    }

    notificationEl.textContent = message;
    notificationEl.classList.remove('hidden');
    
    // Hilangkan setelah 3 detik
    setTimeout(() => {
      notificationEl.classList.add('hidden');
    }, 3000);
  }

  showError(message) {
    const container = document.getElementById("saved-story-list");
    if (!container) return;

    // Remove loading skeleton
    container.classList.remove('content-loading');
    
    container.innerHTML = `<p class="error">⛔ ${message}</p>`;
  }
}