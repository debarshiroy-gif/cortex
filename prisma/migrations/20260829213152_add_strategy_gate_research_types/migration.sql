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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Experiment_insightId_fkey" FOREIGN KEY ("insightId") REFERENCES "Insight" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Experiment_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Experiment" ("createdAt", "effectSize", "hypothesis", "id", "initiativeId", "insightId", "method", "result", "sampleSize", "status", "successMetric", "updatedAt", "watchOut") SELECT "createdAt", "effectSize", "hypothesis", "id", "initiativeId", "insightId", "method", "result", "sampleSize", "status", "successMetric", "updatedAt", "watchOut" FROM "Experiment";
DROP TABLE "Experiment";
ALTER TABLE "new_Experiment" RENAME TO "Experiment";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
