/*
  Warnings:

  - Added the required column `updatedAt` to the `OKR` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Release` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_OKR" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "metricId" TEXT,
    "objective" TEXT NOT NULL,
    "keyResults" TEXT NOT NULL DEFAULT '[]',
    "quarter" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OKR_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OKR_metricId_fkey" FOREIGN KEY ("metricId") REFERENCES "Metric" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_OKR" ("id", "keyResults", "metricId", "objective", "productId", "quarter") SELECT "id", "keyResults", "metricId", "objective", "productId", "quarter" FROM "OKR";
DROP TABLE "OKR";
ALTER TABLE "new_OKR" RENAME TO "OKR";
CREATE TABLE "new_Release" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" DATETIME,
    "tier" TEXT NOT NULL DEFAULT 'minor',
    "checklist" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Release_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Release" ("checklist", "date", "id", "name", "productId", "tier") SELECT "checklist", "date", "id", "name", "productId", "tier" FROM "Release";
DROP TABLE "Release";
ALTER TABLE "new_Release" RENAME TO "Release";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
