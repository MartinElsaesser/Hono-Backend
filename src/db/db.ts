import pg from "pg";
import { Kysely, PostgresDialect } from "kysely";
import type { DB } from "./schema/db-types.js";
import { envs } from "../config/env.js";

// connect to postgres database
export const pool = new pg.Pool({
	connectionString: envs.DATABASE_URL,
	max: 10,
});

const int8TypeId = 20;
// Map int8 to number.
pg.types.setTypeParser(int8TypeId, val => {
	return parseInt(val, 10);
});

// pass database connection to kysely
export const db = new Kysely<DB>({
	dialect: new PostgresDialect({
		pool,
	}),
});
