export async function extractPdfText(base64: string): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  const buffer = Buffer.from(base64, "base64");
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    return result.text.trim();
  } finally {
    await parser.destroy();
  }
}
