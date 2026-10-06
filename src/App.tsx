import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import "./App.css";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Messages from "./pages/Messages";
import Contacts from "./pages/Contacts";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Accounts from "./pages/Accounts";
import { CompanySignupPage, LoginPage, SignupPage } from "./pages/Auth";
import { AppDataProvider } from "./hooks/AppDataProvider";
import { AuthProvider } from "./hooks/AuthProvider";
import { useAuth } from "./hooks/useAuth";

function RequireAuth() {
  const { session } = useAuth();
  const location = useLocation();
  return session?.accessToken && session.tenantId
    ? <Outlet />
    : <Navigate to="/login" state={{ from: `${location.pathname}${location.search}` }} replace />;
}

function App() {
  return (
    <AuthProvider>
      <AppDataProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/signup/invite/:code" element={<SignupPage />} />
            <Route path="/company-signup" element={<CompanySignupPage />} />
            <Route path="/register" element={<LegacySignupRoute />} />
            <Route path="/setup" element={<Navigate to="/signup" replace />} />
            <Route path="/onboarding" element={<Navigate to="/signup" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/sign-in" element={<Navigate to="/login" replace />} />

            <Route element={<RequireAuth />}>
              <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="messages" element={<Messages />} />
                <Route path="contacts" element={<Contacts />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />
                <Route path="accounts" element={<Accounts />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AppDataProvider>
    </AuthProvider>
  );
}

function LegacySignupRoute() {
  const { search } = useLocation();
  const { code } = useParams();
  return <Navigate to={`/signup${code ? `/invite/${encodeURIComponent(code)}` : ""}${search}`} replace />;
}

export default App;