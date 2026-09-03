import fs from "fs";
import path from "path";

const knowledgeDir = path.join(process.cwd(), "knowledge", "frameworks");

function loadFramework(filename: string): string {
  const filePath = path.join(knowledgeDir, filename);
  return fs.readFileSync(filePath, "utf-8");
}

export const frameworks = {
  rice: () => loadFramework("rice-scoring.md"),
  prd: () => loadFramework("prd-template.md"),
  kano: () => loadFramework("kano-model.md"),
  jtbd: () => loadFramework("jtbd.md"),
  okr: () => loadFramework("okr-framework.md"),
  northStar: () => loadFramework("north-star-metric.md"),
  stakeholderUpdate: () => loadFramework("stakeholder-update.md"),
  launchChecklist: () => loadFramework("launch-checklist.md"),
  ost: () => loadFramework("opportunity-solution-tree.md"),
  requirementGates: () => loadFramework("requirement-gates.md"),
  researchPlanning: () => loadFramework("research-planning.md"),
  secondaryResearch: () => loadFramework("secondary-research.md"),
  outreachDrafting: () => loadFramework("outreach-drafting.md"),
  dataAnalysis: () => loadFramework("data-analysis.md"),
  brdTemplate: () => loadFramework("brd-template.md"),
  prototypeGeneration: () => loadFramework("prototype-generation.md"),
  abTestSynthesis: () => loadFramework("ab-test-synthesis.md"),
  prdInitiative: () => loadFramework("prd-initiative-template.md"),
  experimentDiscussion: () => loadFramework("experiment-discussion.md"),
  surveySynthesis: () => loadFramework("survey-synthesis.md"),
  prdMerge: () => loadFramework("prd-merge.md"),
};

export type FrameworkKey = keyof typeof frameworks;
