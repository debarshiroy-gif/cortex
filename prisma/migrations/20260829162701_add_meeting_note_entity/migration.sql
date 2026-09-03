-- CreateTable
CREATE TABLE "MeetingNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceType" TEXT NOT NULL,
    "link" TEXT,
    "rawContent" TEXT NOT NULL DEFAULT '',
    "meetingDate" DATETIME,
    "attendees" TEXT NOT NULL DEFAULT '[]',
    "relevanceScore" REAL,
    "status" TEXT NOT NULL DEFAULT 'suggested',
    "linkedInitiativeId" TEXT,
    "linkedInsightId" TEXT,
    "geminiNotetakerEnabled" TEXT,
    "addedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MeetingNote_linkedInitiativeId_fkey" FOREIGN KEY ("linkedInitiativeId") REFERENCES "Initiative" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MeetingNote_linkedInsightId_fkey" FOREIGN KEY ("linkedInsightId") REFERENCES "Insight" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
