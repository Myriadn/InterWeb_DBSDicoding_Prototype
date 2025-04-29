// src/scripts/pages/about/about-page.js
import AboutPresenter from "./about-presenter";
import NavigationHelper from "../../utils/navigation-helper";

export default class AboutPage {
  constructor() {
    this.presenter = new AboutPresenter(this);
  }
  
  async render() {
    // Get app info from presenter
    const appInfo = this.presenter.getAppInfo();
    
    return `
      <section class="container about-page" id="main-content">
        <h1>About ${appInfo.name}</h1>
        
        <div class="about-content">
          <p>${appInfo.description}</p>
        </div>
        
        <div class="about-features">
          ${appInfo.features.map(feature => `
            <div class="feature-card">
              <i class="fas ${feature.icon}"></i>
              <h3>${feature.title}</h3>
              <p>${feature.description}</p>
            </div>
          `).join('')}
        </div>
        
        <div class="github-card">
          <i class="fab fa-github"></i>
          <a href="${appInfo.githubUrl}" target="_blank">
            ${appInfo.githubUrl.replace('https://', '')}
          </a>
        </div>
      </section>
    `;
  }

  async afterRender() {
    // Use the presenter to set up navigation
    this.presenter.setupNavigation();
  }
  
  // These methods are called by the presenter
  setupAuthenticatedNavigation() {
    NavigationHelper.setupAuthenticatedNavigation();
  }
  
  setupUnauthenticatedNavigation() {
    NavigationHelper.setupUnauthenticatedNavigation();
  }
}
