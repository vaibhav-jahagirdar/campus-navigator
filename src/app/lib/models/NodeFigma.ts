// models/NodeFigma.ts
import mongoose from "mongoose";

const NodeFigmaSchema = new mongoose.Schema({
  nodeId: {
    type: String,
    required: true,
    unique: true,
  },

  // figma pixel coordinates
  fx: { type: Number, required: true },
  fy: { type: Number, required: true },

  floor: { type: Number, default: 2 }
});

export default mongoose.models.NodeFigma || mongoose.model("NodeFigma", NodeFigmaSchema);