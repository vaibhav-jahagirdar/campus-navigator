"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
// --- Schema ---
var StudentSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    usn: { type: String, required: true, unique: true },
    department: { type: String, required: true },
    year: { type: Number, required: true },
    cardId: { type: String, required: true, unique: true }, // <-- unified name
    createdBy: { type: String },
}, { timestamps: true });
// ✅ Fix OverwriteModelError for Next.js hot reload
var Student = mongoose_1.models.Student || (0, mongoose_1.model)("Student", StudentSchema);
exports.default = Student;
