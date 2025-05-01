# Myriadn Story App

![Myriadn Story App Logo](/src/public/images/logo.png)

Myriadn Story App adalah platform berbagi cerita yang memungkinkan pengguna untuk membagikan momen dan pengalaman mereka melalui foto dan teks. Aplikasi ini menawarkan pengalaman pengguna yang cepat dan responsif dengan dukungan Progressive Web App (PWA).

## Fitur Utama

- **Berbagi Cerita**: Unggah foto dan deskripsi untuk berbagi momen spesial Anda.
- **Kamera Terintegrasi**: Ambil foto langsung dari aplikasi menggunakan kamera perangkat.
- **Lokasi dengan Peta**: Tandai lokasi cerita Anda pada peta interaktif.
- **Simpan Cerita**: Simpan cerita yang menarik untuk dibaca nanti.
- **Notifikasi**: Dapatkan pemberitahuan saat ada cerita baru.
- **Mode Offline**: Akses cerita tersimpan bahkan saat tidak ada koneksi internet.
- **PWA**: Instal aplikasi di perangkat untuk akses lebih cepat.

## Tangkapan Layar

![Screenshot 1](/src/public/images/screenshots/MyriadnStoryApp_001.png)
![Screenshot 2](/src/public/images/screenshots/MyriadnStoryApp_002.png)
![Screenshot 3](/src/public/images/screenshots/MyriadnStoryApp_003.png)

## Demo

Anda dapat mengakses demo aplikasi di [https://myriadnstoryapp.netlify.app/](https://myriadnstoryapp.netlify.app/)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (disarankan versi 12 atau lebih tinggi)
- [npm](https://www.npmjs.com/) (Node package manager)

### Installation

1. Clone repositori ini atau download kode sumber.
2. Pasang seluruh dependencies dengan perintah berikut.
   ```shell
   npm install
   ```

## Scripts

- Build for Production:
  ```shell
  npm run build
  ```
  Script ini menjalankan webpack dalam mode production menggunakan konfigurasi `webpack.prod.js` dan menghasilkan sejumlah file build ke direktori `dist`.

- Start Development Server:
  ```shell
  npm run start-dev
  ```
  Script ini menjalankan server pengembangan webpack dengan fitur live reload dan mode development sesuai konfigurasi di`webpack.dev.js`.

- Serve:
  ```shell
  npm run serve
  ```
  Script ini menggunakan [`http-server`](https://www.npmjs.com/package/http-server) untuk menyajikan konten dari direktori `dist`.

## Teknologi

- HTML, CSS, JavaScript (Vanilla)
- Webpack untuk bundling
- Leaflet untuk peta interaktif
- IndexedDB untuk penyimpanan lokal
- Service Worker untuk mode offline dan PWA
- Push API untuk notifikasi

## Project Structure

```text
myriadn-story-app/
├── dist/                   # Compiled files for production
├── src/                    # Source project files
│   ├── public/             # Public files
│   │   ├── app.webmanifest # PWA manifest
│   │   ├── offline.html    # Halaman offline
│   │   ├── images/         # Gambar dan ikon
│   ├── scripts/            # Source JavaScript files
│   │   ├── data/           # API dan data handling
│   │   ├── pages/          # Komponen halaman
│   │   ├── routes/         # Router
│   │   ├── utils/          # Utility functions
│   │   ├── sw.js           # Service Worker
│   ├── styles/             # Source CSS files
│   └── index.html          # Main HTML file
├── webpack.common.js       # Webpack common configuration
├── webpack.dev.js          # Webpack development configuration
└── webpack.prod.js         # Webpack production configuration
```

