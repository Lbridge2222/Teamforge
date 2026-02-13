
import { db } from "../lib/db";
import {
  organisations,
  workspaces,
  stages,
  activityCategories,
  teamRoles,
  stageRoleAssignments,
  activities,
  activityAssignments,
  roleProgressions,
  handoffs,
} from "../lib/db/schema";
import { eq } from "drizzle-orm";

const MOCK_STAGES = [
  "Marketing & Awareness",
  "Sales Discovery",
  "Solution Design",
  "Closing & Contracting",
  "Onboarding & Implementation",
  "Customer Success & Expansion",
];

const MOCK_CATEGORIES = [
  "Campaign Management",
  "Content Creation",
  "Lead Qualification",
  "Technical Pre-sales",
  "Commercial Negotiation",
  "Project Management",
  "System Configuration",
  "User Training",
  "Data Migration",
  "QBRs & Renewals",
  "Support Escalation",
  "Product Feedback",
];

const MOCK_ROLES = [
  // Marketing
  {
    name: "Growth Marketer",
    jobTitle: "Growth Marketing Manager",
    department: "Marketing",
    level: "senior",
    belbinPrimary: "resource_investigator",
    belbinSecondary: "shaper",
    stageIndex: 0,
    isLeaf: true,
    owns: [{ title: "User Acquisition", items: ["Paid Search", "Social Ads"] }],
    contributesTo: ["Brand Strategy"],
  },
  {
    name: "Content Strategist",
    jobTitle: "Senior Content Strategist",
    department: "Marketing",
    level: "lead",
    belbinPrimary: "plant",
    belbinSecondary: "monitor_evaluator",
    stageIndex: 0,
    isLeaf: true,
    owns: [{ title: "Content Calendar", items: ["Blog", "Whitepapers"] }],
    contributesTo: ["SEO"],
  },
  // Sales
  {
    name: "SDR",
    jobTitle: "Sales Development Rep",
    department: "Sales",
    level: "entry",
    belbinPrimary: "resource_investigator",
    belbinSecondary: "teamworker",
    stageIndex: 1,
    isLeaf: true,
    owns: [{ title: "Outbound Pipeline", items: ["Cold Calls", "Email Sequences"] }],
    contributesTo: ["Feedback Loop"],
  },
  {
    name: "Account Executive",
    jobTitle: "Enterprise AE",
    department: "Sales",
    level: "senior",
    belbinPrimary: "shaper",
    belbinSecondary: "resource_investigator",
    stageIndex: 3,
    isLeaf: true,
    owns: [{ title: "Revenue Quota", items: ["Closing Deals", "Contract Negotiation"] }],
    contributesTo: ["Forecasting"],
  },
  {
    name: "Sales Engineer",
    jobTitle: "Principal Solutions Engineer",
    department: "Sales",
    level: "mid",
    belbinPrimary: "specialist",
    belbinSecondary: "completer_finisher",
    stageIndex: 2,
    isLeaf: true,
    owns: [{ title: "Technical Win", items: ["Demos", "POCs"] }],
    contributesTo: ["Product Roadmap"],
  },
  // Implementation
  {
    name: "Project Manager",
    jobTitle: "Implementation Manager",
    department: "Professional Services",
    level: "mid",
    belbinPrimary: "implementer",
    belbinSecondary: "coordinator",
    stageIndex: 4,
    isLeaf: true,
    owns: [{ title: "Project Timeline", items: ["Gantt Charts", "Resource Allocation"] }],
    contributesTo: ["Methodology"],
  },
  {
    name: "Solutions Architect",
    jobTitle: "Senior Solutions Architect",
    department: "Professional Services",
    level: "senior",
    belbinPrimary: "monitor_evaluator",
    belbinSecondary: "plant",
    stageIndex: 4,
    isLeaf: true,
    owns: [{ title: "Solution Design", items: ["Architecture Diagrams", "Integration Specs"] }],
    contributesTo: ["Best Practices"],
  },
  // CS
  {
    name: "CSM",
    jobTitle: "Customer Success Manager",
    department: "Customer Success",
    level: "mid",
    belbinPrimary: "teamworker",
    belbinSecondary: "coordinator",
    stageIndex: 5,
    isLeaf: true,
    owns: [{ title: "Customer Health", items: ["QBRs", "Adoption Metrics"] }],
    contributesTo: ["Case Studies"],
  },
  // Leadership
  {
    name: "VP Sales",
    jobTitle: "Vice President of Sales",
    department: "Sales",
    level: "director",
    belbinPrimary: "coordinator",
    belbinSecondary: "shaper",
    overseesStageIndices: [1, 2, 3],
    owns: [{ title: "Global Revenue", items: ["Sales Strategy", "Hiring"] }],
  },
  {
    name: "Head of CS",
    jobTitle: "Head of Customer Success",
    department: "Customer Success",
    level: "head",
    belbinPrimary: "coordinator",
    belbinSecondary: "teamworker",
    overseesStageIndices: [4, 5],
    owns: [{ title: "Retention", items: ["Churn Reduction", "Expansion Strategy"] }],
  },
  {
    name: "CMO",
    jobTitle: "Chief Marketing Officer",
    department: "Marketing",
    level: "director",
    belbinPrimary: "shaper",
    belbinSecondary: "plant",
    overseesStageIndices: [0],
    owns: [{ title: "Brand", items: ["Positioning", "Market Entry"] }],
  },
  // Unassigned / Bench
  {
    name: "Data Analyst",
    jobTitle: "RevOps Analyst",
    department: "Operations",
    level: "mid",
    belbinPrimary: "monitor_evaluator",
    belbinSecondary: "specialist",
    stageIndex: undefined, // Unassigned
    isLeaf: false,
    owns: [{ title: "Reporting", items: ["Dashboards", "Data Quality"] }],
  },
];

const MOCK_ACTIVITIES = [
  "Run paid social campaigns",
  "Write blog posts",
  "Cold call leads",
  "Qualify inbound leads",
  "Conduct discovery call",
  "Build custom demo",
  "Draft proposal",
  "Negotiate contract terms",
  "Host kickoff meeting",
  "Configure Salesforce integration",
  "Import customer data",
  "Train end users",
  "Conduct QBR",
  "Handle renewal negotiation",
];

async function main() {
  console.log("🌱 Starting exhaustive seed...");

  // 1. Get or Create Organisation
  let org = await db.query.organisations.findFirst();
  if (!org) {
    [org] = await db
      .insert(organisations)
      .values({
        name: "Mock Corp Global",
        slug: "mock-corp-global",
        plan: "enterprise",
      })
      .returning();
    console.log("Created Organisation:", org.name);
  } else {
    console.log("Using existing Organisation:", org.name);
  }

  // 2. Create Workspace
  const [workspace] = await db
    .insert(workspaces)
    .values({
      orgId: org.id!,
      name: "SaaS Go-To-Market (Mock)",
      description: "An exhaustive dataset for testing formatting and layout.",
      industryTemplate: "saas-sales",
    })
    .returning();
  console.log("Created Workspace:", workspace.name);

  // 3. Create Stages
  const createdStages = await Promise.all(
    MOCK_STAGES.map((name, i) =>
      db
        .insert(stages)
        .values({
          workspaceId: workspace.id,
          name,
          sortOrder: i,
        })
        .returning()
        .then((rows) => rows[0])
    )
  );
  console.log(`Created ${createdStages.length} Stages`);

  // 4. Create Categories
  const createdCategories = await Promise.all(
    MOCK_CATEGORIES.map((name, i) =>
      db
        .insert(activityCategories)
        .values({
          workspaceId: workspace.id,
          name,
          sortOrder: i,
        })
        .returning()
        .then((rows) => rows[0])
    )
  );
  console.log(`Created ${createdCategories.length} Categories`);

  // 5. Create Roles
  const rolesMap = new Map(); // name -> role
  
  for (let i = 0; i < MOCK_ROLES.length; i++) {
    const r = MOCK_ROLES[i];
    
    // Calculate color index based on department roughly
    let colorIndex = 0;
    if (r.department === "Sales") colorIndex = 1;
    if (r.department === "Customer Success") colorIndex = 2;
    if (r.department === "Professional Services") colorIndex = 3;

    // Resolve overseen stages
    const overseesStageIds = r.overseesStageIndices?.map(idx => createdStages[idx].id) || [];

    const [role] = await db
      .insert(teamRoles)
      .values({
        workspaceId: workspace.id,
        name: r.name,
        jobTitle: r.jobTitle,
        colorIndex,
        belbinPrimary: r.belbinPrimary,
        belbinSecondary: r.belbinSecondary,
        overseesStageIds: overseesStageIds,
        budgetLevel: r.level === "director" ? "owner" : r.level === "head" ? "manager" : "none",
        owns: r.owns || [],
        contributesTo: r.contributesTo || [],
      })
      .returning();
    
    rolesMap.set(r.name, role);

    // Create Progression/Career info
    await db.insert(roleProgressions).values({
      roleId: role.id,
      tier: r.level as any,
      growthTrack: "steady",
      autonomy: "moderate",
    });

    // Assign to Stage if leaf node
    if (r.stageIndex !== undefined) {
      await db.insert(stageRoleAssignments).values({
        stageId: createdStages[r.stageIndex].id,
        roleId: role.id,
      });
    }
  }
  console.log(`Created ${MOCK_ROLES.length} Roles`);

  // 6. Create Random Activities
  for (const actName of MOCK_ACTIVITIES) {
    // Pick random category and stage
    const cat = createdCategories[Math.floor(Math.random() * createdCategories.length)];
    const stage = createdStages[Math.floor(Math.random() * createdStages.length)];

    const [activity] = await db.insert(activities).values({
      workspaceId: workspace.id,
      name: actName,
      categoryId: cat.id,
      stageId: stage.id,
    }).returning();

    // Assign to a random role that works in that stage? 
    // Simplified: Assign to random role
    const randomRole = Array.from(rolesMap.values())[Math.floor(Math.random() * rolesMap.size)];
    
    await db.insert(activityAssignments).values({
      activityId: activity.id,
      roleId: randomRole.id,
    });
  }
  console.log(`Created Activities`);

  console.log("✅ Exhaustive seed complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
