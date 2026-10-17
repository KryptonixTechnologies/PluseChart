import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useAppData } from "../hooks/useAppData";
import type { CompanyRegistrationInput } from "../hooks/authContext";
import type { AccountInput, NotificationPreferences, SystemPreferences } from "../types/models";
import { defaultSettings } from "../data/seedData";
import { formatKES } from "../services/currencyFormatting";
import "./auth.css";

function AuthBrand() {
  return (
    <a className="tenant-auth-brand" href="/login" aria-label="PulseChart sign in">
      <span className="tenant-auth-mark">P</span>
      <span>PulseChart<small>COMMUNICATION WORKSPACE</small></span>
    </a>
  );
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

export function SignupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { code: routeInviteCode } = useParams();
  const [searchParams] = useSearchParams();
  const { session, register } = useAuth();
  const [inviteCode, setInviteCode] = useState(() => routeInviteCode || searchParams.get("code") || searchParams.get("invite") || "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (session) return <Navigate to="/dashboard" replace />;

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = inviteCode.trim();
    if (!code) {
      setError("Enter a valid invite code or open your company's invite link.");
      return;
    }
    if (password.length < 8) {
      setError("Your password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        invite_code: code,
      });
      navigate("/dashboard", { replace: true });
    } catch (submitError) {
      setError(errorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateInviteCode = (value: string) => {
    setInviteCode(value);
  };

  return (
    <main className="tenant-auth-page">
      <section className="tenant-auth-card" aria-labelledby="signup-heading">
        <AuthBrand />
        <span className="tenant-auth-eyebrow">JOIN YOUR WORKSPACE</span>
        <h1 id="signup-heading">Create your account</h1>
        <p className="tenant-auth-description">Enter the invite code from your workspace administrator to join that workspace.</p>
        {error && <div className="tenant-auth-error" role="alert">{error}</div>}
        <form className="tenant-auth-form" onSubmit={submit}>
          <label>Invite code
            <input required autoComplete="one-time-code" value={inviteCode} onChange={(event) => updateInviteCode(event.target.value)} placeholder="Enter your invite code" />
          </label>
          <label>Your name
            <input required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name" />
          </label>
          <label>Email address
            <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" />
          </label>
          <label>Password
            <input required type="password" minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" />
          </label>
          <button className="tenant-auth-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Creating account..." : "Create account"}</button>
        </form>
        <p className="tenant-auth-switch">Already have an account? <Link to="/login" state={location.state}>Sign in</Link></p>
        <p className="tenant-auth-switch">Creating a new company? <Link to="/company-signup">Register your company</Link></p>
      </section>
    </main>
  );
}

export function CompanySignupPage() {
  const navigate = useNavigate();
  const { session, registerCompany } = useAuth();
  const { accounts, workspace, addAccount } = useAppData();
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState("");
  const [domain, setDomain] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("Kenya");
  const [subscriptionPlan, setSubscriptionPlan] = useState<"Starter" | "Growth" | "Enterprise">("Starter");
  const [subscriptionMode, setSubscriptionMode] = useState<"trial" | "paid">("trial");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [systemPreferences, setSystemPreferences] = useState<SystemPreferences>(defaultSettings.system);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(defaultSettings.notifications);
  const [member, setMember] = useState<AccountInput>({ fullName: "", email: "", phone: "", role: "Staff" });
  const [memberPassword, setMemberPassword] = useState("");
  const [memberFeedback, setMemberFeedback] = useState("");
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState("");

  const subscriptionOptions = [
    { plan: "Starter", price: 1500, seats: 5, description: "For small teams getting started." },
    { plan: "Growth", price: 4900, seats: 20, description: "For growing communication teams." },
    { plan: "Enterprise", price: 12000, seats: 50, description: "Advanced operations and scaling." },
  ] as const;

  const selectedSubscription = subscriptionOptions.find((option) => option.plan === subscriptionPlan) ?? subscriptionOptions[0];
  const flowStage = step <= 2 ? 1 : step === 3 ? 2 : step === 4 ? 3 : 4;

  if (session && step === 1) return <Navigate to="/dashboard" replace />;

  if ((workspace || accounts.length > 0) && step === 1) {
    return (
      <main className="tenant-auth-page">
        <section className="tenant-auth-card company-auth-card" aria-labelledby="existing-workspace-heading">
          <AuthBrand />
          <span className="tenant-auth-eyebrow">WORKSPACE READY</span>
          <h1 id="existing-workspace-heading">Welcome back</h1>
          <p className="tenant-auth-description">
            {workspace
              ? `${workspace.companyName} is ready. Choose your account to continue.`
              : "Choose a saved account to continue."}
          </p>
          {accounts.length > 0 ? (
            <div className="tenant-auth-form">
              {accounts.map((account) => (
                <Link
                  className="tenant-auth-account-link"
                  key={account.id}
                  to={`/login?email=${encodeURIComponent(account.email)}`}
                >
                  <span>{account.fullName}</span>
                  <small>{account.email} · {account.role}</small>
                </Link>
              ))}
            </div>
          ) : (
            <p className="tenant-auth-error" role="status">
              No local sign-in account was found. Go to sign in to check another saved email, or clear this site's browser data to start over.
            </p>
          )}
          <p className="tenant-auth-switch"><Link to="/login">Sign in with a different email</Link></p>
        </section>
      </main>
    );
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const input: CompanyRegistrationInput = {
        company_name: companyName.trim(),
        domain: domain.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "").toLowerCase(),
        industry,
        country,
        admin_name: adminName.trim(),
        admin_email: adminEmail.trim(),
        admin_password: password,
        admin_job_title: jobTitle.trim(),
        invite_code: crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase(),
        system_preferences: systemPreferences,
        notification_preferences: notificationPreferences,
        subscription: {
          plan: selectedSubscription.plan,
          billingCycle,
          price: subscriptionMode === "trial" ? 0 : billingCycle === "yearly" ? selectedSubscription.price * 10 : selectedSubscription.price,
          seats: selectedSubscription.seats,
          startedAt: new Date().toISOString(),
          status: subscriptionMode === "trial" ? "trial" : "payment_pending",
        },
      };
      await registerCompany(input);
      setInviteCode(input.invite_code);
      setStep(5);
    } catch (registrationError) {
      setError(errorMessage(registrationError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    setError("");
    setStep((current) => Math.min(current + 1, 4));
  };

  const backStep = () => {
    setError("");
    setStep((current) => Math.max(current - 1, 1));
  };

  const addTeamMember = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsAddingMember(true);
    setMemberFeedback("");
    try {
      const result = await addAccount({
        ...member,
        fullName: member.fullName.trim(),
        email: member.email.trim(),
      }, memberPassword);
      if (result !== "created") {
        setMemberFeedback(result === "duplicate"
          ? "An account with this email already exists."
          : "Secure password storage is unavailable in this browser.");
        return;
      }
      setMember({ fullName: "", email: "", phone: "", role: "Staff" });
      setMemberPassword("");
      setMemberFeedback("Team member added. They can sign in with their email and password.");
    } finally {
      setIsAddingMember(false);
    }
  };

  const copyInviteCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopyFeedback("Invite code copied.");
    } catch {
      setCopyFeedback("Select and copy the invite code manually.");
    }
  };

  const validateStep = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step === 1) {
      const normalizedDomain = domain.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
      if (!/^(?=.{1,253}$)(?!-)[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$/.test(normalizedDomain)) {
        setError("Enter a valid company domain, such as company.co.ke.");
        return;
      }
    }
    if (step === 2 && password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }
    nextStep();
  };

  return (
    <main className="tenant-auth-page">
      <section className="tenant-auth-card company-auth-card" aria-labelledby="company-signup-heading">
        <AuthBrand />
        <div className="tenant-auth-flow" aria-label={`Signup flow, stage ${flowStage} of 4`}>
          {[
            { title: "Company signs up", description: "Company name + admin details" },
            { title: "Chooses a plan", description: "Trial or paid subscription + payment" },
            { title: "Account provisioned", description: "Company + admin user created" },
            { title: "Workspace ready", description: "Admin gets a signup link/code" },
          ].map((flowStep, index) => {
            const stage = index + 1;
            const status = stage < flowStage ? "complete" : stage === flowStage ? "current" : "upcoming";
            return (
              <div className="tenant-auth-flow-item" key={flowStep.title}>
                <div className={`tenant-auth-flow-node stage-${stage} ${status}`} aria-current={stage === flowStage ? "step" : undefined}>
                  <strong>{flowStep.title}</strong>
                  <span>{flowStep.description}</span>
                </div>
                {stage < 4 && <span className="tenant-auth-flow-connector" aria-hidden="true" />}
              </div>
            );
          })}
        </div>
        <span className="tenant-auth-eyebrow">SIGNUP FLOW · STAGE {flowStage} OF 4</span>
        <h1 id="company-signup-heading">
          {step === 1 ? "Company details" : step === 2 ? "Administrator account" : step === 3 ? "Choose a plan" : step === 4 ? "Workspace preferences" : "Invite your team"}
        </h1>
        <p className="tenant-auth-description">
          {step === 1 && "Add the basic details for your company workspace."}
          {step === 2 && "Create the Administrator account you’ll use to sign in."}
          {step === 3 && "Select a trial or paid plan before the company and admin account are provisioned."}
          {step === 4 && "Choose how dates and notifications are handled before provisioning the workspace."}
          {step === 5 && `${companyName} is set up. Share the invite code or add a team member now.`}
        </p>
        {error && <div className="tenant-auth-error" role="alert">{error}</div>}
        {step === 1 && <form className="tenant-auth-form" onSubmit={validateStep}>
          <label>Company name<input required autoComplete="organization" value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder="e.g. Acme Health Group" /></label>
          <label>Business web domain<input required autoComplete="url" value={domain} onChange={(event) => setDomain(event.target.value)} placeholder="company.co.ke" /></label>
          <label>Industry<select required value={industry} onChange={(event) => setIndustry(event.target.value)}><option value="">Select your industry</option><option>Healthcare</option><option>Technology</option><option>Finance & Banking</option><option>Education</option><option>Retail & E-commerce</option><option>Professional Services</option><option>Manufacturing</option><option>Other</option></select></label>
          <label>Country<select value={country} onChange={(event) => setCountry(event.target.value)}><option>Kenya</option><option>Uganda</option><option>Tanzania</option><option>Rwanda</option><option>Ethiopia</option><option>South Africa</option><option>Nigeria</option><option>Other</option></select></label>
          <button className="tenant-auth-submit" type="submit">Continue to administrator setup</button>
        </form>}
        {step === 2 && <form className="tenant-auth-form" onSubmit={validateStep}>
          <label>Full name<input required autoComplete="name" value={adminName} onChange={(event) => setAdminName(event.target.value)} placeholder="Your full name" /></label>
          <label>Work email<input required type="email" autoComplete="email" value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} placeholder="you@company.co.ke" /></label>
          <label>Job title<input required autoComplete="organization-title" value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} placeholder="e.g. Founder or Operations Director" /></label>
          <label>Password<input required type="password" minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" /></label>
          <div className="tenant-auth-step-actions"><button className="secondary-button" type="button" onClick={backStep}>Back</button><button className="tenant-auth-submit" type="submit">Continue to plan selection</button></div>
        </form>}
        {step === 3 && <form className="tenant-auth-form" onSubmit={validateStep}>
          <div className="tenant-auth-choice-toggle" role="group" aria-label="Subscription type">
            <button type="button" aria-pressed={subscriptionMode === "trial"} onClick={() => setSubscriptionMode("trial")}>Start with a trial</button>
            <button type="button" aria-pressed={subscriptionMode === "paid"} onClick={() => setSubscriptionMode("paid")}>Choose a paid plan</button>
          </div>
          <div className="tenant-auth-plan-grid" role="group" aria-label="Subscription plan">
            {subscriptionOptions.map((option) => (
              <button className={subscriptionPlan === option.plan ? "tenant-auth-plan selected" : "tenant-auth-plan"} type="button" key={option.plan} aria-pressed={subscriptionPlan === option.plan} onClick={() => setSubscriptionPlan(option.plan)}>
                <strong>{option.plan}</strong>
                <span>{option.description}</span>
                <b>{subscriptionMode === "trial" ? "Free trial" : `${formatKES(billingCycle === "yearly" ? option.price * 10 : option.price)} / ${billingCycle === "yearly" ? "year" : "month"}`}</b>
                <small>Up to {option.seats} team accounts</small>
              </button>
            ))}
          </div>
          {subscriptionMode === "paid" && <div className="tenant-auth-payment-note" role="status">
            <strong>Payment step</strong>
            <span>Checkout is not connected yet. No payment details are collected and no charge will be made; this plan will be saved as pending.</span>
            <div className="tenant-auth-choice-toggle compact" role="group" aria-label="Billing cycle">
              <button type="button" aria-pressed={billingCycle === "monthly"} onClick={() => setBillingCycle("monthly")}>Monthly</button>
              <button type="button" aria-pressed={billingCycle === "yearly"} onClick={() => setBillingCycle("yearly")}>Yearly · 2 months free</button>
            </div>
          </div>}
          {subscriptionMode === "trial" && <p className="tenant-auth-small-note">Trial duration and payment setup are not configured in this local build.</p>}
          <div className="tenant-auth-step-actions"><button className="secondary-button" type="button" onClick={backStep}>Back</button><button className="tenant-auth-submit" type="submit">Continue to workspace setup</button></div>
        </form>}
        {step === 4 && <form className="tenant-auth-form" onSubmit={(event) => { event.preventDefault(); void submit(event); }}>
          <label>Language<select value={systemPreferences.language} onChange={(event) => setSystemPreferences((current) => ({ ...current, language: event.target.value }))}><option>English</option></select></label>
          <label>Time zone<select value={systemPreferences.timeZone} onChange={(event) => setSystemPreferences((current) => ({ ...current, timeZone: event.target.value }))}><option value="Africa/Nairobi">East Africa Time (EAT)</option><option value="UTC">UTC</option></select></label>
          <label>Date format<select value={systemPreferences.dateFormat} onChange={(event) => setSystemPreferences((current) => ({ ...current, dateFormat: event.target.value }))}><option>DD/MM/YYYY</option><option>MM/DD/YYYY</option><option>YYYY-MM-DD</option></select></label>
          {([
            ["emailNotifications", "Email notifications"],
            ["messageNotifications", "Message notifications"],
            ["weeklyReports", "Weekly reports"],
          ] as const).map(([field, label]) => <label className="tenant-auth-checkbox" key={field}><input type="checkbox" checked={notificationPreferences[field]} onChange={(event) => setNotificationPreferences((current) => ({ ...current, [field]: event.target.checked }))} />{label}</label>)}
          <p className="tenant-auth-small-note">Notification preferences are saved for this workspace. No notifications are sent from this frontend.</p>
          <div className="tenant-auth-step-actions"><button className="secondary-button" type="button" onClick={backStep}>Back</button><button className="tenant-auth-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Provisioning account..." : "Provision account"}</button></div>
        </form>}
        {step === 5 && <div className="tenant-auth-form">
          <div className="tenant-auth-invite">
            <label htmlFor="workspace-invite-code">Workspace invite code</label>
            <div className="tenant-auth-invite-row"><input id="workspace-invite-code" readOnly value={inviteCode} /><button className="secondary-button" type="button" onClick={() => void copyInviteCode()}>Copy code</button></div>
            <p>Team members can enter this code on the sign-up page in this browser.</p>
            {copyFeedback && <span role="status">{copyFeedback}</span>}
          </div>
          <form className="tenant-auth-team-form" onSubmit={(event) => void addTeamMember(event)}>
            <div className="tenant-auth-section-label">ADD A TEAM MEMBER</div>
            <label>Full name<input required value={member.fullName} onChange={(event) => setMember((current) => ({ ...current, fullName: event.target.value }))} /></label>
            <label>Email address<input required type="email" value={member.email} onChange={(event) => setMember((current) => ({ ...current, email: event.target.value }))} /></label>
            <label>Role<select value={member.role} onChange={(event) => setMember((current) => ({ ...current, role: event.target.value }))}><option>Staff</option><option>Manager</option><option>Clinician</option></select></label>
            <label>Password<input required type="password" minLength={8} value={memberPassword} onChange={(event) => setMemberPassword(event.target.value)} placeholder="At least 8 characters" /></label>
            {memberFeedback && <div className="tenant-auth-notice" role="status">{memberFeedback}</div>}
            <button className="secondary-button" type="submit" disabled={isAddingMember}>{isAddingMember ? "Adding member..." : "Add team member"}</button>
          </form>
          <button className="tenant-auth-submit" type="button" onClick={() => navigate("/dashboard", { replace: true })}>Go to workspace</button>
        </div>}
        {step < 5 && <p className="tenant-auth-switch"><Link to="/login">Already have an account? Sign in</Link></p>}
      </section>
    </main>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { accounts, workspace } = useAppData();
  const { session, login } = useAuth();
  const [email, setEmail] = useState(() => searchParams.get("email") ?? accounts[0]?.email ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const destination = accounts.find((account) => account.email.toLowerCase() === email.trim().toLowerCase())?.role === "Administrator"
    ? "/subscription"
    : "/dashboard";

  if (session) return <Navigate to={session.user.role === "Administrator" ? "/subscription" : "/dashboard"} replace />;

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      await login(email.trim(), password);
      navigate(destination, { replace: true });
    } catch (loginError) {
      setError(errorMessage(loginError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="tenant-auth-page">
      <section className="tenant-auth-card" aria-labelledby="login-heading">
        <AuthBrand />
        <span className="tenant-auth-eyebrow">MEMBER ACCESS</span>
        <h1 id="login-heading">Welcome back</h1>
        <p className="tenant-auth-description">
          {workspace ? `Sign in to ${workspace.companyName} with an account saved in this browser.` : "Sign in with an account saved in this browser."}
        </p>
        {accounts.length === 0 && (
          <div className="tenant-auth-notice" role="status">
            No saved accounts were found in this browser. <Link to="/company-signup">Create a local workspace</Link> to get started.
          </div>
        )}
        {error && <div className="tenant-auth-error" role="alert">{error}</div>}
        <form className="tenant-auth-form" onSubmit={submit}>
          {accounts.length > 1 ? (
            <label>Choose saved account
              <select value={email} onChange={(event) => setEmail(event.target.value)}>
                <option value="">Choose your account</option>
                {accounts.map((account) => <option key={account.id} value={account.email}>{account.fullName} · {account.email}</option>)}
              </select>
            </label>
          ) : (
            <label>Email address
              <input required type="email" autoComplete="username" list="saved-account-emails" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" />
              <datalist id="saved-account-emails">
                {accounts.map((account) => <option key={account.id} value={account.email}>{account.fullName}</option>)}
              </datalist>
            </label>
          )}
          <label>Password
            <input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" />
          </label>
          <button className="tenant-auth-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Signing in..." : "Sign in"}</button>
        </form>
        {workspace && <p className="tenant-auth-switch">Need another local account? Add one after signing in from the Accounts page.</p>}
        {!workspace && <p className="tenant-auth-switch">New to PulseChart? <Link to="/company-signup">Create a company workspace</Link></p>}
      </section>
    </main>
  );
}

export const SignInPage = LoginPage;
