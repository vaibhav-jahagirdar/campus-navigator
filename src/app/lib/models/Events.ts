import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    bannerImage: {
      type: String, // URL to the image (uploaded to cloud storage)
      required: false,
    },
    venue: {
      type: String,
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"], // GeoJSON Point
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: false,
      },
    },
    startDateTime: {
      type: Date,
      required: true,
    },
    endDateTime: {
      type: Date,
      required: true,
    },
    registrationRequired: {
      type: Boolean,
      default: true,
    },
    maxParticipants: {
      type: Number,
      default: 0, // 0 = unlimited
    },
    participantsCount: {
      type: Number,
      default: 0,
    },
    paymentRequired: {
      type: Boolean,
      default: false,
    },
    feeAmount: {
      type: Number,
      default: 0, // in INR (or cents if USD)
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to admin who created
      required: true,
    },
    categories: {
      type: [String], // e.g., ["Sports", "Cultural", "Workshop"]
      default: [],
    },
    tags: {
      type: [String], // For search/filtering
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true, // Can be used to hide old events
    },
  },
  {
    timestamps: true, // createdAt and updatedAt
  }
);

export default mongoose.models.Event || mongoose.model("Event", eventSchema);