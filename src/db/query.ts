import { Effect } from "effect"

/**
 * Wrap a Drizzle thenable query builder into an Effect.
 * Drizzle query builders implement the Thenable interface,
 * so Effect.tryPromise can resolve them directly.
 */
export const dbQuery = <T>(query: { then(onfulfilled: (value: T) => any): any }): Effect.Effect<T> =>
  Effect.tryPromise(() => Promise.resolve(query))
