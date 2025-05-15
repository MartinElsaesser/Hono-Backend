import { db } from "../db.js";

void (async function seed() {
	await db.deleteFrom("todo").execute();

	await db
		.insertInto("todo")
		.values([
			{
				headline: "1. Buy groceries",
				description: "I need:\n* Cucumbers\n* Milk\n* Strawberries",
				done: false,
			},
			{
				headline: "2. Go to the gym",
				description: "I need to go to the gym at least 3 times a week",
				done: false,
			},
			{
				headline: "3. Read a book",
				description: "I need to read at least 1 book a month",
				done: false,
			},
			{
				headline: "4. Learn a new language",
				description: "I need to learn a new language",
				done: false,
			},
			{
				headline: "5. Write a blog post",
				description: "I need to write a blog post about my experience with Kysely",
				done: false,
			},
		])
		.execute();
})();
