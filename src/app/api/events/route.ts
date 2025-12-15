import { NextResponse } from "next/server";
import dbConnect from "../../../../lib/mongodb";
import Events from "@/app/lib/models/Events";

export async function GET(req: Request) {
  await dbConnect();

  try {
    const url = new URL(req.url);
    const page = Number(url.searchParams.get("page") || 1); 
    const limit = Number(url.searchParams.get("limit") || 10); 
    const skip = (page - 1) * limit;

    
    const events = await Events.find({ isActive: true })
      .sort({ startDateTime: 1 }) 
      .skip(skip)
      .limit(limit)
      .select("-__v"); 

    const totalEvents = await Events.countDocuments({ isActive: true });
    const totalPages = Math.ceil(totalEvents / limit);

    return NextResponse.json({
      page,
      limit,
      totalPages,
      totalEvents,
      events,
    }, { status: 200 });
  } catch (err) {
    console.error("Error fetching events:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}