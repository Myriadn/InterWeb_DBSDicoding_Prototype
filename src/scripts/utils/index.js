/**
 * Format tanggal ke format yang lebih mudah dibaca
 * @param {string} date - String tanggal dari API
 * @returns {string} Tanggal yang diformat
 */
export const showFormattedDate = (date) => {
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return new Date(date).toLocaleDateString("id-ID", options);
};

/**
 * Helper untuk memastikan skip-to-content functionality berfungsi dengan baik
 * @returns {void}
 */
export const setupAccessibility = () => {
  // Make sure main content is focusable
  const mainContent = document.getElementById("main-content");
  if (mainContent && mainContent.getAttribute("tabindex") !== "-1") {
    mainContent.setAttribute("tabindex", "-1");
  }

  // Ensure screen readers announce when focused
  if (mainContent) {
    mainContent.addEventListener("focus", function () {
      // The aria-live attribute will make screen readers announce this
      mainContent.setAttribute("aria-live", "polite");

      // Remove the attribute after a short delay
      setTimeout(() => {
        mainContent.removeAttribute("aria-live");
      }, 1000);
    });
  }
};
