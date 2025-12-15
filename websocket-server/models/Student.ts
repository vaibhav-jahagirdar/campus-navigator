
import { Schema, model, models, Document } from "mongoose";

// --- Interface ---
export interface IStudent extends Document {
  name: string;
  usn: string;
  department: string;
  year: number;
  cardId: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}
// --- Schema ---
const StudentSchema = new Schema<IStudent>(
  {
    name: { type: String, required: true },
    usn: { type: String, required: true, unique: true },
    department: { type: String, required: true },
    year: { type: Number, required: true },
    cardId: { type: String, required: true, unique: true }, // <-- unified name
    createdBy: { type: String },
  },
  { timestamps: true }
);

// ✅ Fix OverwriteModelError for Next.js hot reload
const Student = models.Student || model<IStudent>("Student", StudentSchema);
export default Student;
