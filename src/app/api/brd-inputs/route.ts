import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { extractPdfText } from "@/lib/pdfText";

const SOURCE_TEAMS = [
  "compliance",
  "operations",
  "finance",
  "business",
  "risk",
  "data_science",
  "product_manager",
] as const;

const CHANNEL_TYPES = [
  "email_artifact",
  "meeting_notes",
  "formal_brd_doc",
  "verbal_notes",
] as const;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const initiativeId = searchParams.get("initiativeId");

  if (!initiativeId) {
    return NextResponse.json({ error: "initiativeId is required" }, { status: 400 });
  }

  const inputs = await prisma.brdInput.findMany({
    where: { initiativeId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(inputs);
}

export async function POST(request: Request) {
  const body = await request.json();
  const {
    initiativeId,
    sourceTeam,
    channelType,
    title,
    content,
    link,
    fileName,
    fileBase64,
    addedBy,
  } = body as {
    initiativeId?: string;
    sourceTeam?: string;
    channelType?: string;
    title?: string;
    content?: string;
    link?: string;
    fileName?: string;
    fileBase64?: string;
    addedBy?: string;
  };

  if (!initiativeId || !sourceTeam || !channelType) {
    return NextResponse.json(
      { error: "initiativeId, sourceTeam, and channelType are required" },
      { status: 400 }
    );
  }
  if (!SOURCE_TEAMS.includes(sourceTeam as (typeof SOURCE_TEAMS)[number])) {
    return NextResponse.json(
      { error: `sourceTeam must be one of: ${SOURCE_TEAMS.join(", ")}` },
      { status: 400 }
    );
  }
  if (!CHANNEL_TYPES.includes(channelType as (typeof CHANNEL_TYPES)[number])) {
    return NextResponse.json(
      { error: `channelType must be one of: ${CHANNEL_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  const initiative = await prisma.initiative.findUnique({ where: { id: initiativeId } });
  if (!initiative) {
    return NextResponse.json({ error: "Initiative not found" }, { status: 404 });
  }

  let extractedText = "";
  if (fileBase64 && fileName) {
    if (fileName.toLowerCase().endsWith(".pdf")) {
      try {
        extractedText = await extractPdfText(fileBase64);
      } catch {
        return NextResponse.json(
          { error: "Failed to extract text from the uploaded PDF" },
          { status: 422 }
        );
      }
    } else {
      extractedText = Buffer.from(fileBase64, "base64").toString("utf-8");
    }
  }

  const combinedContent = [content?.trim(), extractedText.trim()].filter(Boolean).join("\n\n");

  if (!combinedContent && !link?.trim()) {
    return NextResponse.json(
      { error: "content, a file, or a link is required" },
      { status: 400 }
    );
  }

  const status = sourceTeam === "product_manager" ? "approved" : "suggested";

  const input = await prisma.brdInput.create({
    data: {
      initiativeId,
      sourceTeam,
      channelType,
      title: title || null,
      content: combinedContent,
      link: link || null,
      fileName: fileName || null,
      status,
      addedBy: addedBy || null,
    },
  });

  return NextResponse.json(input, { status: 201 });
}
