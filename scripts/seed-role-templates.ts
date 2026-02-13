import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { roleTemplates } from "../src/lib/db/schema";

const client = postgres(process.env.DATABASE_URL!, { prepare: false });
const db = drizzle(client);

// ════════════════════════════════════════════════════════════════════════════════
// MASSIVE ROLE TEMPLATE SEED
// 150+ real-world roles across 18 departments
// Each role has: department, title, purpose, deliverables, strengths,
// Belbin profile, tier, budget level, activities by category, and tags.
// Sourced from aggregated job specs across SaaS, fintech, e-commerce,
// consulting, agency, and enterprise orgs.
// ════════════════════════════════════════════════════════════════════════════════

type RoleTemplate = {
  department: string;
  jobTitle: string;
  corePurpose: string;
  keyDeliverables: string[];
  strengthProfile: string[];
  belbinPrimary: string;
  belbinSecondary: string;
  tier: "entry" | "mid" | "senior" | "lead" | "head" | "director";
  budgetLevel: "owner" | "manager" | "awareness" | "none";
  activities: { category: string; items: string[] }[];
  tags: string[];
};

const ROLE_TEMPLATES: RoleTemplate[] = [
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SOFTWARE ENGINEERING
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    department: "Engineering",
    jobTitle: "Junior Software Engineer",
    corePurpose: "Build features and fix bugs under guidance of senior engineers, learning codebase patterns and engineering best practices",
    keyDeliverables: ["Bug fixes shipped", "Feature tickets completed", "Code review participation", "Unit test coverage"],
    strengthProfile: ["Learning agility", "Attention to detail", "Collaboration"],
    belbinPrimary: "Implementer",
    belbinSecondary: "Team Worker",
    tier: "entry",
    budgetLevel: "none",
    activities: [
      { category: "Development", items: ["Write code for assigned tickets", "Fix bugs from issue tracker", "Write unit tests", "Participate in code reviews"] },
      { category: "Learning", items: ["Attend engineering onboarding", "Shadow senior engineers", "Complete training modules", "Document learnings"] },
    ],
    tags: ["engineering", "software", "ic", "entry-level"],
  },
  {
    department: "Engineering",
    jobTitle: "Software Engineer",
    corePurpose: "Design and implement features end-to-end, contributing to architecture decisions and mentoring junior engineers",
    keyDeliverables: ["Features shipped on time", "Technical design documents", "Code review throughput", "Reduced bug count in owned areas"],
    strengthProfile: ["Problem solving", "System design", "Ownership"],
    belbinPrimary: "Implementer",
    belbinSecondary: "Specialist",
    tier: "mid",
    budgetLevel: "none",
    activities: [
      { category: "Development", items: ["Design and implement features", "Write integration tests", "Review pull requests", "Refactor legacy code"] },
      { category: "Planning", items: ["Estimate tickets", "Break down epics into stories", "Participate in sprint planning", "Write technical design docs"] },
      { category: "Operations", items: ["Monitor production alerts", "Debug production issues", "Improve CI/CD pipeline", "Maintain documentation"] },
    ],
    tags: ["engineering", "software", "ic", "mid-level"],
  },
  {
    department: "Engineering",
    jobTitle: "Senior Software Engineer",
    corePurpose: "Lead technical design for complex systems, drive engineering quality standards, and mentor the team",
    keyDeliverables: ["System architecture documents", "Technical debt reduction", "Team velocity improvement", "Cross-team technical alignment"],
    strengthProfile: ["Architecture thinking", "Mentorship", "Technical leadership", "Communication"],
    belbinPrimary: "Plant",
    belbinSecondary: "Specialist",
    tier: "senior",
    budgetLevel: "awareness",
    activities: [
      { category: "Architecture", items: ["Design system architecture", "Write RFCs and ADRs", "Lead technical design reviews", "Evaluate build vs buy"] },
      { category: "Development", items: ["Implement complex features", "Establish coding standards", "Create shared libraries", "Performance optimization"] },
      { category: "Mentorship", items: ["Mentor junior/mid engineers", "Lead code review sessions", "Run tech talks", "Guide career development"] },
      { category: "Operations", items: ["Incident response lead", "Capacity planning", "SLA monitoring", "Postmortem facilitation"] },
    ],
    tags: ["engineering", "software", "ic", "senior"],
  },
  {
    department: "Engineering",
    jobTitle: "Staff Engineer",
    corePurpose: "Set technical direction across multiple teams, solve the hardest engineering problems, and drive org-wide engineering excellence",
    keyDeliverables: ["Multi-team technical strategy", "Platform reliability improvements", "Engineering process improvements", "Technical roadmap"],
    strengthProfile: ["Systems thinking", "Strategic influence", "Cross-team leadership"],
    belbinPrimary: "Plant",
    belbinSecondary: "Shaper",
    tier: "lead",
    budgetLevel: "awareness",
    activities: [
      { category: "Strategy", items: ["Define technical strategy", "Create engineering roadmap", "Drive technology selection", "Lead architecture guild"] },
      { category: "Cross-team", items: ["Align teams on technical direction", "Resolve cross-team dependencies", "Facilitate technical decision making", "Represent engineering in leadership"] },
      { category: "Innovation", items: ["Prototype new approaches", "Evaluate emerging technologies", "Run proof-of-concepts", "Publish internal tech blog posts"] },
    ],
    tags: ["engineering", "software", "ic", "staff"],
  },
  {
    department: "Engineering",
    jobTitle: "Principal Engineer",
    corePurpose: "Define long-term technical vision for the entire engineering organisation, ensuring architectural coherence at scale",
    keyDeliverables: ["Multi-year technical vision", "Engineering principles & guardrails", "Strategic vendor evaluations", "Company-wide architectural decisions"],
    strengthProfile: ["Visionary thinking", "Influence without authority", "Deep expertise"],
    belbinPrimary: "Plant",
    belbinSecondary: "Monitor Evaluator",
    tier: "head",
    budgetLevel: "manager",
    activities: [
      { category: "Vision", items: ["Set multi-year technical vision", "Define engineering principles", "Author architecture decision records", "Guide technology radar"] },
      { category: "Governance", items: ["Run architecture review board", "Evaluate strategic technology bets", "Define scaling strategy", "Set security & compliance standards"] },
    ],
    tags: ["engineering", "software", "ic", "principal"],
  },
  {
    department: "Engineering",
    jobTitle: "Engineering Manager",
    corePurpose: "Lead and grow a team of engineers, ensuring delivery, team health, and career progression",
    keyDeliverables: ["Team velocity & predictability", "Engineer retention & growth", "Sprint commitments met", "1:1 and feedback cadence"],
    strengthProfile: ["People leadership", "Delivery management", "Empathy", "Coaching"],
    belbinPrimary: "Coordinator",
    belbinSecondary: "Team Worker",
    tier: "lead",
    budgetLevel: "manager",
    activities: [
      { category: "People", items: ["Run weekly 1:1s", "Write performance reviews", "Create development plans", "Handle hiring for team", "Manage team capacity"] },
      { category: "Delivery", items: ["Run sprint ceremonies", "Remove blockers", "Track team metrics", "Coordinate with product", "Manage stakeholder expectations"] },
      { category: "Culture", items: ["Foster psychological safety", "Run team retrospectives", "Celebrate wins", "Address team conflicts"] },
    ],
    tags: ["engineering", "management", "people-leader"],
  },
  {
    department: "Engineering",
    jobTitle: "Senior Engineering Manager",
    corePurpose: "Lead multiple engineering teams, drive engineering strategy, and develop engineering managers",
    keyDeliverables: ["Cross-team delivery coordination", "Manager development", "Engineering headcount planning", "Process improvements"],
    strengthProfile: ["Strategic thinking", "Manager coaching", "Organisational design"],
    belbinPrimary: "Coordinator",
    belbinSecondary: "Shaper",
    tier: "head",
    budgetLevel: "owner",
    activities: [
      { category: "Leadership", items: ["Coach engineering managers", "Run skip-level 1:1s", "Set team structure & org design", "Drive hiring strategy"] },
      { category: "Strategy", items: ["Align engineering with business goals", "Headcount & budget planning", "Define engineering OKRs", "Vendor & tool decisions"] },
      { category: "Process", items: ["Improve engineering processes", "Define on-call & incident practices", "Standardise team workflows", "Drive post-incident reviews"] },
    ],
    tags: ["engineering", "management", "senior-leader"],
  },
  {
    department: "Engineering",
    jobTitle: "VP of Engineering",
    corePurpose: "Own the entire engineering organisation, strategy, budget, and delivery across all product lines",
    keyDeliverables: ["Engineering strategy & roadmap", "Department budget management", "Org-wide velocity", "Engineering brand & hiring pipeline"],
    strengthProfile: ["Executive leadership", "Strategic planning", "Stakeholder management"],
    belbinPrimary: "Shaper",
    belbinSecondary: "Coordinator",
    tier: "director",
    budgetLevel: "owner",
    activities: [
      { category: "Executive", items: ["Present to board / C-suite", "Set engineering vision", "Manage department P&L", "Drive M&A technical due diligence"] },
      { category: "Organisation", items: ["Design org structure", "Succession planning", "Define career ladders", "Employer branding for engineering"] },
    ],
    tags: ["engineering", "executive", "vp"],
  },
  {
    department: "Engineering",
    jobTitle: "Frontend Engineer",
    corePurpose: "Build performant, accessible user interfaces and design system components",
    keyDeliverables: ["UI components shipped", "Lighthouse performance scores", "Accessibility audit compliance", "Design system contributions"],
    strengthProfile: ["UI/UX sensibility", "CSS mastery", "Performance optimization"],
    belbinPrimary: "Implementer",
    belbinSecondary: "Completer Finisher",
    tier: "mid",
    budgetLevel: "none",
    activities: [
      { category: "Development", items: ["Build React/Vue components", "Implement responsive layouts", "Write E2E tests", "Optimize bundle size"] },
      { category: "Design System", items: ["Create reusable components", "Document component APIs", "Maintain Storybook", "Collaborate with designers"] },
    ],
    tags: ["engineering", "frontend", "ui"],
  },
  {
    department: "Engineering",
    jobTitle: "Backend Engineer",
    corePurpose: "Design and build APIs, services, and data pipelines that power the product",
    keyDeliverables: ["API endpoints shipped", "Service reliability (uptime)", "Database query performance", "API documentation"],
    strengthProfile: ["System design", "Database optimization", "Security awareness"],
    belbinPrimary: "Implementer",
    belbinSecondary: "Specialist",
    tier: "mid",
    budgetLevel: "none",
    activities: [
      { category: "Development", items: ["Design REST/GraphQL APIs", "Write database migrations", "Implement business logic", "Build background jobs"] },
      { category: "Infrastructure", items: ["Optimize database queries", "Set up caching layers", "Implement rate limiting", "Write API documentation"] },
    ],
    tags: ["engineering", "backend", "api"],
  },
  {
    department: "Engineering",
    jobTitle: "Full-Stack Engineer",
    corePurpose: "Deliver features across the entire stack from database to UI, bridging frontend and backend",
    keyDeliverables: ["End-to-end features shipped", "Cross-stack bug fixes", "Technical documentation", "Integration test coverage"],
    strengthProfile: ["Versatility", "Rapid prototyping", "Cross-stack debugging"],
    belbinPrimary: "Implementer",
    belbinSecondary: "Resource Investigator",
    tier: "mid",
    budgetLevel: "none",
    activities: [
      { category: "Development", items: ["Build full-stack features", "Create API endpoints and UI", "Write integration tests", "Handle database schema changes"] },
      { category: "Collaboration", items: ["Bridge frontend/backend teams", "Prototype new features", "Support DevOps tasks", "Review cross-stack PRs"] },
    ],
    tags: ["engineering", "full-stack"],
  },
  {
    department: "Engineering",
    jobTitle: "Mobile Engineer",
    corePurpose: "Build and maintain native or cross-platform mobile applications with excellent user experience",
    keyDeliverables: ["App store releases", "Crash-free rate", "App performance metrics", "Platform-specific features"],
    strengthProfile: ["Mobile UX", "Platform expertise", "Performance tuning"],
    belbinPrimary: "Implementer",
    belbinSecondary: "Completer Finisher",
    tier: "mid",
    budgetLevel: "none",
    activities: [
      { category: "Development", items: ["Build mobile screens and flows", "Implement push notifications", "Handle offline sync", "Write UI tests"] },
      { category: "Release", items: ["Prepare app store submissions", "Manage beta testing", "Monitor crash analytics", "Handle app review feedback"] },
    ],
    tags: ["engineering", "mobile", "ios", "android"],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PLATFORM / DEVOPS / SRE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    department: "Platform & Infrastructure",
    jobTitle: "DevOps Engineer",
    corePurpose: "Build and maintain CI/CD pipelines, infrastructure automation, and developer tooling",
    keyDeliverables: ["Deployment frequency", "Pipeline reliability", "Infrastructure-as-code coverage", "Mean time to deploy"],
    strengthProfile: ["Automation mindset", "Linux/Cloud expertise", "Scripting"],
    belbinPrimary: "Implementer",
    belbinSecondary: "Completer Finisher",
    tier: "mid",
    budgetLevel: "awareness",
    activities: [
      { category: "CI/CD", items: ["Maintain build pipelines", "Automate deployments", "Manage container orchestration", "Optimize build times"] },
      { category: "Infrastructure", items: ["Manage cloud resources (AWS/GCP/Azure)", "Write Terraform/Pulumi modules", "Handle secrets management", "Maintain monitoring stack"] },
    ],
    tags: ["engineering", "devops", "infrastructure"],
  },
  {
    department: "Platform & Infrastructure",
    jobTitle: "Site Reliability Engineer (SRE)",
    corePurpose: "Ensure production reliability, define SLOs, and automate operational toil away",
    keyDeliverables: ["Service uptime (SLO adherence)", "Incident response time", "Toil reduction %", "Runbook coverage"],
    strengthProfile: ["Reliability engineering", "Incident management", "Monitoring"],
    belbinPrimary: "Monitor Evaluator",
    belbinSecondary: "Implementer",
    tier: "senior",
    budgetLevel: "awareness",
    activities: [
      { category: "Reliability", items: ["Define and monitor SLOs/SLIs", "Conduct capacity planning", "Run game days & chaos engineering", "Write runbooks"] },
      { category: "Incident Management", items: ["Lead incident response", "Write postmortems", "Automate incident detection", "Maintain on-call rotation"] },
      { category: "Automation", items: ["Eliminate toil through automation", "Build self-healing systems", "Create operational dashboards", "Improve alert quality"] },
    ],
    tags: ["engineering", "sre", "reliability"],
  },
  {
    department: "Platform & Infrastructure",
    jobTitle: "Platform Engineer",
    corePurpose: "Build the internal developer platform that enables product teams to ship faster and safer",
    keyDeliverables: ["Developer experience score", "Platform adoption rate", "Self-service capability coverage", "Deployment lead time"],
    strengthProfile: ["Platform thinking", "Developer empathy", "API design"],
    belbinPrimary: "Plant",
    belbinSecondary: "Implementer",
    tier: "senior",
    budgetLevel: "awareness",
    activities: [
      { category: "Platform", items: ["Build internal developer portal", "Create service templates", "Manage Kubernetes clusters", "Build self-service infrastructure"] },
      { category: "Developer Experience", items: ["Improve local dev environment", "Create CLI tools", "Write platform documentation", "Run developer surveys"] },
    ],
    tags: ["engineering", "platform", "developer-experience"],
  },
  {
    department: "Platform & Infrastructure",
    jobTitle: "Cloud Architect",
    corePurpose: "Design cloud infrastructure strategy, ensure cost optimization, and drive cloud-native adoption",
    keyDeliverables: ["Cloud architecture blueprints", "Cost optimization savings", "Cloud migration plans", "Security compliance"],
    strengthProfile: ["Cloud strategy", "Cost management", "Security architecture"],
    belbinPrimary: "Plant",
    belbinSecondary: "Monitor Evaluator",
    tier: "lead",
    budgetLevel: "manager",
    activities: [
      { category: "Architecture", items: ["Design cloud architecture", "Create migration strategies", "Define network topology", "Set cloud security policies"] },
      { category: "Optimization", items: ["Run cost optimization reviews", "Right-size infrastructure", "Negotiate reserved instances", "Track cloud spend by team"] },
    ],
    tags: ["engineering", "cloud", "architecture"],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SECURITY
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    department: "Security",
    jobTitle: "Security Engineer",
    corePurpose: "Protect systems and data by identifying vulnerabilities, building security tooling, and responding to threats",
    keyDeliverables: ["Vulnerability remediation rate", "Security tool coverage", "Penetration test findings resolved", "Security incident response time"],
    strengthProfile: ["Threat modeling", "Security tooling", "Incident response"],
    belbinPrimary: "Monitor Evaluator",
    belbinSecondary: "Specialist",
    tier: "mid",
    budgetLevel: "none",
    activities: [
      { category: "Security", items: ["Conduct vulnerability assessments", "Implement SAST/DAST scanning", "Review infrastructure security", "Build security automation"] },
      { category: "Incident Response", items: ["Investigate security incidents", "Conduct forensic analysis", "Update incident playbooks", "Run tabletop exercises"] },
    ],
    tags: ["security", "engineering", "appsec"],
  },
  {
    department: "Security",
    jobTitle: "Head of Information Security (CISO)",
    corePurpose: "Own the organisation's security posture, compliance, and risk management strategy",
    keyDeliverables: ["Security strategy", "Compliance certifications (SOC2, ISO27001)", "Risk register", "Security budget management"],
    strengthProfile: ["Risk management", "Compliance expertise", "Executive communication"],
    belbinPrimary: "Shaper",
    belbinSecondary: "Monitor Evaluator",
    tier: "director",
    budgetLevel: "owner",
    activities: [
      { category: "Governance", items: ["Define security policies", "Manage compliance certifications", "Run risk assessments", "Present to board on security posture"] },
      { category: "Operations", items: ["Oversee SOC operations", "Manage security vendors", "Drive security awareness training", "Handle regulatory inquiries"] },
    ],
    tags: ["security", "executive", "compliance"],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PRODUCT MANAGEMENT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    department: "Product",
    jobTitle: "Associate Product Manager",
    corePurpose: "Support product discovery and delivery by conducting research, writing specs, and coordinating with engineering",
    keyDeliverables: ["User story tickets", "Research summaries", "Competitor analysis", "Feature adoption tracking"],
    strengthProfile: ["Curiosity", "Research", "Communication"],
    belbinPrimary: "Resource Investigator",
    belbinSecondary: "Team Worker",
    tier: "entry",
    budgetLevel: "none",
    activities: [
      { category: "Discovery", items: ["Conduct user interviews", "Analyse usage data", "Create competitor analyses", "Write user stories"] },
      { category: "Delivery", items: ["Groom backlog", "Attend standups", "Track feature metrics", "Coordinate QA testing"] },
    ],
    tags: ["product", "ic", "entry-level"],
  },
  {
    department: "Product",
    jobTitle: "Product Manager",
    corePurpose: "Own a product area end-to-end — define strategy, prioritise roadmap, and ship outcomes that move business metrics",
    keyDeliverables: ["Product roadmap", "Feature PRDs", "Metric-driven outcomes", "Stakeholder alignment"],
    strengthProfile: ["Strategic thinking", "Data analysis", "Stakeholder management", "Prioritisation"],
    belbinPrimary: "Shaper",
    belbinSecondary: "Resource Investigator",
    tier: "mid",
    budgetLevel: "awareness",
    activities: [
      { category: "Strategy", items: ["Define product vision for area", "Create quarterly roadmap", "Run prioritisation exercises (RICE/ICE)", "Set success metrics & OKRs"] },
      { category: "Discovery", items: ["Lead user research sessions", "Analyse product analytics", "Map customer journey", "Identify growth opportunities"] },
      { category: "Delivery", items: ["Write PRDs and acceptance criteria", "Run sprint reviews", "Manage feature launches", "Handle stakeholder communication"] },
    ],
    tags: ["product", "ic", "mid-level"],
  },
  {
    department: "Product",
    jobTitle: "Senior Product Manager",
    corePurpose: "Drive product strategy for a major product line, aligning cross-functional teams and influencing company direction",
    keyDeliverables: ["Product line strategy", "Revenue/retention impact", "Cross-team alignment", "Market positioning"],
    strengthProfile: ["Strategic leadership", "Business acumen", "Influence", "Analytical depth"],
    belbinPrimary: "Shaper",
    belbinSecondary: "Monitor Evaluator",
    tier: "senior",
    budgetLevel: "manager",
    activities: [
      { category: "Strategy", items: ["Own product line P&L", "Define go-to-market strategy", "Lead pricing decisions", "Shape company product vision"] },
      { category: "Leadership", items: ["Mentor PMs", "Align engineering & design leads", "Present to exec team", "Drive cross-functional initiatives"] },
      { category: "Market", items: ["Conduct market analysis", "Lead customer advisory board", "Define competitive positioning", "Identify M&A targets"] },
    ],
    tags: ["product", "ic", "senior"],
  },
  {
    department: "Product",
    jobTitle: "Director of Product",
    corePurpose: "Lead the product management function, set product strategy, and manage a team of PMs",
    keyDeliverables: ["Product organisation strategy", "PM team development", "Portfolio-level roadmap", "Product-led growth metrics"],
    strengthProfile: ["Leadership", "Portfolio management", "Organisational design"],
    belbinPrimary: "Coordinator",
    belbinSecondary: "Shaper",
    tier: "director",
    budgetLevel: "owner",
    activities: [
      { category: "Leadership", items: ["Hire and develop PMs", "Define PM career ladder", "Run product reviews", "Manage product budget"] },
      { category: "Strategy", items: ["Set portfolio strategy", "Align product & engineering investment", "Drive product-market fit", "Present to board"] },
    ],
    tags: ["product", "executive", "director"],
  },
  {
    department: "Product",
    jobTitle: "Product Analyst",
    corePurpose: "Provide data-driven insights to inform product decisions, measure feature impact, and identify opportunities",
    keyDeliverables: ["Dashboard & reports", "A/B test analysis", "Funnel conversion reports", "Cohort retention analysis"],
    strengthProfile: ["SQL expertise", "Statistical analysis", "Data storytelling"],
    belbinPrimary: "Monitor Evaluator",
    belbinSecondary: "Specialist",
    tier: "mid",
    budgetLevel: "none",
    activities: [
      { category: "Analysis", items: ["Build product dashboards", "Run A/B test analysis", "Create funnel reports", "Perform cohort analysis"] },
      { category: "Support", items: ["Support PM decision-making", "Define tracking requirements", "QA analytics implementation", "Present insights to team"] },
    ],
    tags: ["product", "analytics", "data"],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DESIGN
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    department: "Design",
    jobTitle: "UX Designer",
    corePurpose: "Design intuitive user experiences by conducting research, creating wireframes, and validating designs with users",
    keyDeliverables: ["Wireframes & prototypes", "Usability test reports", "User journey maps", "Design specs for engineering"],
    strengthProfile: ["Empathy", "Research methods", "Information architecture"],
    belbinPrimary: "Plant",
    belbinSecondary: "Team Worker",
    tier: "mid",
    budgetLevel: "none",
    activities: [
      { category: "Research", items: ["Conduct usability tests", "Create user personas", "Map user journeys", "Run card sorting exercises"] },
      { category: "Design", items: ["Create wireframes", "Build interactive prototypes", "Design user flows", "Write UX copy"] },
    ],
    tags: ["design", "ux", "research"],
  },
  {
    department: "Design",
    jobTitle: "UI Designer",
    corePurpose: "Craft beautiful, consistent visual interfaces that bring the brand to life in product",
    keyDeliverables: ["High-fidelity mockups", "Design system components", "Style guides", "Icon and illustration sets"],
    strengthProfile: ["Visual design", "Typography", "Color theory", "Brand consistency"],
    belbinPrimary: "Completer Finisher",
    belbinSecondary: "Plant",
    tier: "mid",
    budgetLevel: "none",
    activities: [
      { category: "Visual Design", items: ["Create high-fidelity mockups", "Design component library", "Maintain design tokens", "Create iconography"] },
      { category: "Collaboration", items: ["Hand off specs to engineering", "Review implemented designs", "Collaborate on animations", "Update brand guidelines"] },
    ],
    tags: ["design", "ui", "visual"],
  },
  {
    department: "Design",
    jobTitle: "Product Designer",
    corePurpose: "Own the end-to-end design of a product area from research through to pixel-perfect delivery",
    keyDeliverables: ["End-to-end feature designs", "Design system contributions", "Usability improvements", "Design quality metrics"],
    strengthProfile: ["Full-stack design", "Prototyping", "Design systems", "Cross-functional collaboration"],
    belbinPrimary: "Plant",
    belbinSecondary: "Shaper",
    tier: "senior",
    budgetLevel: "none",
    activities: [
      { category: "Design", items: ["Lead design for product area", "Create prototypes and specs", "Run design critiques", "Contribute to design system"] },
      { category: "Strategy", items: ["Define design vision for area", "Set design quality bar", "Advocate for user needs", "Drive design consistency"] },
    ],
    tags: ["design", "product-design"],
  },
  {
    department: "Design",
    jobTitle: "Head of Design",
    corePurpose: "Lead the design function, set design vision, build team, and ensure design excellence across all products",
    keyDeliverables: ["Design team growth", "Design system maturity", "NPS/CSAT improvements", "Cross-product design coherence"],
    strengthProfile: ["Design leadership", "Team building", "Strategic design"],
    belbinPrimary: "Coordinator",
    belbinSecondary: "Plant",
    tier: "head",
    budgetLevel: "owner",
    activities: [
      { category: "Leadership", items: ["Hire and mentor designers", "Define design processes", "Run design reviews", "Manage design tools budget"] },
      { category: "Strategy", items: ["Set design vision", "Drive design system adoption", "Align design with product strategy", "Present to executive team"] },
    ],
    tags: ["design", "executive", "head"],
  },
  {
    department: "Design",
    jobTitle: "UX Researcher",
    corePurpose: "Generate deep user insights through qualitative and quantitative research to inform product and design decisions",
    keyDeliverables: ["Research reports", "User interview insights", "Survey analysis", "Usability test findings"],
    strengthProfile: ["Research methodology", "Interview skills", "Data synthesis", "Storytelling"],
    belbinPrimary: "Resource Investigator",
    belbinSecondary: "Monitor Evaluator",
    tier: "mid",
    budgetLevel: "none",
    activities: [
      { category: "Research", items: ["Plan and conduct user interviews", "Design and run surveys", "Moderate usability tests", "Conduct diary studies"] },
      { category: "Insights", items: ["Synthesise research findings", "Create insight repositories", "Present to stakeholders", "Build research roadmap"] },
    ],
    tags: ["design", "ux-research"],
  },
  {
    department: "Design",
    jobTitle: "Design System Lead",
    corePurpose: "Own the design system as a product — defining components, patterns, and governance that enable consistent UI at scale",
    keyDeliverables: ["Component library coverage", "Design system documentation", "Adoption metrics", "Accessibility compliance"],
    strengthProfile: ["Systems thinking", "Component architecture", "Accessibility", "Documentation"],
    belbinPrimary: "Implementer",
    belbinSecondary: "Completer Finisher",
    tier: "senior",
    budgetLevel: "awareness",
    activities: [
      { category: "System", items: ["Build and maintain component library", "Define design tokens", "Write usage guidelines", "Run accessibility audits"] },
      { category: "Governance", items: ["Review component contributions", "Track adoption metrics", "Run design system office hours", "Coordinate with engineering"] },
    ],
    tags: ["design", "design-system", "frontend"],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DATA & ANALYTICS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    department: "Data & Analytics",
    jobTitle: "Data Analyst",
    corePurpose: "Transform raw data into actionable insights through analysis, visualisation, and reporting",
    keyDeliverables: ["Dashboard suite", "Weekly/monthly reports", "Ad-hoc analysis", "Data quality improvements"],
    strengthProfile: ["SQL", "Data visualisation", "Business understanding"],
    belbinPrimary: "Monitor Evaluator",
    belbinSecondary: "Specialist",
    tier: "mid",
    budgetLevel: "none",
    activities: [
      { category: "Analysis", items: ["Build dashboards in Looker/Tableau/Metabase", "Write SQL queries for ad-hoc analysis", "Create automated reports", "Identify trends and anomalies"] },
      { category: "Data Quality", items: ["Validate data accuracy", "Document data definitions", "Create data dictionaries", "Flag data quality issues"] },
    ],
    tags: ["data", "analytics", "sql"],
  },
  {
    department: "Data & Analytics",
    jobTitle: "Data Engineer",
    corePurpose: "Build and maintain the data infrastructure — pipelines, warehouses, and tooling — that powers analytics and ML",
    keyDeliverables: ["Pipeline reliability (SLA)", "Data freshness", "Warehouse query performance", "Data model documentation"],
    strengthProfile: ["ETL/ELT design", "Data modeling", "Pipeline orchestration"],
    belbinPrimary: "Implementer",
    belbinSecondary: "Specialist",
    tier: "mid",
    budgetLevel: "none",
    activities: [
      { category: "Pipelines", items: ["Build ETL/ELT pipelines", "Manage Airflow/Dagster DAGs", "Monitor pipeline health", "Handle data backfills"] },
      { category: "Warehouse", items: ["Design data models (star schema)", "Optimize warehouse queries", "Manage dbt transformations", "Maintain data catalog"] },
    ],
    tags: ["data", "engineering", "etl"],
  },
  {
    department: "Data & Analytics",
    jobTitle: "Data Scientist",
    corePurpose: "Apply statistical and machine learning methods to solve business problems and generate predictive insights",
    keyDeliverables: ["ML models in production", "Predictive accuracy metrics", "Experiment results", "Research papers/presentations"],
    strengthProfile: ["Machine learning", "Statistics", "Python/R", "Experimentation"],
    belbinPrimary: "Plant",
    belbinSecondary: "Specialist",
    tier: "senior",
    budgetLevel: "none",
    activities: [
      { category: "Modeling", items: ["Build predictive models", "Feature engineering", "Model evaluation & validation", "Deploy models to production"] },
      { category: "Experimentation", items: ["Design A/B experiments", "Statistical significance testing", "Causal inference analysis", "Write experiment reports"] },
    ],
    tags: ["data", "ml", "science"],
  },
  {
    department: "Data & Analytics",
    jobTitle: "Machine Learning Engineer",
    corePurpose: "Productionise ML models with robust pipelines, monitoring, and scalable serving infrastructure",
    keyDeliverables: ["Model serving latency", "ML pipeline reliability", "Model retraining automation", "Feature store coverage"],
    strengthProfile: ["ML ops", "System design", "Model optimization"],
    belbinPrimary: "Implementer",
    belbinSecondary: "Specialist",
    tier: "senior",
    budgetLevel: "none",
    activities: [
      { category: "MLOps", items: ["Build model training pipelines", "Set up model serving infrastructure", "Implement model monitoring", "Manage feature stores"] },
      { category: "Engineering", items: ["Optimize model inference", "Build A/B testing framework for models", "Automate model retraining", "Handle model versioning"] },
    ],
    tags: ["data", "ml", "engineering"],
  },
  {
    department: "Data & Analytics",
    jobTitle: "Head of Data",
    corePurpose: "Lead the data organisation — strategy, team, infrastructure, and governance — enabling data-driven decisions company-wide",
    keyDeliverables: ["Data strategy", "Team growth & retention", "Data platform maturity", "Data governance framework"],
    strengthProfile: ["Data strategy", "Team leadership", "Stakeholder management"],
    belbinPrimary: "Coordinator",
    belbinSecondary: "Shaper",
    tier: "head",
    budgetLevel: "owner",
    activities: [
      { category: "Strategy", items: ["Define data strategy", "Set data team OKRs", "Manage data budget", "Present to exec team"] },
      { category: "Governance", items: ["Establish data governance", "Define data ownership", "Manage data privacy compliance", "Create data quality standards"] },
    ],
    tags: ["data", "executive", "head"],
  },
  {
    department: "Data & Analytics",
    jobTitle: "Analytics Engineer",
    corePurpose: "Bridge data engineering and analytics by building clean, tested, documented data models analysts can trust",
    keyDeliverables: ["dbt model coverage", "Data test pass rate", "Self-serve analytics adoption", "Metric definitions"],
    strengthProfile: ["SQL mastery", "Data modeling", "Documentation"],
    belbinPrimary: "Implementer",
    belbinSecondary: "Completer Finisher",
    tier: "mid",
    budgetLevel: "none",
    activities: [
      { category: "Modeling", items: ["Build dbt models", "Define metrics layer", "Create semantic models", "Write data tests"] },
      { category: "Enablement", items: ["Build self-serve dashboards", "Train stakeholders on tools", "Maintain data documentation", "Support ad-hoc requests"] },
    ],
    tags: ["data", "analytics-engineering", "dbt"],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // QUALITY ASSURANCE / QA
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    department: "Quality Assurance",
    jobTitle: "QA Engineer",
    corePurpose: "Ensure product quality through manual and exploratory testing, bug reporting, and test case management",
    keyDeliverables: ["Test case coverage", "Bugs found before release", "Regression test execution", "Release sign-off"],
    strengthProfile: ["Attention to detail", "Exploratory testing", "Communication"],
    belbinPrimary: "Completer Finisher",
    belbinSecondary: "Monitor Evaluator",
    tier: "mid",
    budgetLevel: "none",
    activities: [
      { category: "Testing", items: ["Write test cases", "Execute regression tests", "Perform exploratory testing", "Validate bug fixes"] },
      { category: "Process", items: ["Manage test case suite", "Track defect metrics", "Participate in sprint planning", "Sign off releases"] },
    ],
    tags: ["qa", "testing"],
  },
  {
    department: "Quality Assurance",
    jobTitle: "QA Automation Engineer",
    corePurpose: "Build and maintain automated test suites that ensure rapid, reliable quality feedback in CI/CD",
    keyDeliverables: ["Automated test coverage %", "Test execution time", "Flaky test reduction", "CI pipeline integration"],
    strengthProfile: ["Test automation", "Programming", "CI/CD integration"],
    belbinPrimary: "Implementer",
    belbinSecondary: "Completer Finisher",
    tier: "mid",
    budgetLevel: "none",
    activities: [
      { category: "Automation", items: ["Write E2E test automation", "Build API test suites", "Maintain test infrastructure", "Reduce flaky tests"] },
      { category: "Framework", items: ["Select and maintain test frameworks", "Create test utilities", "Integrate with CI/CD", "Generate test reports"] },
    ],
    tags: ["qa", "automation", "testing"],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MARKETING
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    department: "Marketing",
    jobTitle: "Marketing Coordinator",
    corePurpose: "Support marketing campaigns across channels, manage content calendar, and coordinate events",
    keyDeliverables: ["Campaign coordination", "Content calendar management", "Event logistics", "Marketing collateral updates"],
    strengthProfile: ["Organisation", "Multitasking", "Communication"],
    belbinPrimary: "Team Worker",
    belbinSecondary: "Implementer",
    tier: "entry",
    budgetLevel: "none",
    activities: [
      { category: "Campaigns", items: ["Coordinate campaign launches", "Schedule social media posts", "Update marketing collateral", "Track campaign assets"] },
      { category: "Events", items: ["Coordinate event logistics", "Manage vendor relationships", "Handle event registrations", "Post-event follow-up"] },
    ],
    tags: ["marketing", "entry-level", "coordinator"],
  },
  {
    department: "Marketing",
    jobTitle: "Content Marketing Manager",
    corePurpose: "Create and manage a content engine that drives organic traffic, brand authority, and lead generation",
    keyDeliverables: ["Blog posts published", "Organic traffic growth", "Content-sourced leads", "SEO ranking improvements"],
    strengthProfile: ["Writing", "SEO", "Content strategy", "Storytelling"],
    belbinPrimary: "Plant",
    belbinSecondary: "Resource Investigator",
    tier: "mid",
    budgetLevel: "awareness",
    activities: [
      { category: "Content Creation", items: ["Write blog posts and articles", "Create ebooks and whitepapers", "Produce case studies", "Manage content calendar"] },
      { category: "SEO", items: ["Conduct keyword research", "Optimize existing content", "Build internal linking strategy", "Track organic rankings"] },
      { category: "Distribution", items: ["Manage email newsletter", "Coordinate guest posting", "Repurpose content across channels", "Syndicate to third-party platforms"] },
    ],
    tags: ["marketing", "content", "seo"],
  },
  {
    department: "Marketing",
    jobTitle: "Demand Generation Manager",
    corePurpose: "Drive qualified pipeline through paid campaigns, nurture programs, and conversion optimization",
    keyDeliverables: ["Marketing qualified leads (MQLs)", "Cost per acquisition (CPA)", "Pipeline contribution", "Conversion rates by stage"],
    strengthProfile: ["Paid media", "Marketing automation", "Analytics", "Growth mindset"],
    belbinPrimary: "Shaper",
    belbinSecondary: "Resource Investigator",
    tier: "mid",
    budgetLevel: "manager",
    activities: [
      { category: "Paid Acquisition", items: ["Manage Google/LinkedIn ads", "Run paid social campaigns", "Optimize landing pages", "A/B test ad creative"] },
      { category: "Nurture", items: ["Build email nurture sequences", "Score and qualify leads", "Create retargeting campaigns", "Manage webinar programs"] },
      { category: "Analytics", items: ["Track attribution models", "Report on funnel metrics", "Optimize conversion rates", "Manage marketing budget"] },
    ],
    tags: ["marketing", "demand-gen", "paid"],
  },
  {
    department: "Marketing",
    jobTitle: "Product Marketing Manager",
    corePurpose: "Own positioning, messaging, and go-to-market for product launches, enabling sales and driving adoption",
    keyDeliverables: ["Positioning & messaging docs", "Launch plans", "Sales enablement materials", "Win/loss analysis"],
    strengthProfile: ["Positioning", "Competitive intelligence", "Cross-functional coordination"],
    belbinPrimary: "Shaper",
    belbinSecondary: "Resource Investigator",
    tier: "senior",
    budgetLevel: "awareness",
    activities: [
      { category: "Positioning", items: ["Craft product positioning", "Write messaging frameworks", "Create battle cards", "Conduct win/loss analysis"] },
      { category: "Go-to-Market", items: ["Lead product launches", "Create launch playbooks", "Train sales on new features", "Build demo scripts"] },
      { category: "Enablement", items: ["Create sales decks", "Build ROI calculators", "Produce customer proof points", "Manage competitive intelligence"] },
    ],
    tags: ["marketing", "product-marketing", "gtm"],
  },
  {
    department: "Marketing",
    jobTitle: "Brand Manager",
    corePurpose: "Define and protect the brand identity, ensuring consistency across all customer touchpoints",
    keyDeliverables: ["Brand guidelines", "Brand awareness metrics", "Visual identity system", "Brand audit reports"],
    strengthProfile: ["Brand strategy", "Visual identity", "Storytelling"],
    belbinPrimary: "Plant",
    belbinSecondary: "Completer Finisher",
    tier: "mid",
    budgetLevel: "awareness",
    activities: [
      { category: "Brand", items: ["Maintain brand guidelines", "Audit brand consistency", "Manage brand assets", "Define tone of voice"] },
      { category: "Creative", items: ["Brief creative agencies", "Review creative outputs", "Lead brand campaigns", "Track brand perception"] },
    ],
    tags: ["marketing", "brand"],
  },
  {
    department: "Marketing",
    jobTitle: "VP of Marketing / CMO",
    corePurpose: "Lead the marketing function end-to-end — strategy, budget, team, and pipeline contribution to revenue",
    keyDeliverables: ["Marketing strategy", "Pipeline & revenue contribution", "Brand leadership", "Team development"],
    strengthProfile: ["Strategic marketing", "Revenue alignment", "Executive leadership"],
    belbinPrimary: "Shaper",
    belbinSecondary: "Coordinator",
    tier: "director",
    budgetLevel: "owner",
    activities: [
      { category: "Strategy", items: ["Set annual marketing strategy", "Manage marketing P&L", "Align with sales on targets", "Present to board"] },
      { category: "Team", items: ["Hire and develop marketing leaders", "Define team structure", "Set marketing OKRs", "Manage agency relationships"] },
    ],
    tags: ["marketing", "executive", "cmo"],
  },
  {
    department: "Marketing",
    jobTitle: "Growth Marketing Manager",
    corePurpose: "Run experiments across the funnel to find scalable growth levers for acquisition, activation, and retention",
    keyDeliverables: ["Experiment velocity", "Conversion rate improvements", "Growth model", "Channel-level ROI"],
    strengthProfile: ["Experimentation", "Data analysis", "Creative problem solving"],
    belbinPrimary: "Plant",
    belbinSecondary: "Shaper",
    tier: "mid",
    budgetLevel: "awareness",
    activities: [
      { category: "Experimentation", items: ["Run growth experiments", "A/B test landing pages", "Optimize onboarding flows", "Test referral programs"] },
      { category: "Analysis", items: ["Build growth model", "Analyse funnel drop-offs", "Track cohort retention", "Report on experiment results"] },
    ],
    tags: ["marketing", "growth"],
  },
  {
    department: "Marketing",
    jobTitle: "Social Media Manager",
    corePurpose: "Build and engage the brand's social media presence across platforms, driving awareness and community",
    keyDeliverables: ["Follower growth", "Engagement rate", "Social-sourced traffic", "Community sentiment"],
    strengthProfile: ["Social media savvy", "Copywriting", "Community building"],
    belbinPrimary: "Resource Investigator",
    belbinSecondary: "Team Worker",
    tier: "entry",
    budgetLevel: "none",
    activities: [
      { category: "Content", items: ["Create social media posts", "Manage content calendar", "Engage with audience", "Monitor brand mentions"] },
      { category: "Analytics", items: ["Track social metrics", "Report on engagement", "Analyse best-performing content", "Identify trending topics"] },
    ],
    tags: ["marketing", "social-media"],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SALES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    department: "Sales",
    jobTitle: "Sales Development Representative (SDR)",
    corePurpose: "Generate qualified pipeline by prospecting, cold outreach, and qualifying inbound leads for account executives",
    keyDeliverables: ["Meetings booked", "Qualified opportunities created", "Outreach volume", "Response rates"],
    strengthProfile: ["Persistence", "Communication", "Research", "Resilience"],
    belbinPrimary: "Resource Investigator",
    belbinSecondary: "Shaper",
    tier: "entry",
    budgetLevel: "none",
    activities: [
      { category: "Prospecting", items: ["Research target accounts", "Build prospect lists", "Send cold emails/calls", "Qualify inbound leads"] },
      { category: "Pipeline", items: ["Book discovery meetings", "Update CRM records", "Follow up on leads", "Hit daily activity targets"] },
    ],
    tags: ["sales", "sdr", "entry-level"],
  },
  {
    department: "Sales",
    jobTitle: "Account Executive (AE)",
    corePurpose: "Own the full sales cycle from discovery through close, building relationships and delivering revenue",
    keyDeliverables: ["Closed-won revenue", "Average deal size", "Win rate", "Pipeline coverage ratio"],
    strengthProfile: ["Negotiation", "Relationship building", "Discovery skills", "Closing"],
    belbinPrimary: "Shaper",
    belbinSecondary: "Resource Investigator",
    tier: "mid",
    budgetLevel: "awareness",
    activities: [
      { category: "Sales Cycle", items: ["Run discovery calls", "Deliver product demos", "Create proposals", "Negotiate contracts"] },
      { category: "Pipeline", items: ["Manage deal pipeline", "Forecast accurately", "Update CRM", "Build account plans"] },
      { category: "Relationships", items: ["Build executive relationships", "Coordinate with solutions engineers", "Manage procurement process", "Handle objections"] },
    ],
    tags: ["sales", "ae", "closing"],
  },
  {
    department: "Sales",
    jobTitle: "Senior Account Executive",
    corePurpose: "Close complex enterprise deals, manage strategic accounts, and mentor junior AEs",
    keyDeliverables: ["Enterprise deal revenue", "Strategic account growth", "Complex deal closure", "AE mentorship"],
    strengthProfile: ["Enterprise selling", "Strategic thinking", "Executive presence"],
    belbinPrimary: "Shaper",
    belbinSecondary: "Coordinator",
    tier: "senior",
    budgetLevel: "awareness",
    activities: [
      { category: "Enterprise Sales", items: ["Manage multi-stakeholder deals", "Navigate procurement", "Run executive briefings", "Build business cases"] },
      { category: "Account Strategy", items: ["Create account expansion plans", "Map org charts", "Identify cross-sell opportunities", "Run QBRs with customers"] },
    ],
    tags: ["sales", "enterprise", "senior"],
  },
  {
    department: "Sales",
    jobTitle: "Solutions Engineer / Sales Engineer",
    corePurpose: "Provide technical expertise during the sales cycle, running demos, POCs, and handling technical objections",
    keyDeliverables: ["Demo win rate", "POC completion rate", "RFP/RFI responses", "Technical qualification accuracy"],
    strengthProfile: ["Technical depth", "Presentation skills", "Problem solving"],
    belbinPrimary: "Specialist",
    belbinSecondary: "Resource Investigator",
    tier: "mid",
    budgetLevel: "none",
    activities: [
      { category: "Pre-Sales", items: ["Run product demonstrations", "Build POC environments", "Answer technical questions", "Complete RFPs/RFIs"] },
      { category: "Technical", items: ["Design integration architectures", "Build custom demo environments", "Create technical documentation", "Support security reviews"] },
    ],
    tags: ["sales", "solutions-engineering", "technical"],
  },
  {
    department: "Sales",
    jobTitle: "Sales Manager",
    corePurpose: "Lead and coach a team of AEs to hit quota, manage pipeline reviews, and drive sales process adherence",
    keyDeliverables: ["Team quota attainment", "Pipeline health metrics", "Forecast accuracy", "Rep ramp time"],
    strengthProfile: ["Coaching", "Pipeline management", "Forecasting", "Team motivation"],
    belbinPrimary: "Coordinator",
    belbinSecondary: "Shaper",
    tier: "lead",
    budgetLevel: "manager",
    activities: [
      { category: "Coaching", items: ["Run weekly 1:1s with reps", "Join customer calls", "Review deal strategy", "Deliver sales training"] },
      { category: "Management", items: ["Run pipeline reviews", "Forecast to leadership", "Manage territory assignments", "Handle compensation plans"] },
    ],
    tags: ["sales", "management", "leader"],
  },
  {
    department: "Sales",
    jobTitle: "VP of Sales / CRO",
    corePurpose: "Own the revenue number — sales strategy, team structure, compensation, and go-to-market execution",
    keyDeliverables: ["Revenue target attainment", "Sales team growth", "Sales cycle efficiency", "Market expansion"],
    strengthProfile: ["Revenue strategy", "Executive leadership", "GTM execution"],
    belbinPrimary: "Shaper",
    belbinSecondary: "Coordinator",
    tier: "director",
    budgetLevel: "owner",
    activities: [
      { category: "Strategy", items: ["Set sales strategy", "Define comp plans", "Plan territory coverage", "Present to board"] },
      { category: "Operations", items: ["Manage sales budget", "Hire sales leaders", "Drive CRM adoption", "Align with marketing on pipeline"] },
    ],
    tags: ["sales", "executive", "revenue"],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CUSTOMER SUCCESS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    department: "Customer Success",
    jobTitle: "Customer Success Manager (CSM)",
    corePurpose: "Drive adoption, retention, and expansion for a portfolio of accounts through proactive relationship management",
    keyDeliverables: ["Net Revenue Retention (NRR)", "Churn rate", "NPS/CSAT scores", "Expansion revenue"],
    strengthProfile: ["Relationship management", "Product knowledge", "Proactive communication"],
    belbinPrimary: "Team Worker",
    belbinSecondary: "Resource Investigator",
    tier: "mid",
    budgetLevel: "none",
    activities: [
      { category: "Account Management", items: ["Run quarterly business reviews", "Monitor customer health scores", "Create success plans", "Identify expansion opportunities"] },
      { category: "Adoption", items: ["Drive product adoption", "Deliver training sessions", "Share best practices", "Track usage metrics"] },
      { category: "Retention", items: ["Manage renewal process", "Handle escalations", "Conduct churn risk analysis", "Build executive relationships"] },
    ],
    tags: ["customer-success", "csm", "retention"],
  },
  {
    department: "Customer Success",
    jobTitle: "Customer Onboarding Specialist",
    corePurpose: "Guide new customers through implementation and onboarding to achieve fast time-to-value",
    keyDeliverables: ["Time to first value", "Onboarding completion rate", "CSAT during onboarding", "Implementation milestones"],
    strengthProfile: ["Project management", "Technical aptitude", "Customer empathy"],
    belbinPrimary: "Implementer",
    belbinSecondary: "Team Worker",
    tier: "entry",
    budgetLevel: "none",
    activities: [
      { category: "Implementation", items: ["Run kickoff calls", "Configure customer accounts", "Migrate customer data", "Set up integrations"] },
      { category: "Enablement", items: ["Deliver training sessions", "Create onboarding guides", "Track milestone completion", "Hand off to CSM"] },
    ],
    tags: ["customer-success", "onboarding"],
  },
  {
    department: "Customer Success",
    jobTitle: "VP of Customer Success",
    corePurpose: "Lead the CS organisation to maximise retention, expansion, and advocacy across the entire customer base",
    keyDeliverables: ["Net Revenue Retention", "Gross churn rate", "CS team efficiency", "Customer advocacy pipeline"],
    strengthProfile: ["CS strategy", "Revenue management", "Team leadership"],
    belbinPrimary: "Coordinator",
    belbinSecondary: "Shaper",
    tier: "director",
    budgetLevel: "owner",
    activities: [
      { category: "Strategy", items: ["Define CS strategy", "Set retention targets", "Build health scoring model", "Present to board on NRR"] },
      { category: "Team", items: ["Hire and develop CS leaders", "Define CS playbooks", "Manage CS budget", "Design compensation models"] },
    ],
    tags: ["customer-success", "executive"],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CUSTOMER SUPPORT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    department: "Customer Support",
    jobTitle: "Support Agent",
    corePurpose: "Resolve customer issues quickly and empathetically via chat, email, and phone",
    keyDeliverables: ["First response time", "Resolution time", "CSAT score", "Ticket volume handled"],
    strengthProfile: ["Empathy", "Troubleshooting", "Communication", "Patience"],
    belbinPrimary: "Team Worker",
    belbinSecondary: "Implementer",
    tier: "entry",
    budgetLevel: "none",
    activities: [
      { category: "Support", items: ["Respond to tickets", "Troubleshoot issues", "Escalate complex cases", "Update knowledge base"] },
      { category: "Quality", items: ["Follow support processes", "Document solutions", "Tag tickets accurately", "Participate in QA reviews"] },
    ],
    tags: ["support", "customer-service", "entry-level"],
  },
  {
    department: "Customer Support",
    jobTitle: "Senior Support Engineer",
    corePurpose: "Handle complex technical support cases, debug integrations, and serve as escalation point",
    keyDeliverables: ["Escalation resolution rate", "Bug reports filed", "Technical KB articles", "Customer escalation CSAT"],
    strengthProfile: ["Technical debugging", "API knowledge", "Customer communication"],
    belbinPrimary: "Specialist",
    belbinSecondary: "Completer Finisher",
    tier: "senior",
    budgetLevel: "none",
    activities: [
      { category: "Technical Support", items: ["Debug complex issues", "Review API logs", "Test customer integrations", "Write bug reports for engineering"] },
      { category: "Knowledge", items: ["Write technical KB articles", "Mentor support agents", "Identify common issue patterns", "Create troubleshooting guides"] },
    ],
    tags: ["support", "technical", "senior"],
  },
  {
    department: "Customer Support",
    jobTitle: "Head of Support",
    corePurpose: "Lead the support team, define support strategy, and ensure world-class customer experience",
    keyDeliverables: ["Overall CSAT/NPS", "Team performance metrics", "Support cost per ticket", "Self-service deflection rate"],
    strengthProfile: ["Operations leadership", "Process design", "Team coaching"],
    belbinPrimary: "Coordinator",
    belbinSecondary: "Shaper",
    tier: "head",
    budgetLevel: "owner",
    activities: [
      { category: "Strategy", items: ["Define support strategy", "Set SLA targets", "Manage support budget", "Drive self-service initiatives"] },
      { category: "Operations", items: ["Optimise support workflows", "Manage support tools", "Handle major escalations", "Report on support metrics"] },
    ],
    tags: ["support", "leadership", "head"],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // HUMAN RESOURCES / PEOPLE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    department: "People & HR",
    jobTitle: "HR Coordinator",
    corePurpose: "Support HR operations including onboarding, benefits administration, and employee records management",
    keyDeliverables: ["Onboarding completion rate", "HR ticket resolution time", "Benefits enrollment accuracy", "Employee record compliance"],
    strengthProfile: ["Organisation", "Attention to detail", "Empathy"],
    belbinPrimary: "Implementer",
    belbinSecondary: "Team Worker",
    tier: "entry",
    budgetLevel: "none",
    activities: [
      { category: "Operations", items: ["Process new hires", "Manage employee records", "Handle benefits enrollment", "Coordinate offboarding"] },
      { category: "Support", items: ["Answer HR queries", "Maintain HRIS system", "Prepare HR reports", "Support compliance audits"] },
    ],
    tags: ["hr", "people", "coordinator"],
  },
  {
    department: "People & HR",
    jobTitle: "Recruiter",
    corePurpose: "Attract, assess, and hire top talent through full-cycle recruiting across departments",
    keyDeliverables: ["Time to fill", "Offer acceptance rate", "Candidate experience score", "Pipeline diversity"],
    strengthProfile: ["Sourcing", "Interviewing", "Candidate experience", "Negotiation"],
    belbinPrimary: "Resource Investigator",
    belbinSecondary: "Team Worker",
    tier: "mid",
    budgetLevel: "none",
    activities: [
      { category: "Sourcing", items: ["Source candidates on LinkedIn", "Attend job fairs", "Manage job postings", "Build talent pipelines"] },
      { category: "Process", items: ["Screen resumes", "Conduct phone screens", "Coordinate interviews", "Manage offers & negotiations"] },
      { category: "Experience", items: ["Keep candidates informed", "Collect interview feedback", "Maintain ATS hygiene", "Track recruiting metrics"] },
    ],
    tags: ["hr", "recruiting", "talent"],
  },
  {
    department: "People & HR",
    jobTitle: "Senior Recruiter / Talent Acquisition Partner",
    corePurpose: "Lead recruiting for critical hires, build employer brand, and optimize the hiring process",
    keyDeliverables: ["Strategic hire completion", "Employer brand metrics", "Process improvement ROI", "Hiring manager satisfaction"],
    strengthProfile: ["Strategic sourcing", "Process optimization", "Stakeholder management"],
    belbinPrimary: "Shaper",
    belbinSecondary: "Resource Investigator",
    tier: "senior",
    budgetLevel: "awareness",
    activities: [
      { category: "Strategic Hiring", items: ["Partner with hiring managers", "Build hiring strategies", "Recruit executive roles", "Manage agency relationships"] },
      { category: "Employer Brand", items: ["Build employer brand content", "Manage Glassdoor/LinkedIn presence", "Run employee referral programs", "Represent at conferences"] },
    ],
    tags: ["hr", "recruiting", "senior"],
  },
  {
    department: "People & HR",
    jobTitle: "People Partner / HR Business Partner",
    corePurpose: "Act as strategic HR advisor to business leaders, driving performance, engagement, and organisational effectiveness",
    keyDeliverables: ["Employee engagement scores", "Performance review completion", "Org design improvements", "Employee relations case resolution"],
    strengthProfile: ["Strategic HR", "Coaching", "Employee relations", "Org design"],
    belbinPrimary: "Coordinator",
    belbinSecondary: "Team Worker",
    tier: "senior",
    budgetLevel: "awareness",
    activities: [
      { category: "Business Partnership", items: ["Advise leaders on people strategy", "Support org design changes", "Facilitate talent reviews", "Coach managers"] },
      { category: "Employee Relations", items: ["Handle employee grievances", "Manage performance improvement plans", "Support restructures", "Ensure compliance"] },
      { category: "Engagement", items: ["Run engagement surveys", "Analyse attrition trends", "Design retention programs", "Facilitate team health checks"] },
    ],
    tags: ["hr", "hrbp", "people-partner"],
  },
  {
    department: "People & HR",
    jobTitle: "Learning & Development Manager",
    corePurpose: "Design and deliver learning programs that develop employee skills, support career growth, and drive business performance",
    keyDeliverables: ["Training completion rates", "Skill development metrics", "Manager effectiveness scores", "Learning NPS"],
    strengthProfile: ["Instructional design", "Facilitation", "Needs assessment"],
    belbinPrimary: "Plant",
    belbinSecondary: "Coordinator",
    tier: "mid",
    budgetLevel: "awareness",
    activities: [
      { category: "Program Design", items: ["Design training curricula", "Build e-learning modules", "Create leadership programs", "Manage LMS platform"] },
      { category: "Delivery", items: ["Facilitate workshops", "Manage external trainers", "Run onboarding programs", "Evaluate learning outcomes"] },
    ],
    tags: ["hr", "l&d", "learning"],
  },
  {
    department: "People & HR",
    jobTitle: "Compensation & Benefits Specialist",
    corePurpose: "Design and administer compensation programs, benefits packages, and equity plans that attract and retain talent",
    keyDeliverables: ["Compensation benchmarking reports", "Benefits cost management", "Pay equity analysis", "Total rewards statements"],
    strengthProfile: ["Compensation analysis", "Benefits design", "Data analysis"],
    belbinPrimary: "Monitor Evaluator",
    belbinSecondary: "Specialist",
    tier: "mid",
    budgetLevel: "awareness",
    activities: [
      { category: "Compensation", items: ["Conduct salary benchmarking", "Design pay bands", "Run pay equity analysis", "Manage equity/stock programs"] },
      { category: "Benefits", items: ["Manage benefits enrollment", "Negotiate with benefits vendors", "Design wellness programs", "Track benefits utilization"] },
    ],
    tags: ["hr", "compensation", "benefits"],
  },
  {
    department: "People & HR",
    jobTitle: "VP of People / Chief People Officer",
    corePurpose: "Lead the entire people function — culture, talent, total rewards, and org effectiveness — as a strategic business partner",
    keyDeliverables: ["Employee engagement", "Retention rates", "People team efficiency", "Culture metrics"],
    strengthProfile: ["People strategy", "Executive leadership", "Culture building"],
    belbinPrimary: "Coordinator",
    belbinSecondary: "Shaper",
    tier: "director",
    budgetLevel: "owner",
    activities: [
      { category: "Strategy", items: ["Set people strategy", "Manage people budget", "Design org effectiveness programs", "Present to board"] },
      { category: "Culture", items: ["Define company values", "Drive DEI initiatives", "Lead culture programs", "Manage internal comms"] },
    ],
    tags: ["hr", "executive", "cpo"],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FINANCE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    department: "Finance",
    jobTitle: "Financial Analyst",
    corePurpose: "Provide financial analysis, budgeting, and forecasting to support business decision-making",
    keyDeliverables: ["Financial models", "Budget vs actual reports", "Variance analysis", "Board deck financials"],
    strengthProfile: ["Financial modeling", "Excel/Sheets mastery", "Analytical thinking"],
    belbinPrimary: "Monitor Evaluator",
    belbinSecondary: "Specialist",
    tier: "mid",
    budgetLevel: "awareness",
    activities: [
      { category: "Analysis", items: ["Build financial models", "Prepare variance analysis", "Create scenario planning models", "Support pricing analysis"] },
      { category: "Reporting", items: ["Prepare monthly reports", "Build board deck financials", "Track KPIs", "Support audit requests"] },
    ],
    tags: ["finance", "analysis", "fp&a"],
  },
  {
    department: "Finance",
    jobTitle: "Accountant",
    corePurpose: "Maintain accurate financial records, process transactions, and ensure compliance with accounting standards",
    keyDeliverables: ["Month-end close timeliness", "Financial statement accuracy", "Reconciliation completion", "Audit readiness"],
    strengthProfile: ["Accounting standards", "Attention to detail", "Process orientation"],
    belbinPrimary: "Completer Finisher",
    belbinSecondary: "Implementer",
    tier: "mid",
    budgetLevel: "none",
    activities: [
      { category: "Accounting", items: ["Process accounts payable/receivable", "Perform bank reconciliations", "Manage general ledger", "Prepare journal entries"] },
      { category: "Compliance", items: ["Prepare financial statements", "Support external audits", "Ensure tax compliance", "Maintain internal controls"] },
    ],
    tags: ["finance", "accounting"],
  },
  {
    department: "Finance",
    jobTitle: "Controller",
    corePurpose: "Oversee all accounting operations, financial reporting, and internal controls",
    keyDeliverables: ["Financial statement quality", "Close cycle time", "Internal control effectiveness", "Audit outcomes"],
    strengthProfile: ["Accounting leadership", "Internal controls", "Team management"],
    belbinPrimary: "Completer Finisher",
    belbinSecondary: "Coordinator",
    tier: "lead",
    budgetLevel: "manager",
    activities: [
      { category: "Operations", items: ["Manage month-end close", "Review financial statements", "Oversee revenue recognition", "Manage accounting team"] },
      { category: "Controls", items: ["Design internal controls", "Lead audit preparation", "Manage tax compliance", "Implement accounting systems"] },
    ],
    tags: ["finance", "controller", "accounting"],
  },
  {
    department: "Finance",
    jobTitle: "CFO / VP of Finance",
    corePurpose: "Lead financial strategy, fundraising, and fiscal discipline across the organisation",
    keyDeliverables: ["Financial strategy", "Cash runway management", "Fundraising/debt management", "Board financial reporting"],
    strengthProfile: ["Financial strategy", "Investor relations", "Executive leadership"],
    belbinPrimary: "Shaper",
    belbinSecondary: "Monitor Evaluator",
    tier: "director",
    budgetLevel: "owner",
    activities: [
      { category: "Strategy", items: ["Set financial strategy", "Manage cash flow", "Lead fundraising rounds", "Negotiate banking relationships"] },
      { category: "Governance", items: ["Present to board", "Manage investor relations", "Oversee financial compliance", "Drive cost optimization"] },
    ],
    tags: ["finance", "executive", "cfo"],
  },
  {
    department: "Finance",
    jobTitle: "Revenue Operations Analyst",
    corePurpose: "Optimize revenue processes across sales, marketing, and CS by managing CRM, reporting, and GTM analytics",
    keyDeliverables: ["CRM data quality", "Revenue reporting accuracy", "Process automation", "Pipeline analytics"],
    strengthProfile: ["CRM administration", "Data analysis", "Process optimization"],
    belbinPrimary: "Implementer",
    belbinSecondary: "Monitor Evaluator",
    tier: "mid",
    budgetLevel: "none",
    activities: [
      { category: "CRM", items: ["Maintain CRM hygiene", "Build CRM reports & dashboards", "Manage sales process automation", "Configure CRM workflows"] },
      { category: "Analytics", items: ["Build revenue reports", "Analyse pipeline health", "Track GTM metrics", "Support forecasting"] },
    ],
    tags: ["finance", "revops", "crm"],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // LEGAL & COMPLIANCE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    department: "Legal & Compliance",
    jobTitle: "Legal Counsel",
    corePurpose: "Provide legal advice on contracts, intellectual property, employment law, and regulatory compliance",
    keyDeliverables: ["Contract turnaround time", "Legal risk assessments", "Policy documents", "Litigation management"],
    strengthProfile: ["Legal analysis", "Contract drafting", "Risk assessment"],
    belbinPrimary: "Monitor Evaluator",
    belbinSecondary: "Completer Finisher",
    tier: "mid",
    budgetLevel: "none",
    activities: [
      { category: "Contracts", items: ["Draft and review contracts", "Negotiate customer agreements", "Manage vendor contracts", "Handle NDAs and DPAs"] },
      { category: "Compliance", items: ["Ensure regulatory compliance", "Draft company policies", "Manage IP portfolio", "Support employment matters"] },
    ],
    tags: ["legal", "compliance", "contracts"],
  },
  {
    department: "Legal & Compliance",
    jobTitle: "Privacy & Compliance Officer",
    corePurpose: "Ensure the organisation complies with data privacy regulations (GDPR, CCPA) and industry standards",
    keyDeliverables: ["Privacy impact assessments", "Compliance audit results", "Data processing records", "Incident response reports"],
    strengthProfile: ["Privacy law", "Compliance frameworks", "Process design"],
    belbinPrimary: "Completer Finisher",
    belbinSecondary: "Monitor Evaluator",
    tier: "senior",
    budgetLevel: "awareness",
    activities: [
      { category: "Privacy", items: ["Conduct privacy impact assessments", "Manage data subject requests", "Maintain ROPA", "Train staff on privacy"] },
      { category: "Compliance", items: ["Manage SOC2/ISO27001 compliance", "Run internal audits", "Handle regulatory inquiries", "Update compliance documentation"] },
    ],
    tags: ["legal", "privacy", "compliance", "gdpr"],
  },
  {
    department: "Legal & Compliance",
    jobTitle: "General Counsel / Head of Legal",
    corePurpose: "Lead all legal affairs, manage external counsel, and protect the company from legal risk",
    keyDeliverables: ["Legal strategy", "Risk mitigation", "External counsel management", "Board legal reporting"],
    strengthProfile: ["Legal strategy", "Executive counsel", "Risk management"],
    belbinPrimary: "Monitor Evaluator",
    belbinSecondary: "Coordinator",
    tier: "director",
    budgetLevel: "owner",
    activities: [
      { category: "Strategy", items: ["Set legal strategy", "Manage legal budget", "Advise executive team", "Handle board governance"] },
      { category: "Operations", items: ["Manage external law firms", "Oversee M&A due diligence", "Handle major litigation", "Manage IP strategy"] },
    ],
    tags: ["legal", "executive", "general-counsel"],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // OPERATIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    department: "Operations",
    jobTitle: "Operations Manager",
    corePurpose: "Optimise business processes, manage cross-functional projects, and ensure operational efficiency",
    keyDeliverables: ["Process efficiency improvements", "Project delivery", "Cost savings", "SLA compliance"],
    strengthProfile: ["Process optimization", "Project management", "Cross-functional coordination"],
    belbinPrimary: "Implementer",
    belbinSecondary: "Coordinator",
    tier: "mid",
    budgetLevel: "awareness",
    activities: [
      { category: "Process", items: ["Map and improve business processes", "Define SOPs", "Automate manual workflows", "Track operational metrics"] },
      { category: "Projects", items: ["Manage cross-functional projects", "Coordinate with vendors", "Run operational reviews", "Handle capacity planning"] },
    ],
    tags: ["operations", "process"],
  },
  {
    department: "Operations",
    jobTitle: "Business Operations Analyst",
    corePurpose: "Analyse business operations data to identify inefficiencies, track KPIs, and support strategic decision-making",
    keyDeliverables: ["Operational dashboards", "Process analysis reports", "Automation recommendations", "KPI tracking"],
    strengthProfile: ["Data analysis", "Process mapping", "Tool administration"],
    belbinPrimary: "Monitor Evaluator",
    belbinSecondary: "Implementer",
    tier: "mid",
    budgetLevel: "none",
    activities: [
      { category: "Analysis", items: ["Build operational dashboards", "Analyse process bottlenecks", "Track business KPIs", "Prepare ops reports"] },
      { category: "Systems", items: ["Administer business tools", "Configure workflow automation", "Document process changes", "Support tool evaluation"] },
    ],
    tags: ["operations", "analytics"],
  },
  {
    department: "Operations",
    jobTitle: "Chief Operating Officer (COO)",
    corePurpose: "Oversee day-to-day operations and execution, translating strategy into operational excellence",
    keyDeliverables: ["Operational strategy execution", "Cross-functional alignment", "Operational efficiency", "Scaling playbooks"],
    strengthProfile: ["Operational leadership", "Strategic execution", "People leadership"],
    belbinPrimary: "Coordinator",
    belbinSecondary: "Shaper",
    tier: "director",
    budgetLevel: "owner",
    activities: [
      { category: "Strategy", items: ["Translate strategy to operations", "Run executive operations reviews", "Drive operational planning", "Present to board"] },
      { category: "Execution", items: ["Align cross-functional teams", "Manage operational budget", "Drive company-wide OKRs", "Handle crisis management"] },
    ],
    tags: ["operations", "executive", "coo"],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PROJECT / PROGRAM MANAGEMENT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    department: "Project Management",
    jobTitle: "Project Manager",
    corePurpose: "Plan, execute, and deliver projects on time, on budget, and within scope",
    keyDeliverables: ["Project delivery on time/budget", "Stakeholder satisfaction", "Risk mitigation", "Status reporting"],
    strengthProfile: ["Planning", "Stakeholder management", "Risk management"],
    belbinPrimary: "Coordinator",
    belbinSecondary: "Implementer",
    tier: "mid",
    budgetLevel: "awareness",
    activities: [
      { category: "Planning", items: ["Create project plans", "Define scope and milestones", "Allocate resources", "Manage project budget"] },
      { category: "Execution", items: ["Run project standups", "Track deliverables", "Manage risks and issues", "Communicate status to stakeholders"] },
    ],
    tags: ["pm", "project-management"],
  },
  {
    department: "Project Management",
    jobTitle: "Program Manager",
    corePurpose: "Coordinate multiple interdependent projects to deliver strategic outcomes across teams and departments",
    keyDeliverables: ["Program milestone delivery", "Cross-project dependency management", "Executive reporting", "Portfolio health"],
    strengthProfile: ["Strategic coordination", "Dependency management", "Executive communication"],
    belbinPrimary: "Coordinator",
    belbinSecondary: "Shaper",
    tier: "senior",
    budgetLevel: "manager",
    activities: [
      { category: "Program", items: ["Manage cross-project dependencies", "Align project timelines", "Run steering committees", "Track program-level risks"] },
      { category: "Reporting", items: ["Create executive dashboards", "Present to leadership", "Manage program budget", "Facilitate cross-team planning"] },
    ],
    tags: ["pm", "program-management"],
  },
  {
    department: "Project Management",
    jobTitle: "Scrum Master / Agile Coach",
    corePurpose: "Facilitate agile practices, remove impediments, and coach teams to improve delivery and collaboration",
    keyDeliverables: ["Sprint velocity trends", "Team satisfaction scores", "Impediment resolution time", "Process maturity improvement"],
    strengthProfile: ["Facilitation", "Coaching", "Servant leadership", "Agile expertise"],
    belbinPrimary: "Team Worker",
    belbinSecondary: "Coordinator",
    tier: "mid",
    budgetLevel: "none",
    activities: [
      { category: "Facilitation", items: ["Run sprint planning", "Facilitate daily standups", "Lead retrospectives", "Conduct sprint reviews"] },
      { category: "Coaching", items: ["Coach teams on agile practices", "Remove impediments", "Shield team from distractions", "Improve team processes"] },
    ],
    tags: ["agile", "scrum", "coaching"],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // IT & INTERNAL TOOLS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    department: "IT",
    jobTitle: "IT Support Specialist",
    corePurpose: "Provide technical support to employees, manage hardware/software, and maintain IT infrastructure",
    keyDeliverables: ["Ticket resolution time", "Employee satisfaction", "Device provisioning speed", "System uptime"],
    strengthProfile: ["Troubleshooting", "Customer service", "Technical breadth"],
    belbinPrimary: "Implementer",
    belbinSecondary: "Team Worker",
    tier: "entry",
    budgetLevel: "none",
    activities: [
      { category: "Support", items: ["Resolve IT support tickets", "Provision new employee devices", "Manage software licenses", "Support video conferencing"] },
      { category: "Maintenance", items: ["Manage MDM platform", "Maintain IT inventory", "Update system documentation", "Handle vendor support tickets"] },
    ],
    tags: ["it", "support", "helpdesk"],
  },
  {
    department: "IT",
    jobTitle: "IT Manager / Director",
    corePurpose: "Lead IT operations, security, and tool strategy to enable productive and secure work across the organisation",
    keyDeliverables: ["IT strategy", "System uptime", "Security posture", "IT budget management"],
    strengthProfile: ["IT leadership", "Vendor management", "Security awareness"],
    belbinPrimary: "Coordinator",
    belbinSecondary: "Monitor Evaluator",
    tier: "lead",
    budgetLevel: "owner",
    activities: [
      { category: "Strategy", items: ["Define IT strategy", "Manage IT budget", "Evaluate and procure tools", "Drive digital workplace initiatives"] },
      { category: "Security", items: ["Implement endpoint security", "Manage identity & access (SSO/SCIM)", "Run security training", "Handle compliance requirements"] },
    ],
    tags: ["it", "management", "security"],
  },
  {
    department: "IT",
    jobTitle: "Systems Administrator",
    corePurpose: "Manage and maintain the organisation's IT systems, networks, and cloud infrastructure",
    keyDeliverables: ["System uptime", "Backup reliability", "Security patching compliance", "Network performance"],
    strengthProfile: ["System administration", "Networking", "Security"],
    belbinPrimary: "Implementer",
    belbinSecondary: "Completer Finisher",
    tier: "mid",
    budgetLevel: "none",
    activities: [
      { category: "Administration", items: ["Manage servers and cloud infra", "Configure network equipment", "Implement backup solutions", "Manage DNS and SSL"] },
      { category: "Security", items: ["Apply security patches", "Monitor system logs", "Manage firewall rules", "Conduct access reviews"] },
    ],
    tags: ["it", "sysadmin", "infrastructure"],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PARTNERSHIPS & BUSINESS DEVELOPMENT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    department: "Partnerships",
    jobTitle: "Partnerships Manager",
    corePurpose: "Identify, negotiate, and manage strategic partnerships that drive revenue, product integration, or market access",
    keyDeliverables: ["Partner-sourced revenue", "Active partnerships", "Joint marketing campaigns", "Integration completions"],
    strengthProfile: ["Relationship building", "Negotiation", "Business development"],
    belbinPrimary: "Resource Investigator",
    belbinSecondary: "Shaper",
    tier: "mid",
    budgetLevel: "awareness",
    activities: [
      { category: "Development", items: ["Identify partnership opportunities", "Negotiate partnership terms", "Draft partnership agreements", "Launch co-marketing campaigns"] },
      { category: "Management", items: ["Manage partner relationships", "Track partner revenue", "Coordinate integration projects", "Run partner QBRs"] },
    ],
    tags: ["partnerships", "business-development"],
  },
  {
    department: "Partnerships",
    jobTitle: "VP of Business Development",
    corePurpose: "Lead strategic business development — partnerships, M&A, and market expansion — to accelerate company growth",
    keyDeliverables: ["Strategic deal pipeline", "Partnership revenue contribution", "Market expansion", "M&A evaluation"],
    strengthProfile: ["Strategic development", "Executive relationships", "Deal making"],
    belbinPrimary: "Shaper",
    belbinSecondary: "Resource Investigator",
    tier: "director",
    budgetLevel: "owner",
    activities: [
      { category: "Strategy", items: ["Define BD strategy", "Identify M&A targets", "Negotiate strategic deals", "Present to board"] },
      { category: "Execution", items: ["Build executive relationships", "Manage BD team", "Track deal pipeline", "Coordinate with product on integrations"] },
    ],
    tags: ["partnerships", "executive", "bd"],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FOUNDER / C-SUITE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    department: "Executive",
    jobTitle: "CEO / Founder",
    corePurpose: "Set company vision, build the team, raise capital, and ensure the company achieves its mission",
    keyDeliverables: ["Company vision & strategy", "Revenue growth", "Fundraising", "Team & culture"],
    strengthProfile: ["Vision", "Leadership", "Fundraising", "Decision making"],
    belbinPrimary: "Shaper",
    belbinSecondary: "Plant",
    tier: "director",
    budgetLevel: "owner",
    activities: [
      { category: "Strategy", items: ["Set company vision", "Define strategic priorities", "Manage board relationships", "Lead fundraising"] },
      { category: "Leadership", items: ["Hire executive team", "Drive company culture", "Communicate with all-hands", "Make final decisions on key issues"] },
    ],
    tags: ["executive", "founder", "ceo"],
  },
  {
    department: "Executive",
    jobTitle: "CTO / Co-Founder (Technical)",
    corePurpose: "Set technical vision, make foundational architecture decisions, and lead the engineering culture",
    keyDeliverables: ["Technical strategy", "Architecture decisions", "Engineering culture", "Technical talent acquisition"],
    strengthProfile: ["Technical vision", "Architecture", "Engineering leadership"],
    belbinPrimary: "Plant",
    belbinSecondary: "Shaper",
    tier: "director",
    budgetLevel: "owner",
    activities: [
      { category: "Technical", items: ["Set technical vision", "Make architecture decisions", "Evaluate technology bets", "Drive technical innovation"] },
      { category: "Leadership", items: ["Build engineering team", "Define engineering culture", "Represent tech externally", "Partner with CEO on strategy"] },
    ],
    tags: ["executive", "cto", "founder"],
  },
  {
    department: "Executive",
    jobTitle: "Chief of Staff",
    corePurpose: "Support the CEO/exec team with strategic initiatives, cross-functional alignment, and operational cadence",
    keyDeliverables: ["Executive initiative delivery", "Cross-functional alignment", "Board prep quality", "Meeting cadence effectiveness"],
    strengthProfile: ["Strategic thinking", "Execution", "Stakeholder management", "Communication"],
    belbinPrimary: "Coordinator",
    belbinSecondary: "Shaper",
    tier: "lead",
    budgetLevel: "awareness",
    activities: [
      { category: "Executive Support", items: ["Prepare board materials", "Manage executive OKRs", "Coordinate exec team meetings", "Drive special projects"] },
      { category: "Operations", items: ["Run company all-hands", "Manage strategic initiatives", "Facilitate cross-functional alignment", "Handle investor communications"] },
    ],
    tags: ["executive", "chief-of-staff"],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PROFESSIONAL SERVICES / CONSULTING
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    department: "Professional Services",
    jobTitle: "Implementation Consultant",
    corePurpose: "Lead customer implementations, configuring the product and ensuring successful go-live",
    keyDeliverables: ["Implementation completion rate", "Time to go-live", "Customer satisfaction", "Configuration quality"],
    strengthProfile: ["Technical configuration", "Project management", "Customer facing"],
    belbinPrimary: "Implementer",
    belbinSecondary: "Coordinator",
    tier: "mid",
    budgetLevel: "none",
    activities: [
      { category: "Implementation", items: ["Run discovery workshops", "Configure product for customer", "Manage implementation timeline", "Conduct go-live readiness checks"] },
      { category: "Enablement", items: ["Train customer admins", "Create implementation documentation", "Build best practice guides", "Manage change management"] },
    ],
    tags: ["services", "implementation", "consulting"],
  },
  {
    department: "Professional Services",
    jobTitle: "Solutions Architect",
    corePurpose: "Design complex technical solutions for enterprise customers, bridging product capabilities with business requirements",
    keyDeliverables: ["Solution architecture documents", "Integration designs", "Technical feasibility assessments", "Customer solution satisfaction"],
    strengthProfile: ["Architecture", "Technical communication", "Customer requirements"],
    belbinPrimary: "Plant",
    belbinSecondary: "Specialist",
    tier: "senior",
    budgetLevel: "awareness",
    activities: [
      { category: "Architecture", items: ["Design solution architectures", "Create integration blueprints", "Assess technical feasibility", "Design data migration strategies"] },
      { category: "Customer", items: ["Lead technical workshops", "Present to technical stakeholders", "Support presales with architectures", "Build reference architectures"] },
    ],
    tags: ["services", "solutions-architect", "technical"],
  },
  {
    department: "Professional Services",
    jobTitle: "Technical Account Manager",
    corePurpose: "Serve as the dedicated technical advisor for strategic accounts, ensuring technical success and deep product adoption",
    keyDeliverables: ["Technical health score", "Feature adoption rate", "Escalation prevention rate", "Technical NPS"],
    strengthProfile: ["Technical depth", "Relationship management", "Advisory skills"],
    belbinPrimary: "Specialist",
    belbinSecondary: "Team Worker",
    tier: "senior",
    budgetLevel: "none",
    activities: [
      { category: "Advisory", items: ["Conduct technical health reviews", "Recommend best practices", "Plan feature adoption roadmap", "Lead architecture reviews"] },
      { category: "Support", items: ["Manage technical escalations", "Coordinate with engineering on bugs", "Run training workshops", "Facilitate beta programs"] },
    ],
    tags: ["services", "tam", "account-management"],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // COMMUNICATIONS / PR
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    department: "Communications",
    jobTitle: "Communications Manager",
    corePurpose: "Own internal and external communications, managing company messaging, PR, and employer brand",
    keyDeliverables: ["Press coverage", "Internal comms reach", "Crisis response", "Employer brand content"],
    strengthProfile: ["Writing", "Media relations", "Crisis management"],
    belbinPrimary: "Resource Investigator",
    belbinSecondary: "Plant",
    tier: "mid",
    budgetLevel: "awareness",
    activities: [
      { category: "External Comms", items: ["Write press releases", "Manage media relationships", "Coordinate interviews", "Handle crisis communications"] },
      { category: "Internal Comms", items: ["Write internal newsletters", "Manage company intranet", "Support executive communications", "Coordinate all-hands content"] },
    ],
    tags: ["communications", "pr"],
  },
  {
    department: "Communications",
    jobTitle: "Technical Writer",
    corePurpose: "Create clear, accurate documentation for products, APIs, and internal processes",
    keyDeliverables: ["Documentation coverage", "Doc page views", "User satisfaction with docs", "API reference completeness"],
    strengthProfile: ["Technical writing", "Information architecture", "Attention to detail"],
    belbinPrimary: "Completer Finisher",
    belbinSecondary: "Specialist",
    tier: "mid",
    budgetLevel: "none",
    activities: [
      { category: "Documentation", items: ["Write product documentation", "Create API references", "Build tutorial guides", "Maintain changelog"] },
      { category: "Process", items: ["Review docs PRs from engineering", "Manage docs platform", "Conduct docs audits", "Track doc usage analytics"] },
    ],
    tags: ["communications", "technical-writing", "documentation"],
  },
  {
    department: "Communications",
    jobTitle: "Developer Advocate / DevRel",
    corePurpose: "Build and nurture the developer community by creating content, giving talks, and gathering feedback for product",
    keyDeliverables: ["Developer community growth", "Content engagement", "Conference talks", "Developer NPS"],
    strengthProfile: ["Technical content creation", "Public speaking", "Community building"],
    belbinPrimary: "Resource Investigator",
    belbinSecondary: "Plant",
    tier: "mid",
    budgetLevel: "awareness",
    activities: [
      { category: "Content", items: ["Write technical blog posts", "Create video tutorials", "Build sample applications", "Maintain developer docs"] },
      { category: "Community", items: ["Speak at conferences", "Run developer meetups", "Manage community forums", "Gather developer feedback for product"] },
    ],
    tags: ["devrel", "community", "developer-advocacy"],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SUPPLY CHAIN / LOGISTICS (for e-commerce, manufacturing)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    department: "Supply Chain & Logistics",
    jobTitle: "Supply Chain Analyst",
    corePurpose: "Analyse supply chain data to optimize inventory, reduce costs, and improve delivery performance",
    keyDeliverables: ["Inventory turn rate", "Supply chain cost reduction", "Demand forecast accuracy", "Supplier performance reports"],
    strengthProfile: ["Data analysis", "Supply chain knowledge", "Forecasting"],
    belbinPrimary: "Monitor Evaluator",
    belbinSecondary: "Specialist",
    tier: "mid",
    budgetLevel: "none",
    activities: [
      { category: "Analysis", items: ["Forecast demand", "Analyse inventory levels", "Track supplier performance", "Identify cost saving opportunities"] },
      { category: "Reporting", items: ["Build supply chain dashboards", "Create procurement reports", "Monitor logistics KPIs", "Support S&OP process"] },
    ],
    tags: ["supply-chain", "logistics", "analytics"],
  },
  {
    department: "Supply Chain & Logistics",
    jobTitle: "Procurement Manager",
    corePurpose: "Manage vendor relationships, negotiate contracts, and ensure cost-effective procurement of goods and services",
    keyDeliverables: ["Cost savings", "Vendor performance scores", "Contract compliance", "Procurement cycle time"],
    strengthProfile: ["Negotiation", "Vendor management", "Cost analysis"],
    belbinPrimary: "Shaper",
    belbinSecondary: "Monitor Evaluator",
    tier: "mid",
    budgetLevel: "manager",
    activities: [
      { category: "Procurement", items: ["Source and evaluate vendors", "Negotiate contracts and pricing", "Manage purchase orders", "Handle vendor disputes"] },
      { category: "Management", items: ["Track procurement spend", "Manage vendor relationships", "Ensure contract compliance", "Support budget planning"] },
    ],
    tags: ["supply-chain", "procurement"],
  },
  {
    department: "Supply Chain & Logistics",
    jobTitle: "Logistics Coordinator",
    corePurpose: "Coordinate shipments, manage warehouse operations, and ensure on-time delivery to customers",
    keyDeliverables: ["On-time delivery rate", "Shipping cost per order", "Warehouse accuracy", "Order fulfillment time"],
    strengthProfile: ["Coordination", "Problem solving", "Process management"],
    belbinPrimary: "Implementer",
    belbinSecondary: "Team Worker",
    tier: "entry",
    budgetLevel: "none",
    activities: [
      { category: "Logistics", items: ["Coordinate shipments", "Manage warehouse inventory", "Track deliveries", "Handle shipping exceptions"] },
      { category: "Operations", items: ["Process orders", "Manage returns", "Coordinate with carriers", "Update logistics documentation"] },
    ],
    tags: ["supply-chain", "logistics", "entry-level"],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // EDUCATION / ACADEMIA / EDTECH
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    department: "Education",
    jobTitle: "Instructional Designer",
    corePurpose: "Design engaging learning experiences using pedagogy, multimedia, and assessment design principles",
    keyDeliverables: ["Course completions", "Learner satisfaction scores", "Assessment pass rates", "Content production"],
    strengthProfile: ["Instructional design", "Multimedia production", "Assessment design"],
    belbinPrimary: "Plant",
    belbinSecondary: "Completer Finisher",
    tier: "mid",
    budgetLevel: "none",
    activities: [
      { category: "Design", items: ["Design course curricula", "Create e-learning modules", "Write assessment questions", "Build learning paths"] },
      { category: "Production", items: ["Produce video content", "Build interactive exercises", "Manage LMS content", "Evaluate learning outcomes"] },
    ],
    tags: ["education", "instructional-design", "learning"],
  },
  {
    department: "Education",
    jobTitle: "Admissions Officer",
    corePurpose: "Manage the admissions pipeline — from outreach through enrollment — ensuring target intake is met",
    keyDeliverables: ["Application volume", "Conversion rates", "Enrollment targets", "Student diversity"],
    strengthProfile: ["Recruitment", "Communication", "Data management"],
    belbinPrimary: "Resource Investigator",
    belbinSecondary: "Team Worker",
    tier: "mid",
    budgetLevel: "none",
    activities: [
      { category: "Recruitment", items: ["Attend school visits and fairs", "Process applications", "Conduct applicant interviews", "Make admission decisions"] },
      { category: "Administration", items: ["Manage applicant database", "Send offer letters", "Track enrollment deposits", "Generate admissions reports"] },
    ],
    tags: ["education", "admissions", "higher-ed"],
  },
  {
    department: "Education",
    jobTitle: "Student Success Advisor",
    corePurpose: "Support student retention and success through proactive advising, intervention, and resource connection",
    keyDeliverables: ["Student retention rate", "Advising session satisfaction", "Early alert response rate", "Graduation rate contribution"],
    strengthProfile: ["Advising", "Empathy", "Proactive outreach"],
    belbinPrimary: "Team Worker",
    belbinSecondary: "Resource Investigator",
    tier: "mid",
    budgetLevel: "none",
    activities: [
      { category: "Advising", items: ["Conduct student advising sessions", "Create academic success plans", "Monitor student progress", "Intervene on early alerts"] },
      { category: "Support", items: ["Connect students to resources", "Facilitate peer mentoring", "Run student workshops", "Track retention metrics"] },
    ],
    tags: ["education", "student-success", "advising"],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // HEALTHCARE / CLINICAL (for health-tech orgs)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    department: "Healthcare",
    jobTitle: "Clinical Operations Manager",
    corePurpose: "Manage clinical workflows, ensure regulatory compliance, and optimize patient/user outcomes",
    keyDeliverables: ["Patient satisfaction scores", "Regulatory compliance", "Clinical workflow efficiency", "Quality metrics"],
    strengthProfile: ["Clinical knowledge", "Process management", "Compliance"],
    belbinPrimary: "Coordinator",
    belbinSecondary: "Completer Finisher",
    tier: "lead",
    budgetLevel: "manager",
    activities: [
      { category: "Operations", items: ["Manage clinical workflows", "Ensure regulatory compliance", "Optimize scheduling", "Track quality metrics"] },
      { category: "Team", items: ["Manage clinical staff", "Conduct training sessions", "Handle patient escalations", "Coordinate with medical director"] },
    ],
    tags: ["healthcare", "clinical", "operations"],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CREATIVE / AGENCY
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    department: "Creative",
    jobTitle: "Graphic Designer",
    corePurpose: "Create visual assets for marketing, product, and brand across digital and print media",
    keyDeliverables: ["Design assets produced", "Brand consistency score", "Stakeholder satisfaction", "Design turnaround time"],
    strengthProfile: ["Visual design", "Brand application", "Creative production"],
    belbinPrimary: "Plant",
    belbinSecondary: "Completer Finisher",
    tier: "mid",
    budgetLevel: "none",
    activities: [
      { category: "Design", items: ["Create marketing graphics", "Design social media assets", "Produce print materials", "Build presentation templates"] },
      { category: "Brand", items: ["Apply brand guidelines", "Maintain asset library", "Create brand templates", "Support event branding"] },
    ],
    tags: ["creative", "design", "graphic-design"],
  },
  {
    department: "Creative",
    jobTitle: "Video Producer",
    corePurpose: "Produce video content for marketing, product, and internal communications from concept to delivery",
    keyDeliverables: ["Videos produced", "Video view count", "Production quality", "Turnaround time"],
    strengthProfile: ["Video production", "Storytelling", "Post-production"],
    belbinPrimary: "Plant",
    belbinSecondary: "Implementer",
    tier: "mid",
    budgetLevel: "awareness",
    activities: [
      { category: "Production", items: ["Script and storyboard videos", "Shoot and edit video content", "Manage post-production", "Coordinate with talent"] },
      { category: "Distribution", items: ["Optimize for platforms (YouTube, social)", "Manage video hosting", "Track video analytics", "Support live streaming"] },
    ],
    tags: ["creative", "video", "production"],
  },
  {
    department: "Creative",
    jobTitle: "Copywriter",
    corePurpose: "Write compelling copy for marketing, product, and sales that drives action and reinforces brand voice",
    keyDeliverables: ["Copy conversion rates", "Content volume", "Brand voice consistency", "A/B test results"],
    strengthProfile: ["Copywriting", "Brand voice", "Persuasion"],
    belbinPrimary: "Plant",
    belbinSecondary: "Resource Investigator",
    tier: "mid",
    budgetLevel: "none",
    activities: [
      { category: "Writing", items: ["Write website copy", "Create email campaigns", "Draft ad copy", "Write product descriptions"] },
      { category: "Optimization", items: ["A/B test headlines", "Optimize landing page copy", "Maintain tone of voice guide", "Write micro-copy for product"] },
    ],
    tags: ["creative", "copywriting", "content"],
  },
  {
    department: "Creative",
    jobTitle: "Creative Director",
    corePurpose: "Lead the creative vision across all brand touchpoints, ensuring consistency and creative excellence",
    keyDeliverables: ["Creative quality", "Brand coherence", "Campaign effectiveness", "Team creative output"],
    strengthProfile: ["Creative vision", "Team leadership", "Brand strategy"],
    belbinPrimary: "Plant",
    belbinSecondary: "Coordinator",
    tier: "head",
    budgetLevel: "owner",
    activities: [
      { category: "Creative", items: ["Set creative direction", "Review and approve creative work", "Lead brainstorming sessions", "Brief creative teams"] },
      { category: "Leadership", items: ["Hire and develop creatives", "Manage creative budget", "Present concepts to stakeholders", "Manage agency relationships"] },
    ],
    tags: ["creative", "leadership", "director"],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // AI / ML SPECIFIC ROLES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    department: "AI & Machine Learning",
    jobTitle: "AI Engineer",
    corePurpose: "Build AI-powered features and integrate LLMs, embedding models, and other AI capabilities into the product",
    keyDeliverables: ["AI feature releases", "Model accuracy/quality", "Inference latency", "Prompt engineering quality"],
    strengthProfile: ["AI/ML implementation", "Prompt engineering", "API integration"],
    belbinPrimary: "Implementer",
    belbinSecondary: "Plant",
    tier: "mid",
    budgetLevel: "none",
    activities: [
      { category: "Development", items: ["Integrate LLM APIs", "Build RAG pipelines", "Design prompt templates", "Implement evaluation harnesses"] },
      { category: "Optimization", items: ["Optimize inference costs", "Implement caching strategies", "A/B test AI features", "Monitor model quality"] },
    ],
    tags: ["ai", "ml", "llm", "engineering"],
  },
  {
    department: "AI & Machine Learning",
    jobTitle: "Head of AI",
    corePurpose: "Define AI strategy, build the AI team, and ensure responsible, effective use of AI across the product",
    keyDeliverables: ["AI strategy", "AI feature adoption", "AI cost management", "Responsible AI framework"],
    strengthProfile: ["AI strategy", "Research management", "Product thinking"],
    belbinPrimary: "Plant",
    belbinSecondary: "Shaper",
    tier: "head",
    budgetLevel: "owner",
    activities: [
      { category: "Strategy", items: ["Define AI strategy & roadmap", "Evaluate AI vendors and models", "Set responsible AI policies", "Manage AI compute budget"] },
      { category: "Team", items: ["Hire AI/ML engineers", "Run AI research reviews", "Present AI capabilities to stakeholders", "Build AI evaluation frameworks"] },
    ],
    tags: ["ai", "ml", "leadership", "head"],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RECRUITMENT AGENCY SPECIFIC
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    department: "Recruitment",
    jobTitle: "Recruitment Consultant",
    corePurpose: "Source candidates, manage client relationships, and place candidates in roles for external clients",
    keyDeliverables: ["Placements made", "Candidate pipeline", "Client satisfaction", "Revenue generated"],
    strengthProfile: ["Sourcing", "Relationship building", "Negotiation", "Resilience"],
    belbinPrimary: "Resource Investigator",
    belbinSecondary: "Shaper",
    tier: "mid",
    budgetLevel: "none",
    activities: [
      { category: "Sourcing", items: ["Source candidates via LinkedIn/boards", "Screen and shortlist candidates", "Prepare candidate profiles", "Manage candidate pipeline"] },
      { category: "Client Management", items: ["Take client job briefs", "Present shortlists", "Coordinate interviews", "Negotiate offers and close placements"] },
    ],
    tags: ["recruitment", "agency", "staffing"],
  },
  {
    department: "Recruitment",
    jobTitle: "Account Manager (Recruitment)",
    corePurpose: "Manage and grow key client accounts, ensuring satisfaction and increasing share of wallet",
    keyDeliverables: ["Client retention rate", "Account revenue growth", "Client satisfaction score", "New roles captured"],
    strengthProfile: ["Account management", "Relationship building", "Revenue growth"],
    belbinPrimary: "Resource Investigator",
    belbinSecondary: "Coordinator",
    tier: "senior",
    budgetLevel: "awareness",
    activities: [
      { category: "Account Management", items: ["Run client review meetings", "Identify upsell opportunities", "Handle client escalations", "Manage SLAs"] },
      { category: "Development", items: ["Negotiate rate cards", "Map client org structures", "Build multi-department relationships", "Track competitor activity"] },
    ],
    tags: ["recruitment", "agency", "account-management"],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // E-COMMERCE SPECIFIC
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    department: "E-Commerce",
    jobTitle: "E-Commerce Manager",
    corePurpose: "Manage the online store experience, optimizing conversion, merchandising, and the digital customer journey",
    keyDeliverables: ["Online revenue", "Conversion rate", "Average order value", "Cart abandonment reduction"],
    strengthProfile: ["E-commerce platforms", "Conversion optimization", "Merchandising"],
    belbinPrimary: "Shaper",
    belbinSecondary: "Monitor Evaluator",
    tier: "mid",
    budgetLevel: "manager",
    activities: [
      { category: "Optimization", items: ["Optimize conversion funnel", "Manage product merchandising", "Run A/B tests on checkout", "Improve site search"] },
      { category: "Operations", items: ["Manage product catalog", "Coordinate with fulfilment", "Handle promotions and pricing", "Track e-commerce KPIs"] },
    ],
    tags: ["e-commerce", "retail", "digital"],
  },
  {
    department: "E-Commerce",
    jobTitle: "CRM & Email Marketing Specialist",
    corePurpose: "Drive customer retention and lifetime value through targeted email, SMS, and CRM campaigns",
    keyDeliverables: ["Email revenue", "Open/click rates", "Customer lifetime value", "List growth"],
    strengthProfile: ["Email marketing", "Segmentation", "Automation", "CRM"],
    belbinPrimary: "Implementer",
    belbinSecondary: "Plant",
    tier: "mid",
    budgetLevel: "none",
    activities: [
      { category: "Campaigns", items: ["Build email campaigns", "Create automated flows", "Segment customer lists", "A/B test subject lines & content"] },
      { category: "CRM", items: ["Manage CRM data", "Track customer lifecycle metrics", "Build loyalty programs", "Create customer win-back campaigns"] },
    ],
    tags: ["e-commerce", "crm", "email-marketing"],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FACILITIES / OFFICE MANAGEMENT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    department: "Facilities",
    jobTitle: "Office Manager",
    corePurpose: "Manage office operations, facilities, and workplace experience to keep the team productive and happy",
    keyDeliverables: ["Workplace satisfaction", "Facility maintenance", "Event coordination", "Office budget management"],
    strengthProfile: ["Organisation", "Vendor management", "Problem solving"],
    belbinPrimary: "Implementer",
    belbinSecondary: "Team Worker",
    tier: "mid",
    budgetLevel: "awareness",
    activities: [
      { category: "Facilities", items: ["Manage office space", "Coordinate with building management", "Handle maintenance requests", "Manage supplies and catering"] },
      { category: "Experience", items: ["Plan company events", "Manage visitor experience", "Coordinate remote/hybrid logistics", "Support health & safety compliance"] },
    ],
    tags: ["facilities", "office-management"],
  },
];

// ════════════════════════════════════════════
// SEED RUNNER
// ════════════════════════════════════════════

async function seed() {
  console.log(`🌱 Seeding ${ROLE_TEMPLATES.length} role templates...`);

  // Clear existing templates
  await db.delete(roleTemplates);
  console.log("  ✓ Cleared existing templates");

  // Insert in batches of 50
  const batchSize = 50;
  for (let i = 0; i < ROLE_TEMPLATES.length; i += batchSize) {
    const batch = ROLE_TEMPLATES.slice(i, i + batchSize);
    await db.insert(roleTemplates).values(batch);
    console.log(`  ✓ Inserted batch ${Math.floor(i / batchSize) + 1} (${batch.length} roles)`);
  }

  console.log(`\n✅ Done! ${ROLE_TEMPLATES.length} role templates seeded across departments:`);

  // Count by department
  const deptCounts: Record<string, number> = {};
  for (const r of ROLE_TEMPLATES) {
    deptCounts[r.department] = (deptCounts[r.department] || 0) + 1;
  }
  for (const [dept, count] of Object.entries(deptCounts).sort()) {
    console.log(`   ${dept}: ${count}`);
  }
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  });
