import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";
import { setupNetworkResilience } from "./lib/networkResilience";

// Initialize adaptive timeouts, retry backoff, and offline handling for weak connections
setupNetworkResilience();

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
