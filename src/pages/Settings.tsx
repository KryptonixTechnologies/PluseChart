import { useState } from "react";
import { useAppData } from "../hooks/useAppData";
import type { AppSettings } from "../types/models";

const settingSections = [
  { id: "profile-settings", label: "Profile", icon: "◉" },
  { id: "notification-settings", label: "Notifications", icon: "🔔" },
  { id: "system-settings", label: "Preferences", icon: "⚙" },
];

function getInitials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function Settings() {
  const { settings, updateSettings } = useAppData();
  const [draft, setDraft] = useState<AppSettings>(settings);
  const [feedback, setFeedback] = useState("");

  const updateProfile = (field: keyof AppSettings["profile"], value: string) => {
    setDraft((current) => ({ ...current, profile: { ...current.profile, [field]: value } }));
  };

  const updateNotification = (field: keyof AppSettings["notifications"]) => {
    setDraft((current) => ({
      ...current,
      notifications: { ...current.notifications, [field]: !current.notifications[field] },
    }));
  };

  const updateSystem = (field: keyof AppSettings["system"], value: string) => {
    setDraft((current) => ({ ...current, system: { ...current.system, [field]: value } }));
  };

  const save = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.profile.fullName.trim() || !/^\S+@\S+\.\S+$/.test(draft.profile.email)) {
      setFeedback("Enter a name and valid email address before saving.");
      return;
    }
    updateSettings(draft);
    setFeedback("Settings saved locally.");
  };

  const cancel = () => {
    setDraft(settings);
    setFeedback("");
  };

  return (
    <div className="settings-page">
      <div className="settings-hero">
        <div>
          <span className="eyebrow">Workspace configuration</span>
          <h1>Settings</h1>
          <p>Personalize your PulseChart workspace and control how updates reach you.</p>
        </div>
        <div className="settings-hero-status"><span className="status-pulse" />Local workspace</div>
      </div>

      {feedback && <div className="feedback success" role="status">{feedback}</div>}

      <form onSubmit={save}>
        <div className="settings-layout">
          <aside className="settings-sidebar">
            <div className="settings-user">
              <div className="settings-avatar">{getInitials(draft.profile.fullName)}</div>
              <div>
                <strong>{draft.profile.fullName}</strong>
                <span>{draft.profile.role}</span>
              </div>
            </div>

            <div className="settings-sidebar-label">Manage workspace</div>
            <nav className="settings-navigation" aria-label="Settings sections">
              {settingSections.map((section) => (
                <a className="settings-nav-item" href={`#${section.id}`} key={section.id}>
                  <span>{section.icon}</span>
                  {section.label}
                </a>
              ))}
            </nav>

            <div className="settings-note">
              <span className="settings-note-icon">i</span>
              <p>Preferences are stored in this browser until a backend account service is connected.</p>
            </div>
          </aside>

          <div className="settings-content">
            <section className="settings-card" id="profile-settings">
              <div className="settings-card-header">
                <div><span className="settings-section-kicker">01 / Account</span><h2>Profile information</h2><p>Keep the identity shown across your communication workspace up to date.</p></div>
              </div>
              <div className="settings-form">
                <div className="profile-preview">
                  <div className="large-settings-avatar">{getInitials(draft.profile.fullName)}</div>
                  <div><strong>{draft.profile.fullName}</strong><p>{draft.profile.email}</p><span className="profile-role-chip">{draft.profile.role}</span></div>
                </div>
                <div className="form-grid">
                  <label className="form-group">Full Name<input value={draft.profile.fullName} onChange={(event) => updateProfile("fullName", event.target.value)} /></label>
                  <label className="form-group">Email Address<input type="email" value={draft.profile.email} onChange={(event) => updateProfile("email", event.target.value)} /></label>
                  <label className="form-group">Phone Number<input type="tel" value={draft.profile.phone} onChange={(event) => updateProfile("phone", event.target.value)} /></label>
                  <label className="form-group">Role<input value={draft.profile.role} disabled /></label>
                </div>
              </div>
            </section>

            <section className="settings-card" id="notification-settings">
              <div className="settings-card-header">
                <div><span className="settings-section-kicker">02 / Alerts</span><h2>Notification preferences</h2><p>Choose which updates PulseChart should prepare for you.</p></div>
              </div>
              <div className="notification-settings">
                {([
                  ["emailNotifications", "Email notifications", "Receive important communication updates."],
                  ["messageNotifications", "Message notifications", "Get notified when you receive a new message."],
                  ["weeklyReports", "Weekly reports", "Receive a weekly summary of communication activity."],
                ] as const).map(([field, title, description]) => (
                  <div className="notification-setting" key={field}>
                    <div><strong>{title}</strong><p>{description}</p></div>
                    <button type="button" className={draft.notifications[field] ? "toggle-switch active" : "toggle-switch"} onClick={() => updateNotification(field)} aria-label={`Toggle ${title}`} aria-pressed={draft.notifications[field]}><span /></button>
                  </div>
                ))}
              </div>
            </section>

            <section className="settings-card" id="system-settings">
              <div className="settings-card-header">
                <div><span className="settings-section-kicker">03 / Display</span><h2>System preferences</h2><p>Set how records are displayed on this device.</p></div>
              </div>
              <div className="preference-list">
                <label className="preference-item"><span><strong>Language</strong><p>Select the language used throughout the system.</p></span><select value={draft.system.language} onChange={(event) => updateSystem("language", event.target.value)}><option>English</option><option>Swahili</option></select></label>
                <label className="preference-item"><span><strong>Time zone</strong><p>Set the time zone used for communication records.</p></span><select value={draft.system.timeZone} onChange={(event) => updateSystem("timeZone", event.target.value)}><option value="Africa/Nairobi">East Africa Time (EAT)</option><option value="UTC">UTC</option></select></label>
                <label className="preference-item"><span><strong>Date format</strong><p>Choose how dates are displayed in the system.</p></span><select value={draft.system.dateFormat} onChange={(event) => updateSystem("dateFormat", event.target.value)}><option>DD/MM/YYYY</option><option>MM/DD/YYYY</option><option>YYYY-MM-DD</option></select></label>
              </div>
            </section>

            <div className="settings-actions"><span className="settings-save-hint">Changes are applied when you save.</span><button className="secondary-button" type="button" onClick={cancel}>Discard changes</button><button className="primary-button" type="submit">Save changes</button></div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default Settings;
