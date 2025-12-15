// models/Node.ts
import mongoose from "mongoose";

const NodeSchema = new mongoose.Schema({
  nodeId: {
    type: String, // "P01"
    required: true,
    unique: true,
  },

  // canonical ground-truth metric system (meters)
  x_m: { type: Number, required: true },
  y_m: { type: Number, required: true },

  // descriptive metadata
  tag: { type: String },
  type: { type: String, enum: ["entrance", "door", "junction", "room", "landmark", "area", "office", "stairs", "department"] },

  // floor support
  floor: { type: Number, default: 2 },

  // wifi duplication group (optional)
  wifiGroup: { type: String, default: null }
});

export default mongoose.models.Node || mongoose.model("Node", NodeSchema);