-- CreateTable
CREATE TABLE "Experiment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "insightId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "hypothesis" TEXT,
    "successMetric" TEXT,
    "sampleSize" INTEGER,
    "effectSize" REAL,
    "result" TEXT,
    "watchOut" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Experiment_insightId_fkey" FOREIGN KEY ("insightId") REFERENCES "Insight" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Requirement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "featureId" TEXT NOT NULL,
    "regime" TEXT NOT NULL DEFAULT 'non_regulated',
    "requirementText" TEXT NOT NULL,
    "sourceProvenance" TEXT,
    "sourceExperimentId" TEXT,
    "ownerName" TEXT,
    "signOffApproved" BOOLEAN NOT NULL DEFAULT false,
    "signOffBy" TEXT,
    "signOffDate" DATETIME,
    "acceptanceCriteria" TEXT NOT NULL DEFAULT '[]',
    "edgeCases" TEXT NOT NULL DEFAULT '[]',
    "riskIfWrong" TEXT,
    "draftedBy" TEXT NOT NULL DEFAULT 'human',
    "verifiedByName" TEXT,
    "verifiedByDate" DATETIME,
    "gateStatus" TEXT NOT NULL DEFAULT 'draft',
    "linkedInsightId" TEXT,
    "linkedPrototypeArea" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Requirement_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Requirement_linkedInsightId_fkey" FOREIGN KEY ("linkedInsightId") REFERENCES "Insight" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Requirement_sourceExperimentId_fkey" FOREIGN KEY ("sourceExperimentId") REFERENCES "Experiment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Requirement" ("acceptanceCriteria", "createdAt", "draftedBy", "edgeCases", "featureId", "gateStatus", "id", "linkedInsightId", "linkedPrototypeArea", "ownerName", "regime", "requirementText", "riskIfWrong", "signOffApproved", "signOffBy", "signOffDate", "sourceProvenance", "updatedAt", "verifiedByDate", "verifiedByName") SELECT "acceptanceCriteria", "createdAt", "draftedBy", "edgeCases", "featureId", "gateStatus", "id", "linkedInsightId", "linkedPrototypeArea", "ownerName", "regime", "requirementText", "riskIfWrong", "signOffApproved", "signOffBy", "signOffDate", "sourceProvenance", "updatedAt", "verifiedByDate", "verifiedByName" FROM "Requirement";
DROP TABLE "Requirement";
ALTER TABLE "new_Requirement" RENAME TO "Requirement";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
