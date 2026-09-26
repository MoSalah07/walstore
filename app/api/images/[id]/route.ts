import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";

import connectToDatabase from "@/lib/connect.db";
import Upload from "@/models/upload.model";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) return new NextResponse(null, { status: 404 });
  await connectToDatabase();
  const file = await Upload.findById(id).lean();
  if (!file) return new NextResponse(null, { status: 404 });
  return new NextResponse(new Uint8Array(file.data.buffer ?? file.data), {
    headers: {
      "Content-Type": file.contentType,
      "Content-Length": String(file.size),
      // Uploads are immutable: a new photo gets a new id.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
