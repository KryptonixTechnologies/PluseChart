import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAppData } from "../hooks/useAppData";

function AuthBrand() {
  return (
    <div className="auth-brand">
      <span className="auth-brand-mark">P</span>
      <span><strong>PulseChart</strong><small>Communication System</small></span>
    </div>
  );
}

function LocalStorageNotice() {
  return <p className="auth-local-note">Local browser accounts are for prototyping only. They are not secure production authentication.</p>;
}

export function SignInPage() {
  const navigate = useNavigate();
  const { accounts, currentAccount, signIn } = useAppData();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (currentAccount) return <Navigate to="/dashboard" replace />;

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    const success = await signIn(email, password);
    setIsSubmitting(false);
    if (success) navigate("/dashboard", { replace: true });
    else setError("We couldn't sign you in with those details. Check your email and password, or contact your administrator for access.");
  };

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="sign-in-heading">
        <AuthBrand />
        <span className="auth-kicker">MEMBER ACCESS</span>
        <h1 id="sign-in-heading">Welcome back</h1>
        <p className="auth-description">Sign in to continue to your communication workspace.</p>
        {error && <div className="form-error" role="alert">{error}</div>}
        <form className="auth-form" onSubmit={submit}>
          <label className="form-group">Email address<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label className="form-group">Password<input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          <button className="primary-button auth-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Signing in..." : "Sign in"}</button>
        </form>
        {accounts.length === 0
          ? <p className="auth-description">First time setting up PulseChart? <Link to="/setup">Create the initial administrator account</Link>.</p>
          : <p className="auth-description">Need access? Contact your workspace administrator to request an account.</p>}
        <LocalStorageNotice />
      </section>
    </main>
  );
}

export function FirstAdminSetupPage() {
  const navigate = useNavigate();
  const { accounts, currentAccount, createInitialAdmin } = useAppData();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (currentAccount) return <Navigate to="/dashboard" replace />;
  if (accounts.length > 0) return <Navigate to="/sign-in" replace />;

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("The passwords don't match.");
      return;
    }

    setIsSubmitting(true);
    const result = await createInitialAdmin({
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      role: "Administrator",
    }, password);
    setIsSubmitting(false);

    if (result === "created") navigate("/dashboard", { replace: true });
    else if (result === "closed") setError("Initial setup is already complete. Sign in with an existing account.");
    else setError("Secure password setup is unavailable in this browser. Use localhost or HTTPS.");
  };

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="setup-heading">
        <AuthBrand />
        <span className="auth-kicker">FIRST-TIME SETUP</span>
        <h1 id="setup-heading">Create the administrator</h1>
        <p className="auth-description">Set up the first administrator account. After this account is created, new accounts can only be added by a signed-in workspace member.</p>
        {error && <div className="form-error" role="alert">{error}</div>}
        <form className="auth-form" onSubmit={submit}>
          <label className="form-group">Full name<input required autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} /></label>
          <label className="form-group">Email address<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label className="form-group">Phone number <span className="optional-label">Optional</span><input type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
          <label className="form-group">Password<input required type="password" autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} /><span className="auth-field-hint">Use at least 8 characters.</span></label>
          <label className="form-group">Confirm password<input required type="password" autoComplete="new-password" minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label>
          <button className="primary-button auth-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Setting up..." : "Create administrator account"}</button>
        </form>
        <p className="auth-description"><Link to="/sign-in">Back to sign in</Link></p>
        <LocalStorageNotice />
      </section>
    </main>
  );
}