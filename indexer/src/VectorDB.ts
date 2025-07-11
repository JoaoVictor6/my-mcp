
import { QdrantClient } from "@qdrant/js-client-rest";
import { Context, Data, Effect, Layer } from "effect";
import { Logger } from "./logger.js";

const COLLECTION_NAME = "my-mcp";

export class QdrantError extends Data.TaggedError("QdrantError")<{
  cause: unknown;
}> { }

export const make = Effect.gen(function*(_) {
  const qdrant = new QdrantClient({
    url: "http://localhost:6333",
  });

  const client = Effect.tryPromise({
    try: () => qdrant.getCollections(),
    catch: (cause) => new QdrantError({ cause }),
  }).pipe(
    Effect.flatMap((response) => {
      const hasCollection = response.collections.some(
        (collection) => collection.name === COLLECTION_NAME,
      );
      if (hasCollection) {
        return Effect.succeed(qdrant);
      }
      return Effect.tryPromise({
        try: () =>
          qdrant.createCollection(COLLECTION_NAME, {
            vectors: { size: 768, distance: "Cosine" },
          }),
        catch: (cause) => new QdrantError({ cause }),
      }).pipe(Effect.map(() => qdrant));
    }),
  );

  const qdrantWithCollection = yield* _(client);

  const add = ({ embedding, text, id, path }: { embedding: number[], text: string, id: string, path: string }) =>
    Effect.gen(function*(_) {
      const logger = yield* _(Logger)
      const result = yield* Effect.tryPromise({
        try: async () => {
          const result = await qdrantWithCollection.upsert(COLLECTION_NAME, {
            wait: true,
            points: [
              {
                id,
                vector: embedding,
                payload: { text, path },
              },
            ],
          })

          return result
        },
        catch: (cause) => new QdrantError({ cause }),
      });

      yield* _(logger.info("The embedding is saved", { id, path, text }))
      return result
    })

  return { add };
});

export class VectorDB extends Context.Tag("VectorDB")<
  VectorDB,
  Effect.Effect.Success<typeof make>
>() {
  static readonly Live = Layer.effect(this, make);
}
