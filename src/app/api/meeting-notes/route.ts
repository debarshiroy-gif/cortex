import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const SOURCE_TYPES = ["gemini_notes", "slack_thread", "freetext"] as const;
const STATUSES = ["suggested", "approved", "rejected"] as const;
const NOTETAKER_VALUES = ["yes", "no", "not_applicable"] as const;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const linkedInitiativeId = searchParams.get("linkedInitiativeId");

  const notes = await prisma.meetingNote.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(linkedInitiativeId ? { linkedInitiativeId } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(notes);
}

export async function POST(request: Request) {
  const body = await request.json();
  const {
    sourceType,
    link,
    rawContent,
    meetingDate,
    attendees,
    relevanceScore,
    status,
    linkedInitiativeId,
    linkedInsightId,
    geminiNotetakerEnabled,
    addedBy,
  } = body;

  if (!sourceType || !SOURCE_TYPES.includes(sourceType)) {
    return NextResponse.json(
      { error: `sourceType must be one of: ${SOURCE_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  if (status && !STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `status must be one of: ${STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  if (
    geminiNotetakerEnabled &&
    !NOTETAKER_VALUES.includes(geminiNotetakerEnabled)
  ) {
    return NextResponse.json(
      {
        error: `geminiNotetakerEnabled must be one of: ${NOTETAKER_VALUES.join(", ")}`,
      },
      { status: 400 }
    );
  }

  if (sourceType === "freetext" && !rawContent?.trim()) {
    return NextResponse.json(
      { error: "rawContent is required for a free-text note" },
      { status: 400 }
    );
  }

  if (sourceType !== "freetext" && !link?.trim()) {
    return NextResponse.json(
      { error: "link is required for gemini_notes / slack_thread notes" },
      { status: 400 }
    );
  }

  const note = await prisma.meetingNote.create({
    data: {
      sourceType,
      link: link || null,
      rawContent: rawContent || "",
      meetingDate: meetingDate ? new Date(meetingDate) : null,
      attendees: JSON.stringify(attendees ?? []),
      relevanceScore: relevanceScore != null ? Number(relevanceScore) : null,
      status: status ?? "suggested",
      linkedInitiativeId: linkedInitiativeId || null,
      linkedInsightId: linkedInsightId || null,
      geminiNotetakerEnabled: geminiNotetakerEnabled || null,
      addedBy: addedBy || null,
    },
  });

  return NextResponse.json(note, { status: 201 });
}
