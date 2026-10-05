import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, CheckCircle2, ChevronLeft, ChevronRight, Copy, Eye, EyeOff, LockKeyhole, Zap } from "lucide-react";
import { useAppData } from "../hooks/useAppData";
import "./onboarding.css";

type Step = 1 | 2 | 3 | 4;
type BillingCycle = "monthly" | "annual";
type PaymentMethod = "mpesa" | "card";
type Plan = {
  id: string;
  name: string;
  employees: string;
  monthly: number | null;
  annual: number | null;
  description: string;
};

const plans: Plan[] = [
  { id: "starter", name: "Starter", employees: "2–20 employees", monthly: 3500, annual: 35700, description: "Small teams and startups" },
  { id: "growth", name: "Growth", employees: "21–50 employees", monthly: 8500, annual: 86700, description: "Growing businesses" },
  { id: "scale", name: "Scale", employees: "51–200 employees", monthly: 18000, annual: 183600, description: "Mid-sized companies" },
  { id: "enterprise", name: "Enterprise", employees: "200+ employees", monthly: null, annual: null, description: "Enterprise organisations" },
];

const provisioningSteps = [
  "Creating company profile...",
  "Configuring M-Pesa billing...",
  "Setting up admin account...",
];

const steps = ["Company & admin", "Plan & team", "Provisioning", "Workspace ready"];

function formatKes(amount: number) {
  return `KES ${amount.toLocaleString("en-KE")}`;
}

function createJoinCode() {
  return crypto.randomUUID().split("-")[0].toUpperCase();
}

function passwordStrength(password: string) {
  if (!password) return 0;
  return [
    password.length >= 8,
    /[A-Z]/.test(password) && /[a-z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
}

function validateField(key: string, value: string) {
  if (key === "companyName" && !value.trim()) return "Enter your company name.";
  if (key === "domain" && !/^(?=.{1,253}$)(?!-)[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$/.test(value.trim())) return "Enter a valid business domain, such as company.co.ke.";
  if (key === "industry" && !value) return "Select your industry.";
  if (key === "adminName" && !value.trim()) return "Enter your full name.";
  if (key === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return "Enter a valid work email address.";
  if (key === "jobTitle" && !value.trim()) return "Enter your job title.";
  if (key === "password" && (value.length < 8 || passwordStrength(value) < 3)) return "Use at least 8 characters with letters and numbers.";
  if (key === "mpesaPhone" && !/^(?:\+?254|0)?7\d{8}$/.test(value.replace(/[\s-]/g, ""))) return "Enter a valid Kenyan M-Pesa number.";
  if (key === "cardNumber" && value.replace(/\D/g, "").length < 15) return "Enter a valid card number.";
  if (key === "cardName" && !value.trim()) return "Enter the name on your card.";
  if (key === "cardExpiry" && !/^(0[1-9]|1[0-2])\/\d{2}$/.test(value)) return "Use MM/YY.";
  if (key === "cardCvv" && !/^\d{3,4}$/.test(value)) return "Enter a valid security code.";
  return "";
}

function Onboarding() {
  const navigate = useNavigate();
  const { createInitialAdmin } = useAppData();
  const [step, setStep] = useState<Step>(1);
  const [companyName, setCompanyName] = useState("");
  const [domain, setDomain] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("Kenya");
  const [adminName, setAdminName] = useState("");
  const [email, setEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("starter");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [trial, setTrial] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mpesa");
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [provisioningIndex, setProvisioningIndex] = useState(0);
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const [setupError, setSetupError] = useState("");
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);

  const selected = plans.find((plan) => plan.id === selectedPlan) ?? plans[0];
  const strength = passwordStrength(password);
  const paymentRequired = !trial && selected.id !== "enterprise";
  const joinLink = `${window.location.origin}/join/${joinCode}`;
  const billingProvisioningMessage = trial
    ? "Activating your 14-day free trial..."
    : selected.id === "enterprise"
      ? "Preparing your enterprise setup..."
      : paymentMethod === "mpesa"
        ? "Configuring M-Pesa billing..."
        : "Configuring card billing...";
  const currentProvisioningSteps = [provisioningSteps[0], billingProvisioningMessage, provisioningSteps[2]];

  useEffect(() => {
    if (step !== 3) return;

    const timers = provisioningSteps.map((_, index) =>
      window.setTimeout(() => setProvisioningIndex(index + 1), 850 * (index + 1)),
    );
    const complete = window.setTimeout(() => setStep(4), 850 * (provisioningSteps.length + 1));
    return () => {
      timers.forEach(window.clearTimeout);
      window.clearTimeout(complete);
    };
  }, [step]);

  const validateCompany = () => {
    const next: Record<string, string> = {};
    if (!companyName.trim()) next.companyName = "Enter your company name.";
    if (!domain.trim() || !/^(?=.{1,253}$)(?!-)[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$/.test(domain.trim())) {
      next.domain = "Enter a valid business domain, such as company.co.ke.";
    }
    if (!industry) next.industry = "Select your industry.";
    if (!adminName.trim()) next.adminName = "Enter your full name.";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "Enter a valid work email address.";
    if (!jobTitle.trim()) next.jobTitle = "Enter your job title.";
    if (password.length < 8 || strength < 3) next.password = "Use at least 8 characters with letters and numbers.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validatePayment = () => {
    const next: Record<string, string> = {};
    if (paymentMethod === "mpesa" && !/^(?:\+?254|0)?7\d{8}$/.test(mpesaPhone.replace(/[\s-]/g, ""))) {
      next.mpesaPhone = "Enter a valid Kenyan M-Pesa number.";
    }
    if (paymentMethod === "card") {
      if (cardNumber.replace(/\s/g, "").length < 15) next.cardNumber = "Enter a valid card number.";
      if (!cardName.trim()) next.cardName = "Enter the name on your card.";
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExpiry)) next.cardExpiry = "Use MM/YY.";
      if (!/^\d{3,4}$/.test(cardCvv)) next.cardCvv = "Enter a valid security code.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = async () => {
    if (step === 1 && !validateCompany()) return;
    if (step === 2 && paymentRequired && !validatePayment()) return;
    setErrors({});
    if (step === 1) setStep(2);
    else if (step === 2) {
      setSetupError("");
      setIsCreatingAdmin(true);
      const result = await createInitialAdmin({
        fullName: adminName.trim(),
        email: email.trim(),
        phone: "",
        role: "Administrator",
      }, password);
      setIsCreatingAdmin(false);
      if (result !== "created") {
        setSetupError(result === "closed"
          ? "An account already exists. Sign in to continue or ask your administrator for access."
          : "We couldn’t securely create your account in this browser. Use localhost or HTTPS and try again.");
        return;
      }
      setProvisioningIndex(0);
      setJoinCode(createJoinCode());
      setStep(3);
    }
  };

  const updateField = (key: string, value: string, setValue: (value: string) => void) => {
    setValue(value);
    setErrors((current) => ({ ...current, [key]: validateField(key, value) }));
  };

  const copyJoinLink = async () => {
    setCopyError("");
    try {
      await navigator.clipboard.writeText(joinLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopyError("Could not copy the link. Select and copy it manually.");
    }
  };

  const launchWorkspace = () => {
    navigate("/dashboard", { replace: true });
  };

  const passwordMessage = useMemo(() => {
    if (!password) return "Use 8+ characters with a mix of letters and numbers.";
    if (strength <= 1) return "Weak password";
    if (strength === 2) return "Fair password";
    if (strength === 3) return "Good password";
    return "Strong password";
  }, [password, strength]);

  return (
    <main className="onboarding-shell">
      <header className="onboarding-topbar">
        <a className="onboarding-brand" href="/sign-in" aria-label="PulseChart home">
          <span className="onboarding-brand-mark">P</span>
          <span>PulseChart<small>WORKSPACE SETUP</small></span>
        </a>
        <div className="secure-label"><LockKeyhole size={14} aria-hidden="true" /> Secure setup</div>
      </header>

      <div className="onboarding-container">
        <div className="wizard-progress" aria-label={`Step ${step} of 4`}>
          <div className="progress-track"><span style={{ width: `${((step - 1) / 3) * 100}%` }} /></div>
          <ol className="progress-steps">
            {steps.map((label, index) => {
              const stepNumber = index + 1;
              return (
                <li className={stepNumber < step ? "complete" : stepNumber === step ? "active" : ""} key={label}>
                  <span className="progress-dot">{stepNumber < step ? <Check size={14} /> : stepNumber}</span>
                  <span className="progress-label">{label}</span>
                </li>
              );
            })}
          </ol>
        </div>

        {step === 1 && (
          <section className="wizard-card" aria-labelledby="company-step-title">
            <div className="wizard-heading">
              <span className="step-eyebrow">STEP 01 <i /> COMPANY & ADMIN</span>
              <h1 id="company-step-title">Let’s get your workspace started</h1>
              <p>Tell us about your organisation and create your administrator profile.</p>
            </div>
            <form className="signup-form" onSubmit={(event) => { event.preventDefault(); goNext(); }} noValidate>
              <div className="form-section-title"><span>01</span><div><h2>Company profile</h2><p>Details your team will recognise.</p></div></div>
              <div className="signup-grid">
                <label className="signup-field span-two">Company name
                  <input autoComplete="organization" placeholder="e.g. Acme Health Group" value={companyName} onChange={(event) => updateField("companyName", event.target.value, setCompanyName)} aria-invalid={!!errors.companyName} />
                  {errors.companyName && <small className="field-error">{errors.companyName}</small>}
                </label>
                <label className="signup-field">Business web domain
                  <div className="domain-input"><span>https://</span><input autoComplete="url" placeholder="company.co.ke" value={domain} onChange={(event) => updateField("domain", event.target.value, setDomain)} aria-invalid={!!errors.domain} /></div>
                  {errors.domain && <small className="field-error">{errors.domain}</small>}
                </label>
                <label className="signup-field">Industry
                  <select value={industry} onChange={(event) => updateField("industry", event.target.value, setIndustry)} aria-invalid={!!errors.industry}>
                    <option value="">Select industry</option>
                    <option>Healthcare</option><option>Technology</option><option>Finance & Banking</option><option>Education</option><option>Retail & E-commerce</option><option>Professional Services</option><option>Manufacturing</option><option>Other</option>
                  </select>
                  {errors.industry && <small className="field-error">{errors.industry}</small>}
                </label>
                <label className="signup-field">Country
                  <select value={country} onChange={(event) => setCountry(event.target.value)}>
                    <option>Kenya</option><option>Uganda</option><option>Tanzania</option><option>Rwanda</option><option>Ethiopia</option><option>South Africa</option><option>Nigeria</option><option>Other</option>
                  </select>
                </label>
              </div>

              <div className="form-section-title admin-section-title"><span>02</span><div><h2>Administrator profile</h2><p>Your personal details and sign-in credentials.</p></div></div>
              <div className="signup-grid">
                <label className="signup-field">Full name
                  <input autoComplete="name" placeholder="Your full name" value={adminName} onChange={(event) => updateField("adminName", event.target.value, setAdminName)} aria-invalid={!!errors.adminName} />
                  {errors.adminName && <small className="field-error">{errors.adminName}</small>}
                </label>
                <label className="signup-field">Work email address
                  <input type="email" autoComplete="email" placeholder="you@company.co.ke" value={email} onChange={(event) => updateField("email", event.target.value, setEmail)} aria-invalid={!!errors.email} />
                  {errors.email && <small className="field-error">{errors.email}</small>}
                </label>
                <label className="signup-field">Job title
                  <input autoComplete="organization-title" placeholder="e.g. Operations Director" value={jobTitle} onChange={(event) => updateField("jobTitle", event.target.value, setJobTitle)} aria-invalid={!!errors.jobTitle} />
                  {errors.jobTitle && <small className="field-error">{errors.jobTitle}</small>}
                </label>
                <label className="signup-field">Password
                  <span className="password-wrap">
                    <input type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Create a strong password" value={password} onChange={(event) => updateField("password", event.target.value, setPassword)} aria-invalid={!!errors.password} />
                    <button type="button" className="password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
                  </span>
                  <span className={`password-strength strength-${strength}`} aria-live="polite">
                    <span className="strength-bars"><i /><i /><i /><i /></span>{passwordMessage}
                  </span>
                  {errors.password && <small className="field-error">{errors.password}</small>}
                </label>
              </div>
              <div className="wizard-actions">
                <span className="form-reassurance"><LockKeyhole size={14} /> Your details are encrypted and secure</span>
                <button className="wizard-button primary" type="submit">Choose your plan <ChevronRight size={17} /></button>
              </div>
            </form>
          </section>
        )}

        {step === 2 && (
          <section className="wizard-card plan-card" aria-labelledby="plan-step-title">
            <div className="wizard-heading">
              <span className="step-eyebrow">STEP 02 <i /> PLAN & TEAM SIZE</span>
              <h1 id="plan-step-title">Choose the right plan for your team</h1>
              <p>Plans scale with your team. Start with a 14-day free trial and no payment upfront.</p>
            </div>
            <div className="billing-row">
              <div className="billing-toggle" role="group" aria-label="Billing cycle">
                <button type="button" className={billingCycle === "monthly" ? "selected" : ""} onClick={() => setBillingCycle("monthly")}>Monthly</button>
                <button type="button" className={billingCycle === "annual" ? "selected" : ""} onClick={() => setBillingCycle("annual")}>Annual <span>Save 15%</span></button>
              </div>
              <span className="billing-caption">All prices in Kenyan Shillings (KES)</span>
            </div>
            <div className="plan-grid">
              {plans.map((plan) => {
                const active = selectedPlan === plan.id;
                const price = billingCycle === "annual" ? plan.annual : plan.monthly;
                return (
                  <button type="button" className={`plan-option ${active ? "chosen" : ""} ${plan.id === "growth" ? "popular" : ""}`} key={plan.id} onClick={() => setSelectedPlan(plan.id)} aria-pressed={active}>
                    {plan.id === "growth" && <span className="popular-tag">MOST POPULAR</span>}
                    <span className="plan-check">{active && <Check size={14} />}</span>
                    <span className="plan-name">{plan.name}</span>
                    <span className="plan-size">{plan.employees}</span>
                    <span className="plan-price">{price === null ? "Custom" : formatKes(price)}<small>{price === null ? "Contact our team" : billingCycle === "annual" ? "/ year" : "/ month"}</small></span>
                    <span className="plan-description">{plan.description}</span>
                    {billingCycle === "annual" && price !== null && <span className="annual-note">Billed annually</span>}
                  </button>
                );
              })}
            </div>
            {errors.mpesaPhone || errors.cardNumber || errors.cardName || errors.cardExpiry || errors.cardCvv ? <div className="wizard-error" role="alert">Check your payment details below.</div> : null}
            <label className={`trial-choice ${trial ? "trial-enabled" : ""}`}>
              <input type="checkbox" checked={trial} onChange={(event) => { setTrial(event.target.checked); setErrors({}); }} />
              <span className="trial-checkbox">{trial && <Check size={14} />}</span>
              <span><strong>Start my 14-day free trial</strong><small>No payment required today. You can cancel anytime during your trial.</small></span>
              <span className="trial-badge">NO PAYMENT NOW</span>
            </label>
            {paymentRequired && (
              <section className="payment-panel" aria-labelledby="payment-heading">
                <div className="payment-title"><div><span className="step-eyebrow">PAYMENT METHOD</span><h2 id="payment-heading">Add a payment method</h2><p>You won’t be charged until you confirm your plan.</p></div><LockKeyhole size={18} aria-hidden="true" /></div>
                <div className="payment-tabs" role="group" aria-label="Payment method">
                  <button type="button" className={paymentMethod === "mpesa" ? "selected" : ""} onClick={() => { setPaymentMethod("mpesa"); setErrors({}); }}><span className="mpesa-mark">M</span>M-Pesa Express</button>
                  <button type="button" className={paymentMethod === "card" ? "selected" : ""} onClick={() => { setPaymentMethod("card"); setErrors({}); }}>▰ Debit / Credit card</button>
                </div>
                {paymentMethod === "mpesa" ? (
                  <label className="signup-field">M-Pesa phone number
                    <input type="tel" autoComplete="tel" placeholder="+254 7XX XXX XXX" value={mpesaPhone} onChange={(event) => updateField("mpesaPhone", event.target.value, setMpesaPhone)} aria-invalid={!!errors.mpesaPhone} />
                    <small className="payment-hint">You’ll receive an M-Pesa prompt on your phone to authorise payment.</small>
                    {errors.mpesaPhone && <small className="field-error">{errors.mpesaPhone}</small>}
                  </label>
                ) : (
                  <div className="signup-grid payment-fields">
                    <label className="signup-field span-two">Card number
                      <input inputMode="numeric" autoComplete="cc-number" placeholder="0000 0000 0000 0000" value={cardNumber} onChange={(event) => updateField("cardNumber", event.target.value, setCardNumber)} aria-invalid={!!errors.cardNumber} />
                      {errors.cardNumber && <small className="field-error">{errors.cardNumber}</small>}
                    </label>
                    <label className="signup-field span-two">Name on card
                      <input autoComplete="cc-name" placeholder="Name as shown on card" value={cardName} onChange={(event) => updateField("cardName", event.target.value, setCardName)} aria-invalid={!!errors.cardName} />
                      {errors.cardName && <small className="field-error">{errors.cardName}</small>}
                    </label>
                    <label className="signup-field">Expiry date
                      <input autoComplete="cc-exp" placeholder="MM/YY" value={cardExpiry} onChange={(event) => updateField("cardExpiry", event.target.value, setCardExpiry)} aria-invalid={!!errors.cardExpiry} />
                      {errors.cardExpiry && <small className="field-error">{errors.cardExpiry}</small>}
                    </label>
                    <label className="signup-field">Security code
                      <input inputMode="numeric" autoComplete="cc-csc" placeholder="CVV" value={cardCvv} onChange={(event) => updateField("cardCvv", event.target.value, setCardCvv)} aria-invalid={!!errors.cardCvv} />
                      {errors.cardCvv && <small className="field-error">{errors.cardCvv}</small>}
                    </label>
                  </div>
                )}
              </section>
            )}
            {!paymentRequired && selected.id === "enterprise" && (
              <div className="enterprise-note"><Zap size={17} /><p><strong>Let’s build the right fit.</strong> An enterprise specialist will get in touch to tailor your plan and pricing.</p></div>
            )}
            {setupError && <div className="wizard-error" role="alert">{setupError}</div>}
            <div className="wizard-actions plan-actions">
              <button className="wizard-button secondary" type="button" onClick={() => { setErrors({}); setStep(1); }}><ChevronLeft size={17} /> Back</button>
              <button className="wizard-button primary" type="button" onClick={goNext} disabled={isCreatingAdmin}>{isCreatingAdmin ? "Creating administrator..." : selected.id === "enterprise" ? "Request enterprise setup" : trial ? "Start free trial" : "Continue to setup"} <ChevronRight size={17} /></button>
            </div>
            <p className="terms-note">By continuing, you agree to our <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a>.</p>
          </section>
        )}

        {step === 3 && (
          <section className="wizard-card provisioning-card" aria-labelledby="provisioning-title" aria-live="polite">
            <div className="provisioning-orbit"><span><Zap size={27} fill="currentColor" /></span></div>
            <span className="step-eyebrow">STEP 03 <i /> PROVISIONING</span>
            <h1 id="provisioning-title">Building your workspace</h1>
            <p className="provisioning-copy">We’re getting everything ready for {companyName || "your team"}.</p>
            <div className="provisioning-list">
              {currentProvisioningSteps.map((item, index) => {
                const done = index < provisioningIndex;
                const current = index === provisioningIndex && provisioningIndex < provisioningSteps.length;
                return <div className={`provisioning-item ${done ? "done" : ""} ${current ? "current" : ""}`} key={item}>
                  <span>{done ? <Check size={14} /> : current ? <i /> : <span className="pending-dot" />}</span>{item}
                </div>;
              })}
            </div>
            <div className="provisioning-progress"><span style={{ width: `${(provisioningIndex / provisioningSteps.length) * 100}%` }} /></div>
            <small className="provisioning-footnote">This usually takes just a few seconds</small>
          </section>
        )}

        {step === 4 && (
          <section className="wizard-card ready-card" aria-labelledby="ready-title">
            <div className="ready-icon"><CheckCircle2 size={34} /></div>
            <span className="step-eyebrow">STEP 04 <i /> ALL SET</span>
            <h1 id="ready-title">Your workspace is ready</h1>
            <p className="ready-copy"><strong>{companyName || "Your company"}</strong> is set up. Invite your team to start collaborating with you.</p>
            <div className="workspace-summary">
              <div className="summary-avatar">{(companyName || "P").slice(0, 1).toUpperCase()}</div>
              <div><strong>{companyName || "Your company"}</strong><span>{selected.name} plan · {selected.employees}</span></div>
              <span className="active-status"><i /> ACTIVE</span>
            </div>
            <div className="join-panel">
              <div className="join-heading"><div><span className="step-eyebrow">EMPLOYEE ONBOARDING</span><h2>Invite your team</h2></div><span className="join-icon">↗</span></div>
              <p>Share this unique join link or code with your employees so they can request access to your workspace.</p>
              <div className="join-link-row"><span>{joinLink}</span><button type="button" onClick={copyJoinLink} aria-label="Copy employee join link">{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? "Copied" : "Copy link"}</button></div>
              {copyError && <small className="field-error copy-error" role="alert">{copyError}</small>}
              <div className="join-code-row"><span>WORKSPACE JOIN CODE</span><strong>{joinCode}</strong></div>
            </div>
            <button className="wizard-button primary launch-button" type="button" onClick={launchWorkspace}>Launch Workspace <ChevronRight size={17} /></button>
            <p className="ready-footnote"><LockKeyhole size={13} /> You can invite more teammates at any time from Workspace Settings.</p>
          </section>
        )}
        <footer className="onboarding-footer"><span>© {new Date().getFullYear()} PulseChart</span><span>Need help? <a href="mailto:support@pulsechart.co.ke">Contact support</a></span></footer>
      </div>
    </main>
  );
}

export default Onboarding;
