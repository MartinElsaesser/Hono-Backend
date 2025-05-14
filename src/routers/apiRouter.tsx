import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db/db.js";
import {
  parsePositiveIntSchema,
  positiveIntSchema,
} from "../schemas/utilitySchemas.js";

const apiRouter = new Hono()
  // get all todos
  .get("/todos", async (c) => {
    const posts = await db
      .selectFrom("todo")
      .selectAll()
      .execute();
    return c.json({
      success: true,
      data: { posts },
    });
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
    async (c) => {
      const { id } = await c.req.valid("param");
      const posts = await db
        .selectFrom("todo")
        .selectAll()
        .where("id", "=", id)
        .execute();
      return c.json({
        success: true,
        data: { posts },
      });
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
    async (c) => {
      const todo = await c.req.valid("json");

      const post = await db
        .insertInto("todo")
        .values({
          description: todo.description,
          done: todo.done,
          headline: todo.headline,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      return c.json({
        success: true,
        data: { post },
      });
    }
  )
  // swap todos by positions
  .patch(
    "/todos/swap1",
    zValidator(
      "json",
      z.object({
        position1: positiveIntSchema,
        position2: positiveIntSchema,
      })
    ),
    async (c) => {
      const { position1, position2 } = await c.req.valid("json");

      const [todo1, todo2] = await db
        .selectFrom("todo")
        .select(["id", "position"])
        .where("position", "in", [position1, position2])
        .execute();

      const result = await db.transaction().execute(async (trx) => {
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

      return c.json({
        success: true,
        data: { result },
      });
    }
  )
  // swap todos by ids
  .patch(
    "/todos/swap3",
    zValidator(
      "json",
      z.object({
        id1: positiveIntSchema,
        id2: positiveIntSchema,
      })
    ),
    async (c) => {
      const { id1, id2 } = await c.req.valid("json");

      const [todo1, todo2] = await db
        .selectFrom("todo")
        .select(["id", "position"])
        .where("id", "in", [id1, id2])
        .execute();

      const result = await db.transaction().execute(async (trx) => {
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

      return c.json({
        success: true,
        data: { result },
      });
    }
  )
  // swap todos by position
  .patch(
    "/todos/swap2",
    zValidator(
      "json",
      z.object({
        position1: positiveIntSchema,
        position2: positiveIntSchema,
      })
    ),
    async (c) => {
      const { position1, position2 } = await c.req.valid("json");

      const result = await db
        .updateTable("todo")
        .set((eb) => ({
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

      return c.json({
        success: true,
        data: { compiled: result },
      });
    }
  )
  // delete a todo
  .delete(
    "/todos",
    zValidator("json", z.object({ postId: z.number() })),
    async (c) => {
      // get validated data
      const { postId } = await c.req.valid("json");

      const post = await db
        .deleteFrom("todo")
        .where("id", "=", postId)
        .returningAll()
        .executeTakeFirstOrThrow();

      return c.json({
        success: true,
        data: { post },
      });
    }
  );

export default apiRouter;
