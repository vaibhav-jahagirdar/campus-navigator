// models/Fingerprint.ts
import mongoose from "mongoose";

const FingerprintSchema = new mongoose.Schema({
  nodeId: {
    type: String,
    required: true,
    index: true,
  },

  bssid: { type: String, required: true },
  rssi: { type: Number, required: true },

  collectedAt: {
    type: Date,
    default: Date.now,
  }
});

FingerprintSchema.index({ nodeId: 1, bssid: 1 });

export default mongoose.models.Fingerprint || mongoose.model("Fingerprint", FingerprintSchema);