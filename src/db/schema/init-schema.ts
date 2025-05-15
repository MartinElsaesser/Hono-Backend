import * as fs from "fs";
import { pool } from "../db.js";

// loads DDL statements from schema.sql file
// and runs them on the database

void (async function connectToDbAndUploadSchema() {
	const client = await pool.connect();

	var sql = fs.readFileSync(import.meta.dirname + "/schema.sql", "utf8");

	await client.query(sql);
	await client.release();
	await pool.end();

	console.log("Initialized Database Schema");
})();
