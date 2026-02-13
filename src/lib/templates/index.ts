import { db } from "@/lib/db";
import { stages, activityCategories, handoffs } from "@/lib/db/schema";

// ════════════════════════════════════════════
// Industry Template Seeder
// Seeds stages and activity categories when a
// workspace is created from a template.
// ════════════════════════════════════════════

type TemplateData = {
  stages: string[];
  categories: string[];
};

const TEMPLATES: Record<string, TemplateData> = {
  "saas-sales": {
    stages: [
      "Lead Generation",
      "SDR Qualification",
      "AE Discovery",
      "Proposal & Negotiation",
      "Close",
      "CS Handoff",
    ],
    categories: [
      "Prospecting",
      "Lead Qualification",
      "Discovery & Demo",
      "Proposal Creation",
      "Contract & Legal",
      "Pipeline Reporting",
      "Onboarding Handoff",
    ],
  },
  "customer-success": {
    stages: ["Onboarding", "Adoption", "Expansion", "Renewal", "Advocacy"],
    categories: [
      "Implementation",
      "Training",
      "Health Monitoring",
      "QBRs",
      "Expansion Plays",
      "Renewal Management",
      "Escalations",
      "Reporting",
    ],
  },
  "product-engineering": {
    stages: ["Discovery", "Design", "Build", "Ship", "Operate"],
    categories: [
      "User Research",
      "Requirement Definition",
      "Design",
      "Sprint Planning",
      "Development",
      "Code Review",
      "Testing",
      "Deployment",
      "Incident Response",
      "Documentation",
    ],
  },
  "higher-ed-admissions": {
    stages: [
      "Outreach",
      "Enquiry",
      "Interview",
      "Application",
      "Offer",
      "Enrolment",
    ],
    categories: [
      "Schools & Events",
      "Lead Management",
      "Conversion & Follow-up",
      "Interviews",
      "Application Processing",
      "Communications",
      "Offer Management",
      "Enrolment",
      "Compliance",
      "Strategy",
    ],
  },
  recruitment: {
    stages: [
      "Sourcing",
      "Screening",
      "Submission",
      "Client Interview",
      "Placement",
      "Aftercare",
    ],
    categories: [
      "Sourcing",
      "Screening & Assessment",
      "Candidate Prep",
      "Client Management",
      "Interview Coordination",
      "Placement Admin",
      "Relationship Management",
      "Reporting",
    ],
  },
};

export async function seedWorkspaceFromTemplate(
  workspaceId: string,
  templateId: string
) {
  const template = TEMPLATES[templateId];
  if (!template) return;

  // Create stages
  const createdStages = await db
    .insert(stages)
    .values(
      template.stages.map((name, i) => ({
        workspaceId,
        name,
        sortOrder: i,
      }))
    )
    .returning();

  // Create handoffs between adjacent stages
  for (let i = 0; i < createdStages.length - 1; i++) {
    await db.insert(handoffs).values({
      workspaceId,
      fromStageId: createdStages[i].id,
      toStageId: createdStages[i + 1].id,
    });
  }

  // Create activity categories
  await db.insert(activityCategories).values(
    template.categories.map((name, i) => ({
      workspaceId,
      name,
      sortOrder: i,
    }))
  );
}
