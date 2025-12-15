import { NextResponse } from "next/server";
import Events from "@/app/lib/models/Events";
import jwt from "jsonwebtoken";
import dbConnect from "../../../../../lib/mongodb";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  await dbConnect(); 

  try {
    // 🔐 1. Get the JWT token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 🧩 2. Verify token
    const payload: any = jwt.verify(token, process.env.JWT_SECRET!);

    // 🚫 3. Check admin privilegesA
    if (payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden - Admins only" }, { status: 403 });
    }

    // 🧾 4. Parse the request body
    const {
      name,
      description,
      bannerImage,
      venue,
      location,
      startDateTime,
      endDateTime,
      registrationRequired,
      maxParticipants,
      paymentRequired,
      feeAmount,
      categories,
      tags,
    } = await req.json();

    // ✅ 5. Basic field validataion
    if (!name || !description || !venue || !startDateTime || !endDateTime) {
      return NextResponse.json(
        { error: "Missing required fields: name, description, venue, startDateTime, endDateTime" },
        { status: 400 }
      );
    }

    // 🏗️ 6. Create new event document
    const newEvent = await Events.create({
      name,
      description,
      bannerImage,
      venue,
      location,
      startDateTime: new Date(startDateTime),
      endDateTime: new Date(endDateTime),
      registrationRequired: registrationRequired ?? true,
      maxParticipants: maxParticipants ?? 0,
      paymentRequired: paymentRequired ?? false,
      feeAmount: feeAmount ?? 0,
      categories: categories || [],
      tags: tags || [],
      createdBy: payload.id,
    });

    // 🟢 7. Return success response
    return NextResponse.json(
      {
        message: "Event created successfully",
        event: newEvent,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating event:", error);
    if (error.name === "JsonWebTokenError") {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}