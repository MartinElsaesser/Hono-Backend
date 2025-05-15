import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db/db.js";
import { parsePositiveIntSchema, positiveIntSchema } from "../schemas/utilitySchemas.js";
import { todoSchema } from "../schemas/todo.js";

const apiRouter = new Hono()
	// get all todos
	.get("/todos", async c => {
		const todos = await db.selectFrom("todo").orderBy("position", "asc").selectAll().execute();
		return c.json(todos);
	})
	// get a specific todo
	.get(
		"/todos/:todoId",
		zValidator(
			"param",
			z.object({
				todoId: parsePositiveIntSchema,
			})
		),
		async c => {
			const { todoId } = await c.req.valid("param");
			const todo = await db
				.selectFrom("todo")
				.selectAll()
				.where("id", "=", todoId)
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
	// shift todo positions for sortable list
	// TODO: refactor
	// TODO: add a documentation link
	.patch(
		"/todos/@arrayMove",
		zValidator(
			"json",
			z.object({
				fromId: positiveIntSchema,
				toId: positiveIntSchema,
			})
		),
		async c => {
			const { fromId, toId } = await c.req.valid("json");

			const result = await db.transaction().execute(async trx => {
				const toTodo = await db
					.selectFrom("todo")
					.select(["id", "position"])
					.where("todo.id", "=", toId)
					.executeTakeFirstOrThrow();

				const fromTodo = await db
					.selectFrom("todo")
					.select(["id", "position"])
					.where("todo.id", "=", fromId)
					.executeTakeFirstOrThrow();
				const futurePositionFromTodo = toTodo.position;

				let shiftOtherTodosQuery = trx.updateTable("todo").returningAll();
				if (toTodo.position < fromTodo.position) {
					// rechts-shift
					shiftOtherTodosQuery = shiftOtherTodosQuery
						.set(eb => ({ position: eb("position", "+", 1) }))
						.where(eb =>
							eb.and([
								eb("position", ">=", toTodo.position),
								eb("position", "<", fromTodo.position),
							])
						);
				} else if (fromTodo.position < toTodo.position) {
					// links-shift
					shiftOtherTodosQuery = shiftOtherTodosQuery
						.set(eb => ({ position: eb("position", "-", 1) }))
						.where(eb =>
							eb.and([
								eb("position", ">", fromTodo.position),
								eb("position", "<=", toTodo.position),
							])
						);
				} else {
					throw new Error("Cannot swap the same todo");
				}
				await shiftOtherTodosQuery.execute();

				const fromTodoNowAtFuturePosition = await trx
					.updateTable("todo")
					.set({ position: futurePositionFromTodo })
					.where("id", "=", fromId)
					.returningAll()
					.executeTakeFirstOrThrow();
				return fromTodoNowAtFuturePosition;
			});

			return c.json({});
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
			const { todoId } = await c.req.valid("param");
			// throw new Error(`Cannot update todo ${todoId}`);
			const todo = await db
				.updateTable("todo")
				.set(updateTodo)
				.where("id", "=", todoId)
				.returningAll()
				.execute();

			return c.json(todo);
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
