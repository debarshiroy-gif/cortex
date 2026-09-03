-- CreateTable
CREATE TABLE "PrototypeVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "initiativeId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "sourceMode" TEXT NOT NULL,
    "promptText" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PrototypeVersion_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
