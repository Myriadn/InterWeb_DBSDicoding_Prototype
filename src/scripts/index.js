// CSS imports
import "../styles/styles.css";

import App from "./pages/app";

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (
    !token &&
    !window.location.hash.includes("/login") &&
    !window.location.hash.includes("/register")
  ) {
    window.location.hash = "/login";
  }

  const app = new App({
    content: document.querySelector("#main-content"),
    drawerButton: document.querySelector("#drawer-button"),
    navigationDrawer: document.querySelector("#navigation-drawer"),
  });
  await app.renderPage();

  window.addEventListener("hashchange", async () => {
    await app.renderPage();
  });
});
