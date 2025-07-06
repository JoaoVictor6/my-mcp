import { Context, Effect, Layer } from "effect"
import * as winston from "winston";

const make = Effect.gen(function* () {
  const logger = winston.createLogger({
    level: "info",
    format: winston.format.json(),
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple(),
        ),
      }),
    ],
  })

  const log = (level: "info" | "warn" | "error") =>
    (message: string, meta?: Record<string, unknown>) =>
      Effect.sync(() => {
        logger[level](message, meta)
      })

  return {
    info: log("info"),
    warn: log("warn"),
    error: log("error"),
  }
})

export class Logger extends Context.Tag("Logger")<Logger, Effect.Effect.Success<typeof make>>() {
  static readonly Live = Layer.effect(this, make)
}
