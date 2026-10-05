import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import "./App.css";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Messages from "./pages/Messages";
import Contacts from "./pages/Contacts";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Accounts from "./pages/Accounts";
import { SignInPage } from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import { AppDataProvider } from "./hooks/AppDataProvider";
import { useAppData } from "./hooks/useAppData";

function RequireAuth() {
  const { currentAccount } = useAppData();
  return currentAccount ? <Outlet /> : <Navigate to="/sign-in" replace />;
}

function App() {
  return (
    <AppDataProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/onboarding" element={<SetupRoute />} />
          <Route path="/sign-in" element={<SignInPage />} />

          <Route path="/setup" element={<SetupRoute />} />
          <Route path="/register" element={<Navigate to="/setup" replace />} />

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
  );
}

function SetupRoute() {
  const { accounts } = useAppData();
  const [setupAvailable] = useState(() => accounts.length === 0);
  return setupAvailable ? <Onboarding /> : <Navigate to="/sign-in" replace />;
}

export default App;