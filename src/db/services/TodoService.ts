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

export async function createTodo({ todo }: { todo: InsertTodo }) {
	const newTodo = await db
		.insertInto("todo")
		.values(todo)
		.returningAll()
		.executeTakeFirstOrThrow();
	return newTodo;
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

export async function updateTodo({ todoId, todo }: { todoId: TodoId; todo: UpdateTodo }) {
	const updatedTodo = await db
		.updateTable("todo")
		.set(todo)
		.where("id", "=", todoId)
		.returningAll()
		.execute();

	return updatedTodo;
}

export async function deleteTodo({ todoId }: { todoId: number }) {
	const deletedTodo = await db
		.deleteFrom("todo")
		.where("id", "=", todoId)
		.returningAll()
		.executeTakeFirstOrThrow();

	return deletedTodo;
}
