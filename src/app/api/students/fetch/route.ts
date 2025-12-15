// /api/library/get.ts (Next.js route using app router)
import { NextResponse } from "next/server";
import dbConnect from "../../../../../lib/mongodb";
import Student from "@/app/lib/models/Student";

export async function GET() {
  try {
    await dbConnect(); // ensure DB is connected

    // Fetch current occupancy info
    const studentsPresent = await Student.find({ isInLibrary: true }).select("usn name -_id");
    const totalSeats = 500; // Or fetch from config/DB if dynamic

    const response = {
      occupied: studentsPresent.length,
      totalSeats,
      presentStudents: studentsPresent, // optional for UI
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error("❌ Error fetching library state:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}