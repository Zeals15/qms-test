// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

// IMPORTANT: import from the folder name that actually exists in your project (you said src/context)
import { AuthProvider } from "./context/AuthContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* AuthProvider wraps the whole app so any useAuth() call works everywhere */}
    <AuthProvider>
      {/* Only one BrowserRouter in the whole app */}
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
