"use client";

import { StatCard, SectionHeader } from "@/components/shared/Badge";
import {
  ShieldCheck,
  ChartLine,
  Users,
} from "@phosphor-icons/react/dist/ssr";
import type { HealthScore } from "@/lib/analysis";

type FunnelHealthProps = {
  health: HealthScore;
};

export function FunnelHealth({ health }: FunnelHealthProps) {
  return (
    <div>
      <SectionHeader
        title="Funnel Health Score"
        subtitle="Headline metrics for pipeline health"
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Issues Found"
          value={health.issueCount}
          variant={health.severity === "green" ? "green" : health.severity === "yellow" ? "yellow" : "red"}
          icon={
            <ShieldCheck
              size={16}
              weight="bold"
              className={
                health.severity === "green"
                  ? "text-emerald-600"
                  : health.severity === "yellow"
                  ? "text-amber-600"
                  : "text-red-600"
              }
            />
          }
        />
        <StatCard
          label="SLAs Defined"
          value={health.slaRatio}
          variant={
            health.slaRatio.startsWith(health.slaRatio.split("/")[1])
              ? "green"
              : "yellow"
          }
          icon={<ChartLine size={16} weight="bold" className="text-gray-500" />}
        />
        <StatCard
          label="Stages Staffed"
          value={health.staffingRatio}
          variant={
            health.staffingRatio.startsWith(health.staffingRatio.split("/")[1])
              ? "green"
              : "yellow"
          }
          icon={<Users size={16} weight="bold" className="text-gray-500" />}
        />
      </div>
    </div>
  );
}
