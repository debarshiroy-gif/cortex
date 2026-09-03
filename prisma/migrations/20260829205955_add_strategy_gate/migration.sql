-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "strategyGateDecision" TEXT NOT NULL DEFAULT 'pending',
    "strategyGateNote" TEXT,
    "strategyGateDecidedBy" TEXT,
    "strategyGateDecidedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Initiative_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Initiative" ("createdAt", "hypothesis", "id", "name", "problemStatement", "productId", "researchGateStatus", "researchSkipReason", "riceConfidence", "riceEffort", "riceImpact", "riceReach", "riceScore", "status", "updatedAt") SELECT "createdAt", "hypothesis", "id", "name", "problemStatement", "productId", "researchGateStatus", "researchSkipReason", "riceConfidence", "riceEffort", "riceImpact", "riceReach", "riceScore", "status", "updatedAt" FROM "Initiative";
DROP TABLE "Initiative";
ALTER TABLE "new_Initiative" RENAME TO "Initiative";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
