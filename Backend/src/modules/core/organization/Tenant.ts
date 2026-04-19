//src/models/Tenst
import { Schema, model } from "mongoose";

const tenantSchema = new Schema(
  {
    name: { type: String, required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User" },
    plan: { type: String, enum: ["free", "starter", "pro"], default: "free" },
  },
  { timestamps: true }
);

export default model("Tenant", tenantSchema);
