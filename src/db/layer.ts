import { Pool } from "pg"
import { drizzle } from "drizzle-orm/node-postgres"
import { ServiceMap, Effect, Layer } from "effect"
import * as schema from "./schema"
import * as authSchema from "./auth-schema"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  max: 10,
})

export const db = drizzle({ client: pool, schema: { ...schema, ...authSchema } })

export type DBShape = typeof db

export const DB = ServiceMap.Service<DBShape>("DB")

export const DBLive = Layer.effect(DB, Effect.sync(() => db))
