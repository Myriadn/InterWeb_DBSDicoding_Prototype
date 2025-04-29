// src/scripts/pages/auth/login-presenter.js
import { login } from "../../data/api";

export default class LoginPresenter {
  constructor(view) {
    this.view = view;
  }

  async processLogin({ email, password }) {
    try {
      if (!this._validateLoginData({ email, password })) {
        return;
      }

      const response = await login({ email, password });
      
      if (!response.error) {
        // Store user data in localStorage
        localStorage.setItem("token", response.loginResult.token);
        localStorage.setItem("userName", response.loginResult.name);
        
        // Show success notification through the view
        this.view.showNotification('success', 'Login berhasil! Mengalihkan...');
        
        // Redirect after a short delay
        setTimeout(() => {
          window.location.hash = "/";
        }, 1000);

        return true;
      } else {
        // Show error notification through the view
        this.view.showNotification('error', response.message);
        return false;
      }
    } catch (error) {
      // Handle any unexpected errors
      this.view.showNotification('error', 'Terjadi kesalahan, silahkan coba lagi');
      console.error("Login error:", error);
      return false;
    }
  }

  setupPasswordToggle(toggleButton, passwordInput) {
    if (!toggleButton || !passwordInput) return;
    
    toggleButton.addEventListener('click', () => {
      const icon = toggleButton.querySelector('i');
      
      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
      } else {
        passwordInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
      }
    });
  }

  _validateLoginData({ email, password }) {
    if (!email || !email.trim()) {
      this.view.showNotification('error', 'Email tidak boleh kosong');
      return false;
    }

    if (!password) {
      this.view.showNotification('error', 'Password tidak boleh kosong');
      return false;
    }

    return true;
  }
}