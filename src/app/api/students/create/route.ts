// app/api/students/route.ts
import { NextResponse } from "next/server";
import dbConnect from "../../../../../lib/mongodb";
import Student,{ IStudent} from "@/app/lib/models/Student";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { z } from "zod";

// --- Zod schema to validate incoming student data ---
const createStudentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  usn: z.string().min(1, "USN is required"),
  department: z.string().min(1, "Department is required"),
  year: z.number().int().min(1).max(5),
  cardId: z.string().min(1, "RFID Card ID is required"),
});

export async function POST(req: Request) {
  await dbConnect();

  try {
    // 🔐 Get JWT from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 🧩 Verify token
    const payload: any = jwt.verify(token, process.env.JWT_SECRET!);
    if (payload.role !== "admin")
      return NextResponse.json({ error: "Forbidden - Admins only" }, { status: 403 });

    // 🧾 Parse & validate request body
    const body = await req.json();
    const validatedData = createStudentSchema.parse(body);

    // 🚀 Check if student or RFID card already exists
    const existing = await Student.findOne({
      $or: [{ usn: validatedData.usn }, { rfidCardId: validatedData.cardId }],
    });
    if (existing)
      return NextResponse.json({ error: "USN or RFID already registered" }, { status: 400 });

    // 🏗️ Create new student
    const newStudent: IStudent = await Student.create({
      ...validatedData,
      createdBy: payload.id,
    });

    return NextResponse.json({ message: "Student created successfully", student: newStudent }, { status: 201 });
  } catch (err: any) {
    console.error("Error creating student:", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    if (err.name === "JsonWebTokenError") {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}