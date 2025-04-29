// src/scripts/pages/home/home-presenter.js
import { getStories } from "../../data/api";

export default class HomePresenter {
  constructor(view) {
    this.view = view;
    this.stories = [];
  }

  async loadStories() {
    try {
      // Check for token before requesting stories
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.hash = "/login";
        return;
      }

      // Show loading state
      const storyList = document.getElementById("story-list");
      if (storyList) {
        storyList.innerHTML = '<div class="loading">Loading stories...</div>';
      }

      // Load the stories from API
      const response = await getStories();

      if (response.error) {
        this.view.showError(response.message || "Failed to load stories");
        return;
      }

      this.stories = response.listStory || [];

      // Display only if we have stories
      if (this.stories.length > 0) {
        this.view.displayStories(this.stories);
      } else {
        this.view.showEmptyState();
      }
    } catch (error) {
      console.error("Error loading stories:", error);
      this.view.showError("Failed to load stories. Please try again later.");
    }
  }

  // Helper methods for sorting/filtering could be added here
  sortStoriesByDate(ascending = false) {
    const sortedStories = [...this.stories].sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return ascending ? dateA - dateB : dateB - dateA;
    });

    this.view.displayStories(sortedStories);
  }
}
