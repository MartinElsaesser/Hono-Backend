import type { Selectable, Updateable, Insertable } from "kysely";
import type { Todo } from "./db-types.js";

export type TodoId = Selectable<Todo>["id"];
export type InsertTodo = Insertable<Todo>;
export type UpdateTodo = Updateable<Todo>;
