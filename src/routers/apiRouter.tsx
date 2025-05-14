import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db/db.js";
import { parsePositiveIntSchema } from "../schemas/utilitySchemas.js";

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
