import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { extractPdfText } from "@/lib/pdfText";

export async function POST(request: Request) {
  const body = await request.json();
  const { productId, name, problemStatement, existingProjectName, fileName, fileBase64 } = body as {
    productId?: string;
    name?: string;
    problemStatement?: string;
    existingProjectName?: string;
    fileName?: string;
    fileBase64?: string;
  };

  if (!productId || !name?.trim() || !existingProjectName?.trim() || !fileBase64 || !fileName) {
    return NextResponse.json(
      { error: "productId, name, existingProjectName, and a PRD file are required" },
      { status: 400 }
    );
  }

  const trimmedProjectName = existingProjectName.trim();

  const existing = await prisma.initiative.findMany({
    where: { productId },
    select: { name: true },
  });
  const collision = existing.some((i) => i.name.trim().toLowerCase() === trimmedProjectName.toLowerCase());
  if (collision) {
    return NextResponse.json(
      { error: `A project named "${trimmedProjectName}" already exists — choose a different name` },
      { status: 400 }
    );
  }

  let extractedText: string;
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

  if (!extractedText.trim()) {
    return NextResponse.json({ error: "The uploaded file has no readable text" }, { status: 422 });
  }

  const brownfieldInitiative = await prisma.$transaction(async (tx) => {
    const placeholder = await tx.initiative.create({
      data: {
        productId,
        name: trimmedProjectName,
        projectType: "external_baseline",
        status: "committed",
      },
    });

    await tx.pRD.create({
      data: {
        initiativeId: placeholder.id,
        content: extractedText.trim(),
        status: "baseline",
      },
    });

    return tx.initiative.create({
      data: {
        productId,
        name: name.trim(),
        problemStatement: problemStatement || null,
        projectType: "brownfield",
        baselineInitiativeId: placeholder.id,
      },
    });
  });

  return NextResponse.json(brownfieldInitiative, { status: 201 });
}
