"use client";

import { useState } from "react";
import { FRAMEWORKS } from "@/lib/frameworks";
import { Collapsible } from "@/components/shared/Collapsible";
import {
  BookOpen,
  UsersThree,
  ChartLineUp,
  Rocket,
  SlidersHorizontal,
  Lightning,
  Lightbulb,
} from "@phosphor-icons/react/dist/ssr";

const ICONS: Record<string, any> = {
  belbin: UsersThree,
  "radical-candor": ChartLineUp,
  drive: Rocket,
  "job-characteristics": SlidersHorizontal,
  rapid: Lightning,
  "working-genius": Lightbulb,
};

export function FrameworksPanel() {
  return (
    <Collapsible
      title={
        <div className="flex items-center gap-3">
          <BookOpen size={16} weight="bold" className="text-gray-500" />
          <span className="font-semibold text-gray-800">Six Management Frameworks</span>
        </div>
      }
      defaultOpen={false}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mt-3">
        {FRAMEWORKS.map((fw) => {
          const Icon = ICONS[fw.key] ?? BookOpen;
          return (
            <div
              key={fw.key}
              className="rounded-lg border border-gray-200 bg-white p-4"
            >
              <div className="text-lg mb-1 text-blue-500">
                <Icon size={22} weight="duotone" />
              </div>
              <h4 className="text-[13px] font-semibold text-gray-800">{fw.name}</h4>
              <p className="text-[11px] text-gray-400 mt-0.5">{fw.author}</p>
              <p className="text-[12px] font-semibold text-gray-700 mt-2">
                {fw.coreConcept}
              </p>
              <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{fw.howUsed}</p>
            </div>
          );
        })}
      </div>
    </Collapsible>
  );
}
