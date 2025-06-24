import { Effect, pipe } from "effect";
import { generateEmbeddingEffect } from "./generateembedding.js";

const program = pipe(
  Effect.succeed("teste"),
  Effect.flatMap(generateEmbeddingEffect)
)

Effect.runPromise(program).then(console.log)
