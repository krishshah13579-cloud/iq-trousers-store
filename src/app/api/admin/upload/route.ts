import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAdminRole } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";
import { getClientIp, checkRateLimit, createRateLimitResponse } from "@/lib/rateLimit";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB per file
const MAX_FILES_PER_REQUEST = 10;
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminRole((session.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate Limiting: Max 15 upload requests per minute per IP
  const ip = getClientIp(req);
  const rl = checkRateLimit(`upload:${ip}`, { limit: 15, windowMs: 60 * 1000 });
  if (!rl.success) {
    return createRateLimitResponse(rl.resetMs);
  }

  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      // Also check single 'file' field
      const singleFile = formData.get("file") as File | null;
      if (singleFile) {
        files.push(singleFile);
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No image files provided for upload" },
        { status: 400 }
      );
    }

    if (files.length > MAX_FILES_PER_REQUEST) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES_PER_REQUEST} images allowed per upload batch` },
        { status: 400 }
      );
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    try {
      await fs.mkdir(uploadsDir, { recursive: true });
    } catch {
      // In serverless read-only filesystems (e.g. Vercel), continue with base64 fallback
    }

    const uploadedUrls: string[] = [];

    for (const file of files) {
      if (!file || typeof file === "string" || !file.name) continue;

      // 1. Enforce size limit before memory buffering to prevent Out-Of-Memory (OOM)
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            error: `File "${file.name}" exceeds the maximum allowed size of 5 MB (${(file.size / 1024 / 1024).toFixed(1)} MB).`,
          },
          { status: 400 }
        );
      }

      // 2. Validate MIME type
      if (!file.type.startsWith("image/")) {
        return NextResponse.json(
          { error: `File "${file.name}" is not a valid image` },
          { status: 400 }
        );
      }

      // 3. Validate file extension
      const ext = path.extname(file.name).toLowerCase() || ".jpg";
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        return NextResponse.json(
          { error: `Image extension "${ext}" is not permitted. Supported: JPG, PNG, WEBP, AVIF` },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());

      // 4. Magic byte signature verification
      const isJpeg = (ext === ".jpg" || ext === ".jpeg") && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
      const isPng = ext === ".png" && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
      const isWebp = ext === ".webp" && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
      const isAvif = ext === ".avif" && buffer.toString("ascii", 4, 12).includes("ftyp");

      if (!isJpeg && !isPng && !isWebp && !isAvif) {
        return NextResponse.json(
          { error: `File "${file.name}" content does not match valid image signature.` },
          { status: 400 }
        );
      }

      // 5. Generate clean sanitized unique filename
      const sanitizedBase = path
        .basename(file.name, ext)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .slice(0, 30);
      const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const fileName = `${sanitizedBase}-${uniqueSuffix}${ext}`;
      const filePath = path.join(uploadsDir, fileName);

      try {
        await fs.writeFile(filePath, buffer);
        uploadedUrls.push(`/uploads/${fileName}`);
      } catch (fsErr: unknown) {
        const isReadOnly =
          (fsErr as { code?: string })?.code === "EROFS" ||
          (fsErr as Error)?.message?.toLowerCase().includes("read-only");
        if (isReadOnly) {
          const mime = file.type || "image/jpeg";
          uploadedUrls.push(`data:${mime};base64,${buffer.toString("base64")}`);
        } else {
          throw fsErr;
        }
      }
    }

    return NextResponse.json({
      success: true,
      urls: uploadedUrls,
      url: uploadedUrls[0],
    });
  } catch (error) {
    console.error("Image upload failed:", error);
    return NextResponse.json(
      { error: "Image processing or upload failed" },
      { status: 500 }
    );
  }
}
