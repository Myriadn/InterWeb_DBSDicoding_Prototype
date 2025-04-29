// src/scripts/pages/auth/register-presenter.js
import { register } from "../../data/api";

export default class RegisterPresenter {
  constructor(view) {
    this.view = view;
  }

  async processRegistration({ name, email, password }) {
    try {
      if (!this._validateRegistrationData({ name, email, password })) {
        return false;
      }

      const response = await register({ name, email, password });
      
      if (!response.error) {
        // Show success notification through the view
        this.view.showNotification('success', 'Registrasi berhasil! Mengalihkan ke halaman login...');
        
        // Redirect after a short delay
        setTimeout(() => {
          window.location.hash = "/login";
        }, 2000);

        return true;
      } else {
        // Show error notification through the view
        this.view.showNotification('error', response.message);
        return false;
      }
    } catch (error) {
      // Handle any unexpected errors
      this.view.showNotification('error', 'Terjadi kesalahan, silahkan coba lagi');
      console.error("Registration error:", error);
      return false;
    }
  }

  setupPasswordToggle(toggleButton, passwordInput) {
    if (!toggleButton || !passwordInput) return;
    
    toggleButton.addEventListener('click', function() {
      const icon = this.querySelector('i');
      
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

  setupPasswordStrengthMeter(passwordInput, strengthBar) {
    if (!passwordInput || !strengthBar) return;
    
    passwordInput.addEventListener('input', function() {
      const password = this.value;
      let strength = 0;
      
      // Rules for determining password strength
      if (password.length >= 8) strength += 20;
      if (password.match(/[a-z]+/)) strength += 20;
      if (password.match(/[A-Z]+/)) strength += 20;
      if (password.match(/[0-9]+/)) strength += 20;
      if (password.match(/[^a-zA-Z0-9]+/)) strength += 20;
      
      // Set color based on strength
      let color = '';
      if (strength <= 40) color = '#ff4d4d'; // Weak - Red
      else if (strength <= 60) color = '#ffd633'; // Medium - Yellow
      else color = '#47d147'; // Strong - Green
      
      strengthBar.style.width = strength + '%';
      strengthBar.style.backgroundColor = color;
    });
  }

  _validateRegistrationData({ name, email, password }) {
    if (!name || !name.trim()) {
      this.view.showNotification('error', 'Nama tidak boleh kosong');
      return false;
    }

    if (!email || !email.trim()) {
      this.view.showNotification('error', 'Email tidak boleh kosong');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.view.showNotification('error', 'Format email tidak valid');
      return false;
    }

    if (!password || password.length < 8) {
      this.view.showNotification('error', 'Password minimal 8 karakter');
      return false;
    }

    return true;
  }
}