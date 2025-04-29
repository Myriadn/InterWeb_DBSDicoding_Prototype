// src/scripts/pages/about/about-presenter.js

export default class AboutPresenter {
  constructor(view) {
    this.view = view;
  }

  // The About page is mostly static content, but we could add methods here
  // for handling any dynamic content or user interactions
  
  getAppInfo() {
    return {
      name: "Myriadn Story App",
      description: "Platform berbagi cerita yang memungkinkan pengguna untuk membagikan momen dan pengalaman mereka melalui foto dan teks.",
      features: [
        {
          icon: "fa-camera",
          title: "Ambil Foto",
          description: "Ambil foto secara langsung dari kamera perangkat Anda atau unggah dari galeri."
        },
        {
          icon: "fa-map-marker-alt",
          title: "Lokasi",
          description: "Tandai lokasi cerita Anda pada peta untuk berbagi tempat spesial."
        },
        {
          icon: "fa-share-alt",
          title: "Berbagi Cerita",
          description: "Bagikan cerita Anda dengan semua orang dalam komunitas."
        }
      ],
      githubUrl: "https://github.com/myriadn"
    };
  }

  setupNavigation() {
    // Check authentication status to determine which navigation to show
    const token = localStorage.getItem("token");
    
    if (token) {
      this.view.setupAuthenticatedNavigation();
    } else {
      this.view.setupUnauthenticatedNavigation();
    }
  }
}