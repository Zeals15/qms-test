// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

/* Toastify */
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/* Pages */
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Quotations from "./pages/Quotations";
import CreateQuotation from "./pages/CreateQuotation";
import QuotationView from "./pages/QuotationView";
import QuotationEdit from "./pages/QuotationEdit";
import Products from "./pages/Products";
import Customers from "./pages/Customers";
import CustomerDetails from "./pages/CustomerDetails";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Unauthorized from "./pages/Unauthorized";
import AdminUsers from "./pages/AdminUsers";

/* ---------------- Protected Shell ---------------- */

type Props = { children: React.ReactNode };

function ProtectedApp({ children }: Props) {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}
/* ---------------- Permission Guard ---------------- */

function RequirePermission({
  allowed,
  children,
}: {
  allowed: boolean;
  children: React.ReactNode;
}) {
  return allowed ? children : <Navigate to="/unauthorized" replace />;
}

/* ---------------- App ---------------- */

export default function App() {
  const { permissions } = useAuth();

  return (
    <>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Protected Application */}
        <Route
          path="/"
          element={
            <ProtectedApp>
              <Dashboard />
            </ProtectedApp>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedApp>
              <Dashboard />
            </ProtectedApp>
          }
        />

        <Route
          path="/quotations"
          element={
            <ProtectedApp>
              <Quotations />
            </ProtectedApp>
          }
        />

        <Route
          path="/quotations/:id"
          element={
            <ProtectedApp>
              <QuotationView />
            </ProtectedApp>
          }
        />

        <Route
          path="/quotations/:id/edit"
          element={
            <ProtectedApp>
              <QuotationEdit />
            </ProtectedApp>
          }
        />

        <Route
          path="/create-quotation"
          element={
            <ProtectedApp>
              <RequirePermission allowed={permissions.canCreateQuotation}>
                <CreateQuotation />
              </RequirePermission>
            </ProtectedApp>
          }
        />

        <Route
          path="/products"
          element={
            <ProtectedApp>
              <Products />
            </ProtectedApp>
          }
        />

        <Route
          path="/customers"
          element={
            <ProtectedApp>
              <Customers />
            </ProtectedApp>
          }
        />

       <Route
  path="/customers/:id"
  element={
    <ProtectedApp>
      <CustomerDetails />
    </ProtectedApp>
  }
/>

        <Route
          path="/reports"
          element={
            <ProtectedApp>
              <RequirePermission allowed={permissions.canViewReports}>
                <Reports />
              </RequirePermission>
            </ProtectedApp>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedApp>
              <RequirePermission allowed={permissions.canManageUsers}>
                <AdminUsers />
              </RequirePermission>
            </ProtectedApp>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedApp>
              <Settings />
            </ProtectedApp>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedApp>
              <Profile />
            </ProtectedApp>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      <ToastContainer
        position="top-right"
        autoClose={4000}
        newestOnTop
        pauseOnHover
        theme="light"
      />
    </>
  );
}
