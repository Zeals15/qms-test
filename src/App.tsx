// src/App.tsx
import { type ReactElement } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Quotations from "./pages/Quotations";
import CreateQuotation from "./pages/CreateQuotation";
import Products from "./pages/Products";
import Customers from "./pages/Customers";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";

// new imports (add these lines)
import QuotationView from "./pages/QuotationView";
import QuotationEdit from "./pages/QuotationEdit";

/** small helper to read auth state in one place */
function useAuth() {
  return localStorage.getItem("isLoggedIn") === "true";
}

function Protected({ children }: { children: ReactElement }) {
  const isLoggedIn = useAuth();
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

/** Root redirect that chooses login or dashboard depending on auth */
function HomeRedirect() {
  const isLoggedIn = useAuth();
  return <Navigate to={isLoggedIn ? "/dashboard" : "/login"} replace />;
}

export default function App() {
  return (
    <Routes>
      {/* explicit login route */}
      <Route path="/login" element={<Login />} />

      {/* root: redirect to login or dashboard depending on auth */}
      <Route path="/" element={<HomeRedirect />} />

      {/* protected app routes */}
      <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
      <Route path="/quotations" element={<Protected><Quotations /></Protected>} />
      <Route path="/quotations/:id" element={<Protected><QuotationView /></Protected>} />
      <Route path="/quotations/:id/edit" element={<Protected><QuotationEdit /></Protected>} />
      <Route path="/create-quotation" element={<Protected><CreateQuotation /></Protected>} />
      <Route path="/products" element={<Protected><Products /></Protected>} />
      <Route path="/customers" element={<Protected><Customers /></Protected>} />
      <Route path="/reports" element={<Protected><Reports /></Protected>} />
      <Route path="/settings" element={<Protected><Settings /></Protected>} />
      <Route path="/profile" element={<Protected><Profile /></Protected>} />

      {/* catch-all: send user to the correct landing (login/dashboard) */}
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}
