import { Effect } from "effect";

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
  return await res.json() as unknown
}

export const generateEmbeddingEffect = (text: string) => Effect.tryPromise({
  try: () => generateEmbedding(text),
  catch: (error) => {
    throw new Error("vish", { cause: error })
  }
})
