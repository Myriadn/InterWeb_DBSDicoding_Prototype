import routes, { notFoundRoute } from "../routes/routes";
import { getActiveRoute } from "../routes/url-parser";
import { setupAccessibility } from "../utils";

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;
  #footer = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;

    this._setupDrawer();
    this._setupSkipLink();
    this._setupFooter();
  }

  _setupDrawer() {
    this.#drawerButton.addEventListener("click", () => {
      this.#navigationDrawer.classList.toggle("open");
    });

    document.body.addEventListener("click", (event) => {
      if (
        !this.#navigationDrawer.contains(event.target) &&
        !this.#drawerButton.contains(event.target)
      ) {
        this.#navigationDrawer.classList.remove("open");
      }

      this.#navigationDrawer.querySelectorAll("a").forEach((link) => {
        if (link.contains(event.target)) {
          this.#navigationDrawer.classList.remove("open");
        }
      });
    });
  }

  _setupSkipLink() {
    // Make sure skip link works across all pages
    document.addEventListener("click", (e) => {
      const skipLink = document.querySelector(".skip-to-content");
      if (skipLink && e.target === skipLink) {
        e.preventDefault();
        const mainContent = document.querySelector("#main-content");
        mainContent.focus();
        mainContent.scrollIntoView({ behavior: "smooth" });

        // Set a visible focus indicator on the main content
        mainContent.classList.add("content-focused");

        // Remove the focus indicator after a delay
        setTimeout(() => {
          mainContent.classList.remove("content-focused");
        }, 2000);
      }
    });
  }

  _setupFooter() {
    // Create footer if it doesn't exist
    if (!document.querySelector('.app-footer')) {
      this.#footer = document.createElement('footer');
      this.#footer.className = 'app-footer';
      this.#footer.innerHTML = `
        <div class="footer-container">
          <div class="footer-brand">
            <span class="footer-logo">Myriadn</span>
            <p class="footer-tagline">yep that's my name</p>
          </div>
        </div>
      `;
      document.body.appendChild(this.#footer);
      
      // Add footer styles
      const footerStyle = document.createElement('style');
      footerStyle.textContent = `
        .app-footer {
          background: #1a2a3a;
          color: #fff;
          box-shadow: 0 -4px 15px rgba(0, 0, 0, 0.2);
          border-top: 1px solid #2c3e50;
          width: 100%;
          padding: 20px 0;
        }
        
        .footer-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 15px 24px;
          display: flex;
          justify-content: center;
          align-items: center;
          border-radius: var(--border-radius-lg);
          background-color: rgba(255, 255, 255, 0.05);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
        }
        
        .footer-brand {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        
        .footer-logo {
          font-family: "Poppins", sans-serif;
          font-size: 1.5rem;
          font-weight: 200;
          color: #fff;
          letter-spacing: 2px;
          text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.3);
          margin-bottom: 8px;
        }
        
        .footer-tagline {
          font-family: "Open Sans", sans-serif;
          font-weight: 300;
          font-size: 0.9rem;
          color: #b2ebf2;
          margin: 0;
          font-style: italic;
        }
        
        /* Create space at bottom of body for footer */
        body {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        
        #app {
          flex: 1;
        }
      `;
      document.head.appendChild(footerStyle);
    }
  }

  _updateActiveNavItem() {
    const url = getActiveRoute();
    const navItems = document.querySelectorAll(".nav-list li");

    // Remove active class from all menu items
    navItems.forEach((item) => {
      item.classList.remove("active");
    });

    // Add active class to the current page's menu item
    navItems.forEach((item) => {
      const link = item.querySelector("a");
      if (link) {
        const href = link.getAttribute("href");
        
        // Skip logout button which has href="#"
        if (href === "#") return;
        
        const pagePath = href.replace("#", "");

        // Special case for home page
        if (
          (url === "/" && pagePath === "/") ||
          (url !== "/" && pagePath !== "/" && url.includes(pagePath))
        ) {
          item.classList.add("active");
        }
      }
    });
  }

  _stopMediaStreams() {
    // Find any active video elements and stop their streams
    document.querySelectorAll("video").forEach((video) => {
      if (video.srcObject) {
        const tracks = video.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
        video.srcObject = null;
      }
    });
  }

  async renderPage() {
    // Stop any active camera streams before changing pages
    this._stopMediaStreams();

    const url = getActiveRoute();
    const page = routes[url] || notFoundRoute; // Use Not Found page if route doesn't exist

    try {
      // Don't reload the page, just update content
      const pageContent = await page.render();

      if (document.startViewTransition) {
        document.startViewTransition(async () => {
          // Fade-out halaman lama
          await this.#content.animate(
            { opacity: [1, 0] },
            { easing: "ease-out" }
          ).finished;

          // Ganti konten dengan halaman baru
          this.#content.innerHTML = pageContent;
          await page.afterRender();

          // Update active menu item
          this._updateActiveNavItem();

          // Fade-in halaman baru
          this.#content.animate({ opacity: [0, 1] }, { easing: "ease-in" });

          // Setup accessibility features for the new content
          setupAccessibility();
        });
      } else {
        // Fallback jika View Transition API tidak didukung
        this.#content.style.opacity = 0;
        this.#content.innerHTML = pageContent;
        await page.afterRender();

        // Update active menu item
        this._updateActiveNavItem();

        this.#content.animate({ opacity: [0, 1] }, { easing: "ease-in" });

        // Setup accessibility features for the new content
        setupAccessibility();
      }
    } catch (error) {
      console.error("Error rendering page:", error);
      this.#content.innerHTML = `
        <section class="container error-page" id="main-content">
          <h1>Terjadi Kesalahan</h1>
          <p class="error">Maaf, terjadi kesalahan saat memuat halaman. Silakan coba lagi.</p>
          <a href="#/" class="btn-primary">Kembali ke Beranda</a>
        </section>
      `;
      setupAccessibility();
    }
  }
}

export default App;
