// src/scripts/utils/notification-helper.js
import { subscribeNotification, unsubscribeNotification } from '../data/api';

const NotificationHelper = {
  // Cek apakah browser mendukung notifikasi
  isNotificationSupported() {
    return 'Notification' in window;
  },
  
  // Cek apakah service worker dan push manager tersedia
  isPushNotificationSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  },
  
  // Meminta izin notifikasi
  async requestPermission() {
    if (!this.isNotificationSupported()) {
      console.log('Browser tidak mendukung notifikasi');
      return false;
    }
    
    const permission = await Notification.requestPermission();
    if (permission === 'denied') {
      console.log('Izin notifikasi ditolak');
      return false;
    }
    
    if (permission === 'default') {
      console.log('Izin notifikasi diabaikan');
      return false;
    }
    
    return true;
  },
  
  // Mendaftarkan service worker
  async registerServiceWorker() {
    try {
      if (!('serviceWorker' in navigator)) {
        console.log('Service worker tidak didukung browser ini');
        return null;
      }
      
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service worker berhasil didaftarkan', registration);
      return registration;
    } catch (error) {
      console.error('Pendaftaran service worker gagal', error);
      return null;
    }
  },
  
  // Subscribe ke push notification
  async subscribePushNotification(registration) {
    try {
      // Meminta izin dulu
      const permissionGranted = await this.requestPermission();
      if (!permissionGranted) {
        return {
          status: false,
          message: 'Izin notifikasi tidak diberikan',
        };
      }
      
      // Cek apakah sudah subscribe sebelumnya
      const subscribed = await this.checkSubscription();
      if (subscribed) {
        return {
          status: true, 
          message: 'Anda sudah berlangganan notifikasi',
          subscription: subscribed,
        };
      }

      // Generate keypair dengan VAPID key yang benar dari API
      const vapidPublicKey = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';
      const convertedVapidKey = this._urlBase64ToUint8Array(vapidPublicKey);
      
      // Subscribe to push service
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });
      
      console.log('Berhasil membuat subscription: ', subscription);
      
      // Kirim subscription ke server
      const token = localStorage.getItem('token');
      if (!token) {
        return {
          status: false,
          message: 'Token tidak ditemukan, silakan login ulang',
        };
      }
      
      // Ekstrak data dari subscription untuk dikirim ke API
      const subscriptionJson = subscription.toJSON();
      const payloadData = {
        endpoint: subscriptionJson.endpoint,
        keys: {
          p256dh: subscriptionJson.keys.p256dh,
          auth: subscriptionJson.keys.auth,
        },
      };
      
      // Kirim ke API
      const response = await subscribeNotification(payloadData);
      
      if (response.error) {
        return {
          status: false,
          message: response.message || 'Gagal berlangganan notifikasi di server',
        };
      }
      
      // Simpan status subscription ke localStorage
      localStorage.setItem('pushSubscription', JSON.stringify(subscriptionJson));
      localStorage.setItem('isSubscribed', 'true');
      
      return {
        status: true,
        message: 'Berlangganan notifikasi berhasil',
        subscription,
      };
    } catch (error) {
      console.error('Gagal berlangganan push notification', error);
      return {
        status: false,
        message: 'Gagal berlangganan notifikasi: ' + error.message,
      };
    }
  },
  
  // Unsubscribe dari push notification
  async unsubscribePushNotification() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        return {
          status: false,
          message: 'Anda belum berlangganan notifikasi',
        };
      }
      
      // Ekstrak endpoint dari subscription
      const endpoint = subscription.endpoint;
      
      // Kirim unsubscribe request ke server
      const token = localStorage.getItem('token');
      if (!token) {
        return {
          status: false,
          message: 'Token tidak ditemukan, silakan login ulang',
        };
      }
      
      const response = await unsubscribeNotification({ endpoint });
      
      // Unsubscribe dari push manager
      await subscription.unsubscribe();
      
      // Hapus status subscription dari localStorage
      localStorage.removeItem('pushSubscription');
      localStorage.setItem('isSubscribed', 'false');
      
      return {
        status: true,
        message: response.message || 'Berhenti berlangganan notifikasi berhasil',
      };
    } catch (error) {
      console.error('Gagal berhenti berlangganan push notification', error);
      return {
        status: false,
        message: 'Gagal berhenti berlangganan notifikasi: ' + error.message,
      };
    }
  },
  
  // Cek status subscription
  async checkSubscription() {
    if (!this.isPushNotificationSupported()) {
      return null;
    }
    
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return subscription;
    } catch (error) {
      console.error('Gagal memeriksa status subscription', error);
      return null;
    }
  },
  
  // Cek apakah user sudah subscribe
  isUserSubscribed() {
    return localStorage.getItem('isSubscribed') === 'true';
  },
  
  // Konversi URL Base64 ke Uint8Array 
  _urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; i++) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  },
};

export default NotificationHelper;