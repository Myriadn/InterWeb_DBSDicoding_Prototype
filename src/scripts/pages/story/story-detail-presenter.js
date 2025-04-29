// src/scripts/pages/story/story-detail-presenter.js
import { getStoryDetail } from "../../data/api";
import { parseActivePathname } from "../../routes/url-parser";

export default class StoryDetailPresenter {
  constructor(view) {
    this.view = view;
    this.story = null;
  }

  async loadStoryDetail() {
    try {
      // Get story ID from URL
      const { id } = parseActivePathname();
      const token = localStorage.getItem("token");
      
      // Redirect to login if not authenticated
      if (!token) {
        window.location.hash = "/login";
        return false;
      }
      
      // Load story detail from API
      const response = await getStoryDetail(id, token);
      
      if (response.error) {
        this.view.showError(response.message);
        return false;
      }
      
      this.story = response.story;
      this.view.displayStoryDetail(this.story);
      
      // Init map if location data is available
      if (this.story.lat && this.story.lon) {
        this.view.initMap(this.story);
      }
      
      return true;
    } catch (error) {
      console.error("Error loading story detail:", error);
      this.view.showError("Terjadi kesalahan saat memuat detail story");
      return false;
    }
  }
  
  // Helper method to validate if we have a story with location
  hasLocation() {
    return this.story && this.story.lat && this.story.lon;
  }
}