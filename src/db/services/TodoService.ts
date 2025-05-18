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

/**
 * This function moves the todo with `id=fromId` to the position of the todo with `id=toId`.\
 * It shifts the positions of the other todos accordingly.
 * @param fromId - The id of the todo to move (from todo)
 * @param toId - The id of the todo to move to (to todo)
 *
 * @example
 * // The todo with `id=fromId` is moved to the right:
 * // the todos ids are equal to the number in their names
 * [todo1, todo2, todo3, todo4]
 * moveTodoBetweenPositions({ fromId: 1, toId: 3 })
 * [todo2, todo3, todo1, todo4]
 *
 * @example
 * // The todo with `id=fromId` is moved to the left:
 * // the todos ids are equal to the number in their names
 * [todo1, todo2, todo3, todo4]
 * moveTodoBetweenPositions({ fromId: 4, toId: 2 })
 * [todo1, todo4, todo2, todo3]
 * @param param0
 * @returns
 */

export async function moveTodoBetweenPositions({ fromId, toId }: { fromId: TodoId; toId: TodoId }) {
	const movedFromTodo = await db.transaction().execute(async trx => {
		// Get the current positions of fromTodo and toTodo
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

		// fromTodo will be moved to the position of toTodo later on
		const oldToTodoPosition = toTodo.position;

		// Check if the from todo is moved to the left or right
		// and shift the other todos accordingly
		let shiftOtherTodosQuery = trx.updateTable("todo").returningAll();
		if (toTodo.position < fromTodo.position) {
			// fromTodo will be moved to the left
			// all todos between toTodo (incl.) and fromTodo (excl.) are shifted one position to the right
			shiftOtherTodosQuery = shiftOtherTodosQuery
				.set(eb => ({ position: eb("position", "+", 1) }))
				.where(eb =>
					eb.and([
						eb("position", ">=", toTodo.position),
						eb("position", "<", fromTodo.position),
					])
				);
		} else if (fromTodo.position < toTodo.position) {
			// fromTodo will be moved to the right
			// all todos between fromTodo (excl.) and toTodo (incl.) are shifted one position to the left
			shiftOtherTodosQuery = shiftOtherTodosQuery
				.set(eb => ({ position: eb("position", "-", 1) }))
				.where(eb =>
					eb.and([
						eb("position", ">", fromTodo.position),
						eb("position", "<=", toTodo.position),
					])
				);
		} else {
			// fromTodo wouldn't be moved at all
			throw new Error("Cannot swap the same todo");
		}
		await shiftOtherTodosQuery.execute();

		// Move fromTodo to the old position of toTodo
		const movedFromTodo = await trx
			.updateTable("todo")
			.set({ position: oldToTodoPosition })
			.where("id", "=", fromId)
			.returningAll()
			.executeTakeFirstOrThrow();
		return movedFromTodo;
	});

	return { movedFromTodo };
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
