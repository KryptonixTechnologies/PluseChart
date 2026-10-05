import { useState } from "react";
import { useAppData } from "../hooks/useAppData";
import type { AccountInput } from "../types/models";

const emptyAccount: AccountInput = {
  fullName: "",
  email: "",
  phone: "",
  role: "Staff",
};

function Accounts() {
  const { accounts, addAccount } = useAppData();
  const [draft, setDraft] = useState<AccountInput>(emptyAccount);
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isError, setIsError] = useState(false);

  const updateField = (field: keyof AccountInput, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const createAccount = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fullName = draft.fullName.trim();
    const email = draft.email.trim().toLowerCase();
    if (!fullName) {
      setIsError(true);
      setFeedback("Enter the account holder's name.");
      return;
    }
    if (accounts.some((account) => account.email.toLowerCase() === email)) {
      setIsError(true);
      setFeedback("An account with this email already exists.");
      return;
    }

    const result = await addAccount({ ...draft, fullName, email }, password);
    if (result !== "created") {
      setIsError(true);
      setFeedback(result === "duplicate" ? "An account with this email already exists." : "Password storage is unavailable in this browser.");
      return;
    }

    setDraft(emptyAccount);
    setPassword("");
    setIsError(false);
    setFeedback("Account created in this workspace.");
  };

  return (
    <div className="accounts-page">
      <div className="page-heading">
        <div>
          <span className="accounts-eyebrow">TEAM DIRECTORY</span>
          <h1>Accounts</h1>
          <p>Manage the people and access roles in your communication workspace.</p>
        </div>
        <div className="accounts-count"><strong>{accounts.length}</strong><span>{accounts.length === 1 ? "team account" : "team accounts"}</span></div>
      </div>

      {feedback && <div className={isError ? "form-error" : "feedback success"} role={isError ? "alert" : "status"}>{feedback}</div>}

      <div className="accounts-workspace">
        <section className="accounts-panel create-account-panel" aria-labelledby="create-account-heading">
          <div className="accounts-panel-header create-account-header">
            <span className="account-panel-icon" aria-hidden="true">＋</span>
            <div>
              <span className="accounts-section-label">NEW MEMBER</span>
              <h2 id="create-account-heading">Create account</h2>
              <p>Add a staff member who can sign in on this browser.</p>
            </div>
          </div>
          <form className="accounts-form" onSubmit={createAccount}>
            <div className="accounts-fields">
              <label className="form-group">Full name<input required autoComplete="name" placeholder="e.g. Amina Otieno" value={draft.fullName} onChange={(event) => updateField("fullName", event.target.value)} /></label>
              <label className="form-group">Work email<input required type="email" autoComplete="email" placeholder="name@organization.com" value={draft.email} onChange={(event) => updateField("email", event.target.value)} /></label>
              <label className="form-group">Password<input required type="password" autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} /></label>
              <label className="form-group"><span className="form-label-line">Phone number <span className="optional-label">Optional</span></span><input type="tel" autoComplete="tel" placeholder="+1 (555) 000-0000" value={draft.phone} onChange={(event) => updateField("phone", event.target.value)} /></label>
              <label className="form-group">Access role<select value={draft.role} onChange={(event) => updateField("role", event.target.value)}><option>Staff</option><option>Administrator</option><option>Manager</option><option>Clinician</option></select></label>
            </div>
            <div className="accounts-local-note"><span aria-hidden="true">i</span><p>Profiles and password hashes stay in this browser. This is not secure for production use.</p></div>
            <button className="primary-button accounts-submit" type="submit"><span aria-hidden="true">＋</span>Create account</button>
          </form>
        </section>

        <section className="accounts-panel directory-panel" aria-labelledby="workspace-accounts-heading">
          <div className="accounts-panel-header directory-header">
            <div>
              <span className="accounts-section-label">DIRECTORY</span>
              <h2 id="workspace-accounts-heading">Workspace accounts</h2>
              <p>{accounts.length ? "Members who can sign in on this browser." : "Staff accounts available on this browser."}</p>
            </div>
            <span className="directory-count">{accounts.length}</span>
          </div>
          {accounts.length > 0 ? <ul className="accounts-list">
            {accounts.map((account) => (
              <li className="account-row" key={account.id}>
                <div className="account-avatar" aria-hidden="true">{account.fullName.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</div>
                <div className="account-identity"><strong>{account.fullName}</strong><span>{account.email}</span></div>
                <span className="account-role">{account.role}</span>
                {account.phone && <span className="account-phone">{account.phone}</span>}
              </li>
            ))}
          </ul> : <div className="accounts-empty">
            <span className="accounts-empty-icon" aria-hidden="true">◉</span>
            <h3>No accounts yet</h3>
            <p>Your staff directory will appear here once you add your first account.</p>
          </div>}
        </section>
      </div>
    </div>
  );
}

export default Accounts;
