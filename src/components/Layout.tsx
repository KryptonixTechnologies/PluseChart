import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { ContactRound, UserPlus } from "lucide-react";
import { useAppData } from "../hooks/useAppData";
import { useAuth } from "../hooks/useAuth";

function Layout() {
  const navigate = useNavigate();
  const { currentAccount, settings, messages, signOut: clearLocalSession } = useAppData();
  const { session, logout } = useAuth();
  const displayName = session?.user.name ?? currentAccount?.fullName ?? settings.profile.fullName;
  const displayRole = session?.user.role ?? currentAccount?.role ?? settings.profile.role;
  const initials = displayName.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const unreadCount = messages.filter((message) => !message.read && message.folder !== "archived").length;

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon">P</div>
          <div>
            <h2>PulseChart</h2>
            <span>Communication System</span>
          </div>
        </div>

        <nav className="navigation">
          <p className="nav-title">MAIN MENU</p>

          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            <span>⌂</span>
            Dashboard
          </NavLink>

          <NavLink
            to="/messages"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            <span>✉</span>
            Messages
          </NavLink>

          <NavLink
            to="/contacts"
            title="Contacts"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            <span className="nav-icon"><ContactRound size={18} strokeWidth={1.8} aria-hidden="true" /></span>
            Contacts
          </NavLink>

          <NavLink
            to="/reports"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            <span>▥</span>
            Reports
          </NavLink>

          <p className="nav-title">SYSTEM</p>

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            <span>⚙</span>
            Settings
          </NavLink>

          <NavLink
            to="/accounts"
            title="Create account"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            <span className="nav-icon"><UserPlus size={18} strokeWidth={1.8} aria-hidden="true" /></span>
            Accounts
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="user-avatar">{initials}</div>
          <div>
            <strong>{displayName}</strong>
            <span>{displayRole}</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="breadcrumb">Communication System</p>
            <h1>PulseChart</h1>
          </div>

          <div className="topbar-actions">
            <button className="notification-button" type="button" onClick={() => navigate("/messages")} aria-label={`${unreadCount} unread messages`}>
              🔔
              {unreadCount > 0 && <span className="notification-dot"></span>}
            </button>

            <div className="profile">
              <div className="profile-avatar">{initials}</div>
              <div>
                <strong>{displayName}</strong>
                <span>{displayRole}</span>
              </div>
            </div>
            <button className="signout-button" type="button" onClick={() => { logout(); clearLocalSession(); navigate("/login", { replace: true }); }}>Sign out</button>
          </div>
        </header>

        <section className="page-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}

export default Layout;