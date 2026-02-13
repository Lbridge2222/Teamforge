"use client";

import {
  Gavel,
  Wrench,
  CheckCircle,
  UserList,
  Handshake,
  Binoculars,
  Lightbulb,
  Scales,
  GraduationCap,
} from "@phosphor-icons/react/dist/ssr";

export const BELBIN_ICONS: Record<string, any> = {
  shaper: Gavel,
  implementer: Wrench,
  completer_finisher: CheckCircle,
  coordinator: UserList,
  teamworker: Handshake,
  resource_investigator: Binoculars,
  plant: Lightbulb,
  monitor_evaluator: Scales,
  specialist: GraduationCap,
};

export function BelbinIcon({ 
  roleKey, 
  className = "", 
  weight = "regular" 
}: { 
  roleKey: string | null | undefined; 
  className?: string; 
  weight?: string 
}) {
  if (!roleKey) return null;
  const Icon = BELBIN_ICONS[roleKey] ?? UserList;
  return <Icon className={className} weight={weight as any} />;
}
