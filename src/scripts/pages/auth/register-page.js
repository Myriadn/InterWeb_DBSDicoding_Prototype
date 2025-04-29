import RegisterPresenter from "./register-presenter";
import NavigationHelper from "../../utils/navigation-helper";

export default class RegisterPage {
  constructor() {
    this.presenter = new RegisterPresenter(this);
  }
  
  async render() {
    return `
      <section class="auth-container" id="main-content">
        <div class="auth-card">
          <div class="auth-header">
            <div class="auth-logo">
              <i class="fas fa-user-plus"></i>
            </div>
            <h1>Register</h1>
            <p class="auth-subtitle">Buat akun untuk memulai</p>
          </div>
          
          <form id="register-form">
            <div class="form-group">
              <label for="name">
                <i class="fas fa-user"></i> Nama
              </label>
              <input type="text" id="name" name="name" placeholder="Masukkan nama lengkap" required>
            </div>
            
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
                <input type="password" id="password" name="password" placeholder="Minimal 8 karakter" minlength="8" required>
                <button type="button" class="toggle-password" aria-label="Tampilkan password">
                  <i class="fas fa-eye"></i>
                </button>
              </div>
              <div class="password-strength" id="password-strength">
                <span class="strength-label">Kekuatan Password:</span>
                <div class="strength-meter">
                  <div class="strength-bar" id="strength-bar"></div>
                </div>
              </div>
            </div>
            
            <div class="form-actions">
              <button type="submit" class="btn-submit">
                <i class="fas fa-user-plus"></i> Register
              </button>
            </div>
            
            <div class="auth-footer">
              <span>Sudah punya akun? <a href="#/login" class="auth-link">Login</a></span>
            </div>
          </form>
        </div>
      </section>
    `;
  }

  async afterRender() {
    // Menggunakan NavigationHelper untuk pengaturan navigasi
    NavigationHelper.setupUnauthenticatedNavigation();

    const form = document.querySelector("#register-form");
    const passwordInput = document.getElementById('password');
    const strengthBar = document.getElementById('strength-bar');
    const togglePassword = document.querySelector('.toggle-password');
    
    // Setup password toggle and strength meter via presenter
    this.presenter.setupPasswordToggle(togglePassword, passwordInput);
    this.presenter.setupPasswordStrengthMeter(passwordInput, strengthBar);

    // Handle form submission
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      
      // Show loading state on button
      const submitButton = form.querySelector('button[type="submit"]');
      const originalText = submitButton.innerHTML;
      submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
      submitButton.disabled = true;
      
      try {
        const name = form.name.value;
        const email = form.email.value;
        const password = form.password.value;
        
        // Process registration via presenter
        const success = await this.presenter.processRegistration({ 
          name, email, password 
        });
        
        if (!success) {
          // Reset button only if registration failed
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
    const form = document.querySelector('#register-form');
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
