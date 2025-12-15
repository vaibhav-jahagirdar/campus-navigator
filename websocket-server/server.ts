import express from "express";
import http from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Student from "./models/Student"

dotenv.config();
console.log("🚀 Starting WebSocket server...");

const PORT = Number(process.env.PORT || 4001);
const CORS_ORIGIN = (process.env.CORS_ORIGIN || "*").split(",").map(s => s.trim());

const ENABLE_MOCK = process.env.ENABLE_MOCK_EMITTER === "true";
const MOCK_INTERVAL = Number(process.env.MOCK_EMIT_INTERVAL_MS || 2000);

// ----------------------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------------------

type LibraryPayload = {
  type: "library_update";
  cardId: string;
  sensor: string;    // <-- identifies rfid_1 / rfid_2 / rfid_3
  status: "entry" | "exit";
  timestamp: string;
};

type ParkingPayload = {
  type: "parking_update";
  slotId: string;
  occupied: boolean;
  timestamp: string;
};

// ----------------------------------------------------------------------------------------
// STATE
// ----------------------------------------------------------------------------------------

const totalLibrarySeats = 500;
const libraryState = {
  presentCards: new Set<string>(),
  occupied: 0,
};

const parkingState = new Map<string, ParkingPayload>();

const sensorState: Record<string, { lastCard?: string; lastTime?: string }> = {};

// ----------------------------------------------------------------------------------------
// EXPRESS + SOCKET.IO
// ----------------------------------------------------------------------------------------

const app = express();
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: CORS_ORIGIN },
});

// Health check
app.get("/health", (_req, res) => res.json({ ok: true }));

// Full system snapshot
app.get("/state", (_req, res) => {
  res.json({
    library: {
      occupied: libraryState.occupied,
      totalSeats: totalLibrarySeats,
      presentCards: Array.from(libraryState.presentCards),
      sensors: sensorState
    },
    parking: Array.from(parkingState.values()),
  });
});

// ----------------------------------------------------------------------------------------
// VALIDATORS
// ----------------------------------------------------------------------------------------

function isLibraryPayload(obj: any): obj is LibraryPayload {
  return (
    obj &&
    obj.type === "library_update" &&
    typeof obj.cardId === "string" &&
    typeof obj.sensor === "string" &&   // REQUIRED
    typeof obj.timestamp === "string"
  );
}

function isParkingPayload(obj: any): obj is ParkingPayload {
  return (
    obj &&
    obj.type === "parking_update" &&
    typeof obj.slotId === "string" &&
    typeof obj.occupied === "boolean" &&
    typeof obj.timestamp === "string"
  );
}

// ----------------------------------------------------------------------------------------
// MONGO
// ----------------------------------------------------------------------------------------

mongoose
  .connect(process.env.MONGO_URI!, { bufferCommands: false })
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => {
    console.error("❌ MongoDB error:", err.message);
    process.exit(1);
  });

// ----------------------------------------------------------------------------------------
// SOCKET LOGIC
// ----------------------------------------------------------------------------------------

io.on("connection", (socket: Socket) => {
  console.log(`🟢 client connected ${socket.id}`);

  socket.on("request_snapshot", () => {
    socket.emit("snapshot", {
      library: {
        occupied: libraryState.occupied,
        totalSeats: totalLibrarySeats,
        presentCards: Array.from(libraryState.presentCards),
        sensors: sensorState
      },
      parking: Array.from(parkingState.values()),
    });
  });

  socket.on("sensor:update", async (msg: any) => {
    try {
      if (!msg?.channel || !msg?.payload) {
        socket.emit("error", { code: "INVALID_FORMAT", message: "Missing channel/payload" });
        return;
      }

      const { channel, payload } = msg;

      // -------------------------------------------------------------
      // LIBRARY UPDATE HANDLING (3 RFID sensors come here)
      // -------------------------------------------------------------
      if (channel === "library" && isLibraryPayload(payload)) {
        const { sensor, cardId, timestamp } = payload;

        // Check DB registration
        const student = await Student.findOne({ cardId });
        if (!student) {
          socket.emit("error", {
            code: "UNREGISTERED_CARD",
            message: `Card ${cardId} is not registered`,
          });
          console.log(`❌ [${sensor}] unregistered card: ${cardId}`);
          return;
        }

        // Toggle entry/exit
        let status: "entry" | "exit";
        if (!libraryState.presentCards.has(cardId)) {
          libraryState.presentCards.add(cardId);
          status = "entry";
        } else {
          libraryState.presentCards.delete(cardId);
          status = "exit";
        }

        libraryState.occupied = libraryState.presentCards.size;

        // Update per-sensor state log
        sensorState[sensor] = { lastCard: cardId, lastTime: timestamp };

        // Broadcast update
        io.emit("library_update", {
          sensor,
          cardId,
          status,
          occupied: libraryState.occupied,
          totalSeats: totalLibrarySeats,
          timestamp: new Date().toISOString(),
        });

        console.log(`📚 [${sensor}] ${cardId} → ${status}`);
        return;
      }

      // -------------------------------------------------------------
      // PARKING UPDATE
      // -------------------------------------------------------------
      if (channel === "parking" && isParkingPayload(payload)) {
        parkingState.set(payload.slotId, payload);
        io.emit("parking_update", payload);
        console.log(`🚗 parking_update: ${payload.slotId} → ${payload.occupied}`);
        return;
      }

      socket.emit("error", { code: "INVALID_PAYLOAD", message: "Payload failed validation" });

    } catch (err) {
      console.error("❌ sensor:update handler error:", err);
      socket.emit("error", { code: "SERVER_ERROR", message: "Internal server error" });
    }
  });

  socket.on("disconnect", reason => {
    console.log(`🔴 client disconnected ${socket.id} (${reason})`);
  });
});

// ----------------------------------------------------------------------------------------
// MOCK MODE (optional)
// ----------------------------------------------------------------------------------------

if (ENABLE_MOCK) {
  console.log("🧪 Mock emitter enabled...");
  setInterval(async () => {
    const now = new Date().toISOString();
    const cardId = `CARD-${Math.floor(Math.random() * 50)}`;
    const sensor = ["rfid_1", "rfid_2", "rfid_3"][Math.floor(Math.random() * 3)];

    const student = await Student.findOne({ cardId });
    if (!student) return;

    let status: "entry" | "exit";
    if (!libraryState.presentCards.has(cardId)) {
      libraryState.presentCards.add(cardId);
      status = "entry";
    } else {
      libraryState.presentCards.delete(cardId);
      status = "exit";
    }

    libraryState.occupied = libraryState.presentCards.size;

    sensorState[sensor] = { lastCard: cardId, lastTime: now };

    io.emit("library_update", {
      sensor,
      cardId,
      status,
      occupied: libraryState.occupied,
      totalSeats: totalLibrarySeats,
      timestamp: now,
    });

    console.log(`📚 (mock) [${sensor}] ${cardId} → ${status}`);
  }, MOCK_INTERVAL);
}

// ----------------------------------------------------------------------------------------
// START SERVER
// ----------------------------------------------------------------------------------------

httpServer.listen(PORT, () => {
  console.log(`✅ WebSocket server running on port ${PORT}`);
  console.log(`🌍 Allowed origins: ${CORS_ORIGIN.join(", ")}`);
});
