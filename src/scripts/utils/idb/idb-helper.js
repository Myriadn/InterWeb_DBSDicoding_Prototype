// src/scripts/utils/idb/idb-helper.js

/**
 * IndexedDB Helper utility class
 * Provides a simplified interface for working with IndexedDB
 */
class IdbHelper {
  static DB_NAME = 'myriadn-story-app';
  static DB_VERSION = 1;
  static OBJECT_STORE_NAME = 'saved-stories';

  /**
   * Open database connection
   * @returns {Promise<IDBDatabase>} Database instance
   */
  static openDB() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error('Browser tidak mendukung IndexedDB'));
        return;
      }

      const request = window.indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = (event) => {
        reject(new Error('Gagal membuka database IndexedDB'));
      };

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object store for saved stories if it doesn't exist
        if (!db.objectStoreNames.contains(this.OBJECT_STORE_NAME)) {
          // Create object store with id as key path
          const objectStore = db.createObjectStore(this.OBJECT_STORE_NAME, { keyPath: 'id' });
          
          // Create indexes for common search queries
          objectStore.createIndex('name', 'name', { unique: false });
          objectStore.createIndex('createdAt', 'createdAt', { unique: false });
          objectStore.createIndex('savedAt', 'savedAt', { unique: false });
        }
      };
    });
  }

  /**
   * Save a story to IndexedDB
   * @param {Object} story - Story object to save
   * @returns {Promise<Object>} Saved story object
   */
  static async saveStory(story) {
    try {
      const db = await this.openDB();
      
      return new Promise((resolve, reject) => {
        // Add savedAt timestamp to mark when the story was saved
        const storyToSave = {
          ...story,
          savedAt: new Date().toISOString()
        };
        
        const transaction = db.transaction(this.OBJECT_STORE_NAME, 'readwrite');
        const objectStore = transaction.objectStore(this.OBJECT_STORE_NAME);
        
        const request = objectStore.put(storyToSave);
        
        request.onsuccess = () => {
          resolve(storyToSave);
        };
        
        request.onerror = () => {
          reject(new Error('Gagal menyimpan story'));
        };
        
        transaction.oncomplete = () => {
          db.close();
        };
      });
    } catch (error) {
      console.error('Error in saveStory:', error);
      throw error;
    }
  }

  /**
   * Get all saved stories from IndexedDB
   * @param {string} orderBy - Property to order by (default: 'savedAt')
   * @param {boolean} ascending - Sort in ascending order (default: false)
   * @returns {Promise<Array>} Array of saved stories
   */
  static async getAllSavedStories(orderBy = 'savedAt', ascending = false) {
    try {
      const db = await this.openDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.OBJECT_STORE_NAME, 'readonly');
        const objectStore = transaction.objectStore(this.OBJECT_STORE_NAME);
        
        // Use index if ordering by something other than the key
        const request = orderBy !== 'id' && objectStore.indexNames.contains(orderBy)
          ? objectStore.index(orderBy).getAll()
          : objectStore.getAll();
        
        request.onsuccess = () => {
          const stories = request.result;
          
          // Sort the results
          const sortedStories = stories.sort((a, b) => {
            const valueA = a[orderBy];
            const valueB = b[orderBy];
            
            // Handle date strings
            if (typeof valueA === 'string' && (valueA.includes('T') || valueA.includes('-'))) {
              return ascending 
                ? new Date(valueA) - new Date(valueB) 
                : new Date(valueB) - new Date(valueA);
            }
            
            // Handle other types
            return ascending 
              ? (valueA > valueB ? 1 : -1) 
              : (valueA < valueB ? 1 : -1);
          });
          
          resolve(sortedStories);
        };
        
        request.onerror = () => {
          reject(new Error('Gagal mengambil data story tersimpan'));
        };
        
        transaction.oncomplete = () => {
          db.close();
        };
      });
    } catch (error) {
      console.error('Error in getAllSavedStories:', error);
      return [];
    }
  }

  /**
   * Get a saved story by ID
   * @param {string} id - Story ID
   * @returns {Promise<Object|null>} Story object or null if not found
   */
  static async getSavedStoryById(id) {
    try {
      const db = await this.openDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.OBJECT_STORE_NAME, 'readonly');
        const objectStore = transaction.objectStore(this.OBJECT_STORE_NAME);
        const request = objectStore.get(id);
        
        request.onsuccess = () => {
          resolve(request.result || null);
        };
        
        request.onerror = () => {
          reject(new Error('Gagal mendapatkan story'));
        };
        
        transaction.oncomplete = () => {
          db.close();
        };
      });
    } catch (error) {
      console.error('Error in getSavedStoryById:', error);
      return null;
    }
  }

  /**
   * Delete a saved story by ID
   * @param {string} id - Story ID to delete
   * @returns {Promise<boolean>} Success status
   */
  static async deleteSavedStory(id) {
    try {
      const db = await this.openDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.OBJECT_STORE_NAME, 'readwrite');
        const objectStore = transaction.objectStore(this.OBJECT_STORE_NAME);
        const request = objectStore.delete(id);
        
        request.onsuccess = () => {
          resolve(true);
        };
        
        request.onerror = () => {
          reject(new Error('Gagal menghapus story'));
        };
        
        transaction.oncomplete = () => {
          db.close();
        };
      });
    } catch (error) {
      console.error('Error in deleteSavedStory:', error);
      return false;
    }
  }

  /**
   * Check if a story is saved
   * @param {string} id - Story ID
   * @returns {Promise<boolean>} True if story is saved
   */
  static async isStorySaved(id) {
    try {
      const story = await this.getSavedStoryById(id);
      return !!story;
    } catch (error) {
      console.error('Error in isStorySaved:', error);
      return false;
    }
  }

  /**
   * Clear all saved stories
   * @returns {Promise<boolean>} Success status
   */
  static async clearAllSavedStories() {
    try {
      const db = await this.openDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.OBJECT_STORE_NAME, 'readwrite');
        const objectStore = transaction.objectStore(this.OBJECT_STORE_NAME);
        const request = objectStore.clear();
        
        request.onsuccess = () => {
          resolve(true);
        };
        
        request.onerror = () => {
          reject(new Error('Gagal menghapus semua story'));
        };
        
        transaction.oncomplete = () => {
          db.close();
        };
      });
    } catch (error) {
      console.error('Error in clearAllSavedStories:', error);
      return false;
    }
  }
}

export default IdbHelper;