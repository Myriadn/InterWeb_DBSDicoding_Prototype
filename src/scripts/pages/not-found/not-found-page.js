// src/scripts/pages/not-found/not-found-page.js
import NavigationHelper from "../../utils/navigation-helper";

export default class NotFoundPage {
  async render() {
    return `
      <section class="container not-found-container" id="main-content">
        <div class="not-found-content">
          <div class="not-found-icon">
            <i class="fas fa-map-signs"></i>
          </div>
          <h1>404</h1>
          <h2>Halaman Tidak Ditemukan</h2>
          <p>Maaf, halaman yang Anda cari tidak ditemukan. Mungkin URL yang Anda masukkan salah atau halaman tersebut sudah tidak tersedia.</p>
          <div class="not-found-actions">
            <a href="#/" class="btn-primary">
              <i class="fas fa-home"></i> Kembali ke Beranda
            </a>
            <a href="#/saved-stories" class="btn-secondary">
              <i class="fas fa-bookmark"></i> Story Tersimpan
            </a>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    // Setup navigation
    const isUserLoggedIn = !!localStorage.getItem('token');
    if (isUserLoggedIn) {
      NavigationHelper.setupAuthenticatedNavigation();
    } else {
      NavigationHelper.setupUnauthenticatedNavigation();
    }

    // Add specific not found styles with animations
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .not-found-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 80vh;
        padding: 30px;
      }
      
      .not-found-content {
        text-align: center;
        max-width: 600px;
        background-color: white;
        border-radius: 16px;
        padding: 40px;
        box-shadow: var(--shadow-medium);
        animation: fade-in 0.6s ease-out forwards;
      }
      
      @keyframes fade-in {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .not-found-icon {
        width: 120px;
        height: 120px;
        margin: 0 auto 30px;
        background: linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 10px 20px rgba(0, 188, 212, 0.2);
        animation: floating 3s ease-in-out infinite;
      }
      
      @keyframes floating {
        0% {
          transform: translateY(0px);
        }
        50% {
          transform: translateY(-10px);
        }
        100% {
          transform: translateY(0px);
        }
      }
      
      .not-found-icon i {
        font-size: 4rem;
        color: #00acc1;
      }
      
      .not-found-content h1 {
        font-size: 6rem;
        font-weight: 800;
        color: var(--primary-color);
        margin: 0;
        line-height: 1;
        letter-spacing: -2px;
        opacity: 0.7;
        margin-bottom: 10px;
      }
      
      .not-found-content h2 {
        font-size: 2rem;
        color: var(--text-color-dark);
        margin-bottom: 20px;
        font-weight: 700;
      }
      
      .not-found-content p {
        font-size: 1.1rem;
        color: var(--text-color-medium);
        margin-bottom: 30px;
        line-height: 1.6;
      }
      
      .not-found-actions {
        display: flex;
        justify-content: center;
        gap: 15px;
        flex-wrap: wrap;
      }
      
      .not-found-actions a {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 12px 24px;
        border-radius: 50px;
        text-decoration: none;
        font-weight: 600;
        transition: all 0.3s ease;
      }
      
      .btn-primary {
        background-color: var(--primary-color);
        color: white;
        box-shadow: 0 4px 10px rgba(52, 152, 219, 0.3);
      }
      
      .btn-primary:hover {
        background-color: var(--primary-dark);
        transform: translateY(-3px);
        box-shadow: 0 6px 15px rgba(52, 152, 219, 0.4);
      }
      
      .btn-secondary {
        background-color: #f1f5f9;
        color: var(--text-color-dark);
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
      }
      
      .btn-secondary:hover {
        background-color: #e2e8f0;
        transform: translateY(-3px);
        box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
      }
      
      @media (max-width: 768px) {
        .not-found-content {
          padding: 30px 20px;
        }
        
        .not-found-content h1 {
          font-size: 5rem;
        }
        
        .not-found-content h2 {
          font-size: 1.5rem;
        }
        
        .not-found-icon {
          width: 100px;
          height: 100px;
          margin-bottom: 20px;
        }
        
        .not-found-icon i {
          font-size: 3rem;
        }
      }
      
      @media (max-width: 480px) {
        .not-found-actions {
          flex-direction: column;
        }
        
        .not-found-content h1 {
          font-size: 4rem;
        }
      }
    `;
    document.head.appendChild(styleElement);
  }
}