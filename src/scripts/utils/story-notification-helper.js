// src/scripts/utils/story-notification-helper.js

import NotificationHelper from './notification-helper';

const StoryNotificationHelper = {
  // Array untuk menyimpan ID stories sebelumnya
  _previousStoryIds: [],
  
  // Fungsi untuk mendeteksi story baru
  async checkForNewStories(stories) {
    if (!stories || !Array.isArray(stories) || stories.length === 0) return;
    
    // Jika belum ada data sebelumnya, simpan data saat ini
    if (this._previousStoryIds.length === 0) {
      this._previousStoryIds = stories.map(story => story.id);
      return;
    }
    
    // Cari story yang belum ada di data sebelumnya
    const newStories = stories.filter(story => !this._previousStoryIds.includes(story.id));
    
    // Update data sebelumnya
    this._previousStoryIds = stories.map(story => story.id);
    
    // Jika ada story baru dan user subscribe notifikasi
    if (newStories.length > 0 && NotificationHelper.isUserSubscribed()) {
      // Kirim notifikasi untuk setiap story baru
      newStories.forEach(story => {
        this._sendNotification(story);
      });
    }
  },
  
  // Fungsi untuk mengirim notifikasi
  _sendNotification(story) {
    // Cek jika browser mendukung notifikasi
    if (!NotificationHelper.isNotificationSupported()) return;
    
    try {
      // Jika notifikasi tidak diizinkan, keluar
      if (Notification.permission !== 'granted') return;
      
      // Buat notifikasi
      const options = {
        body: story.description.substring(0, 100) + '...',
        icon: '/favicon.png',
        badge: '/favicon.png',
        vibrate: [100, 50, 100],
        data: {
          dateOfArrival: Date.now(),
          storyId: story.id,
          url: `/#/story/${story.id}`,
        },
        actions: [
          {
            action: 'open',
            title: 'Lihat Story',
          },
          {
            action: 'close',
            title: 'Tutup',
          },
        ],
      };
      
      // Tampilkan notifikasi
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(`Story baru dari ${story.name}`, options);
        });
      } else {
        // Fallback ke notifikasi browser biasa
        new Notification(`Story baru dari ${story.name}`, options);
      }
    } catch (error) {
      console.error('Error menampilkan notifikasi:', error);
    }
  },
};

export default StoryNotificationHelper;