import mongoose, { Document, Model, Schema } from "mongoose";

export interface IRegistration extends Document {
  user: mongoose.Types.ObjectId;
  event: mongoose.Types.ObjectId;
  paymentStatus: "Pending" | "Completed" | "Failed";
  amountPaid: number;
  registeredAt: Date;
}

const registrationSchema: Schema<IRegistration> = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    event: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    paymentStatus: { 
      type: String, 
      enum: ["Pending", "Completed", "Failed"], 
      default: "Pending" 
    },
    amountPaid: { type: Number, default: 0 },
    registeredAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Registration: Model<IRegistration> =
  mongoose.models.Registration || mongoose.model<IRegistration>("Registration", registrationSchema);

export default Registration;