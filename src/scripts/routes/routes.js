import HomePage from "../pages/home/home-page";
import LoginPage from "../pages/auth/login-page";
import RegisterPage from "../pages/auth/register-page";
import AddStoryPage from "../pages/story/add-story-page";
import StoryDetailPage from "../pages/story/story-detail-page";
import AboutPage from "../pages/about/about-page";
import SavedStoriesPage from "../pages/saved-stories/saved-stories-page";

const routes = {
  "/": new HomePage(),
  "/login": new LoginPage(),
  "/register": new RegisterPage(),
  "/add-story": new AddStoryPage(),
  "/story/:id": new StoryDetailPage(),
  "/about": new AboutPage(),
  "/saved-stories": new SavedStoriesPage(),
};

export default routes;
