import { BADGE_CLASSES, ROLE_COLORS } from "@/lib/design-system";
import type { ReactNode } from "react";

// Badge — flat pill component
type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "neutral";

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-gray-100 text-gray-700",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
  info: "bg-blue-50 text-blue-700",
  neutral: "bg-gray-50 text-gray-500",
};

type BadgeProps = {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
};

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  return (
    <span className={`${BADGE_CLASSES} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}

// Role Colour Dot — flat, no ring/shadow
type ColorDotProps = {
  colorIndex: number;
  size?: "sm" | "md" | "lg";
};

const dotSizes = {
  sm: "h-2.5 w-2.5",
  md: "h-3.5 w-3.5",
  lg: "h-5 w-5",
};

export function ColorDot({ colorIndex, size = "md" }: ColorDotProps) {
  const color = ROLE_COLORS[colorIndex % ROLE_COLORS.length];
  return (
    <span
      className={`${dotSizes[size]} rounded-full inline-block shrink-0`}
      style={{ backgroundColor: color.hex }}
    />
  );
}

// Tag — removable pill
type TagProps = {
  children: ReactNode;
  onRemove?: () => void;
  variant?: BadgeVariant;
};

export function Tag({ children, onRemove, variant = "default" }: TagProps) {
  return (
    <span className={`${BADGE_CLASSES} ${variantClasses[variant]} gap-1.5`}>
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-0.5 -mr-1 rounded p-0.5 hover:bg-black/10 transition-colors"
        >
          \u00d7
        </button>
      )}
    </span>
  );
}

// Empty State
type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {icon && <div className="mb-3 text-gray-300">{icon}</div>}
      <h3 className="text-base font-semibold text-gray-600">{title}</h3>
      {description && (
        <p className="mt-1.5 text-sm text-gray-400 max-w-sm leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// Section Header
type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div>
        <h2 className="text-[15px] font-semibold text-gray-900">{title}</h2>
        {subtitle && (
          <p className="text-[13px] text-gray-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// Stat Card — flat, color-blocked left border
type StatCardProps = {
  label: string;
  value: string | number;
  variant?: "green" | "yellow" | "red" | "neutral";
  icon?: ReactNode;
};

const statVariants = {
  green: "border-l-4 border-l-emerald-500 bg-white",
  yellow: "border-l-4 border-l-amber-500 bg-white",
  red: "border-l-4 border-l-red-500 bg-white",
  neutral: "border-l-4 border-l-gray-300 bg-white",
};

export function StatCard({ label, value, variant = "neutral", icon }: StatCardProps) {
  return (
    <div className={`rounded-lg border border-gray-200 px-4 py-3.5 ${statVariants[variant]}`}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          {label}
        </span>
      </div>
      <div className="text-2xl font-bold text-gray-900 tabular-nums">{value}</div>
    </div>
  );
}
