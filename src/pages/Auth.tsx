import { useState } from "react";
import { Check, Minus } from "lucide-react";
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useAppData } from "../hooks/useAppData";
import type { CompanyRegistrationInput } from "../hooks/authContext";
import type { AccountInput, SubscriptionPlan } from "../types/models";
import { defaultSettings } from "../data/seedData";
import { formatKES } from "../services/currencyFormatting";
import PasswordInput from "../components/PasswordInput";
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
            <PasswordInput required minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" />
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
  const [step, setStep] = useState<1 | 2>(1);
  const [isComplete, setIsComplete] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [domain, setDomain] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("Kenya");
  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlan>("Free");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [member, setMember] = useState<AccountInput>({ fullName: "", email: "", phone: "", role: "Team Member" });
  const [memberPassword, setMemberPassword] = useState("");
  const [memberFeedback, setMemberFeedback] = useState("");
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState("");

  const subscriptionOptions = [
    { plan: "Free", price: 0, seats: 3, description: "Explore PulseChart free for 14 days." },
    { plan: "Starter", price: 1500, seats: 5, description: "For small teams getting started." },
    { plan: "Most Popular", price: 4900, seats: 20, description: "For growing communication teams." },
    { plan: "Premium", price: 12000, seats: 50, description: "Advanced operations and scaling." },
  ] as const;
  const subscriptionComparisonRows: { label: string; values: (string | boolean)[] }[] = [
    { label: "Company accounts", values: subscriptionOptions.map((option) => `Up to ${option.seats}`) },
    { label: "Shared team inbox", values: [true, true, true, true] },
    { label: "Contact management", values: [true, true, true, true] },
    { label: "Basic activity reports", values: [true, true, true, true] },
    { label: "Expanded reporting", values: [false, false, true, true] },
    { label: "Customer support", values: [true, true, true, true] },
  ];
  const selectedSubscription = subscriptionOptions.find((option) => option.plan === subscriptionPlan) ?? subscriptionOptions[0];

  if (session && !isSubmitting && !isComplete) return <Navigate to="/dashboard" replace />;

  if ((workspace || accounts.length > 0) && !isComplete) {
    return (
      <main className="tenant-auth-page">
        <section className="tenant-auth-card company-auth-card" aria-labelledby="existing-workspace-heading">
          <AuthBrand />
          <span className="tenant-auth-eyebrow">WORKSPACE READY</span>
          <h1 id="existing-workspace-heading">Welcome back</h1>
          <p className="tenant-auth-description">
            {workspace
              ? `${workspace.companyName} is ready. Choose your account to continue.`
              : "Select an account to continue."}
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
              No sign-in account was found. Contact your workspace administrator for help.
            </p>
          )}
          <p className="tenant-auth-switch"><Link to="/login">Sign in with a different email</Link></p>
        </section>
      </main>
    );
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedDomain = domain.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
    if (!/^(?=.{1,253}$)(?!-)[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$/.test(normalizedDomain)) {
      setError("Enter a valid company domain, such as company.co.ke.");
      return;
    }
    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const subscriptionStartedAt = new Date();
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
        system_preferences: defaultSettings.system,
        notification_preferences: defaultSettings.notifications,
        subscription: {
          plan: selectedSubscription.plan,
          billingCycle,
          price: selectedSubscription.plan === "Free" ? 0 : billingCycle === "yearly" ? selectedSubscription.price * 10 : selectedSubscription.price,
          seats: selectedSubscription.seats,
          startedAt: subscriptionStartedAt.toISOString(),
          trialEndsAt: selectedSubscription.plan === "Free"
            ? new Date(subscriptionStartedAt.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString()
            : undefined,
          status: selectedSubscription.plan === "Free" ? "trial" : "payment_pending",
        },
      };
      await registerCompany(input);
      setInviteCode(input.invite_code);
      setIsComplete(true);
    } catch (registrationError) {
      setError(errorMessage(registrationError));
    } finally {
      setIsSubmitting(false);
    }
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
          : "Unable to securely save this password. Please try again.");
        return;
      }
      setMember({ fullName: "", email: "", phone: "", role: "Team Member" });
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

  const continueToPackage = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedDomain = domain.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
    if (!/^(?=.{1,253}$)(?!-)[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$/.test(normalizedDomain)) {
      setError("Enter a valid company domain, such as company.co.ke.");
      return;
    }
    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }
    setError("");
    setStep(2);
  };

  if (isComplete) {
    return (
      <main className="tenant-auth-page company-signup-page">
        <section className="tenant-auth-card company-auth-card" aria-labelledby="workspace-ready-heading">
          <AuthBrand />
          <span className="tenant-auth-eyebrow">WORKSPACE READY</span>
          <h1 id="workspace-ready-heading">{companyName} is set up</h1>
          <p className="tenant-auth-description">Share the invite code or add a team member now.</p>
          <div className="tenant-auth-invite">
            <label htmlFor="workspace-invite-code">Workspace invite code</label>
            <div className="tenant-auth-invite-row"><input id="workspace-invite-code" readOnly value={inviteCode} /><button className="secondary-button" type="button" onClick={() => void copyInviteCode()}>Copy code</button></div>
            <p>Team members can enter this code on the sign-up page.</p>
            {copyFeedback && <span role="status">{copyFeedback}</span>}
          </div>
          <form className="tenant-auth-team-form" onSubmit={(event) => void addTeamMember(event)}>
            <div className="tenant-auth-section-label">ADD A TEAM MEMBER</div>
            <label>Full name<input required value={member.fullName} onChange={(event) => setMember((current) => ({ ...current, fullName: event.target.value }))} /></label>
            <label>Email address<input required type="email" value={member.email} onChange={(event) => setMember((current) => ({ ...current, email: event.target.value }))} /></label>
            <label>Role<select value={member.role} onChange={(event) => setMember((current) => ({ ...current, role: event.target.value }))}><option>Staff</option><option>Manager</option></select></label>
            <label>Password<PasswordInput required minLength={8} autoComplete="new-password" value={memberPassword} onChange={(event) => setMemberPassword(event.target.value)} placeholder="At least 8 characters" /></label>
            {memberFeedback && <div className="tenant-auth-notice" role="status">{memberFeedback}</div>}
            <button className="secondary-button" type="submit" disabled={isAddingMember}>{isAddingMember ? "Adding member..." : "Add team member"}</button>
          </form>
          <button className="tenant-auth-submit" type="button" onClick={() => navigate("/dashboard", { replace: true })}>Go to workspace</button>
        </section>
      </main>
    );
  }

  return (
    <main className="tenant-auth-page company-signup-page">
      <section className="tenant-auth-card company-auth-card company-signup-card" aria-labelledby="company-signup-heading">
        <AuthBrand />
        <div className="company-signup-progress" aria-label={`Signup step ${step} of 2`}>
          <div className={step === 1 ? "current" : "complete"}><span>01</span><strong>Company & administrator</strong></div>
          <div className={step === 2 ? "current" : "upcoming"}><span>02</span><strong>Subscription package</strong></div>
        </div>
        <span className="tenant-auth-eyebrow">STEP {step} OF 2 · {step === 1 ? "COMPANY SETUP" : "SUBSCRIPTION"}</span>
        <h1 id="company-signup-heading">{step === 1 ? "Create your workspace" : "Choose your package"}</h1>
        <p className="tenant-auth-description">
          {step === 1
            ? "Enter your company details and administrator account to continue."
            : "Choose a trial or paid package for your team. Your company and administrator details are saved."}
        </p>
        {error && <div className="tenant-auth-error" role="alert">{error}</div>}
        {step === 1 ? (
          <form className="tenant-auth-form company-signup-form" onSubmit={continueToPackage}>
            <div className="company-signup-form-grid">
              <section className="company-signup-section" aria-labelledby="company-details-heading">
                <div className="company-signup-section-heading"><span>01</span><div><h2 id="company-details-heading">Company details</h2><p>Basic information for your workspace.</p></div></div>
                <div className="company-signup-fields">
                  <label>Company name<input required autoComplete="organization" value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder="e.g. Acme Health Group" /></label>
                  <label>Business web domain<input required autoComplete="url" value={domain} onChange={(event) => setDomain(event.target.value)} placeholder="company.co.ke" /></label>
                  <label>Industry<select required value={industry} onChange={(event) => setIndustry(event.target.value)}><option value="">Select your industry</option><option>Healthcare</option><option>Technology</option><option>Finance & Banking</option><option>Education</option><option>Retail & E-commerce</option><option>Professional Services</option><option>Manufacturing</option><option>Other</option></select></label>
                  <label>Country<select value={country} onChange={(event) => setCountry(event.target.value)}><option>Kenya</option><option>Uganda</option><option>Tanzania</option><option>Rwanda</option><option>Ethiopia</option><option>South Africa</option><option>Nigeria</option><option>Other</option></select></label>
                </div>
              </section>

              <section className="company-signup-section" aria-labelledby="administrator-heading">
                <div className="company-signup-section-heading"><span>02</span><div><h2 id="administrator-heading">Administrator</h2><p>Sign-in details for the workspace owner.</p></div></div>
                <div className="company-signup-fields">
                  <label>Full name<input required autoComplete="name" value={adminName} onChange={(event) => setAdminName(event.target.value)} placeholder="Your full name" /></label>
                  <label>Work email<input required type="email" autoComplete="email" value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} placeholder="you@company.co.ke" /></label>
                  <label>Job title<input required autoComplete="organization-title" value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} placeholder="e.g. Founder or Operations Director" /></label>
                  <label>Password<PasswordInput required minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" /></label>
                </div>
              </section>
            </div>
            <button className="tenant-auth-submit company-signup-submit" type="submit">Continue to subscription</button>
          </form>
        ) : (
          <form className="tenant-auth-form company-signup-form" onSubmit={(event) => void submit(event)}>
            <section className="company-signup-section company-signup-plan-section" aria-labelledby="package-heading">
              <div className="company-signup-section-heading"><span>02</span><div><h2 id="package-heading">Subscription package</h2><p>Select a plan for {companyName}.</p></div></div>
              <div className="company-signup-summary">
                <span>Administrator</span>
                <strong>{adminName}</strong>
                <small>{adminEmail} · {jobTitle}</small>
              </div>
              <div className="company-package-cards" role="group" aria-label="Subscription packages">
                {subscriptionOptions.map((option, index) => {
                  const isSelected = subscriptionPlan === option.plan;
                  return (
                    <article className={`company-package-card package-${option.plan.toLowerCase().replaceAll(" ", "-")}${isSelected ? " selected" : ""}`} key={option.plan}>
                      <button className="company-package-card-header" type="button" aria-pressed={isSelected} onClick={() => setSubscriptionPlan(option.plan)}>
                        <strong>{option.plan}</strong>
                        <span>{option.plan === "Free" ? "Free" : formatKES(billingCycle === "yearly" ? option.price * 10 : option.price)}</span>
                        <small>{option.plan === "Free" ? "14 days" : `/${billingCycle === "yearly" ? "year" : "month"}`}</small>
                        <small>{option.plan === "Free" ? "14-day trial" : isSelected ? "Selected" : "Paid plan"}</small>
                      </button>
                      <p className="company-package-card-description">{option.description}</p>
                      <ul className="company-package-card-features">
                        {subscriptionComparisonRows.map((row) => {
                          const value = row.values[index];
                          return (
                            <li key={row.label}>
                              {typeof value === "string"
                                ? <><Check size={15} aria-hidden="true" /><span>{row.label}: <strong>{value}</strong></span></>
                                : value
                                  ? <><Check size={15} aria-hidden="true" /><span>{row.label}</span></>
                                  : <><Minus size={15} aria-hidden="true" /><span className="not-included">{row.label}</span></>}
                            </li>
                          );
                        })}
                      </ul>
                      <button className="company-package-card-select" type="button" aria-pressed={isSelected} onClick={() => setSubscriptionPlan(option.plan)}>
                        {isSelected ? option.plan === "Free" ? "Free trial selected" : "Selected" : `Select ${option.plan}`}
                      </button>
                    </article>
                  );
                })}
              </div>
              {subscriptionPlan !== "Free" && <div className="tenant-auth-payment-note" role="status">
                <strong>Payment setup</strong>
                <span>Checkout is not connected. No payment details are collected and no charge will be made.</span>
                <div className="tenant-auth-choice-toggle compact" role="group" aria-label="Billing cycle">
                  <button type="button" aria-pressed={billingCycle === "monthly"} onClick={() => setBillingCycle("monthly")}>Monthly</button>
                  <button type="button" aria-pressed={billingCycle === "yearly"} onClick={() => setBillingCycle("yearly")}>Yearly · 2 months free</button>
                </div>
              </div>}
              {subscriptionPlan === "Free" && <p className="tenant-auth-small-note">The Free plan includes 14 days of access.</p>}
            </section>
            <div className="tenant-auth-step-actions company-signup-step-actions">
              <button className="secondary-button" type="button" onClick={() => { setError(""); setStep(1); }}>Back</button>
              <button className="tenant-auth-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Creating workspace..." : "Create workspace"}</button>
            </div>
          </form>
        )}
        <p className="tenant-auth-switch"><Link to="/login">Already have an account? Sign in</Link></p>
      </section>
    </main>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { accounts, workspace } = useAppData();
  const { session, login } = useAuth();
  const [email, setEmail] = useState(() => searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  if (session) return <Navigate to="/dashboard" replace />;

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      await login(email.trim(), password);
      navigate("/dashboard", { replace: true });
    } catch (loginError) {
      setError(errorMessage(loginError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="tenant-auth-page login-auth-page">
      <section className="tenant-auth-card" aria-labelledby="login-heading">
        <AuthBrand />
        <span className="tenant-auth-eyebrow">MEMBER ACCESS</span>
        <h1 id="login-heading">Welcome back</h1>
        <p className="tenant-auth-description">
          {workspace ? `Sign in to ${workspace.companyName} using your work email and password.` : "Sign in using your work email and password."}
        </p>
        {accounts.length === 0 && (
          <div className="tenant-auth-notice" role="status">
            No account was found. <Link to="/company-signup">Create a company workspace</Link> to get started.
          </div>
        )}
        {error && <div className="tenant-auth-error" role="alert">{error}</div>}
        <form className="tenant-auth-form" onSubmit={submit}>
          <label>Email address
            <input required type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" />
          </label>
          <label>Password
            <PasswordInput required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" />
          </label>
          <button className="tenant-auth-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Signing in..." : "Sign in"}</button>
        </form>
        {workspace && <p className="tenant-auth-switch">Have an invite code? <Link to="/signup">Join this workspace</Link></p>}
        {!workspace && <p className="tenant-auth-switch">New to PulseChart? <Link to="/company-signup">Create a company workspace</Link></p>}
      </section>
    </main>
  );
}

export const SignInPage = LoginPage;
