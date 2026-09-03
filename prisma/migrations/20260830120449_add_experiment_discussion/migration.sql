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
    "targetAudience" TEXT,
    "outreachDraft" TEXT,
    "sentAt" DATETIME,
    "dataFileName" TEXT,
    "dataFileContent" TEXT,
    "sources" TEXT NOT NULL DEFAULT '[]',
    "abTestVersionIds" TEXT NOT NULL DEFAULT '[]',
    "abTestCustomQuestions" TEXT NOT NULL DEFAULT '[]',
    "shareToken" TEXT,
    "discussionThread" TEXT NOT NULL DEFAULT '[]',
    "surveyResponses" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Experiment_insightId_fkey" FOREIGN KEY ("insightId") REFERENCES "Insight" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Experiment_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Experiment" ("abTestCustomQuestions", "abTestVersionIds", "createdAt", "dataFileContent", "dataFileName", "effectSize", "hypothesis", "id", "initiativeId", "insightId", "method", "outreachDraft", "result", "sampleSize", "sentAt", "shareToken", "sources", "status", "successMetric", "targetAudience", "updatedAt", "watchOut") SELECT "abTestCustomQuestions", "abTestVersionIds", "createdAt", "dataFileContent", "dataFileName", "effectSize", "hypothesis", "id", "initiativeId", "insightId", "method", "outreachDraft", "result", "sampleSize", "sentAt", "shareToken", "sources", "status", "successMetric", "targetAudience", "updatedAt", "watchOut" FROM "Experiment";
DROP TABLE "Experiment";
ALTER TABLE "new_Experiment" RENAME TO "Experiment";
CREATE UNIQUE INDEX "Experiment_shareToken_key" ON "Experiment"("shareToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
