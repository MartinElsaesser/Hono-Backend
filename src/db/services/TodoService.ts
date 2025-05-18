import { db } from "../db.js";
import type { InsertTodo, TodoId, UpdateTodo } from "../schema/db-helper-types.js";

export async function getAllTodos() {
	const todos = await db.selectFrom("todo").selectAll().orderBy("position", "asc").execute();
	return todos;
}

export async function getTodoById({ todoId }: { todoId: TodoId }) {
	const todo = await db
		.selectFrom("todo")
		.selectAll()
		.where("id", "=", todoId)
		.executeTakeFirstOrThrow();
	return todo;
}

export async function createTodo({ insertTodo }: { insertTodo: InsertTodo }) {
	const todo = await db
		.insertInto("todo")
		.values(insertTodo)
		.returningAll()
		.executeTakeFirstOrThrow();
	return todo;
}

export async function moveTodoBetweenPositions({ fromId, toId }: { fromId: TodoId; toId: TodoId }) {
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

	return {};
}

export async function updateTodo({
	todoId,
	updateTodo,
}: {
	todoId: TodoId;
	updateTodo: UpdateTodo;
}) {
	const todo = await db
		.updateTable("todo")
		.set(updateTodo)
		.where("id", "=", todoId)
		.returningAll()
		.execute();

	return todo;
}
export async function deleteTodo({ todoId }: { todoId: number }) {
	const todo = await db
		.deleteFrom("todo")
		.where("id", "=", todoId)
		.returningAll()
		.executeTakeFirstOrThrow();

	return todo;
}
