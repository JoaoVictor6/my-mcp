import { Effect } from "effect";
import { Logger } from "./logger.js";

const generateEmbedding = async (text: string) => {
  const url = "http://localhost:11434/api/embeddings";
  const data = {
    model: "nomic-embed-text",
    prompt: text,
  };
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    throw new Error(await res.text())
  }
  return await res.json() as unknown as { embedding: number[] }
}

export const generateEmbeddingEffect = ({ text }: { text: string }) => Effect.gen(function*(_) {
  const embedding = yield* Effect.tryPromise({
    try: async () => await generateEmbedding(text),
    catch: (error) => {
      throw new Error("vish", { cause: error })
    }
  })
  const logger = yield* _(Logger)

  yield* _(logger.info("Embedding was generated"))

  return embedding
})
