// CSS imports
import "../styles/styles.css";

import App from "./pages/app";
import NotificationHelper from "./utils/notification-helper";

const app = new App({
  content: document.querySelector("#main-content"),
  drawerButton: document.querySelector("#drawer-button"),
  navigationDrawer: document.querySelector("#navigation-drawer"),
});

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (
    !token &&
    !window.location.hash.includes("/login") &&
    !window.location.hash.includes("/register")
  ) {
    window.location.hash = "/login";
  }

  // Daftarkan service worker
  const serviceWorkerRegistration = await NotificationHelper.registerServiceWorker();
  if (serviceWorkerRegistration) {
    console.log('Service Worker berhasil diregistrasi');
  }

  await app.renderPage();

  window.addEventListener("hashchange", async () => {
    await app.renderPage();
  });
});
