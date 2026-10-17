import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import "./App.css";
import Layout from "./components/Layout";
import { CompanySignupPage, LoginPage, SignupPage } from "./pages/Auth";
import { AppDataProvider } from "./hooks/AppDataProvider";
import { AuthProvider } from "./hooks/AuthProvider";
import { useAppData } from "./hooks/useAppData";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Messages = lazy(() => import("./pages/Messages"));
const Contacts = lazy(() => import("./pages/Contacts"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const Accounts = lazy(() => import("./pages/Accounts"));
const Subscription = lazy(() => import("./pages/Subscription"));

function RequireAuth() {
  const { currentAccount } = useAppData();
  const location = useLocation();
  return currentAccount
    ? <Outlet />
    : <Navigate to="/login" state={{ from: `${location.pathname}${location.search}` }} replace />;
}

function RequireAdmin() {
  const { currentAccount } = useAppData();
  return currentAccount?.role === "Administrator"
    ? <Outlet />
    : <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <AppDataProvider>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<div className="page-loading" role="status">Loading page…</div>}>
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
                <Route element={<RequireAdmin />}>
                  <Route path="/subscription" element={<Subscription />} />
                </Route>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="messages" element={<Messages />} />
                  <Route path="contacts" element={<Contacts />} />
                  <Route path="reports" element={<Reports />} />
                  <Route element={<RequireAdmin />}>
                    <Route path="settings" element={<Settings />} />
                    <Route path="accounts" element={<Accounts />} />
                  </Route>
                </Route>
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </AppDataProvider>
  );
}

function LegacySignupRoute() {
  const { search } = useLocation();
  const { code } = useParams();
  return <Navigate to={`/signup${code ? `/invite/${encodeURIComponent(code)}` : ""}${search}`} replace />;
}

export default App;