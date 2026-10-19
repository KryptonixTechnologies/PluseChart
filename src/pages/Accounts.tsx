import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useAppData } from "../hooks/useAppData";
import type { AccountInput } from "../types/models";
import PasswordInput from "../components/PasswordInput";
import ConfirmDialog from "../components/ConfirmDialog";

const emptyAccount: AccountInput = {
  fullName: "",
  email: "",
  phone: "",
  role: "Staff",
};

function Accounts() {
  const { accounts, currentAccount, addAccount, updateAccount, deleteAccount } = useAppData();
  const [draft, setDraft] = useState<AccountInput>(emptyAccount);
  const [password, setPassword] = useState("");
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<(typeof accounts)[number] | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isError, setIsError] = useState(false);

  const updateField = (field: keyof AccountInput, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const saveAccount = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fullName = draft.fullName.trim();
    const email = draft.email.trim().toLowerCase();
    if (!fullName) {
      setIsError(true);
      setFeedback("Enter the account holder's name.");
      return;
    }
    if (accounts.some((account) => account.id !== editingAccountId && account.email.toLowerCase() === email)) {
      setIsError(true);
      setFeedback("An account with this email already exists.");
      return;
    }

    const result = editingAccountId
      ? await updateAccount(editingAccountId, { ...draft, fullName, email }, password || undefined)
      : await addAccount({ ...draft, fullName, email }, password);
    const success = editingAccountId ? "updated" : "created";
    if (result !== success) {
      setIsError(true);
      setFeedback(result === "duplicate"
        ? "An account with this email already exists."
        : result === "not_found"
          ? "This account no longer exists. Refresh the directory and try again."
          : "Unable to securely save this password. Please try again.");
      return;
    }

    setDraft(emptyAccount);
    setPassword("");
    setEditingAccountId(null);
    setIsError(false);
    setFeedback(editingAccountId ? "Account updated." : "Account created successfully.");
  };

  const editAccount = (account: (typeof accounts)[number]) => {
    setDraft({ fullName: account.fullName, email: account.email, phone: account.phone, role: account.role });
    setPassword("");
    setEditingAccountId(account.id);
    setFeedback("");
  };

  const cancelEdit = () => {
    setDraft(emptyAccount);
    setPassword("");
    setEditingAccountId(null);
  };

  const confirmDelete = () => {
    if (!accountToDelete) return;
    const deleted = deleteAccount(accountToDelete.id);
    setAccountToDelete(null);
    setIsError(!deleted);
    setFeedback(deleted ? "Account deleted." : "You cannot delete the account you are currently signed in with.");
    if (editingAccountId === accountToDelete.id) cancelEdit();
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
              <span className="accounts-section-label">{editingAccountId ? "EDIT MEMBER" : "NEW MEMBER"}</span>
              <h2 id="create-account-heading">{editingAccountId ? "Edit account" : "Create account"}</h2>
              <p>{editingAccountId ? "Update this member's profile, access role, or password." : "Add a staff member to the workspace."}</p>
            </div>
          </div>
          <form className="accounts-form" onSubmit={saveAccount}>
            <div className="accounts-fields">
              <label className="form-group">Full name<input required autoComplete="name" placeholder="e.g. Amina Otieno" value={draft.fullName} onChange={(event) => updateField("fullName", event.target.value)} /></label>
              <label className="form-group">Work email<input required type="email" autoComplete="email" placeholder="name@organization.com" value={draft.email} onChange={(event) => updateField("email", event.target.value)} /></label>
              <label className="form-group">{editingAccountId ? "New password (optional)" : "Password"}<PasswordInput required={!editingAccountId} autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} /></label>
              <label className="form-group"><span className="form-label-line">Phone number <span className="optional-label">Optional</span></span><input type="tel" autoComplete="tel" placeholder="+1 (555) 000-0000" value={draft.phone} onChange={(event) => updateField("phone", event.target.value)} /></label>
              <label className="form-group">Access role<select value={draft.role} onChange={(event) => updateField("role", event.target.value)}><option>Staff</option><option>Administrator</option><option>Manager</option></select></label>
            </div>
            <div className="accounts-local-note"><span aria-hidden="true">i</span><p>Team members can sign in with the email and password you provide.</p></div>
            <div className="account-form-actions">
              {editingAccountId && <button className="secondary-button" type="button" onClick={cancelEdit}>Cancel edit</button>}
              <button className="primary-button accounts-submit" type="submit">{editingAccountId ? "Save changes" : <><span aria-hidden="true">＋</span>Create account</>}</button>
            </div>
          </form>
        </section>

        <section className="accounts-panel directory-panel" aria-labelledby="workspace-accounts-heading">
          <div className="accounts-panel-header directory-header">
            <div>
              <span className="accounts-section-label">DIRECTORY</span>
              <h2 id="workspace-accounts-heading">Workspace accounts</h2>
              <p>{accounts.length ? "Members with access to this workspace." : "Workspace members will appear here."}</p>
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
                <div className="account-actions">
                  <button className="account-action-button" type="button" aria-label={`Edit ${account.fullName}`} title="Edit account" onClick={() => editAccount(account)}><Pencil size={16} aria-hidden="true" /></button>
                  {currentAccount?.id !== account.id && <button className="account-action-button delete" type="button" aria-label={`Delete ${account.fullName}`} title="Delete account" onClick={() => setAccountToDelete(account)}><Trash2 size={16} aria-hidden="true" /></button>}
                </div>
              </li>
            ))}
          </ul> : <div className="accounts-empty">
            <span className="accounts-empty-icon" aria-hidden="true">◉</span>
            <h3>No accounts yet</h3>
            <p>Your staff directory will appear here once you add your first account.</p>
          </div>}
        </section>
      </div>
      {accountToDelete && <ConfirmDialog title="Delete account?" message={`This will permanently delete ${accountToDelete.fullName}'s account and sign-in credentials.`} onClose={() => setAccountToDelete(null)} onConfirm={confirmDelete} />}
    </div>
  );
}

export default Accounts;
