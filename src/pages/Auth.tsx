import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ApiError } from "../services/apiClient";
import type { CompanyRegistrationInput } from "../hooks/authContext";
import "./auth.css";

const inviteCodeStorageKey = "pulsechart.pendingInviteCode";
const companyReferenceStorageKey = "pulsechart.pendingCompanyReference";

function AuthBrand() {
  return (
    <a className="tenant-auth-brand" href="/login" aria-label="PulseChart sign in">
      <span className="tenant-auth-mark">P</span>
      <span>PulseChart<small>COMMUNICATION WORKSPACE</small></span>
    </a>
  );
}

function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

export function SignupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { code: routeInviteCode } = useParams();
  const [searchParams] = useSearchParams();
  const { session, register } = useAuth();
  const [inviteCode, setInviteCode] = useState(() => {
    const urlCode = routeInviteCode || searchParams.get("code") || searchParams.get("invite");
    if (urlCode) return urlCode;
    return window.sessionStorage.getItem(inviteCodeStorageKey) ?? "";
  });
  const companyReference = (() => {
    const urlCompany = searchParams.get("company_id") || searchParams.get("company");
    if (urlCompany) return urlCompany;
    return window.sessionStorage.getItem(companyReferenceStorageKey) ?? "";
  })();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (inviteCode.trim()) window.sessionStorage.setItem(inviteCodeStorageKey, inviteCode.trim());
    else window.sessionStorage.removeItem(inviteCodeStorageKey);
  }, [inviteCode]);

  useEffect(() => {
    if (companyReference.trim()) window.sessionStorage.setItem(companyReferenceStorageKey, companyReference.trim());
    else window.sessionStorage.removeItem(companyReferenceStorageKey);
  }, [companyReference]);

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
    window.sessionStorage.setItem(inviteCodeStorageKey, code);
    if (companyReference.trim()) {
      window.sessionStorage.setItem(companyReferenceStorageKey, companyReference.trim());
    }

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        invite_code: code,
        ...(companyReference.trim() ? { company_id: companyReference.trim() } : {}),
      });
      window.sessionStorage.removeItem(inviteCodeStorageKey);
      window.sessionStorage.removeItem(companyReferenceStorageKey);
      navigate("/dashboard", { replace: true });
    } catch (submitError) {
      setError(errorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateInviteCode = (value: string) => {
    setInviteCode(value);
    if (value.trim()) window.sessionStorage.setItem(inviteCodeStorageKey, value.trim());
    else window.sessionStorage.removeItem(inviteCodeStorageKey);
  };

  return (
    <main className="tenant-auth-page">
      <section className="tenant-auth-card" aria-labelledby="signup-heading">
        <AuthBrand />
        <span className="tenant-auth-eyebrow">JOIN YOUR WORKSPACE</span>
        <h1 id="signup-heading">Create your account</h1>
        <p className="tenant-auth-description">Use the invitation from your company administrator to join the right workspace.</p>
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
        {companyReference && <span className="tenant-auth-company-ref">Company reference detected from your invite.</span>}
      </section>
    </main>
  );
}

export function CompanySignupPage() {
  const navigate = useNavigate();
  const { session, registerCompany } = useAuth();
  const [companyName, setCompanyName] = useState("");
  const [domain, setDomain] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("Kenya");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (session) return <Navigate to="/dashboard" replace />;

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedDomain = domain.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
    if (!/^(?=.{1,253}$)(?!-)[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$/.test(normalizedDomain)) {
      setError("Enter a valid company domain, such as company.co.ke.");
      return;
    }
    if (password.length < 8) {
      setError("Your password must be at least 8 characters.");
      return;
    }

    const input: CompanyRegistrationInput = {
      company_name: companyName.trim(),
      domain: normalizedDomain.toLowerCase(),
      industry,
      country,
      admin_name: adminName.trim(),
      admin_email: adminEmail.trim(),
      admin_password: password,
      admin_job_title: jobTitle.trim(),
    };

    setIsSubmitting(true);
    setError("");
    try {
      await registerCompany(input);
      navigate("/dashboard", { replace: true });
    } catch (registrationError) {
      setError(errorMessage(registrationError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="tenant-auth-page">
      <section className="tenant-auth-card company-auth-card" aria-labelledby="company-signup-heading">
        <AuthBrand />
        <span className="tenant-auth-eyebrow">CREATE A COMPANY WORKSPACE</span>
        <h1 id="company-signup-heading">Set up your company</h1>
        <p className="tenant-auth-description">Register your organisation. Your account will be its first Administrator.</p>
        {error && <div className="tenant-auth-error" role="alert">{error}</div>}
        <form className="tenant-auth-form" onSubmit={submit}>
          <label>Company name
            <input required autoComplete="organization" value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder="e.g. Acme Health Group" />
          </label>
          <label>Business web domain
            <input required autoComplete="url" value={domain} onChange={(event) => setDomain(event.target.value)} placeholder="company.co.ke" />
          </label>
          <label>Industry
            <select required value={industry} onChange={(event) => setIndustry(event.target.value)}>
              <option value="">Select your industry</option>
              <option>Healthcare</option><option>Technology</option><option>Finance & Banking</option><option>Education</option><option>Retail & E-commerce</option><option>Professional Services</option><option>Manufacturing</option><option>Other</option>
            </select>
          </label>
          <label>Country
            <select value={country} onChange={(event) => setCountry(event.target.value)}>
              <option>Kenya</option><option>Uganda</option><option>Tanzania</option><option>Rwanda</option><option>Ethiopia</option><option>South Africa</option><option>Nigeria</option><option>Other</option>
            </select>
          </label>
          <div className="tenant-auth-section-label">Administrator</div>
          <label>Full name
            <input required autoComplete="name" value={adminName} onChange={(event) => setAdminName(event.target.value)} placeholder="Your full name" />
          </label>
          <label>Work email
            <input required type="email" autoComplete="email" value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} placeholder="you@company.co.ke" />
          </label>
          <label>Job title
            <input required autoComplete="organization-title" value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} placeholder="e.g. Founder or Operations Director" />
          </label>
          <label>Password
            <input required type="password" minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" />
          </label>
          <button className="tenant-auth-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Creating workspace..." : "Create company workspace"}</button>
        </form>
        <p className="tenant-auth-switch">Joining an existing company? <Link to="/signup">Use an invite link</Link></p>
        <p className="tenant-auth-switch">Already registered? <Link to="/login">Sign in</Link></p>
      </section>
    </main>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const destination = (location.state as { from?: string } | null)?.from ?? "/dashboard";

  if (session) return <Navigate to={destination} replace />;

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
        <p className="tenant-auth-description">Sign in with your work email. PulseChart will open your company workspace.</p>
        {error && <div className="tenant-auth-error" role="alert">{error}</div>}
        <form className="tenant-auth-form" onSubmit={submit}>
          <label>Email address
            <input required type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" />
          </label>
          <label>Password
            <input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" />
          </label>
          <button className="tenant-auth-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Signing in..." : "Sign in"}</button>
        </form>
        <p className="tenant-auth-switch">Joining an existing company? <Link to="/signup">Sign up with an invite</Link></p>
        <p className="tenant-auth-switch">New to PulseChart? <Link to="/company-signup">Create a company workspace</Link></p>
      </section>
    </main>
  );
}

export const SignInPage = LoginPage;
