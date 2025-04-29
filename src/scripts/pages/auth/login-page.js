import LoginPresenter from "./login-presenter";
import NavigationHelper from "../../utils/navigation-helper";

export default class LoginPage {
  constructor() {
    this.presenter = new LoginPresenter(this);
  }
  
  async render() {
    return `
      <section class="auth-container" id="main-content">
        <div class="auth-card">
          <div class="auth-header">
            <div class="auth-logo">
              <i class="fas fa-book-open"></i>
            </div>
            <h1>Login</h1>
            <p class="auth-subtitle">Silahkan masuk untuk melanjutkan</p>
          </div>
          
          <form id="login-form">
            <div class="form-group">
              <label for="email">
                <i class="fas fa-envelope"></i> Email
              </label>
              <input type="email" id="email" name="email" placeholder="Masukkan email" required>
            </div>
            
            <div class="form-group">
              <label for="password">
                <i class="fas fa-lock"></i> Password
              </label>
              <div class="password-field">
                <input type="password" id="password" name="password" placeholder="Masukkan password" required>
                <button type="button" class="toggle-password" aria-label="Tampilkan password">
                  <i class="fas fa-eye"></i>
                </button>
              </div>
            </div>
            
            <div class="form-actions">
              <button type="submit" class="btn-submit">
                <i class="fas fa-sign-in-alt"></i> Login
              </button>
            </div>
            
            <div class="auth-footer">
              <span>Belum punya akun? <a href="#/register" class="auth-link">Daftar</a></span>
            </div>
          </form>
        </div>
      </section>
    `;
  }

  async afterRender() {
    // Menggunakan NavigationHelper untuk pengaturan navigasi
    NavigationHelper.setupUnauthenticatedNavigation();

    const form = document.querySelector("#login-form");
    const passwordInput = document.querySelector('#password');
    const togglePassword = document.querySelector('.toggle-password');
    
    // Setup password toggle via presenter
    this.presenter.setupPasswordToggle(togglePassword, passwordInput);

    // Handle form submission
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      
      // Show loading state on button
      const submitButton = form.querySelector('button[type="submit"]');
      const originalText = submitButton.innerHTML;
      submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
      submitButton.disabled = true;
      
      try {
        const email = form.email.value;
        const password = form.password.value;
        
        // Process login via presenter
        const success = await this.presenter.processLogin({ email, password });
        
        if (!success) {
          // Reset button only if login failed (success will redirect)
          submitButton.innerHTML = originalText;
          submitButton.disabled = false;
        }
      } catch (error) {
        // Handle any unexpected errors
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
      }
    });
  }
  
  showNotification(type, message) {
    // Check for existing notifications
    const existingNotif = document.querySelector('.auth-notification');
    if (existingNotif) {
      existingNotif.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `auth-notification ${type}`;
    notification.innerHTML = `
      <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
      ${message}
    `;
    
    // Add to form
    const form = document.querySelector('#login-form');
    form.insertBefore(notification, form.querySelector('.form-actions'));
    
    // Remove notification after a delay for errors
    if (type === 'error') {
      setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 500);
      }, 3000);
    }
  }
}
