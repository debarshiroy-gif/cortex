import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const STATUSES = ["suggested", "approved", "rejected"] as const;
const NOTETAKER_VALUES = ["yes", "no", "not_applicable"] as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const note = await prisma.meetingNote.findUnique({ where: { id } });
  if (!note) {
    return NextResponse.json({ error: "MeetingNote not found" }, { status: 404 });
  }
  return NextResponse.json(note);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.meetingNote.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "MeetingNote not found" }, { status: 404 });
  }

  if (body.status && !STATUSES.includes(body.status)) {
    return NextResponse.json(
      { error: `status must be one of: ${STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  if (
    body.geminiNotetakerEnabled &&
    !NOTETAKER_VALUES.includes(body.geminiNotetakerEnabled)
  ) {
    return NextResponse.json(
      {
        error: `geminiNotetakerEnabled must be one of: ${NOTETAKER_VALUES.join(", ")}`,
      },
      { status: 400 }
    );
  }

  const note = await prisma.meetingNote.update({
    where: { id },
    data: {
      ...(body.status !== undefined && { status: body.status }),
      ...(body.rawContent !== undefined && { rawContent: body.rawContent }),
      ...(body.link !== undefined && { link: body.link || null }),
      ...(body.meetingDate !== undefined && {
        meetingDate: body.meetingDate ? new Date(body.meetingDate) : null,
      }),
      ...(body.attendees !== undefined && {
        attendees: JSON.stringify(body.attendees),
      }),
      ...(body.relevanceScore !== undefined && {
        relevanceScore: body.relevanceScore != null ? Number(body.relevanceScore) : null,
      }),
      ...(body.linkedInitiativeId !== undefined && {
        linkedInitiativeId: body.linkedInitiativeId || null,
      }),
      ...(body.linkedInsightId !== undefined && {
        linkedInsightId: body.linkedInsightId || null,
      }),
      ...(body.geminiNotetakerEnabled !== undefined && {
        geminiNotetakerEnabled: body.geminiNotetakerEnabled || null,
      }),
      ...(body.addedBy !== undefined && { addedBy: body.addedBy || null }),
    },
  });

  return NextResponse.json(note);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const existing = await prisma.meetingNote.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "MeetingNote not found" }, { status: 404 });
  }

  await prisma.meetingNote.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
