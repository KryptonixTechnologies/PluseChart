import { useState } from "react";
import { BadgeCheck, Check, CreditCard, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppData } from "../hooks/useAppData";
import { useAuth } from "../hooks/useAuth";
import type { BillingCycle, SubscriptionPlan } from "../types/models";
import { defaultWorkspaceSubscription } from "../types/models";
import { formatKES } from "../services/currencyFormatting";

const plans: { plan: SubscriptionPlan; monthlyPrice: number; seats: number; description: string; features: string[] }[] = [
  {
    plan: "Starter",
    monthlyPrice: 1500,
    seats: 5,
    description: "The essentials for a focused team.",
    features: ["Shared team inbox", "Contact management", "Basic activity reports"],
  },
  {
    plan: "Growth",
    monthlyPrice: 4900,
    seats: 20,
    description: "More room for a growing operation.",
    features: ["Everything in Starter", "Up to 20 team accounts", "Expanded reporting"],
  },
  {
    plan: "Enterprise",
    monthlyPrice: 12000,
    seats: 50,
    description: "Capacity and visibility for larger teams.",
    features: ["Everything in Growth", "Up to 50 team accounts", "Priority support"],
  },
];

function Subscription() {
  const navigate = useNavigate();
  const { currentAccount, workspace, updateSubscription } = useAppData();
  const { session, logout } = useAuth();
  const activeSubscription = workspace?.subscription ?? defaultWorkspaceSubscription;
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(activeSubscription.billingCycle);

  const choosePlan = (plan: (typeof plans)[number]) => {
    if (!workspace) return;

    const isCurrent = activeSubscription.plan === plan.plan && activeSubscription.billingCycle === billingCycle;
    if (isCurrent) {
      navigate("/dashboard", { replace: true });
      return;
    }

    const price = billingCycle === "yearly" ? plan.monthlyPrice * 10 : plan.monthlyPrice;
    updateSubscription({
      plan: plan.plan,
      billingCycle,
      price,
      seats: plan.seats,
      startedAt: activeSubscription.plan === plan.plan ? activeSubscription.startedAt : new Date().toISOString(),
      status: "payment_pending",
    });
    navigate("/dashboard", { replace: true });
  };

  return (
    <main className="subscription-gate">
      <header className="subscription-gate-header">
        <div className="subscription-gate-brand">
          <span className="subscription-gate-mark">P</span>
          <span>PulseChart<small>COMMUNICATION WORKSPACE</small></span>
        </div>
        <div className="subscription-gate-user">
          <span>{session?.user.name ?? currentAccount?.fullName ?? "Workspace administrator"}</span>
          <button type="button" onClick={() => { logout(); navigate("/login", { replace: true }); }}>Sign out</button>
        </div>
      </header>
      <div className="subscription-page subscription-gate-content">
      <div className="page-heading subscription-gate-heading">
        <div>
          <span className="subscription-eyebrow">WORKSPACE SETUP</span>
          <h1>Choose your package</h1>
          <p>Select a package for {workspace?.companyName || "your workspace"} to continue.</p>
        </div>
      </div>

      <section className="subscription-current" aria-labelledby="current-plan-title">
        <div className="subscription-current-icon"><BadgeCheck size={22} aria-hidden="true" /></div>
        <div className="subscription-current-copy">
          <span className="subscription-eyebrow">CURRENT PACKAGE</span>
          <h2 id="current-plan-title">{workspace?.companyName || "Workspace"} <span>{activeSubscription.plan}</span></h2>
          <p>
            {activeSubscription.seats} team accounts · {activeSubscription.billingCycle === "yearly" ? "Billed annually" : "Billed monthly"} · {activeSubscription.status === "trial" ? "Trial" : activeSubscription.status === "payment_pending" ? "Payment pending" : "Active"}
          </p>
        </div>
        <div className="subscription-current-price">
          <strong>{formatKES(activeSubscription.price)}</strong>
          <span>/{activeSubscription.billingCycle === "yearly" ? "year" : "month"}</span>
        </div>
      </section>

      <div className="subscription-plans-heading">
        <div>
          <h2>Available packages</h2>
          <p>Choose from {formatKES(plans[0].monthlyPrice)} to {formatKES(plans[plans.length - 1].monthlyPrice)} per month. Annual billing includes 2 months free.</p>
        </div>
        <div className="billing-toggle" role="group" aria-label="Billing cycle">
          <button type="button" aria-pressed={billingCycle === "monthly"} onClick={() => setBillingCycle("monthly")}>Monthly</button>
          <button type="button" aria-pressed={billingCycle === "yearly"} onClick={() => setBillingCycle("yearly")}>Yearly <span>2 months free</span></button>
        </div>
      </div>

      <div className="subscription-plan-grid">
        {plans.map((plan) => {
          const isCurrent = activeSubscription.plan === plan.plan && activeSubscription.billingCycle === billingCycle;

          return (
            <article className={`subscription-plan${plan.plan === "Growth" ? " featured" : ""}`} key={plan.plan}>
              {plan.plan === "Growth" && <span className="subscription-plan-label">MOST POPULAR</span>}
              <h3>{plan.plan}</h3>
              <p className="subscription-plan-description">{plan.description}</p>
              <div className="subscription-plan-price">
                <strong>{formatKES(billingCycle === "yearly" ? plan.monthlyPrice * 10 : plan.monthlyPrice)}</strong>
                <span>/{billingCycle === "yearly" ? "year" : "month"}</span>
              </div>
              {billingCycle === "yearly" && <p className="subscription-plan-equivalent">Equivalent to {formatKES(plan.monthlyPrice)}/month</p>}
              <div className="subscription-plan-seats"><Users size={16} aria-hidden="true" /> Up to {plan.seats} team accounts</div>
              <ul>
                {plan.features.map((feature) => <li key={feature}><Check size={16} aria-hidden="true" />{feature}</li>)}
              </ul>
              <button
                className={isCurrent ? "subscription-plan-button current" : "subscription-plan-button"}
                type="button"
                disabled={!workspace}
                onClick={() => choosePlan(plan)}
              >
                {isCurrent ? <><Check size={16} aria-hidden="true" /> Continue with {plan.plan}</> : <><CreditCard size={16} aria-hidden="true" /> Choose {plan.plan}</>}
              </button>
            </article>
          );
        })}
      </div>
      </div>
    </main>
  );
}

export default Subscription;