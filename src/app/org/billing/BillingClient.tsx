"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  Check,
  X,
  Lightning,
  RocketLaunch,
  Crown,
} from "@phosphor-icons/react";
import { CARD_CLASSES, BUTTON } from "@/lib/design-system";
import { PLAN_LIMITS } from "@/lib/types";
import type { Organisation, Plan } from "@/lib/types";
import { SectionHeader } from "@/components/shared/Badge";

type PlanInfo = {
  key: Plan;
  name: string;
  monthlyPrice: string;
  annualPrice: string;
  description: string;
  icon: typeof Lightning;
  color: string;
  features: string[];
};

const PLANS: PlanInfo[] = [
  {
    key: "free",
    name: "Free",
    monthlyPrice: "£0",
    annualPrice: "£0",
    description: "For individuals trying out TeamForge",
    icon: Lightning,
    color: "bg-slate-100 border-slate-300 text-slate-700",
    features: [
      "1 workspace",
      "5 roles per workspace",
      "20 activities per workspace",
      "1 member",
    ],
  },
  {
    key: "starter",
    name: "Starter",
    monthlyPrice: "£29",
    annualPrice: "£279",
    description: "For small teams getting started",
    icon: RocketLaunch,
    color: "bg-blue-50 border-blue-300 text-blue-700",
    features: [
      "3 workspaces",
      "20 roles per workspace",
      "100 activities per workspace",
      "5 members",
      "PDF export",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    monthlyPrice: "£79",
    annualPrice: "£759",
    description: "For growing teams with complex structures",
    icon: Crown,
    color: "bg-emerald-50 border-emerald-300 text-emerald-700",
    features: [
      "Unlimited workspaces",
      "Unlimited roles",
      "Unlimited activities",
      "20 members",
      "PDF export",
      "AI features",
    ],
  },
  {
    key: "enterprise",
    name: "Enterprise",
    monthlyPrice: "Custom",
    annualPrice: "Custom",
    description: "For large organisations with custom needs",
    icon: Crown,
    color: "bg-violet-50 border-violet-300 text-violet-700",
    features: [
      "Everything in Pro",
      "Unlimited members",
      "API access",
      "SSO (coming soon)",
      "Dedicated support",
    ],
  },
];

export function BillingClient() {
  const [org, setOrg] = useState<Organisation | null>(null);
  const [myRole, setMyRole] = useState<string>("viewer");
  const [loading, setLoading] = useState(true);
  const [annual, setAnnual] = useState(true);

  const fetchOrg = useCallback(async () => {
    try {
      const res = await fetch("/api/org");
      if (!res.ok) throw new Error("Failed to fetch org");
      const data = await res.json();
      setOrg(data.org);
      setMyRole(data.membership.role);
    } catch {
      toast.error("Failed to load organisation");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrg();
  }, [fetchOrg]);

  async function handleUpgrade(planKey: Plan) {
    if (planKey === "enterprise") {
      toast.info("Contact us at hello@teamforge.io for Enterprise pricing");
      return;
    }
    // In production, this would create a Stripe Checkout session
    toast.info(
      `Stripe Checkout not yet configured. To upgrade to ${planKey}, configure STRIPE_SECRET_KEY and price IDs.`
    );
  }

  async function handleManageBilling() {
    // In production, this would redirect to Stripe Customer Portal
    toast.info(
      "Stripe Customer Portal not yet configured. Add STRIPE_SECRET_KEY to enable billing management."
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400 text-sm">
        Loading billing...
      </div>
    );
  }

  if (!org) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-slate-500">No organisation found.</p>
        <Link href="/dashboard" className={BUTTON.primary}>
          Go to Dashboard
        </Link>
      </div>
    );
  }

  const currentPlan = org.plan as Plan;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/org/settings"
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft size={20} weight="bold" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Billing & Plans
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your subscription and view plan options
          </p>
        </div>
      </div>

      {/* Current plan */}
      <section>
        <SectionHeader title="Current Plan" subtitle={org.name} />
        <div className={`${CARD_CLASSES} p-6 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <CreditCard
                size={20}
                weight="bold"
                className="text-blue-600"
              />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">
                {PLANS.find((p) => p.key === currentPlan)?.name ?? currentPlan}{" "}
                Plan
              </p>
              <p className="text-xs text-slate-500">
                {currentPlan === "free"
                  ? "Free forever"
                  : `Billed ${annual ? "annually" : "monthly"}`}
              </p>
            </div>
          </div>

          {currentPlan !== "free" && myRole === "owner" && (
            <button onClick={handleManageBilling} className={BUTTON.secondary}>
              Manage Billing
            </button>
          )}
        </div>
      </section>

      {/* Plan selection */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <SectionHeader title="Choose a Plan" subtitle="Upgrade or downgrade anytime" />

          {/* Annual/Monthly toggle */}
          <div className="flex items-center gap-2 text-sm">
            <span
              className={`font-medium ${
                !annual ? "text-slate-900" : "text-slate-400"
              }`}
            >
              Monthly
            </span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full border border-gray-300 transition-colors ${
                annual ? "bg-blue-600" : "bg-slate-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                  annual ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
            <span
              className={`font-medium ${
                annual ? "text-slate-900" : "text-slate-400"
              }`}
            >
              Annual
            </span>
            {annual && (
              <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                Save 20%
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((plan) => {
            const isCurrent = plan.key === currentPlan;
            const Icon = plan.icon;
            const limits = PLAN_LIMITS[plan.key];

            return (
              <div
                key={plan.key}
                className={`rounded-xl border p-5 flex flex-col transition-all ${
                  isCurrent
                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                    : "border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-gray-300"
                }`}
              >
                {/* Plan header */}
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className={`h-8 w-8 rounded-lg flex items-center justify-center ${plan.color}`}
                  >
                    <Icon size={16} weight="bold" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {plan.name}
                  </h3>
                  {isCurrent && (
                    <span className="ml-auto rounded-full bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">
                      Current
                    </span>
                  )}
                </div>

                {/* Price */}
                <div className="mb-2">
                  <span className="text-2xl font-bold text-slate-900">
                    {annual ? plan.annualPrice : plan.monthlyPrice}
                  </span>
                  {plan.key !== "free" && plan.key !== "enterprise" && (
                    <span className="text-xs text-slate-500 ml-1">
                      / {annual ? "year" : "month"}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 mb-4">
                  {plan.description}
                </p>

                {/* Features */}
                <ul className="space-y-1.5 flex-1 mb-4">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-1.5 text-xs text-slate-600"
                    >
                      <Check
                        size={12}
                        weight="bold"
                        className="text-emerald-500 shrink-0"
                      />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* Action */}
                {isCurrent ? (
                  <div className="text-center py-2 text-xs font-bold text-blue-600">
                    Your current plan
                  </div>
                ) : myRole === "owner" ? (
                  <button
                    onClick={() => handleUpgrade(plan.key)}
                    className={`w-full rounded-lg py-2 text-sm font-medium transition-colors ${
                      plan.key === "enterprise"
                        ? "bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {plan.key === "enterprise"
                      ? "Contact Sales"
                      : "Upgrade"}
                  </button>
                ) : (
                  <div className="text-center py-2 text-xs text-slate-400">
                    Only owners can change plans
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section>
        <SectionHeader title="FAQ" subtitle="Common billing questions" />
        <div className={`${CARD_CLASSES} p-6 space-y-4`}>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Can I change plans at any time?
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Yes. Upgrades take effect immediately, and you&apos;ll be prorated
              for the remaining billing period. Downgrades take effect at the end
              of your current billing cycle.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              What happens to my data if I downgrade?
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Your data is never deleted. If you exceed plan limits, you
              won&apos;t be able to create new items until you&apos;re within
              limits, but existing data remains accessible.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Do you offer refunds?
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              We offer a 14-day money-back guarantee on all paid plans. Contact
              support within 14 days of your purchase for a full refund.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
