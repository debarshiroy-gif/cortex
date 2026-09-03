-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PRD" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "featureId" TEXT,
    "initiativeId" TEXT,
    "problem" TEXT,
    "goals" TEXT,
    "nonGoals" TEXT,
    "userStories" TEXT NOT NULL DEFAULT '[]',
    "acceptanceCriteria" TEXT NOT NULL DEFAULT '[]',
    "openQuestions" TEXT NOT NULL DEFAULT '[]',
    "content" TEXT,
    "stories" TEXT NOT NULL DEFAULT '[]',
    "mergedIntoMaster" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PRD_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PRD_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PRD" ("acceptanceCriteria", "content", "createdAt", "featureId", "goals", "id", "initiativeId", "nonGoals", "openQuestions", "problem", "status", "stories", "updatedAt", "userStories") SELECT "acceptanceCriteria", "content", "createdAt", "featureId", "goals", "id", "initiativeId", "nonGoals", "openQuestions", "problem", "status", "stories", "updatedAt", "userStories" FROM "PRD";
DROP TABLE "PRD";
ALTER TABLE "new_PRD" RENAME TO "PRD";
CREATE UNIQUE INDEX "PRD_featureId_key" ON "PRD"("featureId");
CREATE UNIQUE INDEX "PRD_initiativeId_key" ON "PRD"("initiativeId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
