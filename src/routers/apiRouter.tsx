import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db/db.js";
import { parsePositiveIntSchema, positiveIntSchema } from "../schemas/utilitySchemas.js";
import { todoSchema } from "../schemas/todo.js";

const apiRouter = new Hono()
	// get all todos
	.get("/todos", async c => {
		const todos = await db.selectFrom("todo").orderBy("id", "asc").selectAll().execute();
		return c.json(todos);
	})
	// get a specific todo
	.get(
		"/todos/:id",
		zValidator(
			"param",
			z.object({
				id: parsePositiveIntSchema,
			})
		),
		async c => {
			const { id } = await c.req.valid("param");
			const todo = await db
				.selectFrom("todo")
				.selectAll()
				.where("id", "=", id)
				.executeTakeFirstOrThrow();
			return c.json(todo);
		}
	)
	// create a new todo
	.post(
		"/todos",
		zValidator(
			"json",
			z.object({
				description: z.string(),
				done: z.boolean(),
				headline: z.string(),
			})
		),
		async c => {
			const insertTodo = await c.req.valid("json");

			const todo = await db
				.insertInto("todo")
				.values({
					description: insertTodo.description,
					done: insertTodo.done,
					headline: insertTodo.headline,
				})
				.returningAll()
				.executeTakeFirstOrThrow();

			return c.json(todo);
		}
	)
	// update a todo
	.patch(
		"/todos/:todoId",
		zValidator(
			"json",
			todoSchema.omit({ id: true, position: true, created_at: true }).partial()
		),
		zValidator(
			"param",
			z.object({
				todoId: parsePositiveIntSchema,
			})
		),
		async c => {
			const updateTodo = await c.req.valid("json");
			const todoId = await c.req.valid("param");
			// throw new Error("Cannot update todo");
			const todo = await db
				.updateTable("todo")
				.set(updateTodo)
				.where("id", "=", todoId.todoId)
				.returningAll()
				.execute();

			return c.json(todo);
		}
	)
	// swap todos positions by id and position
	.patch(
		"/todos/swap-by-id",
		zValidator(
			"json",
			z.object({
				id1: positiveIntSchema,
				position1: positiveIntSchema,
				id2: positiveIntSchema,
				position2: positiveIntSchema,
			})
		),
		async c => {
			const { id1, position1, id2, position2 } = await c.req.valid("json");

			const todos = await db
				.selectFrom("todo")
				.select(["id", "position"])
				.where(eb =>
					eb.or([
						eb.and([eb("id", "=", id1), eb("position", "=", position1)]),
						eb.and([eb("id", "=", id2), eb("position", "=", position2)]),
					])
				)
				.execute();

			if (todos.length !== 2) {
				throw new Error("Invalid todo ids or positions");
			}
			const [todo1, todo2] = todos;

			const result = await db.transaction().execute(async trx => {
				const swappedTodo1 = await trx
					.updateTable("todo")
					.set({ position: todo2.position })
					.where("id", "=", todo1.id)
					.returningAll()
					.executeTakeFirstOrThrow();

				const swappedTodo2 = await trx
					.updateTable("todo")
					.set({ position: todo1.position })
					.where("id", "=", todo2.id)
					.returningAll()
					.executeTakeFirstOrThrow();

				return [swappedTodo1, swappedTodo2];
			});

			return c.json(result);
		}
	)
	// swap todos by position
	.patch(
		"/todos/swap-by-position",
		zValidator(
			"json",
			z.object({
				position1: positiveIntSchema,
				position2: positiveIntSchema,
			})
		),
		async c => {
			const { position1, position2 } = await c.req.valid("json");

			const result = await db
				.updateTable("todo")
				.set(eb => ({
					position: eb
						.case()
						.when("position", "=", position1)
						.then(position2)
						.else(position1)
						.end(),
				}))
				.where("position", "in", [position1, position2])
				.returningAll()
				.execute();
			console.log(result);

			return c.json(result);
		}
	)
	// delete a todo
	.delete("/todos", zValidator("json", z.object({ todoId: z.number() })), async c => {
		// get validated data
		const { todoId } = await c.req.valid("json");

		const todo = await db
			.deleteFrom("todo")
			.where("id", "=", todoId)
			.returningAll()
			.executeTakeFirstOrThrow();

		return c.json(todo);
	});

export default apiRouter;
