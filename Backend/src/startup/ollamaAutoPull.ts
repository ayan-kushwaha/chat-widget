// src/startup/ollamaAutoPull.ts (new)
import axios from "axios";

const MODELS = [
  process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text",
  process.env.OLLAMA_CHAT_MODEL || "mistral:7b"
];

export async function autoPullModels() {
  if (!process.env.AUTO_PULL_MODELS) return;

  console.log("⚙ Auto model pull enabled");

  for (const m of MODELS) {
    try {
      console.log(`⏳ Pulling ${m}...`);
      const baseUrl = process.env.OLLAMA_URL || "http://localhost:11434";
      await axios.post(`${baseUrl}/api/pull`, { name: m });
      console.log(`🔥 Model ready: ${m}`);
    } catch (e: any) {
      console.log(`⚠ Failed pulling ${m}: ${e.message}`);
    }
  }
}
