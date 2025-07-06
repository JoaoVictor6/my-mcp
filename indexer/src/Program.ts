import { Effect } from "effect";
import { generateEmbeddingEffect } from "./generate-embedding.js";
import { getMarkdownFilesStream } from "./getMarkdownFiles.js";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { VectorDB } from "./VectorDB.js";
import { v4 as uuidv4 } from 'uuid';
import { Logger } from "./logger.js";


const splitter = new RecursiveCharacterTextSplitter({
  chunkOverlap: 50,
  chunkSize: 500
})
const createChunksForText = ({ text }: { text: string }) => Effect.tryPromise({
  try: async () => {
    const texts = await splitter.splitText(text)
    return { texts }
  },
  catch: cause => {
    throw new Error("Failed when create chunks", { cause })
  }
})

const indexerEffect = ({ path, text }: { path: string; text: string }) =>
  Effect.gen(function*(_) {
    const logger = yield* _(Logger)
    const vectorDB = yield* _(VectorDB);
    const { texts } = yield* _(createChunksForText({ text }));
    const embedding = yield* _(
      Effect.forEach(
        texts,
        (text) =>
          Effect.gen(function*(_) {
            const { embedding } = yield* _(generateEmbeddingEffect({ text }));
            return yield* _(vectorDB.add({ embedding, text, id: uuidv4(), path }));
          }),
        { concurrency: "unbounded" },
      ),
    );
    yield* _(logger.info("Embedding is finished", { path, embedding }));
  });


const program =
  getMarkdownFilesStream.pipe(
    Effect.flatMap(chunk =>
      Effect.forEach(chunk, indexerEffect)
    ),
  )
const handledError = program.pipe(
  Effect.catchTag("QdrantError", (error) =>
    Effect.logError("Error with Qdrant", error)
  )
)
const runnable = handledError.pipe(
  Effect.provide(VectorDB.Live),
  Effect.provide(Logger.Live)
)

Effect.runPromise(runnable).then(console.log)
