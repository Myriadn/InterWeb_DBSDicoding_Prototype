// src/scripts/pages/saved-stories/saved-stories-presenter.js
import IdbHelper from "../../utils/idb/idb-helper";

export default class SavedStoriesPresenter {
  constructor(view) {
    this.view = view;
  }

  /**
   * Load all saved stories from IndexedDB
   * @param {string} orderBy - Field to order by
   * @param {boolean} ascending - Sort in ascending order
   */
  async loadSavedStories(orderBy = 'savedAt', ascending = false) {
    try {
      // Retrieve all saved stories from IndexedDB
      const savedStories = await IdbHelper.getAllSavedStories(orderBy, ascending);
      
      // Display stories in the view
      this.view.displaySavedStories(savedStories);
    } catch (error) {
      console.error('Error loading saved stories:', error);
      this.view.showError('Gagal memuat daftar story tersimpan');
    }
  }

  /**
   * Delete a saved story by ID
   * @param {string} id - Story ID to delete
   */
  async deleteSavedStory(id) {
    try {
      // Delete story from IndexedDB
      const success = await IdbHelper.deleteSavedStory(id);
      
      if (success) {
        this.view._showNotification('Story berhasil dihapus dari tersimpan');
        
        // Reload stories to refresh the list
        await this.loadSavedStories();
      } else {
        this.view._showNotification('Gagal menghapus story');
      }
    } catch (error) {
      console.error('Error deleting saved story:', error);
      this.view._showNotification('Terjadi kesalahan saat menghapus story');
    }
  }

  /**
   * Clear all saved stories
   */
  async clearAllSavedStories() {
    try {
      // Clear all stories from IndexedDB
      const success = await IdbHelper.clearAllSavedStories();
      
      if (success) {
        this.view._showNotification('Semua story tersimpan berhasil dihapus');
        
        // Show empty state
        this.view.showEmptyState();
      } else {
        this.view._showNotification('Gagal menghapus semua story tersimpan');
      }
    } catch (error) {
      console.error('Error clearing saved stories:', error);
      this.view._showNotification('Terjadi kesalahan saat menghapus semua story');
    }
  }
}