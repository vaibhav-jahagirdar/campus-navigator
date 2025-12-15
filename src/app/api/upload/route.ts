import { NextResponse } from "next/server";
import fs from "fs";
import dbConnect from "../../../../lib/mongodb";
import cloudinary from "../../../../lib/cloudinary";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: Request) {
  try {
    await dbConnect();

    // --- JWT verification ---
    const cookieHolder = await cookies();
    const token = cookieHolder.get("token")?.value;
    if (!token)
      return NextResponse.json({ error: "token not found" }, { status: 401 });

    let payload: any;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
      return NextResponse.json({ error: "invalid token" }, { status: 401 });
    }

    if (payload.role !== "admin")
      return NextResponse.json({ error: "forbidden" }, { status: 403 });

    // --- Handle form data ---
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file)
      return NextResponse.json({ error: "file not found" }, { status: 400 });

    // Convert File -> Buffer -> temp file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const tmpPath = `/tmp/${file.name}`;
    await fs.promises.writeFile(tmpPath, buffer);

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(tmpPath, {
      folder: "smart-campus",
      resource_type: "auto",
      overwrite: true,
    });

    // Delete temp file
    await fs.promises.unlink(tmpPath);

    return NextResponse.json({ url: result.secure_url }, { status: 200 });
  } catch (err) {
    console.error("Upload error:", err);
    const message =
      err && typeof err === "object" && "message" in err
        ? (err as any).message
        : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}