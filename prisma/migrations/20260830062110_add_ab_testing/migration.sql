-- AlterTable
ALTER TABLE "PrototypeVersion" ADD COLUMN "readabilityScore" REAL;

-- CreateTable
CREATE TABLE "PrototypeFeedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "experimentId" TEXT NOT NULL,
    "shownVersionId" TEXT NOT NULL,
    "rating" INTEGER,
    "comment" TEXT,
    "customAnswers" TEXT NOT NULL DEFAULT '[]',
    "timeToCompleteMs" INTEGER,
    "interactionCount" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PrototypeFeedback_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "Experiment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PrototypeFeedback_shownVersionId_fkey" FOREIGN KEY ("shownVersionId") REFERENCES "PrototypeVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    "targetAudience" TEXT,
    "outreachDraft" TEXT,
    "sentAt" DATETIME,
    "dataFileName" TEXT,
    "dataFileContent" TEXT,
    "sources" TEXT NOT NULL DEFAULT '[]',
    "abTestVersionIds" TEXT NOT NULL DEFAULT '[]',
    "abTestCustomQuestions" TEXT NOT NULL DEFAULT '[]',
    "shareToken" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Experiment_insightId_fkey" FOREIGN KEY ("insightId") REFERENCES "Insight" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Experiment_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Experiment" ("createdAt", "dataFileContent", "dataFileName", "effectSize", "hypothesis", "id", "initiativeId", "insightId", "method", "outreachDraft", "result", "sampleSize", "sentAt", "sources", "status", "successMetric", "targetAudience", "updatedAt", "watchOut") SELECT "createdAt", "dataFileContent", "dataFileName", "effectSize", "hypothesis", "id", "initiativeId", "insightId", "method", "outreachDraft", "result", "sampleSize", "sentAt", "sources", "status", "successMetric", "targetAudience", "updatedAt", "watchOut" FROM "Experiment";
DROP TABLE "Experiment";
ALTER TABLE "new_Experiment" RENAME TO "Experiment";
CREATE UNIQUE INDEX "Experiment_shareToken_key" ON "Experiment"("shareToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
