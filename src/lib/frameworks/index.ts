// ════════════════════════════════════════════
// SIX FRAMEWORKS — Summary Reference Data
// All published academic/practitioner frameworks
// ════════════════════════════════════════════

export type Framework = {
  key: string;
  name: string;
  author: string;
  coreConcept: string;
  description: string;
  howUsed: string;
};

export const FRAMEWORKS: Framework[] = [
  {
    key: "belbin",
    name: "Belbin Team Roles",
    author: "Meredith Belbin",
    coreConcept: "9 behavioural types across Action / People / Thinking",
    description:
      "People adopt one of nine behavioural roles in a team. Balanced teams need coverage across all three categories. Imbalance causes dysfunction.",
    howUsed:
      "Assigned to each role as primary + secondary. Used to check team composition balance and activity-to-person fit.",
  },
  {
    key: "radical-candor",
    name: "Radical Candor",
    author: "Kim Scott",
    coreConcept: "Rock Stars (steady mastery) vs Superstars (steep growth)",
    description:
      "Not everyone should climb. 'Rock Stars' deepen mastery and are the backbone. 'Superstars' need challenge and will leave without it. Both tracks are valuable.",
    howUsed:
      "Each role progression declares a growth track. Prevents the mistake of pushing everyone to climb when some should deepen.",
  },
  {
    key: "drive",
    name: "Drive",
    author: "Daniel Pink",
    coreConcept: "Autonomy, Mastery, Purpose",
    description:
      "Three intrinsic motivators that predict engagement. If any is missing, the role will struggle to retain good people.",
    howUsed:
      "Three dimensions scored per role. If any is absent or weak, the role needs redesigning.",
  },
  {
    key: "job-characteristics",
    name: "Job Characteristics Model",
    author: "Hackman & Oldham",
    coreConcept: "5 core job design dimensions",
    description:
      "Skill Variety, Task Identity, Task Significance, Autonomy, and Feedback are the five dimensions that predict job satisfaction and performance.",
    howUsed:
      "Scores each role on all five dimensions. Low scores signal a need to redesign the job, not replace the person.",
  },
  {
    key: "rapid",
    name: "RAPID",
    author: "Bain & Company",
    coreConcept: "Decision rights: Decide, Recommend, Input, Perform",
    description:
      "Most team friction comes from ambiguous decision rights. RAPID clarifies who has the final call vs who proposes vs who executes.",
    howUsed:
      "Each role lists what it Decides, Recommends, provides Input on, and Performs. Overlaps and gaps surface friction.",
  },
  {
    key: "working-genius",
    name: "Working Genius",
    author: "Patrick Lencioni",
    coreConcept: "Energy mapping: what energises vs drains",
    description:
      "Persistent mismatch between what someone does daily and what gives them energy leads to burnout. This framework makes that mismatch visible.",
    howUsed:
      "Each role lists energisers and drainers. When someone is doing mostly draining work, something needs to change.",
  },
];
