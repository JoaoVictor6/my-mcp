import { Effect, Stream } from "effect";
import { fromAsyncIterable } from "effect/Stream";
import { readFileSync } from "fs";
import { globbyStream } from "globby"
import { Logger } from "./logger.js";

const stream = globbyStream("/home/turing/projects/my-mcp/indexer/src/md/**/*.md")
export const getMarkdownFilesStream =
  fromAsyncIterable(stream, cause => {
    throw new Error("can`t read file", { cause })
  }).pipe(
    Stream.mapEffect((file) => {
      const text = readFileSync(file as string, { encoding: "utf-8" })
      return Effect.gen(function*(_) {
        const logger = yield* _(Logger)
        yield* _(logger.info("Reading document", { path: file }))
        return { path: file as string, text }
      })
    }),
    Stream.runCollect
  )

