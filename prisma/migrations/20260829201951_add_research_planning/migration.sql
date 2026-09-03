-- CreateTable
CREATE TABLE "ResearchMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "initiativeId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "proposedExperiments" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ResearchMessage_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Experiment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "insightId" TEXT,
    "initiativeId" TEXT,
    "method" TEXT NOT NULL,
    "hypothesis" TEXT,
    "successMetric" TEXT,
    "sampleSize" INTEGER,
    "effectSize" REAL,
    "result" TEXT,
    "watchOut" TEXT,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Experiment_insightId_fkey" FOREIGN KEY ("insightId") REFERENCES "Insight" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Experiment_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Experiment" ("createdAt", "effectSize", "hypothesis", "id", "insightId", "method", "result", "sampleSize", "successMetric", "updatedAt", "watchOut") SELECT "createdAt", "effectSize", "hypothesis", "id", "insightId", "method", "result", "sampleSize", "successMetric", "updatedAt", "watchOut" FROM "Experiment";
DROP TABLE "Experiment";
ALTER TABLE "new_Experiment" RENAME TO "Experiment";
CREATE TABLE "new_Initiative" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "problemStatement" TEXT,
    "hypothesis" TEXT,
    "status" TEXT NOT NULL DEFAULT 'idea',
    "riceReach" REAL,
    "riceImpact" REAL,
    "riceConfidence" REAL,
    "riceEffort" REAL,
    "riceScore" REAL,
    "researchGateStatus" TEXT NOT NULL DEFAULT 'undecided',
    "researchSkipReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Initiative_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Initiative" ("createdAt", "hypothesis", "id", "name", "problemStatement", "productId", "riceConfidence", "riceEffort", "riceImpact", "riceReach", "riceScore", "status", "updatedAt") SELECT "createdAt", "hypothesis", "id", "name", "problemStatement", "productId", "riceConfidence", "riceEffort", "riceImpact", "riceReach", "riceScore", "status", "updatedAt" FROM "Initiative";
DROP TABLE "Initiative";
ALTER TABLE "new_Initiative" RENAME TO "Initiative";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
