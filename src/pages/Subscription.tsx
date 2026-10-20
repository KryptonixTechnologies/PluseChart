import { useState } from "react";
import { BadgeCheck, Check, CreditCard, Minus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppData } from "../hooks/useAppData";
import type { BillingCycle, SubscriptionPlan } from "../types/models";
import { defaultWorkspaceSubscription } from "../types/models";
import { formatKES } from "../services/currencyFormatting";

const plans: { plan: SubscriptionPlan; monthlyPrice: number; seats: number; description: string }[] = [
  {
    plan: "Free",
    monthlyPrice: 0,
    seats: 3,
    description: "Explore PulseChart free for 14 days.",
  },
  {
    plan: "Starter",
    monthlyPrice: 1500,
    seats: 5,
    description: "The essentials for a focused team.",
  },
  {
    plan: "Most Popular",
    monthlyPrice: 4900,
    seats: 20,
    description: "More room for a growing operation.",
  },
  {
    plan: "Premium",
    monthlyPrice: 12000,
    seats: 50,
    description: "Capacity and visibility for larger teams.",
  },
];

const comparisonRows = [
  { label: "Company accounts", values: ["Up to 3", "Up to 5", "Up to 20", "Up to 50"] },
  { label: "Shared team inbox", values: [true, true, true, true] },
  { label: "Contact management", values: [true, true, true, true] },
  { label: "Basic activity reports", values: [true, true, true, true] },
  { label: "Expanded reporting", values: [false, false, true, true] },
  { label: "Customer support", values: [true, true, true, true] },
];

function Subscription() {
  const navigate = useNavigate();
  const { workspace, updateSubscription } = useAppData();
  const activeSubscription = workspace?.subscription ?? defaultWorkspaceSubscription;
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(activeSubscription.billingCycle);

  const choosePlan = (plan: (typeof plans)[number]) => {
    if (!workspace) return;

    const isCurrent = activeSubscription.plan === plan.plan && activeSubscription.billingCycle === billingCycle;
    if (isCurrent) {
      navigate("/dashboard", { replace: true });
      return;
    }

    const price = plan.plan === "Free" ? 0 : billingCycle === "yearly" ? plan.monthlyPrice * 10 : plan.monthlyPrice;
    const startedAt = new Date();
    updateSubscription({
      plan: plan.plan,
      billingCycle,
      price,
      seats: plan.seats,
      startedAt: activeSubscription.plan === plan.plan ? activeSubscription.startedAt : startedAt.toISOString(),
      trialEndsAt: plan.plan === "Free"
        ? activeSubscription.plan === "Free" && activeSubscription.trialEndsAt
          ? activeSubscription.trialEndsAt
          : new Date(startedAt.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString()
        : undefined,
      status: plan.plan === "Free" ? "trial" : "payment_pending",
    });
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="subscription-page">
      <div className="page-heading">
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
            {activeSubscription.seats} company accounts · {activeSubscription.status === "trial" && activeSubscription.trialEndsAt
              ? `14-day trial ends ${new Date(activeSubscription.trialEndsAt).toLocaleDateString()}`
              : activeSubscription.billingCycle === "yearly" ? "Billed annually" : "Billed monthly"} · {activeSubscription.status === "trial" ? "Trial" : activeSubscription.status === "payment_pending" ? "Payment pending" : "Active"}
          </p>
        </div>
        <div className="subscription-current-price">
          <strong>{activeSubscription.plan === "Free" ? "Free" : formatKES(activeSubscription.price)}</strong>
          <span>{activeSubscription.plan === "Free" ? "14 days" : `/${activeSubscription.billingCycle === "yearly" ? "year" : "month"}`}</span>
        </div>
      </section>

      <div className="subscription-plans-heading">
        <div>
          <h2>Available packages</h2>
          <p>Compare Free, Starter, Most Popular, and Premium. Annual billing includes 2 months free.</p>
        </div>
        <div className="billing-toggle" role="group" aria-label="Billing cycle">
          <button type="button" aria-pressed={billingCycle === "monthly"} onClick={() => setBillingCycle("monthly")}>Monthly</button>
          <button type="button" aria-pressed={billingCycle === "yearly"} onClick={() => setBillingCycle("yearly")}>Yearly <span>2 months free</span></button>
        </div>
      </div>

      <div className="subscription-price-cards">
        {plans.map((plan, index) => {
          const isCurrent = activeSubscription.plan === plan.plan && activeSubscription.billingCycle === billingCycle;
          return (
            <article className={`subscription-price-card plan-${plan.plan.toLowerCase().replaceAll(" ", "-")}`} key={plan.plan}>
              <header className="subscription-price-card-header">
                <h3>{plan.plan}</h3>
                <p>{plan.description}</p>
                <strong>{plan.plan === "Free" ? "Free" : formatKES(billingCycle === "yearly" ? plan.monthlyPrice * 10 : plan.monthlyPrice)}</strong>
                <span>{plan.plan === "Free" ? "14 days" : `/${billingCycle === "yearly" ? "year" : "month"}`}</span>
                {billingCycle === "yearly" && plan.plan !== "Free" && <small>Equivalent to {formatKES(plan.monthlyPrice)}/month</small>}
              </header>
              <ul className="subscription-price-card-features">
                {comparisonRows.map((row) => {
                  const value = row.values[index];
                  return (
                    <li key={row.label}>
                      {typeof value === "string"
                        ? <><Check size={16} aria-hidden="true" /><span>{row.label}: <strong>{value}</strong></span></>
                        : value
                          ? <><Check size={16} aria-hidden="true" /><span>{row.label}</span></>
                          : <><Minus size={16} aria-hidden="true" /><span className="not-included">{row.label}</span></>}
                    </li>
                  );
                })}
              </ul>
              <button
                className={isCurrent ? "subscription-plan-button current" : "subscription-plan-button"}
                type="button"
                disabled={!workspace}
                onClick={() => choosePlan(plan)}
              >
                {isCurrent ? <><Check size={16} aria-hidden="true" /> Current plan</> : <><CreditCard size={16} aria-hidden="true" /> Choose {plan.plan}</>}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export default Subscription;