import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Messages from "./pages/Messages";
import Contacts from "./pages/Contacts";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import { AppDataProvider } from "./hooks/AppDataProvider";

function App() {
  return (
    <AppDataProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />

            <Route path="dashboard" element={<Dashboard />} />

            <Route path="messages" element={<Messages />} />

            <Route path="contacts" element={<Contacts />} />

            <Route path="reports" element={<Reports />} />

            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppDataProvider>
  );
}

export default App;