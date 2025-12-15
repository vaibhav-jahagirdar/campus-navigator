import dbConnect from "../../../../../lib/mongodb";
import User from "@/app/lib/models/User";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        await dbConnect();

        const { name, email, password } = await req.json();

        if (!email || !password || !name) {
            return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json({ error: "User already exists" }, { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            name: name || "",
            email,
            password: hashedPassword,
        });

        const safeUser = {
            id: user._id?.toString?.(),
            name: user.name,
            email: user.email,
        };

        return NextResponse.json({ user: safeUser }, { status: 201 });
    } catch (err) {
        console.error("Register route error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
