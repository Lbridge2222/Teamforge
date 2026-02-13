"use client";

import { ROLE_COLORS } from "@/lib/design-system";

/**
 * MiniOrgChart — renders a tiny SVG org chart thumbnail
 * showing the workspace's team hierarchy at a glance.
 */

export type OrgChartSummary = {
  leadershipCount: number;
  stages: { name: string; roleCount: number }[];
  unassignedCount: number;
  totalRoles: number;
};

type MiniOrgChartProps = {
  summary: OrgChartSummary;
  width?: number;
  height?: number;
};

export function MiniOrgChart({
  summary,
  width = 200,
  height = 100,
}: MiniOrgChartProps) {
  const { leadershipCount, stages, unassignedCount, totalRoles } = summary;

  if (totalRoles === 0 && stages.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-md bg-gray-50 border border-gray-100"
        style={{ width, height }}
      >
        <span className="text-[9px] text-gray-400 font-medium">No roles</span>
      </div>
    );
  }

  const stageCount = stages.length || 1;
  const padding = 8;
  const usableW = width - padding * 2;
  const usableH = height - padding * 2;

  // Layout tiers
  const hasLeadership = leadershipCount > 0;
  const hasUnassigned = unassignedCount > 0;
  const tiers = (hasLeadership ? 1 : 0) + (stages.length > 0 ? 1 : 0) + (hasUnassigned ? 1 : 0);
  const tierH = tiers > 0 ? usableH / (tiers + 0.5) : usableH;

  let currentY = padding + 4;

  const nodeW = 18;
  const nodeH = 10;
  const stageHeaderH = 8;
  const gapBetweenNodes = 3;

  const elements: React.ReactNode[] = [];
  let keyIdx = 0;

  // Leadership tier
  if (hasLeadership) {
    const leaderX = width / 2 - (leadershipCount * (nodeW + gapBetweenNodes) - gapBetweenNodes) / 2;
    for (let i = 0; i < Math.min(leadershipCount, 5); i++) {
      elements.push(
        <rect
          key={keyIdx++}
          x={leaderX + i * (nodeW + gapBetweenNodes)}
          y={currentY}
          width={nodeW}
          height={nodeH}
          rx={2}
          fill="#F59E0B"
          opacity={0.8}
        />
      );
    }

    const leaderCenterY = currentY + nodeH;
    currentY += tierH;

    // Connector line from leadership to stages
    if (stages.length > 0) {
      elements.push(
        <line
          key={keyIdx++}
          x1={width / 2}
          y1={leaderCenterY}
          x2={width / 2}
          y2={currentY}
          stroke="#D1D5DB"
          strokeWidth={1}
        />
      );

      // Horizontal bar across stages
      if (stages.length > 1) {
        const firstStageX = padding + (usableW / stageCount) / 2;
        const lastStageX = padding + usableW - (usableW / stageCount) / 2;
        elements.push(
          <line
            key={keyIdx++}
            x1={firstStageX}
            y1={currentY}
            x2={lastStageX}
            y2={currentY}
            stroke="#D1D5DB"
            strokeWidth={1}
          />
        );
      }
    }
  }

  // Stages tier
  if (stages.length > 0) {
    const colW = usableW / stageCount;

    stages.slice(0, 6).forEach((stage, i) => {
      const cx = padding + colW * i + colW / 2;

      // Vertical connector from horizontal bar
      if (hasLeadership) {
        elements.push(
          <line
            key={keyIdx++}
            x1={cx}
            y1={currentY}
            x2={cx}
            y2={currentY + 4}
            stroke="#D1D5DB"
            strokeWidth={1}
          />
        );
      }

      // Stage header
      const headerW = Math.min(colW - 4, 36);
      elements.push(
        <rect
          key={keyIdx++}
          x={cx - headerW / 2}
          y={currentY + 4}
          width={headerW}
          height={stageHeaderH}
          rx={2}
          fill="#1F2937"
          opacity={0.9}
        />
      );

      // Role dots under stage
      const roleCount = Math.min(stage.roleCount, 4);
      const dotR = 3;
      const dotGap = 2;
      const dotsW = roleCount * (dotR * 2 + dotGap) - dotGap;
      const dotsStartX = cx - dotsW / 2;

      for (let j = 0; j < roleCount; j++) {
        const colorIdx = (i * 3 + j) % ROLE_COLORS.length;
        elements.push(
          <circle
            key={keyIdx++}
            cx={dotsStartX + j * (dotR * 2 + dotGap) + dotR}
            cy={currentY + stageHeaderH + 14}
            r={dotR}
            fill={ROLE_COLORS[colorIdx].hex}
            opacity={0.7}
          />
        );
      }
    });

    currentY += tierH + 10;
  }

  // Unassigned dots  
  if (hasUnassigned) {
    const dotR = 2.5;
    const dotGap = 3;
    const count = Math.min(unassignedCount, 6);
    const dotsW = count * (dotR * 2 + dotGap) - dotGap;
    const startX = width / 2 - dotsW / 2;
    const dotY = Math.min(currentY + 4, height - padding - dotR);

    for (let i = 0; i < count; i++) {
      elements.push(
        <circle
          key={keyIdx++}
          cx={startX + i * (dotR * 2 + dotGap) + dotR}
          cy={dotY}
          r={dotR}
          fill="#9CA3AF"
          opacity={0.5}
        />
      );
    }
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="rounded-md bg-gray-50 border border-gray-100"
    >
      {elements}
    </svg>
  );
}
