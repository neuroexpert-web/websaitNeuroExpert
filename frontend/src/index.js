import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

// Тихая деградация аналитики
const initAnalytics = () => {
  try {
    // PostHog
    if (window.posthog) {
      window.posthog.init(process.env.REACT_APP_POSTHOG_KEY);
    }
  } catch (e) { /* silent */ }
  
  try {
    // Yandex Metrika
    if (typeof window.ym !== 'undefined') {
      window.ym(104770996, 'init', { 
        clickmap: true,
        trackLinks: true,
        accurateTrackBounce: true,
        webvisor: true
      });
    }
  } catch (e) { /* silent */ }
};

initAnalytics();

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
