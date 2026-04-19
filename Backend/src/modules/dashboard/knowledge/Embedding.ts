import mongoose, { Schema, Document } from "mongoose";

export interface IChunk {
  index: number;
  text: string;
  vectorId: string;
  tokens: number;
}

export interface IEmbedding extends Document {
  contentId: mongoose.Types.ObjectId;
  siteId: string; // String rakha hai taaki easy query ho
  chunks: IChunk[]; // 🔥 ARRAY: Saare chunks yahan aayenge
  metadata: any;
}

const embeddingSchema = new Schema(
  {
    contentId: { type: Schema.Types.ObjectId, ref: "Content", required: true, unique: true }, // Unique: Ek Content ka Ek hi Embedding Doc
    siteId: { type: String, required: true },
    chunks: [
      {
        index: { type: Number, required: true },
        text: { type: String, required: true },
        vectorId: { type: String },
        tokens: { type: Number },
      },
    ],
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Indexing

embeddingSchema.index({ "chunks.index": 1 }); // Array ke andar search karne ke liye

export default mongoose.model<IEmbedding>("Embedding", embeddingSchema);